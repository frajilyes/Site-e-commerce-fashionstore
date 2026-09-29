const { Router } = require("express");
const {
  getAllClothes,
  getClothesById,
  createClothes,
  updateClothes,
  deleteClothesById,
} = require("../Controllers/clothesController");
const {
  getReviewsByClothes,
  createReview,
} = require("../Controllers/reviewController");
const { protect } = require("../Middlewares/authMiddleware");
const { isAdmin } = require("../Middlewares/adminMiddleware");
const {
  validateClothes,
  validateReview,
  validateObjectId,
} = require("../validators");
const { stripHtmlFields } = require("../Middlewares/sanitize");

const clothesRouter = Router();

const publicCache = (req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=60, stale-while-revalidate=300",
  );
  next();
};

clothesRouter.get("/", publicCache, getAllClothes);
clothesRouter.get("/:id", publicCache, validateObjectId(), getClothesById);

clothesRouter.get(
  "/:clothesId/reviews",
  validateObjectId("clothesId"),
  getReviewsByClothes,
);
clothesRouter.post(
  "/:clothesId/reviews",
  protect,
  validateObjectId("clothesId"),
  stripHtmlFields("comment"),
  validateReview,
  createReview,
);

clothesRouter.post(
  "/",
  protect,
  isAdmin,
  stripHtmlFields("title", "description"),
  validateClothes,
  createClothes,
);
clothesRouter.put(
  "/:id",
  protect,
  isAdmin,
  validateObjectId(),
  stripHtmlFields("title", "description"),
  updateClothes,
);
clothesRouter.delete("/:id", protect, isAdmin, validateObjectId(), deleteClothesById);

module.exports = clothesRouter;
