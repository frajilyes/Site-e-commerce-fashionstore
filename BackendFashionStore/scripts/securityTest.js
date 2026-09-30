
const bcrypt = require("bcrypt");

const env = require("../config/env");
const connectDB = require("../config/db");
const { disconnectDB } = require("../config/db");
const app = require("../app");
const User = require("../Models/userAuth");
const Order = require("../Models/order");
const Payement = require("../Models/payement");
const OrderReview = require("../Models/orderReview");
const Clothes = require("../Models/clothes");
const WebHook = require("../Models/webHook");
const stripe = require("../config/stripe");
const { resetRateLimits } = require("../Middlewares/rateLimiter");

const PASSWORD = "Sec-Test-Passw0rd";
const stamp = Date.now();
const emails = [`sectest-a-${stamp}@example.test`, `sectest-b-${stamp}@example.test`];

let base = "";
const results = [];

const check = async (label, fn) => {
  try {
    const detail = await fn();
    results.push(true);
    console.log(`  ok    ${label}${detail ? ` — ${detail}` : ""}`);
  } catch (error) {
    results.push(false);
    console.log(`  ECHEC ${label} — ${error.message}`);
  }
};

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

const api = async (method, url, { token, body, headers = {} } = {}) => {
  const response = await fetch(`${base}${url}`, {
    method,
    headers: {
      ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, headers: response.headers, data };
};

const login = async (email, password = PASSWORD) => {
  const { status, data } = await api("POST", "/api/auth/login", {
    body: { email, password },
  });
  expect(status === 200 && data.token, `login ${email} : statut ${status}`);
  return data.token;
};

const run = async () => {
  await connectDB({ silent: true });
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  base = `http://127.0.0.1:${server.address().port}`;
  console.log(`[security] API de test sur ${base}\n`);

  const hash = await bcrypt.hash(PASSWORD, env.security.bcryptRounds);
  const [userA, userB] = await User.create(
    emails.map((email, i) => ({
      firstName: "Sec",
      lastName: `Test${i}`,
      email,
      phone: "+33600000000",
      password: hash,
      isEmailVerified: true,
      role: i === 1 ? "admin" : "user",
    })),
  );

  try {
    let tokenA = await login(userA.email);

    const products = await Clothes.find({ inStock: { $ne: false } }, { price: 1 })
      .limit(2)
      .lean();
    expect(products.length === 2, "catalogue vide — lancer `npm run seed`");
    const expected =
      Math.round(
        (products[0].price * 2 + products[1].price + 15 + (products[0].price * 2 + products[1].price) * 0.08) *
          100,
      ) / 100;

    let orderA = null;
    let paymentA = null;
    await check("prix et « isPaid » envoyes par le client sont ignores", async () => {
      const { status, data } = await api("POST", "/api/orders", {
        token: tokenA,
        body: {
          user: userB._id,
          items: [
            { clothes: products[0]._id, quantity: 2 },
            { clothes: products[1]._id, quantity: 1 },
          ],
          deliveryMethod: "Express Delivery",
          totalPrice: 0.01,
          isPaid: true,
          orderNumber: "HACKED-1",
        },
      });
      expect(status === 201, `statut ${status} ${JSON.stringify(data)}`);
      orderA = data;
      expect(data.isPaid === false, "la commande est marquee payee");
      expect(Math.abs(data.totalPrice - expected) < 0.01, `total ${data.totalPrice} au lieu de ${expected}`);
      expect(String(data.user) === String(userA._id), "commande attribuee a un autre compte");
      expect(data.orderNumber !== "HACKED-1", "numero de commande impose par le client");
      return `total recalcule ${data.totalPrice} $`;
    });

    await check("quantite negative / produit inexistant refuses", async () => {
      const neg = await api("POST", "/api/orders", {
        token: tokenA,
        body: { items: [{ clothes: products[0]._id, quantity: -5 }] },
      });
      const ghost = await api("POST", "/api/orders", {
        token: tokenA,
        body: { items: [{ clothes: "0123456789abcdef01234567", quantity: 1 }] },
      });
      expect(neg.status === 400, `quantite negative : ${neg.status}`);
      expect(ghost.status === 400, `produit fantome : ${ghost.status}`);
    });

    await check("paiement : statut « Completed » et montant client ignores", async () => {
      const { status, data } = await api("POST", "/api/payments", {
        token: tokenA,
        body: {
          order: orderA._id,
          amount: 0.01,
          status: "Completed",
          paidAt: new Date().toISOString(),
          shipping: {
            FirstName: "Sec", LastName: "Test", Phone: "0600000000",
            StreetAddress: "1 rue Test", City: "Paris", ZipCode: 75001,
          },
        },
      });
      expect(status === 201, `statut ${status} ${JSON.stringify(data)}`);
      expect(data.status === "Pending", `statut ${data.status}`);
      expect(data.amount === orderA.totalPrice, `montant ${data.amount}`);
      const order = await Order.findById(orderA._id).lean();
      expect(order.isPaid === false, "la commande est passee a payee");
      paymentA = data;
    });

    if (env.stripe.isConfigured && env.stripe.secretKey.startsWith("sk_test_")) {
      await check("session Stripe Checkout facturee au montant du serveur", async () => {
        const { status, data } = await api(
          "POST",
          `/api/payments/${paymentA._id}/checkout-session`,
          { token: tokenA },
        );
        expect(status === 201, `statut ${status} ${JSON.stringify(data)}`);
        expect(new URL(data.url).hostname === "checkout.stripe.com", `url ${data.url}`);
        const session = await stripe.checkout.sessions.retrieve(data.sessionId);
        expect(
          session.amount_total === Math.round(orderA.totalPrice * 100),
          `Stripe facture ${session.amount_total} au lieu de ${Math.round(orderA.totalPrice * 100)}`,
        );
        expect(
          session.success_url.endsWith("/orders?payment=success"),
          `retour ${session.success_url}`,
        );
        await stripe.checkout.sessions.expire(data.sessionId).catch(() => {});
        return `${session.amount_total / 100} $ sur checkout.stripe.com`;
      });
    }

    if (env.stripe.webhookSecret) {
      const stripeEvent = (amountInCents) => ({
        id: `evt_sectest_${stamp}_${amountInCents}`,
        object: "event",
        type: "checkout.session.completed",
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: `cs_test_sectest_${stamp}_${amountInCents}`,
            object: "checkout.session",
            payment_status: "paid",
            amount_total: amountInCents,
            currency: "usd",
            payment_intent: null,
            metadata: { payementId: String(paymentA._id) },
          },
        },
      });

      const postWebhook = (event, signature) => {
        const payload = JSON.stringify(event);
        return fetch(`${base}/api/webhook/stripe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Stripe-Signature":
              signature ??
              stripe.webhooks.generateTestHeaderString({
                payload,
                secret: env.stripe.webhookSecret,
              }),
          },
          body: payload,
        });
      };

      await check("webhook a la signature falsifiee refuse", async () => {
        const res = await postWebhook(stripeEvent(Math.round(orderA.totalPrice * 100)), "t=1,v1=deadbeef");
        expect(res.status === 400, `statut ${res.status}`);
        const order = await Order.findById(orderA._id).lean();
        expect(order.isPaid === false, "commande payee par un faux webhook");
      });

      await check("webhook signe mais montant altere : commande non payee", async () => {
        const res = await postWebhook(stripeEvent(1));
        expect(res.status === 200, `statut ${res.status}`);
        const [order, pay] = await Promise.all([
          Order.findById(orderA._id).lean(),
          Payement.findById(paymentA._id).lean(),
        ]);
        expect(order.isPaid === false, "commande payee pour 0,01 $");
        expect(pay.status === "Failed", `paiement ${pay.status}`);
        await Payement.updateOne({ _id: paymentA._id }, { $set: { status: "Pending" } });
      });

      await check("webhook signe au bon montant : commande payee", async () => {
        const res = await postWebhook(stripeEvent(Math.round(orderA.totalPrice * 100)));
        expect(res.status === 200, `statut ${res.status}`);
        const order = await Order.findById(orderA._id).lean();
        expect(order.isPaid === true, "commande toujours impayee");
      });
    }

    await check("impossible de payer / lire la commande d'un autre client", async () => {
      const orderB = await Order.create({ user: userB._id, orderNumber: `SEC-${stamp}`, totalPrice: 10 });
      const pay = await api("POST", "/api/payments", {
        token: tokenA,
        body: {
          order: orderB._id,
          shipping: {
            FirstName: "X", LastName: "Y", Phone: "0600000000",
            StreetAddress: "x", City: "x", ZipCode: 1,
          },
        },
      });
      const read = await api("GET", `/api/orders/${orderB._id}`, { token: tokenA });
      expect(pay.status === 404, `paiement : ${pay.status}`);
      expect(read.status === 404, `lecture : ${read.status}`);
    });

    await check("types inattendus rejetes en 400 (pas de 500)", async () => {
      const r1 = await api("POST", "/api/auth/login", { body: { email: userA.email, password: ["x"] } });
      const r2 = await api("POST", "/api/auth/verify-email", { body: { token: { a: 1 } } });
      expect(r1.status === 400, `login tableau : ${r1.status}`);
      expect(r2.status === 400, `verify objet : ${r2.status}`);
    });

    await check("reponse identique : compte inconnu / mauvais mot de passe", async () => {
      const unknown = await api("POST", "/api/auth/login", {
        body: { email: `nobody-${stamp}@example.test`, password: "Wrong-pass1" },
      });
      const wrong = await api("POST", "/api/auth/login", {
        body: { email: userA.email, password: "Wrong-pass1" },
      });
      expect(unknown.status === 401 && wrong.status === 401, "statuts differents");
      expect(unknown.data.message === wrong.data.message, "messages differents");
    });

    await check("les champs internes ne sortent pas dans /api/auth/me", async () => {
      const { data } = await api("GET", "/api/auth/me", { token: tokenA });
      ["password", "tokenVersion", "emailVerificationToken", "stripeCustomerId"].forEach((f) =>
        expect(!(f in data), `champ ${f} expose`),
      );
    });

    await check("changer de mot de passe revoque les anciens jetons", async () => {
      const { status, data } = await api("PUT", "/api/users/password", {
        token: tokenA,
        body: { currentPassword: PASSWORD, newPassword: "New-Passw0rd-2" },
      });
      expect(status === 200 && data.token, `changement : ${status}`);
      const old = await api("GET", "/api/auth/me", { token: tokenA });
      const fresh = await api("GET", "/api/auth/me", { token: data.token });
      expect(old.status === 401, `ancien jeton encore valide (${old.status})`);
      expect(fresh.status === 200, `nouveau jeton refuse (${fresh.status})`);
      tokenA = data.token;
    });

    await check("mot de passe faible refuse", async () => {
      const { status } = await api("PUT", "/api/users/password", {
        token: tokenA,
        body: { currentPassword: "New-Passw0rd-2", newPassword: "aaaaaaaa" },
      });
      expect(status === 400, `statut ${status}`);
    });

    await check("verrou par compte apres 10 echecs, meme si l'IP change", async () => {
      resetRateLimits();
      let last = 0;
      for (let i = 0; i < 11; i++) {
        const r = await api("POST", "/api/auth/login", {
          body: { email: userB.email, password: `Wrong-pass${i}` },
        });
        last = r.status;
      }
      resetRateLimits();
      expect(last === 429, `11e tentative : ${last}`);
    });

    await check("?fields=+champ ne force pas la lecture d'un champ cache", async () => {
      const { status, data } = await api("GET", "/api/clothes?fields=+password,title&limit=1");
      expect(status === 200, `statut ${status}`);
      expect(!("password" in (data.data[0] || {})), "password renvoye");
    });

    await check("en-tetes de securite et compression", async () => {
      const r = await fetch(`${base}/api/clothes`, { headers: { "Accept-Encoding": "gzip" } });
      await r.arrayBuffer();
      expect(/default-src 'none'/.test(r.headers.get("content-security-policy") || ""), "CSP absente");
      expect(r.headers.get("content-encoding") === "gzip", `encodage ${r.headers.get("content-encoding")}`);
      const me = await api("GET", "/api/auth/me", { token: tokenA });
      expect(me.headers.get("cache-control") === "no-store", "donnees privees cachables");
    });
  } finally {
    const ids = [userA._id, userB._id];
    const orders = await Order.find({ user: { $in: ids } }, { _id: 1 }).lean();
    await Promise.all([
      OrderReview.deleteMany({ user: { $in: ids } }),
      Payement.deleteMany({ user: { $in: ids } }),
      Order.deleteMany({ _id: { $in: orders.map((o) => o._id) } }),
      User.deleteMany({ _id: { $in: ids } }),
      WebHook.deleteMany({ eventId: { $regex: `^evt_sectest_${stamp}_` } }),
    ]);
    server.close();
    await disconnectDB();
  }

  const passed = results.filter(Boolean).length;
  console.log(`\n[security] ${passed}/${results.length} attaques bloquees (donnees de test supprimees)`);
  process.exit(passed === results.length ? 0 : 1);
};

run().catch(async (error) => {
  console.error(`[security] arret : ${error.message}`);
  await disconnectDB().catch(() => {});
  process.exit(1);
});

