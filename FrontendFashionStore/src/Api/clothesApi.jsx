import { get, post, put, del } from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const getClothes = ({ keyword, category, subCategory } = {}) => {
  const params = {};
  if (keyword) params.keyword = keyword;
  if (category) params.category = category;
  if (subCategory) params.subCategory = subCategory;

  return get(ENDPOINTS.clothes.root, { params });
};

export const getClothesById = (id) => get(ENDPOINTS.clothes.byId(id));

export const getClothesReviews = (clothesId) =>
  get(ENDPOINTS.clothes.reviews(clothesId));

export const createClothesReview = (clothesId, { rating, comment }) =>
  post(ENDPOINTS.clothes.reviews(clothesId), { rating, comment });

export const createClothes = (payload) => post(ENDPOINTS.clothes.root, payload);
export const updateClothes = (id, payload) =>
  put(ENDPOINTS.clothes.byId(id), payload);
export const deleteClothes = (id) => del(ENDPOINTS.clothes.byId(id));

export default {
  getClothes,
  getClothesById,
  getClothesReviews,
  createClothesReview,
  createClothes,
  updateClothes,
  deleteClothes,
};
