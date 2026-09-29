const { Router } = require("express");
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrderById,
} = require("../Controllers/orderController");
const { protect } = require("../Middlewares/authMiddleware");
const { isAdmin } = require("../Middlewares/adminMiddleware");
const { validateOrder, validateObjectId } = require("../validators");

const orderRouter = Router();

orderRouter.use(protect);

orderRouter.get("/", isAdmin, getAllOrders);
orderRouter.get("/:id", validateObjectId(), getOrderById);
orderRouter.post("/", validateOrder, createOrder);
orderRouter.put("/:id", isAdmin, validateObjectId(), updateOrder);
orderRouter.delete("/:id", isAdmin, validateObjectId(), deleteOrderById);

module.exports = orderRouter;
