import { get, post, put, del } from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const getMyOrderReviews = ({ order } = {}) => {
  const params = {};
  if (order) params.order = order;
  return get(ENDPOINTS.orderReviews.root, { params });
};

export const getOrderReviewById = (id) => get(ENDPOINTS.orderReviews.byId(id));

export const createOrderReview = (payload) =>
  post(ENDPOINTS.orderReviews.root, payload);

export const updateOrderReview = (id, payload) =>
  put(ENDPOINTS.orderReviews.byId(id), payload);

export const deleteOrderReview = (id) => del(ENDPOINTS.orderReviews.byId(id));

export default {
  getMyOrderReviews,
  getOrderReviewById,
  createOrderReview,
  updateOrderReview,
  deleteOrderReview,
};
