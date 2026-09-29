const mongoose = require("mongoose");
const {
  shippingAddressSchema,
  PAYMENT_METHODS,
  DELIVERY_METHODS,
} = require("./shippingAddress");

const orderReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    payement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payement",
    },

    ShippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    DeliveryMethod: {
      type: String,
      enum: DELIVERY_METHODS,
      default: "Standard Delivery",
      required: true,
    },

    PaymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "Card",
      required: true,
    },

    SendAsAgift: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

orderReviewSchema.index({ order: 1 }, { unique: true });
orderReviewSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("OrderReview", orderReviewSchema);
