const { Router } = require("express");
const {
  uploadSingle,
  uploadMultiple,
  deleteUpload,
} = require("../Controllers/uploadController");
const upload = require("../Middlewares/upload");
const env = require("../config/env");
const { protect } = require("../Middlewares/authMiddleware");
const { isAdmin } = require("../Middlewares/adminMiddleware");
const { uploadLimiter } = require("../Middlewares/rateLimiter");

const uploadRouter = Router();

uploadRouter.use(protect, isAdmin, uploadLimiter);

const { verifyImageContent } = upload;

uploadRouter.post("/", upload.single("image"), verifyImageContent, uploadSingle);
uploadRouter.post(
  "/multiple",
  upload.array("images", env.upload.maxFiles),
  verifyImageContent,
  uploadMultiple,
);
uploadRouter.delete("/:filename", deleteUpload);

module.exports = uploadRouter;
