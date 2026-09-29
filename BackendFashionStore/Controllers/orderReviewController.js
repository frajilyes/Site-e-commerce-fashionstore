const mongoose = require("mongoose");
const orderReview = require("../Models/orderReview");
const order = require("../Models/order");
const payement = require("../Models/payement");
const ApiError = require("../Utils/ApiError");
const asyncHandler = require("../Utils/asyncHandler");

const isOwnerOrAdmin = (doc, user) =>
  doc.user.toString() === user._id.toString() || user.role === "admin";

const assertOwnPayement = async (payementId, orderId, currentUser) => {
  if (payementId === undefined || payementId === null || payementId === "") return;

  if (!mongoose.Types.ObjectId.isValid(payementId)) {
    throw ApiError.badRequest("payement is not a valid id");
  }

  const found = await payement.findById(payementId).lean();
  const matches =
    found &&
    String(found.order) === String(orderId) &&
    (String(found.user) === String(currentUser._id) || currentUser.role === "admin");

  if (!matches) {
    throw ApiError.badRequest("payement does not match this order");
  }
};

const getAllOrderReviews = asyncHandler(async (req, res) => {
  const query = req.user.role === "admin" ? {} : { user: req.user._id };
  if (req.query.order) query.order = req.query.order;

  const reviews = await orderReview
    .find(query)
    .populate("order")
    .sort({ createdAt: -1 });

  res.status(200).json({ total: reviews.length, data: reviews });
});

const getOrderReviewById = asyncHandler(async (req, res) => {
  const found = await orderReview.findById(req.params.id).populate("order");

  if (!found) {
    throw ApiError.notFound("Order review not found");
  }

  if (!isOwnerOrAdmin(found, req.user)) {
    throw ApiError.forbidden("You can only see your own order review");
  }

  res.status(200).json(found);
});

const createOrderReview = asyncHandler(async (req, res) => {
  const {
    order: orderId,
    payement,
    ShippingAddress,
    DeliveryMethod,
    PaymentMethod,
    SendAsAgift,
  } = req.body;

  const relatedOrder = await order.findById(orderId);
  if (!relatedOrder) {
    throw ApiError.notFound("Order not found");
  }

  if (
    relatedOrder.user &&
    relatedOrder.user.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw ApiError.forbidden("This order belongs to another user");
  }

  const existing = await orderReview.findOne({ order: orderId });
  if (existing) {
    throw ApiError.conflict("This order already has a review step");
  }

  await assertOwnPayement(payement, orderId, req.user);

  const created = await orderReview.create({
    user: req.user._id,
    order: orderId,
    payement: payement,
    ShippingAddress: ShippingAddress,
    DeliveryMethod: DeliveryMethod,
    PaymentMethod: PaymentMethod,
    SendAsAgift: SendAsAgift,
  });

  res.status(201).json(created);
});

const updateOrderReview = asyncHandler(async (req, res) => {
  const existing = await orderReview.findById(req.params.id);
  if (!existing) {
    throw ApiError.notFound("Order review not found");
  }

  if (!isOwnerOrAdmin(existing, req.user)) {
    throw ApiError.forbidden("You can only edit your own order review");
  }

  const { payement, ShippingAddress, DeliveryMethod, PaymentMethod, SendAsAgift } =
    req.body;

  await assertOwnPayement(payement, existing.order, req.user);

  const updated = await orderReview.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        payement,
        ShippingAddress,
        DeliveryMethod,
        PaymentMethod,
        SendAsAgift,
      },
    },
    { returnDocument: "after", runValidators: true },
  );

  res.status(200).json(updated);
});

const deleteOrderReviewById = asyncHandler(async (req, res) => {
  const existing = await orderReview.findById(req.params.id);
  if (!existing) {
    throw ApiError.notFound("Order review not found");
  }

  if (!isOwnerOrAdmin(existing, req.user)) {
    throw ApiError.forbidden("You can only delete your own order review");
  }

  await orderReview.findByIdAndDelete(req.params.id);

  res.status(200).json({ message: "Order review deleted successfully" });
});

module.exports = {
  getAllOrderReviews,
  getOrderReviewById,
  createOrderReview,
  updateOrderReview,
  deleteOrderReviewById,
};
