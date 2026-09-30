
require("dotenv").config({ quiet: true });

const raw = process.env;

const str = (value, fallback = "") => {
  const trimmed = String(value ?? "").trim();
  return trimmed || fallback;
};

const int = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const bool = (value, fallback = false) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const list = (value) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const nodeEnv = str(raw.NODE_ENV, "development");

const clientOrigins = list(raw.CLIENT_URL).map((origin) =>
  origin.replace(/\/+$/, ""),
);

const smtpHost = str(raw.SMTP_HOST);
const smtpUser = str(raw.SMTP_USER);
const smtpPass = str(raw.SMTP_PASS);

const stripeSecretKey = str(raw.STRIPE_SECRET_KEY);
const googleClientId = str(raw.GOOGLE_CLIENT_ID);

const env = {
  nodeEnv: nodeEnv,
  isProduction: nodeEnv === "production",
  isTest: nodeEnv === "test",
  isDevelopment: nodeEnv === "development",
  port: int(raw.PORT, 3000),

  dbUri: str(raw.DB_URI, "mongodb://localhost:27017/fashionstore"),

  jwt: {
    secret: str(raw.JWT_SECRET),
    expiresIn: str(raw.JWT_EXPIRES_IN, "7d"),
  },

  clientOrigins: clientOrigins,
  clientUrl: clientOrigins[0] || "http://localhost:5173",

  stripe: {
    secretKey: stripeSecretKey,
    webhookSecret: str(raw.STRIPE_WEBHOOK_SECRET),
    currency: str(raw.STRIPE_CURRENCY, "usd").toLowerCase(),
    isConfigured: stripeSecretKey.startsWith("sk_"),
  },

  google: {
    clientId: googleClientId,
    isConfigured: googleClientId.endsWith(".apps.googleusercontent.com"),
  },

  mail: {
    host: smtpHost,
    port: int(raw.SMTP_PORT, 587),
    user: smtpUser,
    pass: smtpPass,
    from: str(raw.MAIL_FROM) || `"FashionStore" <${smtpUser}>`,
    isConfigured: Boolean(smtpHost && smtpUser && smtpPass),
  },

  security: {
    bcryptRounds: int(raw.BCRYPT_SALT_ROUNDS, 10),
    trustProxy: bool(raw.TRUST_PROXY, false),
    bodyLimit: str(raw.BODY_LIMIT, "1mb"),
  },

  rateLimit: {
    windowMs: int(raw.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: int(raw.RATE_LIMIT_MAX, 600),
    authMax: int(raw.RATE_LIMIT_AUTH_MAX, 20),
    accountMax: int(raw.RATE_LIMIT_ACCOUNT_MAX, 10),
    enabled: bool(raw.RATE_LIMIT_ENABLED, true),
  },

  pagination: {
    defaultLimit: int(raw.PAGE_SIZE_DEFAULT, 24),
    maxLimit: int(raw.PAGE_SIZE_MAX, 100),
  },

  seed: {
    adminEmail: str(raw.SEED_ADMIN_EMAIL),
    adminPassword: str(raw.SEED_ADMIN_PASSWORD),
    adminFirstName: str(raw.SEED_ADMIN_FIRST_NAME, "Admin"),
    adminLastName: str(raw.SEED_ADMIN_LAST_NAME, "FashionStore"),
  },
};

const assertEnv = () => {
  const errors = [];
  const warnings = [];

  if (!env.jwt.secret) {
    errors.push("JWT_SECRET est vide : aucun jeton ne peut etre signe");
  } else if (env.isProduction && env.jwt.secret.length < 32) {
    errors.push("JWT_SECRET doit faire au moins 32 caracteres en production");
  }

  if (
    env.isProduction &&
    env.jwt.secret &&
    (new Set(env.jwt.secret).size < 10 ||
      /^(secret|changeme|password|jwt|test)/i.test(env.jwt.secret))
  ) {
    errors.push(
      "JWT_SECRET est trop previsible. Generer une valeur aleatoire : " +
        "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
    );
  }

  if (env.security.bcryptRounds < 10 || env.security.bcryptRounds > 15) {
    errors.push("BCRYPT_SALT_ROUNDS doit etre compris entre 10 et 15");
  }

  if (env.isProduction) {
    env.clientOrigins
      .filter((origin) => !origin.startsWith("https://"))
      .forEach((origin) =>
        warnings.push(
          `CLIENT_URL contient une origine non HTTPS en production : ${origin}`,
        ),
      );
    if (!env.clientOrigins.length) {
      errors.push("CLIENT_URL est obligatoire en production (CORS)");
    }
  }

  if (!env.dbUri) {
    errors.push("DB_URI est vide : impossible de joindre MongoDB");
  }

  if (!env.clientOrigins.length) {
    warnings.push(
      "CLIENT_URL est vide : CORS refusera le navigateur et les liens de " +
        "confirmation pointeront vers http://localhost:5173",
    );
  }

  if (!env.stripe.isConfigured) {
    warnings.push("STRIPE_SECRET_KEY absente : paiements et panier indisponibles");
  }
  if (env.stripe.isConfigured && !env.stripe.webhookSecret) {
    warnings.push(
      "STRIPE_WEBHOOK_SECRET absente : /api/webhook/stripe rejettera tout",
    );
  }
  if (!env.google.isConfigured) {
    warnings.push("GOOGLE_CLIENT_ID absent : « Continue with Google » desactive");
  }
  if (!env.mail.isConfigured) {
    warnings.push(
      "SMTP incomplet : les liens de confirmation seront affiches dans la console",
    );
  }

  if (errors.length) {
    throw new Error(
      `Configuration invalide (.env) :\n  - ${errors.join("\n  - ")}`,
    );
  }

  return warnings;
};

const logEnvWarnings = () => {
  if (env.isTest) return;
  assertEnv().forEach((warning) => console.warn(`[env] ${warning}`));
};

module.exports = env;
module.exports.env = env;
module.exports.assertEnv = assertEnv;
module.exports.logEnvWarnings = logEnvWarnings;
