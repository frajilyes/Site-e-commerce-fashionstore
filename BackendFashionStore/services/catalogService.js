
const clothes = require("../Models/clothes");
const ApiFeatures = require("../Utils/apiFeatures");
const ApiError = require("../Utils/ApiError");

const WRITABLE_FIELDS = [
  "id",
  "title",
  "author",
  "audience",
  "description",
  "price",
  "oldPrice",
  "image",
  "category",
  "subCategory",
  "sizes",
  "colors",
  "badge",
  "badgeColor",
  "material",
  "inStock",
  "soldCount",
  "type",
  "fitType",
  "fit",
  "features",
  "ageRange",
  "ageGroup",
  "gender",
  "occasion",
  "collar",
  "neckline",
  "sleeve",
  "length",
  "inseam",
  "rise",
  "heelHeight",
  "closure",
  "uvProtection",
  "lensType",
  "weight",
  "care",
];

const FILTERABLE_FIELDS = [
  "category",
  "subCategory",
  "audience",
  "author",
  "badge",
  "inStock",
  "price",
  "rating",
  "type",
  "fitType",
];

const pick = (source, fields) => {
  const result = {};
  fields.forEach((field) => {
    if (source[field] !== undefined) result[field] = source[field];
  });
  return result;
};

const listClothes = (queryString = {}) =>
  new ApiFeatures(clothes.find(), queryString)
    .searchText(["title", "category", "subCategory"])
    .filter(FILTERABLE_FIELDS)
    .sort("-createdAt")
    .selectFields()
    .paginate()
    .execute();

const getClothesById = async (id) => {
  const found = await clothes.findById(id);
  if (!found) {
    throw ApiError.notFound("Clothes item not found");
  }
  return found;
};

const createClothes = async (payload) => {
  const data = pick(payload, [...WRITABLE_FIELDS, "rating", "reviews"]);

  if (!data.id) {
    data.id = await nextCatalogueId();
  }

  return clothes.create(data);
};

const updateClothes = async (id, payload) => {
  const data = pick(
    payload,
    WRITABLE_FIELDS.filter((field) => field !== "id"),
  );

  const updated = await clothes.findByIdAndUpdate(
    id,
    { $set: data },
    { returnDocument: "after", runValidators: true },
  );

  if (!updated) {
    throw ApiError.notFound("Clothes item not found");
  }

  return updated;
};

const deleteClothes = async (id) => {
  const deleted = await clothes.findByIdAndDelete(id);
  if (!deleted) {
    throw ApiError.notFound("Clothes item not found");
  }
  return deleted;
};

const nextCatalogueId = async () => {
  const docs = await clothes.find({}, { id: 1 }).lean();
  const highest = docs.reduce((max, doc) => {
    const value = Number(doc.id);
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);

  return String(highest + 1);
};

module.exports = {
  WRITABLE_FIELDS,
  FILTERABLE_FIELDS,
  listClothes,
  getClothesById,
  createClothes,
  updateClothes,
  deleteClothes,
  nextCatalogueId,
};
