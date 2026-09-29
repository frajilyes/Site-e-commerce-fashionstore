const mongoose = require("mongoose");
const wishList = require("../Models/wishList");
const ApiError = require("../Utils/ApiError");
const asyncHandler = require("../Utils/asyncHandler");

const MAX_ITEMS = 500;

const isOwnerOrAdmin = (doc, user) =>
  (doc.user && doc.user.toString() === user._id.toString()) ||
  user.role === "admin";

const cleanClothes = (clothes) => {
  if (clothes === undefined) return undefined;
  if (!Array.isArray(clothes)) {
    throw ApiError.badRequest("clothes must be an array of ids");
  }
  if (clothes.length > MAX_ITEMS) {
    throw ApiError.badRequest(`A wishlist cannot hold more than ${MAX_ITEMS} items`);
  }
  if (!clothes.every((id) => mongoose.Types.ObjectId.isValid(id))) {
    throw ApiError.badRequest("clothes contains an invalid id");
  }
  return [...new Set(clothes.map(String))];
};

const findOwnedOr404 = async (id, currentUser) => {
  const found = await wishList.findById(id);
  if (!found || !isOwnerOrAdmin(found, currentUser)) {
    throw ApiError.notFound("Wishlist not found");
  }
  return found;
};

const getAllWishLists = asyncHandler(async (req, res) => {
  res.status(200).json(await wishList.find().lean());
});

const getWishListById = asyncHandler(async (req, res) => {
  res.status(200).json(await findOwnedOr404(req.params.id, req.user));
});

const createWishList = asyncHandler(async (req, res) => {
  const created = await wishList.create({
    user: req.user._id,
    clothes: cleanClothes(req.body.clothes) || [],
  });
  res.status(201).json(created);
});

const updateWishList = asyncHandler(async (req, res) => {
  await findOwnedOr404(req.params.id, req.user);

  const updated = await wishList.findByIdAndUpdate(
    req.params.id,
    { $set: { clothes: cleanClothes(req.body.clothes) } },
    { returnDocument: "after", runValidators: true },
  );
  res.status(200).json(updated);
});

const deleteWishListById = asyncHandler(async (req, res) => {
  await findOwnedOr404(req.params.id, req.user);
  res.status(200).json(await wishList.findByIdAndDelete(req.params.id));
});

module.exports = {
  getAllWishLists,
  getWishListById,
  createWishList,
  updateWishList,
  deleteWishListById,
};
