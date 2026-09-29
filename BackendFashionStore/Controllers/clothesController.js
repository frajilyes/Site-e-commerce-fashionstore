
const {
  listClothes,
  getClothesById: findClothesById,
  createClothes: create,
  updateClothes: update,
  deleteClothes: remove,
} = require("../services/catalogService");
const asyncHandler = require("../Utils/asyncHandler");
const { ok, created, list } = require("../Utils/response");

const getAllClothes = asyncHandler(async (req, res) => {
  const { data, total, page, limit } = await listClothes(req.query);

  list(res, data, { total, page, limit });
});

const getClothesById = asyncHandler(async (req, res) => {
  ok(res, await findClothesById(req.params.id));
});

const createClothes = asyncHandler(async (req, res) => {
  created(res, await create(req.body));
});

const updateClothes = asyncHandler(async (req, res) => {
  ok(res, await update(req.params.id, req.body));
});

const deleteClothesById = asyncHandler(async (req, res) => {
  ok(res, await remove(req.params.id));
});

module.exports = {
  getAllClothes,
  getClothesById,
  createClothes,
  updateClothes,
  deleteClothesById,
};
