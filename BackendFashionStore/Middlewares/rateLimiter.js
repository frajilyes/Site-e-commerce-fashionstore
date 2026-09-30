
const env = require("../config/env");
const ApiError = require("../Utils/ApiError");

const buckets = new Map();
const MAX_BUCKETS = 100000;

const SWEEP_INTERVAL_MS = 60 * 1000;
const sweeper = setInterval(() => {
  const now = Date.now();
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= now) buckets.delete(key);
  });
}, SWEEP_INTERVAL_MS);
if (typeof sweeper.unref === "function") sweeper.unref();

const clientKey = (req, scope) => {
  const identity = req.user?._id ? `user:${req.user._id}` : `ip:${req.ip}`;
  return `${scope}|${identity}`;
};

const hit = (key, windowMs) => {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (!existing && buckets.size >= MAX_BUCKETS) {
      buckets.delete(buckets.keys().next().value);
    }
    const fresh = { count: 1, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return fresh;
  }

  existing.count += 1;
  return existing;
};

const rateLimiter = ({
  max = env.rateLimit.max,
  windowMs = env.rateLimit.windowMs,
  scope = "global",
  message = "Too many requests, please try again later",
  skipSuccessfulRequests = false,
  skip = null,
  keyGenerator = null,
} = {}) => {
  return (req, res, next) => {
    if (!env.rateLimit.enabled || (skip && skip(req))) return next();

    const custom = keyGenerator ? keyGenerator(req) : undefined;
    if (keyGenerator && !custom) return next();
    const key = custom ? `${scope}|${custom}` : clientKey(req, scope);
    const bucket = hit(key, windowMs);
    const remaining = Math.max(0, max - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAt - Date.now()) / 1000);

    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", Math.max(0, resetSeconds));

    if (bucket.count > max) {
      res.setHeader("Retry-After", Math.max(1, resetSeconds));
      return next(new ApiError(429, message, "RATE_LIMITED"));
    }

    if (skipSuccessfulRequests) {
      res.on("finish", () => {
        if (res.statusCode < 400) {
          const current = buckets.get(key);
          if (current) current.count = Math.max(0, current.count - 1);
        }
      });
    }

    next();
  };
};

const apiLimiter = rateLimiter({
  scope: "api",
  max: env.rateLimit.max,
  message: "Too many requests from this client, please slow down",
});

const authLimiter = rateLimiter({
  scope: "auth",
  max: env.rateLimit.authMax,
  skipSuccessfulRequests: true,
  message:
    "Too many attempts. Wait a few minutes before trying again, or reset your session.",
});

const accountLoginLimiter = rateLimiter({
  scope: "login-account",
  max: env.rateLimit.accountMax,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    typeof req.body?.email === "string"
      ? `email:${req.body.email.trim().toLowerCase()}`
      : null,
  message:
    "Too many failed attempts on this account. Please wait before trying again.",
});

const resetRateLimits = () => buckets.clear();

module.exports = {
  rateLimiter,
  apiLimiter,
  authLimiter,
  accountLoginLimiter,
  resetRateLimits,
};
