const crypto = require("crypto");
const order = require("../Models/order");
const ApiError = require("../Utils/ApiError");
const asyncHandler = require("../Utils/asyncHandler");
const { priceOrder } = require("../services/orderPricing");

const buildOrderNumber = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;

const getAllOrders = asyncHandler(async (req, res) => {
  res.status(200).json(await order.find().sort({ createdAt: -1 }).lean());
});

const getOrderById = asyncHandler(async (req, res) => {
  const found = await order.findById(req.params.id);
  if (!found) {
    throw ApiError.notFound("Order not found");
  }

  const isOwner = found.user && found.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    throw ApiError.notFound("Order not found");
  }

  res.status(200).json(found);
});

const createOrder = asyncHandler(async (req, res) => {
  const { items, deliveryMethod, promoCode, itemsOrdered } = req.body;

  const pricing = await priceOrder({ items, deliveryMethod, promoCode });

  const created = await order.create({
    user: req.user._id,
    items: pricing.lines,
    orderNumber: buildOrderNumber(),
    totalPrice: pricing.total,
    totalAmount: `$${pricing.total.toFixed(2)}`,
    deliveryMethod: pricing.deliveryMethod,
    estimatedDelivery: pricing.estimatedDelivery,
    itemsOrdered:
      typeof itemsOrdered === "string" ? itemsOrdered.slice(0, 2000) : undefined,
    promoCode: pricing.promoCode,
    isPaid: false,
  });

  res.status(201).json(created);
});

const updateOrder = asyncHandler(async (req, res) => {
  const {
    items,
    totalPrice,
    totalAmount,
    estimatedDelivery,
    itemsOrdered,
    promoCode,
    isPaid,
  } = req.body;

  const updated = await order.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        items,
        totalPrice,
        totalAmount,
        estimatedDelivery,
        itemsOrdered,
        promoCode,
        isPaid,
      },
    },
    { returnDocument: "after", runValidators: true },
  );

  if (!updated) {
    throw ApiError.notFound("Order not found");
  }

  res.status(200).json(updated);
});

const deleteOrderById = asyncHandler(async (req, res) => {
  const deleted = await order.findByIdAndDelete(req.params.id);
  if (!deleted) {
    throw ApiError.notFound("Order not found");
  }

  res.status(200).json(deleted);
});

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrderById,
};
