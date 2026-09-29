const mongoose = require("mongoose");
const {
  shippingAddressSchema,
  PAYMENT_METHODS,
  DELIVERY_METHODS,
} = require("./shippingAddress");

const payementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    shipping: shippingAddressSchema,

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "USD",
    },

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "Card",
    },

    deliveryMethod: {
      type: String,
      enum: DELIVERY_METHODS,
      default: "Standard Delivery",
    },

    SendAsAgift: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },

    paidAt: {
      type: Date,
    },

    stripeSessionId: {
      type: String,
    },

    stripePaymentIntentId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

payementSchema.index({ user: 1 });
payementSchema.index({ order: 1 });
payementSchema.index({ stripeSessionId: 1 }, { sparse: true });
payementSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });

module.exports = mongoose.model("Payement", payementSchema);
