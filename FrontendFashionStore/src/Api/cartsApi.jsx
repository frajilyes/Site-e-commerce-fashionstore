import { get, post, put, del } from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const createCart = ({
  user,
  items,
  paymentMethodId,
  SaveCardForFuturePurchases = false,
}) =>
  post(ENDPOINTS.carts.root, {
    user,
    items,
    paymentMethodId,
    SaveCardForFuturePurchases,
  });

export const getCartById = (id) => get(ENDPOINTS.carts.byId(id));

export const updateCart = (id, payload) => put(ENDPOINTS.carts.byId(id), payload);

export const deleteCart = (id) => del(ENDPOINTS.carts.byId(id));

export const getAllCarts = () => get(ENDPOINTS.carts.root);

export default {
  createCart,
  getCartById,
  updateCart,
  deleteCart,
  getAllCarts,
};
