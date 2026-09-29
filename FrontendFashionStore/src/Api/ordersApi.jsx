import { get, post, put, del } from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const createOrder = (payload) => post(ENDPOINTS.orders.root, payload);

export const getOrderById = (id) => get(ENDPOINTS.orders.byId(id));

export const getAllOrders = () => get(ENDPOINTS.orders.root);
export const updateOrder = (id, payload) => put(ENDPOINTS.orders.byId(id), payload);
export const deleteOrder = (id) => del(ENDPOINTS.orders.byId(id));

export default {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrder,
  deleteOrder,
};
