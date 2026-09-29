
const mongoose = require("mongoose");

const env = require("../config/env");
const connectDB = require("../config/db");
const { disconnectDB } = require("../config/db");
const app = require("../app");

const results = [];
let base = "";

const check = async (label, fn) => {
  try {
    const detail = await fn();
    results.push({ label, ok: true, detail });
    console.log(`  ok    ${label}${detail ? ` — ${detail}` : ""}`);
  } catch (error) {
    results.push({ label, ok: false, detail: error.message });
    console.log(`  ECHEC ${label} — ${error.message}`);
  }
};

const request = async (path, options = {}) => {
  const response = await fetch(`${base}${path}`, options);
  const text = await response.text();

  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { status: response.status, headers: response.headers, body };
};

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

const run = async () => {
  await connectDB({ silent: true });

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  base = `http://127.0.0.1:${server.address().port}`;

  console.log(`[smoke] API de test sur ${base}`);
  console.log(`[smoke] base ${mongoose.connection.name}\n`);

  await check("GET /api/health repond 200 et signale la base connectee", async () => {
    const { status, body } = await request("/api/health");
    expect(status === 200, `statut ${status}`);
    expect(body.status === "ok", `status="${body.status}"`);
    expect(body.database === "connected", `database="${body.database}"`);
    return `stripe:${body.services.stripe} google:${body.services.google} mail:${body.services.mail}`;
  });

  let sampleId = null;

  await check("GET /api/clothes renvoie { total, data } avec des articles", async () => {
    const { status, body } = await request("/api/clothes");
    expect(status === 200, `statut ${status}`);
    expect(Array.isArray(body.data), "data n'est pas un tableau");
    expect(typeof body.total === "number", "total absent");
    expect(body.data.length > 0, "catalogue vide — lancer `npm run seed`");
    expect(
      body.data.length === body.total,
      `liste tronquee : ${body.data.length}/${body.total}`,
    );
    sampleId = body.data[0]._id;
    return `${body.total} articles`;
  });

  await check("GET /api/clothes?page=1&limit=5 pagine sans casser la forme", async () => {
    const { status, body } = await request("/api/clothes?page=1&limit=5");
    expect(status === 200, `statut ${status}`);
    expect(body.data.length <= 5, `${body.data.length} articles renvoyes`);
    expect(body.pages >= 1, "pages absent");
    return `page 1/${body.pages}`;
  });

  await check("GET /api/clothes?keyword=... filtre par recherche", async () => {
    const { status, body } = await request("/api/clothes?keyword=shirt");
    expect(status === 200, `statut ${status}`);
    return `${body.total} resultats pour "shirt"`;
  });

  await check("GET /api/clothes/:id renvoie l'article", async () => {
    expect(sampleId, "aucun article a interroger");
    const { status, body } = await request(`/api/clothes/${sampleId}`);
    expect(status === 200, `statut ${status}`);
    expect(body._id === sampleId, "ce n'est pas le bon document");
    return body.title;
  });

  await check("GET /api/clothes/:id invalide renvoie 400", async () => {
    const { status } = await request("/api/clothes/pas-un-id");
    expect(status === 400, `statut ${status}`);
  });

  await check("GET /api/clothes/:id inconnu renvoie 404", async () => {
    const { status, body } = await request("/api/clothes/000000000000000000000000");
    expect(status === 404, `statut ${status}`);
    expect(body.success === false, "format d'erreur inattendu");
  });

  await check("route inconnue renvoie 404 { success:false, message }", async () => {
    const { status, body } = await request("/api/pas-une-route");
    expect(status === 404, `statut ${status}`);
    expect(body.success === false && body.message, "format d'erreur inattendu");
  });

  await check("en-tetes de securite presents", async () => {
    const { headers } = await request("/api/health");
    expect(
      headers.get("x-content-type-options") === "nosniff",
      "X-Content-Type-Options manquant",
    );
    expect(!headers.get("x-powered-by"), "X-Powered-By expose");
    return "nosniff, pas de X-Powered-By";
  });

  await check("injection Mongo sur /api/auth/login neutralisee", async () => {
    const { status, body } = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: { $ne: null }, password: "whatever1" }),
    });
    expect(status === 400, `statut ${status} (attendu 400)`);
    return body.message;
  });

  await check("route protegee sans jeton renvoie 401", async () => {
    const { status } = await request("/api/users/profile");
    expect(status === 401, `statut ${status}`);
  });

  await check("upload sans jeton renvoie 401", async () => {
    const { status } = await request("/api/upload", { method: "POST" });
    expect(status === 401, `statut ${status}`);
  });

  await check("origine non autorisee refusee par CORS", async () => {
    const { status } = await request("/api/clothes", {
      headers: { Origin: "http://attaquant.example" },
    });
    expect(status === 403, `statut ${status}`);
  });

  await check("origine du frontend acceptee par CORS", async () => {
    const origin = env.clientOrigins[0];
    expect(origin, "CLIENT_URL vide");
    const { status, headers } = await request("/api/clothes", {
      headers: { Origin: origin },
    });
    expect(status === 200, `statut ${status}`);
    expect(
      headers.get("access-control-allow-origin") === origin,
      "en-tete CORS absent",
    );
    return origin;
  });

  if (process.env.SMOKE_EMAIL && process.env.SMOKE_PASSWORD) {
    let token = null;

    await check("POST /api/auth/login ouvre une session", async () => {
      const { status, body } = await request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: process.env.SMOKE_EMAIL,
          password: process.env.SMOKE_PASSWORD,
        }),
      });
      expect(status === 200, `statut ${status} — ${body.message}`);
      expect(body.token, "aucun jeton renvoye");
      token = body.token;
      return `${body.user.email} (${body.user.role})`;
    });

    await check("GET /api/auth/me accepte le jeton", async () => {
      const { status, body } = await request("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(status === 200, `statut ${status}`);
      expect(body.email, "profil vide");
      return body.email;
    });
  } else {
    console.log("  (session non testee : definir SMOKE_EMAIL et SMOKE_PASSWORD)");
  }

  if (env.rateLimit.enabled) {
    await check("le rate limiter bloque les connexions en rafale", async () => {
      const attempt = () =>
        request("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "inconnu@example.com",
            password: "mauvais-mot-de-passe",
          }),
        });

      let limited = null;
      for (let i = 0; i < env.rateLimit.authMax + 5 && !limited; i += 1) {
        const response = await attempt();
        if (response.status === 429) limited = response;
      }

      expect(limited, `aucun 429 apres ${env.rateLimit.authMax + 5} tentatives`);
      expect(limited.headers.get("retry-after"), "Retry-After manquant");
      return `429 une fois le quota atteint (${env.rateLimit.authMax})`;
    });
  }

  await new Promise((resolve) => server.close(resolve));
  await disconnectDB();

  const failed = results.filter((result) => !result.ok);
  console.log(
    `\n[smoke] ${results.length - failed.length}/${results.length} verifications reussies`,
  );

  if (failed.length) {
    console.error(`[smoke] echecs : ${failed.map((f) => f.label).join(" | ")}`);
    process.exit(1);
  }
};

if (require.main === module) {
  run().catch(async (error) => {
    console.error(`[smoke] interrompu : ${error.stack || error.message}`);
    await disconnectDB().catch(() => {});
    process.exit(1);
  });
}

module.exports = { run };
