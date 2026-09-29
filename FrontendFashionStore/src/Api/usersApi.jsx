import { get, put, del } from "./axiosClient";
import ENDPOINTS from "./endpoints";

export const getProfile = () => get(ENDPOINTS.users.profile);

export const updateProfile = ({ firstName, lastName, phone }) =>
  put(ENDPOINTS.users.profile, { firstName, lastName, phone });

export const changePassword = ({ currentPassword, newPassword }) =>
  put(ENDPOINTS.users.password, { currentPassword, newPassword });

export const getAllUsers = () => get(ENDPOINTS.users.root);
export const getUserById = (id) => get(ENDPOINTS.users.byId(id));
export const updateUserRole = (id, role) => put(ENDPOINTS.users.role(id), { role });
export const deleteUser = (id) => del(ENDPOINTS.users.byId(id));

export default {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};
