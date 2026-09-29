const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    items: [
      {
        clothes: { type: mongoose.Schema.Types.ObjectId, ref: "Clothes" },
        quantity: Number,
      },
    ],

    stripePaymentMethodId: {
      type: String,
      required: true,
    },
    CartholderName: {
      type: String,
    },
    CardBrand: {
      type: String,
    },
    Last4: {
      type: String,
    },
    ExpiryDate: {
      type: String,
    },
    SaveCardForFuturePurchases: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
