import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

const rewriteSeoFiles = (siteUrl) => ({
  name: 'rewrite-seo-files',
  apply: 'build',
  closeBundle() {
    if (!siteUrl || siteUrl === PLACEHOLDER_SITE_URL) return
    for (const file of ['robots.txt', 'sitemap.xml']) {
      const target = resolve('dist', file)
      if (!existsSync(target)) continue
      const source = readFileSync(target, 'utf8')
      writeFileSync(target, source.split(PLACEHOLDER_SITE_URL).join(siteUrl))
    }
  },
})

const HERO_BOOT_TIMEOUT = 2500

const deferAssetsUntilHero = () => ({
  name: 'defer-assets-until-hero',
  apply: 'build',
  enforce: 'post',
  generateBundle(_options, bundle) {
    const html = Object.values(bundle).find(
      (chunk) => chunk.type === 'asset' && chunk.fileName === 'index.html',
    )
    if (!html) return

    let source = String(html.source)
    const styles = []
    const entries = []
    const preloads = []
    let crossorigin = false

    source = source.replace(
      /<link\b[^>]*\brel="stylesheet"[^>]*>/g,
      (tag) => {
        const href = /\bhref="([^"]+)"/.exec(tag)
        if (!href) return tag
        styles.push(href[1])
        return ''
      },
    )

    source = source.replace(
      /<script\b[^>]*\btype="module"[^>]*><\/script>/g,
      (tag) => {
        const src = /\bsrc="([^"]+)"/.exec(tag)
        if (!src) return tag
        entries.push(src[1])
        if (/\bcrossorigin\b/.test(tag)) crossorigin = true
        return ''
      },
    )

    source = source.replace(
      /<link\b[^>]*\brel="modulepreload"[^>]*>/g,
      (tag) => {
        const href = /\bhref="([^"]+)"/.exec(tag)
        if (!href) return tag
        preloads.push(href[1])
        if (/\bcrossorigin\b/.test(tag)) crossorigin = true
        return ''
      },
    )

    if (!entries.length) return

    const boot = `<script>(function(){
var s=${JSON.stringify(styles)},e=${JSON.stringify(entries)},p=${JSON.stringify(preloads)},co=${crossorigin},done=false,armed=false;
function load(){
if(done)return;done=true;clearTimeout(t);
var h=document.head,i,n;
for(i=0;i<s.length;i++){n=document.createElement("link");n.rel="stylesheet";n.href=s[i];h.appendChild(n)}
for(i=0;i<p.length;i++){n=document.createElement("link");n.rel="modulepreload";if(co)n.crossOrigin="anonymous";n.href=p[i];h.appendChild(n)}
for(i=0;i<e.length;i++){n=document.createElement("script");n.type="module";if(co)n.crossOrigin="anonymous";n.src=e[i];h.appendChild(n)}
}
function afterFrame(){requestAnimationFrame(function(){requestAnimationFrame(load)})}
var lcpSeen=false,po;
try{po=new PerformanceObserver(function(){lcpSeen=true;if(armed)load()});po.observe({type:"largest-contentful-paint",buffered:true})}catch(err){}
function ready(){
if(armed)return;armed=true;
if(!po)afterFrame();          // pas d'entree LCP disponible : repli sur la frame peinte
else if(lcpSeen)load();       // LCP deja enregistre : plus rien a attendre
}
var t=setTimeout(load,${HERO_BOOT_TIMEOUT});
var k=["pointerdown","keydown","touchstart"];
for(var j=0;j<k.length;j++)addEventListener(k[j],load,{once:true,passive:true,capture:true});
var img=document.querySelector("img.background-image");
if(!img||img.complete)ready();
else{img.addEventListener("load",ready,{once:true});img.addEventListener("error",ready,{once:true})}
})();</script>`

    html.source = source.replace('</body>', `${boot}
  </body>`)
  },
})

const contentSecurityPolicy = (apiUrl) => ({
  name: 'content-security-policy',
  apply: 'build',
  enforce: 'post',
  generateBundle(_options, bundle) {
    const html = Object.values(bundle).find(
      (chunk) => chunk.type === 'asset' && chunk.fileName === 'index.html',
    )
    if (!html) return

    let source = String(html.source)

    const hashes = []
    source.replace(
      /<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g,
      (_tag, body) => {
        hashes.push(`'sha256-${createHash('sha256').update(body).digest('base64')}'`)
        return _tag
      },
    )

    let apiOrigin = ''
    try {
      if (/^https?:\/\//.test(apiUrl)) apiOrigin = new URL(apiUrl).origin
    } catch {
      apiOrigin = ''
    }

    const google = 'https://accounts.google.com'
    const directives = [
      `default-src 'self'`,
      `script-src 'self' ${hashes.join(' ')} ${google}/gsi/client`,
      `style-src 'self' 'unsafe-inline' ${google}/gsi/style`,
      `img-src 'self' data: blob: https:${apiOrigin ? ` ${apiOrigin}` : ''}`,
      `font-src 'self' data:`,
      `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''} ${google}/gsi/`,
      `frame-src ${google} https://www.google.com`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `worker-src 'self' blob:`,
      `manifest-src 'self'`,
    ]

    const meta =
      `<meta http-equiv="Content-Security-Policy" content="${directives.join('; ')}" />\n` +
      `    <meta name="referrer" content="strict-origin-when-cross-origin" />`

    source = source.replace(/(<meta charset="[^"]*"\s*\/?>)/i, `$1\n    ${meta}`)
    html.source = source
  },
})

const PLACEHOLDER_SITE_URL = 'http://localhost:4173'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'

  const apiOrigin = (env.VITE_API_URL || 'http://localhost:3000/api').replace(
    /\/api\/?$/,
    '',
  )

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      rewriteSeoFiles((env.VITE_SITE_URL || '').replace(/\/$/, '')),
      deferAssetsUntilHero(),
      contentSecurityPolicy(env.VITE_API_URL || ''),
    ],

    build: {
      target: 'es2022',
      minify: 'oxc',
      cssMinify: true,
      cssCodeSplit: true,
      sourcemap: false,
      modulePreload: { polyfill: false },
      assetsInlineLimit: 4096,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'redux',
                test: /[/]node_modules[/](@reduxjs|react-redux|redux|redux-thunk|immer|use-sync-external-store)[/]/,
                priority: 20,
              },
              {
                name: 'react',
                test: /[/]node_modules[/](react|react-dom|scheduler|react-router|react-router-dom)[/]/,
                priority: 10,
              },
            ],
          },
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },

    define: isProd
      ? {
          'console.log': '(()=>{})',
          'console.debug': '(()=>{})',
          'console.info': '(()=>{})',
        }
      : {},

    server: {
      port: 5173,
      proxy: {
        '/api': { target: apiOrigin, changeOrigin: true },
        '/uploads': { target: apiOrigin, changeOrigin: true },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': { target: apiOrigin, changeOrigin: true },
        '/uploads': { target: apiOrigin, changeOrigin: true },
      },
    },
  }
})
