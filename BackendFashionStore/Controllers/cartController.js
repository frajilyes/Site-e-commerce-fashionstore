
const cart = require("../Models/cart");
const { resolvePaymentMethod } = require("../services/paymentService");
const ApiError = require("../Utils/ApiError");
const asyncHandler = require("../Utils/asyncHandler");
const { ok, created } = require("../Utils/response");

const assertOwnerOrAdmin = (doc, currentUser, action) => {
  const isOwner =
    doc.user && doc.user.toString() === currentUser._id.toString();

  if (!isOwner && currentUser.role !== "admin") {
    throw ApiError.forbidden(`You can only ${action} your own cart`);
  }
};

const findCartOr404 = async (id) => {
  const found = await cart.findById(id);
  if (!found) {
    throw ApiError.notFound("Cart not found");
  }
  return found;
};

const getAllCarts = asyncHandler(async (req, res) => {
  ok(res, await cart.find());
});

const getCartById = asyncHandler(async (req, res) => {
  const found = await findCartOr404(req.params.id);
  assertOwnerOrAdmin(found, req.user, "view");

  ok(res, found);
});

const createCart = asyncHandler(async (req, res) => {
  const { items, paymentMethodId, SaveCardForFuturePurchases } = req.body;

  const card = await resolvePaymentMethod(
    paymentMethodId,
    req.user,
    SaveCardForFuturePurchases,
  );

  created(
    res,
    await cart.create({ user: req.user._id, items: items, ...card }),
  );
});

const updateCart = asyncHandler(async (req, res) => {
  const { items, paymentMethodId, SaveCardForFuturePurchases } = req.body;

  const existing = await findCartOr404(req.params.id);
  assertOwnerOrAdmin(existing, req.user, "edit");

  const card = paymentMethodId
    ? await resolvePaymentMethod(
        paymentMethodId,
        req.user,
        SaveCardForFuturePurchases,
      )
    : { SaveCardForFuturePurchases };

  ok(
    res,
    await cart.findByIdAndUpdate(
      req.params.id,
      { $set: { items, ...card } },
      { returnDocument: "after", runValidators: true },
    ),
  );
});

const deleteCartById = asyncHandler(async (req, res) => {
  const existing = await findCartOr404(req.params.id);
  assertOwnerOrAdmin(existing, req.user, "delete");

  ok(res, await cart.findByIdAndDelete(req.params.id));
});

module.exports = {
  getAllCarts,
  getCartById,
  createCart,
  updateCart,
  deleteCartById,
};
