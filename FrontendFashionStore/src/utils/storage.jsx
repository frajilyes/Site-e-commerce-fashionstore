
import { STORAGE_KEYS } from "../config/env";

export const readJSON = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const readRaw = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeRaw = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const remove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
  }
};

export const getToken = () => readRaw(STORAGE_KEYS.token);
export const setToken = (token) =>
  token ? writeRaw(STORAGE_KEYS.token, token) : remove(STORAGE_KEYS.token);
export const clearToken = () => remove(STORAGE_KEYS.token);

export const getStoredUser = () => readJSON(STORAGE_KEYS.user, null);
export const setStoredUser = (user) =>
  user ? writeJSON(STORAGE_KEYS.user, user) : remove(STORAGE_KEYS.user);
export const clearStoredUser = () => remove(STORAGE_KEYS.user);

export const getWishlistId = () => readRaw(STORAGE_KEYS.wishlistId);
export const setWishlistId = (id) =>
  id ? writeRaw(STORAGE_KEYS.wishlistId, id) : remove(STORAGE_KEYS.wishlistId);

export const getOrderIds = () => {
  const ids = readJSON(STORAGE_KEYS.orderIds, []);
  return Array.isArray(ids) ? ids : [];
};

export const rememberOrderId = (id) => {
  if (!id) return;
  const ids = getOrderIds().filter((existing) => existing !== id);
  ids.unshift(id);
  writeJSON(STORAGE_KEYS.orderIds, ids.slice(0, 50));
};

export const clearSession = () => {
  clearToken();
  clearStoredUser();
  remove(STORAGE_KEYS.wishlistId);
};

export default {
  readJSON,
  writeJSON,
  readRaw,
  writeRaw,
  remove,
  getToken,
  setToken,
  clearToken,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  getWishlistId,
  setWishlistId,
  getOrderIds,
  rememberOrderId,
  clearSession,
};
