const { Router } = require("express");
const {
  getAllPayements,
  getPayementById,
  createPayement,
  updatePayement,
  deletePayementById,
  createCheckoutSession,
} = require("../Controllers/payementController");
const { protect } = require("../Middlewares/authMiddleware");
const { isAdmin } = require("../Middlewares/adminMiddleware");
const {
  validatePayement,
  validateObjectId,
} = require("../Middlewares/validate");

const payementRouter = Router();

payementRouter.use(protect);

payementRouter.get("/", isAdmin, getAllPayements);
payementRouter.get("/:id", validateObjectId(), getPayementById);
payementRouter.post("/", validatePayement, createPayement);
payementRouter.post(
  "/:id/checkout-session",
  validateObjectId(),
  createCheckoutSession,
);
payementRouter.put("/:id", isAdmin, validateObjectId(), updatePayement);
payementRouter.delete("/:id", isAdmin, validateObjectId(), deletePayementById);

module.exports = payementRouter;
