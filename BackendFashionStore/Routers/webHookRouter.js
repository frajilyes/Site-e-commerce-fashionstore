const { Router } = require("express");
const {
  getAllWebHooks,
  getWebHookById,
  createWebHook,
  updateWebHook,
  deleteWebHookById,
} = require("../Controllers/webHookController");
const { protect } = require("../Middlewares/authMiddleware");
const { isAdmin } = require("../Middlewares/adminMiddleware");
const { validateObjectId } = require("../Middlewares/validate");

const webHookRouter = Router();

webHookRouter.use(protect, isAdmin);

webHookRouter.get("/", getAllWebHooks);
webHookRouter.get("/:id", validateObjectId(), getWebHookById);
webHookRouter.post("/", createWebHook);
webHookRouter.put("/:id", validateObjectId(), updateWebHook);
webHookRouter.delete("/:id", validateObjectId(), deleteWebHookById);

module.exports = webHookRouter;
