const { Router } = require("express");
const {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReviewById,
} = require("../Controllers/reviewController");
const { protect } = require("../Middlewares/authMiddleware");
const { validateReview, validateObjectId } = require("../validators");
const { stripHtmlFields } = require("../Middlewares/sanitize");

const stripComment = stripHtmlFields("comment");

const reviewRouter = Router();

reviewRouter.get("/", getAllReviews);
reviewRouter.get("/:id", validateObjectId(), getReviewById);
reviewRouter.post("/", protect, stripComment, validateReview, createReview);
reviewRouter.put(
  "/:id",
  protect,
  validateObjectId(),
  stripComment,
  validateReview,
  updateReview,
);
reviewRouter.delete("/:id", protect, validateObjectId(), deleteReviewById);

module.exports = reviewRouter;
