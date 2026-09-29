const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clothes: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clothes",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

reviewSchema.index({ user: 1, clothes: 1 }, { unique: true });
reviewSchema.index({ clothes: 1, createdAt: -1 });

reviewSchema.statics.syncClothesRating = async function (clothesId) {
  const [stats] = await this.aggregate([
    { $match: { clothes: new mongoose.Types.ObjectId(clothesId) } },
    {
      $group: {
        _id: "$clothes",
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  await mongoose.model("Clothes").findByIdAndUpdate(clothesId, {
    rating: stats ? Math.round(stats.average * 10) / 10 : 0,
    reviews: stats ? stats.count : 0,
  });
};

const resync = (model, clothesId) => {
  model.syncClothesRating(clothesId).catch((error) => {
    console.error(`[review] note non recalculee pour ${clothesId} :`, error.message);
  });
};

reviewSchema.post("save", function () {
  resync(this.constructor, this.clothes);
});

reviewSchema.post(/^findOneAnd/, function (doc) {
  if (doc) resync(doc.constructor, doc.clothes);
});

module.exports = mongoose.model("Review", reviewSchema);
