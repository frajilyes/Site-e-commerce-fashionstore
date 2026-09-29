
const mongoose = require("mongoose");
const clothes = require("../Models/clothes");
const ApiError = require("../Utils/ApiError");

const TAX_RATE = 0.08;

const SHIPPING_COST = {
  "Standard Delivery": 5,
  "Express Delivery": 15,
  "Free Delivery": 0,
};

const ESTIMATED_DELIVERY = {
  "Standard Delivery": "3-5 business days",
  "Express Delivery": "1-2 business days",
  "Free Delivery": "7-10 business days",
};

const PROMO_CODES = {
  SAVE10: 10,
  SAVE20: 20,
  FASHION50: 50,
  WELCOME15: 15,
};

const MAX_LINES = 50;
const MAX_QUANTITY = 20;

const round2 = (value) => Math.round(value * 100) / 100;

const normalizePromo = (code) => {
  const key = String(code || "").trim().toUpperCase();
  return PROMO_CODES[key] ? key : null;
};

const priceOrder = async ({ items, deliveryMethod, promoCode }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest("items must contain at least one line");
  }
  if (items.length > MAX_LINES) {
    throw ApiError.badRequest(`An order cannot contain more than ${MAX_LINES} lines`);
  }

  const lines = items.map((item, index) => {
    const id = item?.clothes;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest(`items[${index}].clothes is not a valid id`);
    }

    const quantity = Number.parseInt(item.quantity ?? 1, 10);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw ApiError.badRequest(
        `items[${index}].quantity must be between 1 and ${MAX_QUANTITY}`,
      );
    }

    const strings = (value) =>
      (Array.isArray(value) ? value : [])
        .filter((v) => typeof v === "string")
        .slice(0, 5)
        .map((v) => v.slice(0, 40));

    return {
      clothes: String(id),
      quantity: quantity,
      size: strings(item.size),
      color: strings(item.color),
    };
  });

  const ids = [...new Set(lines.map((line) => line.clothes))];
  const products = await clothes
    .find({ _id: { $in: ids } }, { price: 1, inStock: 1, title: 1 })
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  let subtotal = 0;
  lines.forEach((line, index) => {
    const product = byId.get(line.clothes);
    if (!product) {
      throw ApiError.badRequest(`items[${index}].clothes does not exist`);
    }
    if (product.inStock === false) {
      throw ApiError.badRequest(`"${product.title}" is out of stock`);
    }
    subtotal += Number(product.price) * line.quantity;
  });

  const method = SHIPPING_COST[deliveryMethod] !== undefined
    ? deliveryMethod
    : "Standard Delivery";
  const shipping = SHIPPING_COST[method];
  const tax = subtotal * TAX_RATE;
  const promo = normalizePromo(promoCode);
  const discount = promo ? PROMO_CODES[promo] : 0;
  const total = round2(Math.max(0, subtotal + shipping + tax - discount));

  return {
    lines: lines,
    deliveryMethod: method,
    estimatedDelivery: ESTIMATED_DELIVERY[method],
    promoCode: promo,
    subtotal: round2(subtotal),
    shipping: shipping,
    tax: round2(tax),
    discount: discount,
    total: total,
  };
};

module.exports = {
  priceOrder,
  TAX_RATE,
  SHIPPING_COST,
  PROMO_CODES,
  MAX_QUANTITY,
};
