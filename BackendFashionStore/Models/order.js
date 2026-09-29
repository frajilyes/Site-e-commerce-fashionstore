const mongoose = require("mongoose");
const { DELIVERY_METHODS } = require("./shippingAddress");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: [
      {
        clothes: { type: mongoose.Schema.Types.ObjectId, ref: "Clothes" },
        quantity: { type: Number, min: 1 },
        size: {
          type: [String],
          default: [],
        },
        color: { type: [String], default: [] },
      },
    ],
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    totalPrice: { type: Number, min: 0 },
    totalAmount: {
      type: String,
    },
    deliveryMethod: { type: String, enum: DELIVERY_METHODS },
    estimatedDelivery: { type: String },
    itemsOrdered: { type: String, maxlength: 2000 },

    isPaid: { type: Boolean, default: false },
    promoCode: { type: String, default: null },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, isPaid: 1, "items.clothes": 1 });

module.exports = mongoose.model("Order", orderSchema);
