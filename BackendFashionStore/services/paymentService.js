
const stripe = require("../config/stripe");
const env = require("../config/env");
const user = require("../Models/userAuth");
const ApiError = require("../Utils/ApiError");

const statusFromStripeError = (error) =>
  error.type === "StripeInvalidRequestError" || error.type === "StripeCardError"
    ? 400
    : 500;

const toApiError = (error) => {
  if (error instanceof ApiError) return error;
  if (!error.type || !String(error.type).startsWith("Stripe")) return error;

  return new ApiError(
    statusFromStripeError(error),
    error.message,
    error.code || "STRIPE_ERROR",
  );
};

const ensureStripeCustomer = async (currentUser) => {
  if (currentUser.stripeCustomerId) return currentUser.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: currentUser.email,
    name: `${currentUser.firstName} ${currentUser.lastName}`,
    metadata: { userId: currentUser._id.toString() },
  });

  await user.findByIdAndUpdate(currentUser._id, {
    $set: { stripeCustomerId: customer.id },
  });
  currentUser.stripeCustomerId = customer.id;

  return customer.id;
};

const resolvePaymentMethod = async (paymentMethodId, currentUser, save) => {
  try {
    const method = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (method.type !== "card" || !method.card) {
      throw ApiError.badRequest("The payment method is not a card");
    }

    if (save && currentUser) {
      const customerId = await ensureStripeCustomer(currentUser);
      if (method.customer !== customerId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });
      }
    }

    const { brand, last4, exp_month, exp_year } = method.card;

    return {
      stripePaymentMethodId: method.id,
      CartholderName: method.billing_details?.name || undefined,
      CardBrand: brand,
      Last4: last4,
      ExpiryDate: `${String(exp_month).padStart(2, "0")}/${String(exp_year).slice(-2)}`,
      SaveCardForFuturePurchases: Boolean(save),
    };
  } catch (error) {
    throw toApiError(error);
  }
};

const createCheckoutSession = async (payementDoc) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (payementDoc.currency || env.stripe.currency).toLowerCase(),
            unit_amount: Math.round(payementDoc.amount * 100),
            product_data: {
              name: payementDoc.order?.orderNumber
                ? `FashionStore order ${payementDoc.order.orderNumber}`
                : "FashionStore order",
            },
          },
        },
      ],
      customer_email: payementDoc.shipping?.Email || undefined,
      metadata: {
        payementId: payementDoc._id.toString(),
        orderId: payementDoc.order?._id ? payementDoc.order._id.toString() : "",
        userId: payementDoc.user.toString(),
      },
      success_url: `${env.clientUrl}/orders?payment=success`,
      cancel_url: `${env.clientUrl}/orders?payment=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    });

    return session;
  } catch (error) {
    throw toApiError(error);
  }
};

module.exports = {
  statusFromStripeError,
  toApiError,
  ensureStripeCustomer,
  resolvePaymentMethod,
  createCheckoutSession,
};
