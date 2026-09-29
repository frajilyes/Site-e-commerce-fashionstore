const express = require("express");
const { Router } = require("express");
const {
  receiveStripeEvent,
} = require("../Controllers/stripeWebhookController");

const stripeWebhookRouter = Router();

stripeWebhookRouter.post(
  "/",
  express.raw({ type: "application/json" }),
  receiveStripeEvent,
);

module.exports = stripeWebhookRouter;
