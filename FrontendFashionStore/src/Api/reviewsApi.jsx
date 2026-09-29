import { get, post, put, del } from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const getReviews = ({ clothes, user } = {}) => {
  const params = {};
  if (clothes) params.clothes = clothes;
  if (user) params.user = user;
  return get(ENDPOINTS.reviews.root, { params });
};

export const getReviewById = (id) => get(ENDPOINTS.reviews.byId(id));

export const createReview = ({ clothes, rating, comment }) =>
  post(ENDPOINTS.reviews.root, { clothes, rating, comment });

export const updateReview = (id, { rating, comment }) =>
  put(ENDPOINTS.reviews.byId(id), { rating, comment });

export const deleteReview = (id) => del(ENDPOINTS.reviews.byId(id));

export default {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
};
