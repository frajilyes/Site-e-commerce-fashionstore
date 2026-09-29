
const env = require("../config/env");
const payement = require("../Models/payement");
const order = require("../Models/order");
const { createCheckoutSession: openCheckoutSession } = require("../services/paymentService");
const ApiError = require("../Utils/ApiError");
const asyncHandler = require("../Utils/asyncHandler");
const { ok, created } = require("../Utils/response");

const CLIENT_FIELDS = [
  "shipping",
  "paymentMethod",
  "deliveryMethod",
  "SendAsAgift",
];

const WRITABLE_FIELDS = [
  "order",
  ...CLIENT_FIELDS,
  "amount",
  "currency",
  "status",
  "stripeSessionId",
  "stripePaymentIntentId",
  "paidAt",
];

const pick = (source, fields) => {
  const result = {};
  fields.forEach((field) => {
    if (source[field] !== undefined) result[field] = source[field];
  });
  return result;
};

const assertOwnerOrAdmin = (doc, currentUser, action) => {
  const isOwner =
    doc.user && doc.user.toString() === currentUser._id.toString();

  if (!isOwner && currentUser.role !== "admin") {
    throw ApiError.forbidden(`You can only ${action} your own payment`);
  }
};

const findPayementOr404 = async (id, populateOrder = false) => {
  const query = payement.findById(id);
  if (populateOrder) query.populate("order");

  const found = await query;
  if (!found) {
    throw ApiError.notFound("Payment not found");
  }
  return found;
};

const getAllPayements = asyncHandler(async (req, res) => {
  ok(res, await payement.find());
});

const getPayementById = asyncHandler(async (req, res) => {
  const found = await findPayementOr404(req.params.id);
  assertOwnerOrAdmin(found, req.user, "view");

  ok(res, found);
});

const createPayement = asyncHandler(async (req, res) => {
  const relatedOrder = await order.findById(req.body.order);

  if (
    !relatedOrder ||
    (relatedOrder.user?.toString() !== req.user._id.toString() &&
      req.user.role !== "admin")
  ) {
    throw ApiError.notFound("Order not found");
  }

  if (relatedOrder.isPaid) {
    throw ApiError.conflict("This order is already paid");
  }

  created(
    res,
    await payement.create({
      ...pick(req.body, CLIENT_FIELDS),
      user: req.user._id,
      order: relatedOrder._id,
      amount: relatedOrder.totalPrice,
      currency: env.stripe.currency.toUpperCase(),
      status: "Pending",
    }),
  );
});

const updatePayement = asyncHandler(async (req, res) => {
  const updated = await payement.findByIdAndUpdate(
    req.params.id,
    { $set: pick(req.body, ["user", ...WRITABLE_FIELDS]) },
    { returnDocument: "after", runValidators: true },
  );

  if (!updated) {
    throw ApiError.notFound("Payment not found");
  }

  ok(res, updated);
});

const deletePayementById = asyncHandler(async (req, res) => {
  const deleted = await payement.findByIdAndDelete(req.params.id);
  if (!deleted) {
    throw ApiError.notFound("Payment not found");
  }

  ok(res, deleted);
});

const createCheckoutSession = asyncHandler(async (req, res) => {
  const found = await findPayementOr404(req.params.id, true);
  assertOwnerOrAdmin(found, req.user, "pay");

  if (found.status === "Completed" || found.order?.isPaid) {
    throw ApiError.conflict("This payment is already completed");
  }

  const session = await openCheckoutSession(found);

  found.stripeSessionId = session.id;
  await found.save();

  created(res, { sessionId: session.id, url: session.url });
});

module.exports = {
  getAllPayements,
  getPayementById,
  createPayement,
  updatePayement,
  deletePayementById,
  createCheckoutSession,
};
