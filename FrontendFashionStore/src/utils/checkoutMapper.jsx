
import {
  DELIVERY_METHOD_BY_ID,
  DELIVERY_ESTIMATE_BY_ID,
  PAYMENT_METHOD_BY_ID,
  DELIVERY_METHODS,
  PAYMENT_METHODS,
} from "../constants/api";

const clean = (value) => {
  const text = String(value ?? "").trim();
  return text === "" ? undefined : text;
};

export const toDeliveryMethod = (shippingMethodId) => {
  const label = DELIVERY_METHOD_BY_ID[shippingMethodId];
  return DELIVERY_METHODS.includes(label) ? label : "Standard Delivery";
};

export const toPaymentMethod = (paymentMethodId) => {
  const label = PAYMENT_METHOD_BY_ID[paymentMethodId];
  return PAYMENT_METHODS.includes(label) ? label : "Card";
};

export const toEstimatedDelivery = (shippingMethodId) =>
  DELIVERY_ESTIMATE_BY_ID[shippingMethodId] ?? "3-5 business days";

export const buildShippingAddress = (shippingInfo = {}) => {
  const zipDigits = String(shippingInfo.zipCode ?? "").replace(/\D/g, "");

  return {
    FirstName: clean(shippingInfo.firstName),
    LastName: clean(shippingInfo.lastName),
    Email: clean(shippingInfo.email),
    Phone: clean(shippingInfo.phone),
    StreetAddress: clean(shippingInfo.address ?? shippingInfo.streetAddress),
    ApartementSuite: clean(shippingInfo.apartment ?? shippingInfo.apartementSuite),
    StateProvince: clean(shippingInfo.state ?? shippingInfo.stateProvince),
    ZipCode: zipDigits ? Number(zipDigits) : 0,
    City: clean(shippingInfo.city),
    Country: clean(shippingInfo.country),
  };
};

export const resolveClothesId = (item, catalogue = []) => {
  if (item?.clothesId) return item.clothesId;
  if (item?._id) return item._id;

  const match = catalogue.find(
    (product) => String(product?.id) === String(item?.id),
  );
  return match?._id ?? null;
};

export const buildOrderItems = (cart = [], catalogue = []) =>
  cart.map((item) => {
    const clothesId = resolveClothesId(item, catalogue);

    return {
      ...(clothesId ? { clothes: clothesId } : {}),
      quantity: Number(item?.quantity) || 1,
      size: item?.size ? [String(item.size)] : [],
      color: item?.color ? [String(item.color)] : [],
    };
  });

export const buildItemsSummary = (cart = []) =>
  cart
    .map((item) => `${Number(item?.quantity) || 1} x ${item?.name ?? "Article"}`)
    .join(", ");

export const generateOrderNumber = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

export const buildOrderPayload = ({
  cart = [],
  catalogue = [],
  shippingMethod,
  promoCode,
}) => ({
  items: buildOrderItems(cart, catalogue),
  deliveryMethod: toDeliveryMethod(shippingMethod),
  itemsOrdered: buildItemsSummary(cart),
  promoCode: promoCode || null,
});

export const buildPaymentPayload = ({
  orderId,
  shippingInfo,
  shippingMethod,
  paymentMethod,
  isGift = false,
}) => ({
  ...(orderId ? { order: orderId } : {}),
  shipping: buildShippingAddress(shippingInfo),
  paymentMethod: toPaymentMethod(paymentMethod),
  deliveryMethod: toDeliveryMethod(shippingMethod),
  SendAsAgift: Boolean(isGift),
});

export const buildOrderReviewPayload = ({
  orderId,
  paymentId,
  shippingInfo,
  shippingMethod,
  paymentMethod,
  isGift = false,
}) => ({
  order: orderId,
  ...(paymentId ? { payement: paymentId } : {}),
  ShippingAddress: buildShippingAddress(shippingInfo),
  DeliveryMethod: toDeliveryMethod(shippingMethod),
  PaymentMethod: toPaymentMethod(paymentMethod),
  SendAsAgift: Boolean(isGift),
});

export default {
  toDeliveryMethod,
  toPaymentMethod,
  toEstimatedDelivery,
  buildShippingAddress,
  resolveClothesId,
  buildOrderItems,
  buildItemsSummary,
  generateOrderNumber,
  buildOrderPayload,
  buildPaymentPayload,
  buildOrderReviewPayload,
};
