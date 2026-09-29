import { get, post, put, del } from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const createWishlist = ({ user, clothes = [] }) =>
  post(ENDPOINTS.wishlists.root, { user, clothes });

export const getWishlistById = (id) => get(ENDPOINTS.wishlists.byId(id));

export const updateWishlist = (id, { user, clothes = [] }) =>
  put(ENDPOINTS.wishlists.byId(id), { user, clothes });

export const deleteWishlist = (id) => del(ENDPOINTS.wishlists.byId(id));

export const getAllWishlists = () => get(ENDPOINTS.wishlists.root);

export default {
  createWishlist,
  getWishlistById,
  updateWishlist,
  deleteWishlist,
  getAllWishlists,
};
