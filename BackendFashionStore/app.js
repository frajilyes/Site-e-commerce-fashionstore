
const compression = require("compression");
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");

const env = require("./config/env");
const { sanitizeRequest } = require("./Middlewares/sanitize");
const { apiLimiter } = require("./Middlewares/rateLimiter");
const { notFound, errorHandler } = require("./Middlewares/errorHandler");
const ApiError = require("./Utils/ApiError");

const userRouter = require("./Routers/routeAuth");
const profileRouter = require("./Routers/userRouter");
const clothesRouter = require("./Routers/clothesRouter");
const reviewRouter = require("./Routers/reviewRouter");
const orderRouter = require("./Routers/orderRouter");
const orderReviewRouter = require("./Routers/orderReviewRouter");
const cartRouter = require("./Routers/cartRouter");
const wishListRouter = require("./Routers/wishListRouter");
const payementRouter = require("./Routers/payementRouter");
const webHookRouter = require("./Routers/webHookRouter");
const stripeWebhookRouter = require("./Routers/stripeWebhookRouter");

const app = express();

if (env.security.trustProxy) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  );
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  if (env.isProduction) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(compression({ threshold: 1024 }));

app.use(
  cors({
    maxAge: 600,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!env.clientOrigins.length) {
        return env.isProduction
          ? callback(ApiError.forbidden("CORS is not configured"))
          : callback(null, true);
      }
      if (env.clientOrigins.includes(origin)) return callback(null, true);

      return callback(
        ApiError.forbidden(`Origin ${origin} is not allowed by CORS`),
      );
    },
    credentials: true,
    exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
  }),
);

app.use("/api/webhook/stripe", stripeWebhookRouter);

app.use(express.json({ limit: env.security.bodyLimit }));
app.use(
  express.urlencoded({
    extended: false,
    limit: env.security.bodyLimit,
    parameterLimit: 100,
  }),
);

app.use(sanitizeRequest);

app.get("/api/health", (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;

  if (env.isProduction) {
    return res.status(dbReady ? 200 : 503).json({
      status: dbReady ? "ok" : "degraded",
      database: dbReady ? "connected" : "disconnected",
    });
  }

  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    env: env.nodeEnv,
    database: dbReady ? "connected" : "disconnected",
    services: {
      stripe: env.stripe.isConfigured,
      google: env.google.isConfigured,
      mail: env.mail.isConfigured,
    },
  });
});

app.use("/api", apiLimiter);

app.use("/api/auth", userRouter);
app.use("/api/users", profileRouter);
app.use("/api/clothes", clothesRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/orders", orderRouter);
app.use("/api/order-reviews", orderReviewRouter);
app.use("/api/carts", cartRouter);
app.use("/api/payments", payementRouter);
app.use("/api/wishlists", wishListRouter);
app.use("/api/webhook", webHookRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
