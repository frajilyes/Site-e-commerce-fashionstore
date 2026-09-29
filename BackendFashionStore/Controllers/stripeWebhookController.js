const mongoose = require("mongoose");
const env = require("../config/env");
const stripe = require("../config/stripe");
const webHook = require("../Models/webHook");
const payement = require("../Models/payement");
const order = require("../Models/order");

const asId = (value) => (typeof value === "string" ? value : value?.id || null);

async function findPayement({ payementId, sessionId, paymentIntentId }) {
  if (payementId && mongoose.Types.ObjectId.isValid(payementId)) {
    const byId = await payement.findById(payementId);
    if (byId) {
      return byId;
    }
  }

  if (sessionId) {
    const bySession = await payement.findOne({ stripeSessionId: sessionId });
    if (bySession) {
      return bySession;
    }
  }

  if (paymentIntentId) {
    return payement.findOne({ stripePaymentIntentId: paymentIntentId });
  }

  return null;
}

async function markOrderPaid(orderId) {
  if (!orderId) {
    return;
  }
  await order.findByIdAndUpdate(orderId, { $set: { isPaid: true } });
}

async function markPayementPaid(payement1, event, { sessionId, intentId }) {
  if (payement1.status === "Completed") {
    return;
  }

  payement1.status = "Completed";
  payement1.paidAt = new Date(event.created * 1000);
  if (sessionId) {
    payement1.stripeSessionId = sessionId;
  }
  if (intentId) {
    payement1.stripePaymentIntentId = intentId;
  }
  await payement1.save();

  await markOrderPaid(payement1.order);
}

async function markPayementFailed(payement1) {
  if (payement1.status !== "Pending") {
    return;
  }
  payement1.status = "Failed";
  await payement1.save();
}

function amountMatches(payement1, amountInCents, currency) {
  const expected = Math.round(Number(payement1.amount) * 100);
  const sameCurrency =
    !currency ||
    !payement1.currency ||
    String(currency).toLowerCase() === String(payement1.currency).toLowerCase();
  return Number(amountInCents) === expected && sameCurrency;
}

async function onCheckoutCompleted(session, event) {
  if (session.payment_status !== "paid") {
    return;
  }

  const intentId = asId(session.payment_intent);
  const payement1 = await findPayement({
    payementId: session.metadata?.payementId,
    sessionId: session.id,
    paymentIntentId: intentId,
  });

  if (!payement1) {
    console.warn(
      `Webhook ${event.id}: aucun paiement lié à la session ${session.id}`,
    );
    return;
  }

  if (!amountMatches(payement1, session.amount_total, session.currency)) {
    console.error(
      `Webhook ${event.id}: montant encaissé (${session.amount_total} ${session.currency}) ` +
        `différent du montant attendu pour le paiement ${payement1._id}`,
    );
    await markPayementFailed(payement1);
    return;
  }

  await markPayementPaid(payement1, event, { sessionId: session.id, intentId });
}

async function onCheckoutFailed(session, event) {
  const payement1 = await findPayement({
    payementId: session.metadata?.payementId,
    sessionId: session.id,
    paymentIntentId: asId(session.payment_intent),
  });

  if (!payement1) {
    console.warn(
      `Webhook ${event.id}: aucun paiement lié à la session ${session.id}`,
    );
    return;
  }

  await markPayementFailed(payement1);
}

async function onPaymentIntentSucceeded(intent, event) {
  const payement1 = await findPayement({
    payementId: intent.metadata?.payementId,
    paymentIntentId: intent.id,
  });

  if (!payement1) {
    console.warn(`Webhook ${event.id}: aucun paiement lié à ${intent.id}`);
    return;
  }

  if (!amountMatches(payement1, intent.amount_received ?? intent.amount, intent.currency)) {
    console.error(
      `Webhook ${event.id}: montant du PaymentIntent ${intent.id} différent ` +
        `du montant attendu pour le paiement ${payement1._id}`,
    );
    await markPayementFailed(payement1);
    return;
  }

  await markPayementPaid(payement1, event, { intentId: intent.id });
}

async function onPaymentIntentFailed(intent, event) {
  const payement1 = await findPayement({
    payementId: intent.metadata?.payementId,
    paymentIntentId: intent.id,
  });

  if (!payement1) {
    console.warn(`Webhook ${event.id}: aucun paiement lié à ${intent.id}`);
    return;
  }

  await markPayementFailed(payement1);
}

const HANDLERS = {
  "checkout.session.completed": onCheckoutCompleted,
  "checkout.session.async_payment_succeeded": onCheckoutCompleted,
  "checkout.session.expired": onCheckoutFailed,
  "checkout.session.async_payment_failed": onCheckoutFailed,
  "payment_intent.succeeded": onPaymentIntentSucceeded,
  "payment_intent.payment_failed": onPaymentIntentFailed,
};

async function receiveStripeEvent(req, res) {
  const secret = env.stripe.webhookSecret;

  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET absent : événement Stripe refusé");
    return res
      .status(500)
      .json({ message: "Webhook secret is not configured" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      secret,
    );
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Webhook signature verification failed" });
  }

  try {
    const seen = await webHook.findOneAndUpdate(
      { eventId: event.id },
      {
        $setOnInsert: {
          eventId: event.id,
          type: event.type,
          data: event.data.object,
          processed: false,
        },
      },
      { upsert: true, returnDocument: "before" },
    );

    if (seen && seen.processed) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    const handler = HANDLERS[event.type];
    if (handler) {
      await handler(event.data.object, event);
    } else {
      console.log(`Webhook ${event.type} reçu (${event.id}) : aucun traitement`);
    }

    await webHook.updateOne(
      { eventId: event.id },
      { $set: { processed: true } },
    );

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(`Webhook ${event.type} (${event.id}) a échoué :`, error);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
}

module.exports = { receiveStripeEvent };
