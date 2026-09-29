const { statusFromStripeError } = require("../services/paymentService");

module.exports = { statusFromError: statusFromStripeError };
