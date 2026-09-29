const user = require("../Models/userAuth");
const bcrypt = require("bcrypt");
const ApiError = require("../Utils/ApiError");
const asyncHandler = require("../Utils/asyncHandler");
const env = require("../config/env");
const { generateToken } = require("../Utils/jwt");

const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const text = (value) => (typeof value === "string" ? value : undefined);
  const firstName = text(req.body.firstName);
  const lastName = text(req.body.lastName);
  const phone = text(req.body.phone);

  const updated = await user.findByIdAndUpdate(
    req.user._id,
    { $set: { firstName, lastName, phone } },
    { returnDocument: "after", runValidators: true },
  );

  res.status(200).json(updated);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const currentUser = await user.findById(req.user._id).select("+password");

  if (!currentUser.password) {
    throw ApiError.badRequest(
      "This account signs in with Google and has no password to change.",
    );
  }

  const matches = await bcrypt.compare(currentPassword, currentUser.password);
  if (!matches) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  currentUser.password = await bcrypt.hash(newPassword, env.security.bcryptRounds);
  currentUser.tokenVersion = (currentUser.tokenVersion || 0) + 1;
  await currentUser.save();

  res.status(200).json({
    message: "Password updated successfully",
    token: generateToken(currentUser._id, currentUser.role, currentUser.tokenVersion),
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await user.find().sort({ createdAt: -1 });
  res.status(200).json({ total: users.length, data: users });
});

const getUserById = asyncHandler(async (req, res) => {
  const found = await user.findById(req.params.id);
  if (!found) {
    throw ApiError.notFound("User not found");
  }
  res.status(200).json(found);
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!["user", "admin"].includes(role)) {
    throw ApiError.badRequest("role must be either 'user' or 'admin'");
  }

  if (req.params.id === req.user._id.toString() && role !== "admin") {
    throw ApiError.badRequest("You cannot remove your own admin role");
  }

  const updated = await user.findByIdAndUpdate(
    req.params.id,
    { $set: { role: role }, $inc: { tokenVersion: 1 } },
    { returnDocument: "after" },
  );

  if (!updated) {
    throw ApiError.notFound("User not found");
  }

  res.status(200).json(updated);
});

const deleteUserById = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw ApiError.badRequest("You cannot delete your own account this way");
  }

  const deleted = await user.findByIdAndDelete(req.params.id);
  if (!deleted) {
    throw ApiError.notFound("User not found");
  }

  res.status(200).json({ message: "User deleted successfully" });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUserById,
};
