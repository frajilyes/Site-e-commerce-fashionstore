
import { API_ORIGIN } from "../config/env";

export const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const toTotal = (payload, fallbackList) =>
  Number.isFinite(payload?.total) ? payload.total : (fallbackList ?? []).length;

export const resolveImageUrl = (image) => {
  if (!image) return "";
  const value = String(image);
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  if (value.startsWith("/")) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value}`;
};

export const normalizeId = (value) => {
  if (value === null || value === undefined) return value;
  const asNumber = Number(value);
  return Number.isFinite(asNumber) && String(asNumber) === String(value).trim()
    ? asNumber
    : value;
};

export const normalizeProduct = (doc) => {
  if (!doc) return null;

  return {
    ...doc,
    id: normalizeId(doc.id ?? doc._id),
    _id: doc._id ?? null,
    title: doc.title ?? "",
    author: doc.author ?? "",
    audience: doc.audience ?? "",
    category: doc.category ?? "",
    subCategory: doc.subCategory ?? "",
    description: doc.description ?? "",
    material: doc.material ?? "",
    badge: doc.badge ?? "",
    badgeColor: doc.badgeColor ?? "#00ff88",
    image: resolveImageUrl(doc.image),
    price: Number(doc.price) || 0,
    oldPrice: Number(doc.oldPrice) || 0,
    rating: Number(doc.rating) || 0,
    reviews: Number(doc.reviews) || 0,
    soldCount: Number(doc.soldCount) || 0,
    sizes: Array.isArray(doc.sizes) ? doc.sizes : [],
    colors: Array.isArray(doc.colors) ? doc.colors : [],
    inStock: doc.inStock !== false,
    features: Array.isArray(doc.features) ? doc.features : [],
  };
};

export const normalizeProducts = (payload) =>
  toArray(payload).map(normalizeProduct).filter(Boolean);

export const normalizeUser = (doc) => {
  if (!doc) return null;
  const id = doc.id ?? doc._id ?? null;

  return {
    ...doc,
    id,
    _id: doc._id ?? id,
    firstName: doc.firstName ?? "",
    lastName: doc.lastName ?? "",
    name: `${doc.firstName ?? ""} ${doc.lastName ?? ""}`.trim(),
    email: doc.email ?? "",
    phone: doc.phone ?? "",
    role: doc.role ?? "user",
  };
};

export const normalizeReview = (doc) => {
  if (!doc) return null;
  const author = doc.user && typeof doc.user === "object" ? doc.user : null;
  const authorMongoId = author?._id ?? doc.user ?? null;

  return {
    id: doc._id ?? `${authorMongoId}-${doc.createdAt}`,
    reviewId: doc._id ?? null,
    authorId: authorMongoId ? `user-${authorMongoId}` : "guest",
    author:
      `${author?.firstName ?? ""} ${author?.lastName ?? ""}`.trim() || "Customer",
    rating: Number(doc.rating) || 0,
    comment: doc.comment ?? "",
    date: doc.createdAt ?? new Date().toISOString(),
    edited: Boolean(
      doc.updatedAt && doc.createdAt && doc.updatedAt !== doc.createdAt,
    ),
    remote: true,
  };
};

export const normalizeReviews = (payload) =>
  toArray(payload).map(normalizeReview).filter(Boolean);

export const normalizeOrder = (doc) => {
  if (!doc) return null;

  const items = Array.isArray(doc.items) ? doc.items : [];

  return {
    id: doc._id ?? null,
    orderNumber: doc.orderNumber ?? "",
    orderDate: doc.createdAt ?? new Date().toISOString(),
    status: doc.isPaid ? "Paid" : "Processing",
    isPaid: Boolean(doc.isPaid),
    totalPrice: Number(doc.totalPrice) || 0,
    totalAmount: doc.totalAmount ?? "",
    estimatedDelivery: doc.estimatedDelivery ?? "",
    itemsOrdered: doc.itemsOrdered ?? "",
    promoCode: doc.promoCode ?? null,
    items: items.map((item) => ({
      clothesId:
        item?.clothes && typeof item.clothes === "object"
          ? item.clothes._id
          : (item?.clothes ?? null),
      product:
        item?.clothes && typeof item.clothes === "object"
          ? normalizeProduct(item.clothes)
          : null,
      quantity: Number(item?.quantity) || 1,
      size: Array.isArray(item?.size) ? item.size.join(", ") : (item?.size ?? ""),
      color: Array.isArray(item?.color)
        ? item.color.join(", ")
        : (item?.color ?? ""),
    })),
    raw: doc,
  };
};

export const normalizeOrders = (payload) =>
  toArray(payload).map(normalizeOrder).filter(Boolean);

export default {
  toArray,
  toTotal,
  resolveImageUrl,
  normalizeId,
  normalizeProduct,
  normalizeProducts,
  normalizeUser,
  normalizeReview,
  normalizeReviews,
  normalizeOrder,
  normalizeOrders,
};
