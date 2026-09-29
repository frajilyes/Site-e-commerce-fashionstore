import { get, post, put, del } from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const createPayment = (payload) => post(ENDPOINTS.payments.root, payload);

export const getPaymentById = (id) => get(ENDPOINTS.payments.byId(id));

export const createCheckoutSession = (id) =>
  post(ENDPOINTS.payments.checkoutSession(id));

export const getAllPayments = () => get(ENDPOINTS.payments.root);
export const updatePayment = (id, payload) =>
  put(ENDPOINTS.payments.byId(id), payload);
export const deletePayment = (id) => del(ENDPOINTS.payments.byId(id));

export default {
  createPayment,
  getPaymentById,
  createCheckoutSession,
  getAllPayments,
  updatePayment,
  deletePayment,
};
