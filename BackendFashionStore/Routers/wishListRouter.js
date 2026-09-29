const { Router } = require("express");
const {
  getAllWishLists,
  getWishListById,
  createWishList,
  updateWishList,
  deleteWishListById,
} = require("../Controllers/wishListController");
const { protect } = require("../Middlewares/authMiddleware");
const { isAdmin } = require("../Middlewares/adminMiddleware");
const { validateObjectId } = require("../Middlewares/validate");

const wishListRouter = Router();

wishListRouter.use(protect);

wishListRouter.get("/", isAdmin, getAllWishLists);
wishListRouter.get("/:id", validateObjectId(), getWishListById);
wishListRouter.post("/", createWishList);
wishListRouter.put("/:id", validateObjectId(), updateWishList);
wishListRouter.delete("/:id", validateObjectId(), deleteWishListById);

module.exports = wishListRouter;
