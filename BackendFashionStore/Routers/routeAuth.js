const { Router } = require("express");
const {
  registerUser,
  login,
  googleAuth,
  verifyEmail,
  resendVerification,
  getMe,
} = require("../Controllers/userAuth");
const { protect } = require("../Middlewares/authMiddleware");
const {
  authLimiter,
  accountLoginLimiter,
} = require("../Middlewares/rateLimiter");
const {
  validateRegister,
  validateLogin,
  validateGoogleAuth,
  validateVerifyEmail,
  validateResendVerification,
} = require("../Middlewares/validate");

const userRouter = Router();

userRouter.post("/register", authLimiter, validateRegister, registerUser);
userRouter.post(
  "/login",
  authLimiter,
  accountLoginLimiter,
  validateLogin,
  login,
);
userRouter.post("/google", authLimiter, validateGoogleAuth, googleAuth);
userRouter.post("/verify-email", authLimiter, validateVerifyEmail, verifyEmail);
userRouter.post(
  "/resend-verification",
  authLimiter,
  validateResendVerification,
  resendVerification,
);
userRouter.get("/me", protect, getMe);

module.exports = userRouter;
