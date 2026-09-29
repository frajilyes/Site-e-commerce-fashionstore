const review = require("../Models/review");
const clothes = require("../Models/clothes");
const order = require("../Models/order");
const ApiError = require("../Utils/ApiError");
const asyncHandler = require("../Utils/asyncHandler");

const REVIEWER_FIELDS = "firstName lastName";

const getAllReviews = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.clothes) query.clothes = req.query.clothes;
  if (req.query.user) query.user = req.query.user;

  const reviews = await review
    .find(query)
    .populate("user", REVIEWER_FIELDS)
    .sort({ createdAt: -1 });

  res.status(200).json({ total: reviews.length, data: reviews });
});

const getReviewsByClothes = asyncHandler(async (req, res) => {
  const reviews = await review
    .find({ clothes: req.params.clothesId })
    .populate("user", REVIEWER_FIELDS)
    .sort({ createdAt: -1 });

  res.status(200).json({ total: reviews.length, data: reviews });
});

const getReviewById = asyncHandler(async (req, res) => {
  const found = await review
    .findById(req.params.id)
    .populate("user", REVIEWER_FIELDS);

  if (!found) {
    throw ApiError.notFound("Review not found");
  }

  res.status(200).json(found);
});

const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const clothesId = req.body.clothes || req.params.clothesId;

  const product = await clothes.findById(clothesId);
  if (!product) {
    throw ApiError.notFound("Clothes item not found");
  }

  const alreadyReviewed = await review.findOne({
    user: req.user._id,
    clothes: clothesId,
  });
  if (alreadyReviewed) {
    throw ApiError.conflict("You have already reviewed this item");
  }

  const paidOrder = await order.findOne({
    user: req.user._id,
    isPaid: true,
    "items.clothes": clothesId,
  });
  if (!paidOrder) {
    throw ApiError.forbidden("You can only review items you have purchased");
  }

  const created = await review.create({
    user: req.user._id,
    clothes: clothesId,
    order: paidOrder._id,
    rating: rating,
    comment: comment,
  });

  res.status(201).json(created);
});

const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const existing = await review.findById(req.params.id);
  if (!existing) {
    throw ApiError.notFound("Review not found");
  }

  if (existing.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("You can only edit your own review");
  }

  const updated = await review.findByIdAndUpdate(
    req.params.id,
    { $set: { rating, comment } },
    { returnDocument: "after", runValidators: true },
  );

  res.status(200).json(updated);
});

const deleteReviewById = asyncHandler(async (req, res) => {
  const existing = await review.findById(req.params.id);
  if (!existing) {
    throw ApiError.notFound("Review not found");
  }

  const isOwner = existing.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    throw ApiError.forbidden("You can only delete your own review");
  }

  await review.findByIdAndDelete(req.params.id);

  res.status(200).json({ message: "Review deleted successfully" });
});

module.exports = {
  getAllReviews,
  getReviewsByClothes,
  getReviewById,
  createReview,
  updateReview,
  deleteReviewById,
};
