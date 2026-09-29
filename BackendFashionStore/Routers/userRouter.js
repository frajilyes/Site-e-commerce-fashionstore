const { Router } = require("express");
const {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUserById,
} = require("../Controllers/userController");
const { protect } = require("../Middlewares/authMiddleware");
const { isAdmin } = require("../Middlewares/adminMiddleware");
const {
  validateChangePassword,
  validateObjectId,
} = require("../Middlewares/validate");

const userRouter = Router();

userRouter.use(protect);

userRouter.get("/profile", getProfile);
userRouter.put("/profile", updateProfile);
userRouter.put("/password", validateChangePassword, changePassword);

userRouter.get("/", isAdmin, getAllUsers);
userRouter.get("/:id", isAdmin, validateObjectId(), getUserById);
userRouter.put("/:id/role", isAdmin, validateObjectId(), updateUserRole);
userRouter.delete("/:id", isAdmin, validateObjectId(), deleteUserById);

module.exports = userRouter;
