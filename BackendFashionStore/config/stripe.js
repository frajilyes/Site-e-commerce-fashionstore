
const Stripe = require("stripe");
const env = require("./env");
const ApiError = require("../Utils/ApiError");

let client = null;

const getStripe = () => {
  if (!env.stripe.isConfigured) {
    throw new ApiError(
      503,
      "Stripe is not configured on the server (STRIPE_SECRET_KEY)",
      "STRIPE_NOT_CONFIGURED",
    );
  }

  if (!client) {
    client = new Stripe(env.stripe.secretKey, {
      appInfo: { name: "FashionStore", version: "1.0.0" },
      maxNetworkRetries: 2,
    });
  }

  return client;
};

const stripeProxy = new Proxy(
  {},
  {
    get(target, prop) {
      if (prop === "getStripe") return getStripe;
      if (prop === "isConfigured") return env.stripe.isConfigured;
      if (prop === "then" || typeof prop === "symbol") return undefined;
      return getStripe()[prop];
    },
  },
);

module.exports = stripeProxy;
module.exports.getStripe = getStripe;
