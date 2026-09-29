
const webHook = require("../Models/webHook");
const ApiError = require("../Utils/ApiError");
const asyncHandler = require("../Utils/asyncHandler");

const findOr404 = async (id) => {
  const found = await webHook.findById(id);
  if (!found) {
    throw ApiError.notFound("Webhook event not found");
  }
  return found;
};

const getAllWebHooks = asyncHandler(async (req, res) => {
  res.status(200).json(await webHook.find().sort({ createdAt: -1 }).lean());
});

const getWebHookById = asyncHandler(async (req, res) => {
  res.status(200).json(await findOr404(req.params.id));
});

const createWebHook = asyncHandler(async (req, res) => {
  const { eventId, type, data, processed } = req.body;
  const created = await webHook.create({
    eventId: eventId,
    type: type,
    data: data,
    processed: processed ?? false,
  });
  res.status(201).json(created);
});

const updateWebHook = asyncHandler(async (req, res) => {
  const { eventId, type, data, processed } = req.body;
  const updated = await webHook.findByIdAndUpdate(
    req.params.id,
    { $set: { eventId, type, data, processed } },
    { returnDocument: "after", runValidators: true },
  );
  if (!updated) {
    throw ApiError.notFound("Webhook event not found");
  }
  res.status(200).json(updated);
});

const deleteWebHookById = asyncHandler(async (req, res) => {
  const deleted = await webHook.findByIdAndDelete(req.params.id);
  if (!deleted) {
    throw ApiError.notFound("Webhook event not found");
  }
  res.status(200).json(deleted);
});

module.exports = {
  getAllWebHooks,
  getWebHookById,
  createWebHook,
  updateWebHook,
  deleteWebHookById,
};
