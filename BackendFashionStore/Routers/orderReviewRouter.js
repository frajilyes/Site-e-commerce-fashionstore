const { Router } = require("express");
const {
  getAllOrderReviews,
  getOrderReviewById,
  createOrderReview,
  updateOrderReview,
  deleteOrderReviewById,
} = require("../Controllers/orderReviewController");
const { protect } = require("../Middlewares/authMiddleware");
const {
  validateOrderReview,
  validateObjectId,
} = require("../Middlewares/validate");

const orderReviewRouter = Router();

orderReviewRouter.use(protect);

orderReviewRouter.get("/", getAllOrderReviews);
orderReviewRouter.get("/:id", validateObjectId(), getOrderReviewById);
orderReviewRouter.post("/", validateOrderReview, createOrderReview);
orderReviewRouter.put("/:id", validateObjectId(), updateOrderReview);
orderReviewRouter.delete("/:id", validateObjectId(), deleteOrderReviewById);

module.exports = orderReviewRouter;
