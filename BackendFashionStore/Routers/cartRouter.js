const { Router } = require("express");
const {
  getAllCarts,
  getCartById,
  createCart,
  updateCart,
  deleteCartById,
} = require("../Controllers/cartController");
const { protect } = require("../Middlewares/authMiddleware");
const { isAdmin } = require("../Middlewares/adminMiddleware");
const { validateCart, validateObjectId } = require("../Middlewares/validate");

const cartRouter = Router();

cartRouter.use(protect);

cartRouter.get("/", isAdmin, getAllCarts);
cartRouter.get("/:id", validateObjectId(), getCartById);
cartRouter.post("/", validateCart(), createCart);
cartRouter.put("/:id", validateObjectId(), validateCart(false), updateCart);
cartRouter.delete("/:id", validateObjectId(), deleteCartById);

module.exports = cartRouter;
