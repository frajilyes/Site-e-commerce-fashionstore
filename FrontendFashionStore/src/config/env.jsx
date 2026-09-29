
const raw = import.meta.env ?? {};

const trimSlashes = (value) => String(value ?? "").replace(/\/+$/, "");

export const API_BASE_URL =
  trimSlashes(raw.VITE_API_URL) || (raw.DEV ? "/api" : "http://localhost:3000/api");

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "") || "";

export const API_TIMEOUT = Number(raw.VITE_API_TIMEOUT) || 20000;

export const STRIPE_PUBLISHABLE_KEY = raw.VITE_STRIPE_PUBLISHABLE_KEY || "";

export const IS_STRIPE_ENABLED = STRIPE_PUBLISHABLE_KEY.startsWith("pk_");

export const IS_DEV = Boolean(raw.DEV);

export const GOOGLE_CLIENT_ID = raw.VITE_GOOGLE_CLIENT_ID || "";

export const IS_GOOGLE_AUTH_ENABLED = GOOGLE_CLIENT_ID.endsWith(
  ".apps.googleusercontent.com",
);

export const STORAGE_KEYS = {
  token: raw.VITE_TOKEN_KEY || "fashionstore_token",
  user: "user",
  cart: "cart",
  wishlist: "wishlist",
  wishlistId: "fashionstore_wishlist_id",
  orderIds: "fashionstore_order_ids",
  orders: "userOrders",
  ratings: "capsRatings",
  reviews: "productReviews",
};

export default {
  API_BASE_URL,
  API_ORIGIN,
  API_TIMEOUT,
  STRIPE_PUBLISHABLE_KEY,
  IS_STRIPE_ENABLED,
  IS_DEV,
  GOOGLE_CLIENT_ID,
  IS_GOOGLE_AUTH_ENABLED,
  STORAGE_KEYS,
};
