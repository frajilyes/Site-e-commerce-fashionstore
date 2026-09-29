// Genere les declinaisons du visuel hero servies par public/images/.
//
// Le hero est l'element LCP de la page d'accueil : chaque kilo-octet qu'il pese
// se paie directement en millisecondes de LCP. Sur une connexion mobile bridee
// (1,6 Mbps), 1 Ko vaut environ 5 ms.
//
// Les fichiers livres jusqu'ici etaient encodes trop haut : l'AVIF 768w pesait
// 28,0 Ko, soit PLUS que le WebP equivalent (24,4 Ko) — un AVIF correctement
// regle doit etre nettement plus leger, sans quoi le <source> AVIF, place en
// premier, fait perdre des octets aux navigateurs qui le supportent.
//
// Reglage retenu : qualite 60. Releve de l'ecart quadratique moyen au master,
// sur la variante 768w (celle que prend un telephone courant) :
//
//   q=50   12,6 Ko   RMSE 3,56
//   q=60   18,8 Ko   RMSE 2,76   <- retenu
//   q=70   26,1 Ko   RMSE 2,17
//   livre  28,0 Ko   RMSE 2,08
//
// L'ecart entre q=60 et l'ancien encodage est imperceptible, a plus forte
// raison sous le voile degrade noir a 70-95 % que Homepage.css pose par-dessus
// (.overlay) — pour un tiers d'octets en moins sur le chemin critique du LCP.
//
// Usage : node scripts/build-hero-images.mjs
//
// Le master est assets/hero-master.webp, garde hors de public/ pour qu'une
// execution ne reencode jamais sa propre sortie (chaque passe degraderait un
// peu plus l'image).
import sharp from 'sharp'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MASTER = resolve(ROOT, 'assets/hero-master.webp')
const OUT_DIR = resolve(ROOT, 'public/images')

// Doit rester synchronise avec HERO_WIDTHS de src/pages/HomePage/Homepage.jsx
// et avec le <link rel="preload"> de index.html.
const WIDTHS = [640, 768, 1080, 1600]

const AVIF = { quality: 60, effort: 9, chromaSubsampling: '4:2:0' }
const WEBP = { quality: 72, effort: 6 }

const kB = (n) => (n / 1024).toFixed(1).padStart(6) + ' kB'

await mkdir(OUT_DIR, { recursive: true })

const master = sharp(MASTER)
const { width: masterWidth } = await master.metadata()

for (const width of WIDTHS) {
  if (width > masterWidth) {
    console.warn(`  ${width}w ignore : le master ne fait que ${masterWidth}px`)
    continue
  }
  for (const [ext, options] of [
    ['avif', AVIF],
    ['webp', WEBP],
  ]) {
    const out = resolve(OUT_DIR, `hero-${width}.${ext}`)
    let before = 0
    try {
      before = (await stat(out)).size
    } catch {
      /* premiere generation */
    }

    const buffer = await sharp(MASTER)
      .resize(width)
      [ext](options)
      .toBuffer()

    await writeFile(out, buffer)

    const delta = before ? `  (avant ${kB(before)})` : ''
    console.log(`hero-${width}.${ext}`.padEnd(20), kB(buffer.length) + delta)
  }
}
