const mongoose = require("mongoose");

const clothesSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    audience: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },

    rating: {
      type: Number,
      default: 0,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    badge: {
      type: String,
      required: true,
    },
    badgeColor: {
      type: String,
      required: true,
    },
    inStock: {  type: Boolean, default: true },
    material: { type: String, required: true },
    soldCount: { type: Number, default: 0 },

    type: { type: String },
    fitType: { type: String },
    fit: { type: String },
    features: { type: [String], default: undefined },
    ageRange: { type: String },
    ageGroup: { type: String },
    gender: { type: String },
    occasion: { type: String },
    collar: { type: String },
    neckline: { type: String },
    sleeve: { type: String },
    length: { type: String },
    inseam: { type: String },
    rise: { type: String },
    heelHeight: { type: String },
    closure: { type: String },
    uvProtection: { type: String },
    lensType: { type: String },
    weight: { type: String },
    care: { type: String },
  },
  { timestamps: true },
);
clothesSchema.index({ title: "text", category: "text", subCategory: "text" });

module.exports = mongoose.model("Clothes", clothesSchema);
