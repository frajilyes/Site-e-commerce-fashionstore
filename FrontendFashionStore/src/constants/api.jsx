
export const PAYMENT_METHODS = [
  "Card",
  "Visa",
  "MasterCard",
  "PayPal",
  "Apple Pay",
  "Google Pay",
  "Cash on Delivery",
];

export const DELIVERY_METHODS = [
  "Standard Delivery",
  "Express Delivery",
  "Free Delivery",
];

export const PAYMENT_STATUS = ["Pending", "Completed", "Failed"];

export const USER_ROLES = ["user", "admin"];

export const DELIVERY_METHOD_BY_ID = {
  standard: "Standard Delivery",
  express: "Express Delivery",
  free: "Free Delivery",
};

export const DELIVERY_ESTIMATE_BY_ID = {
  standard: "3-5 business days",
  express: "1-2 business days",
  free: "7-10 business days",
};

export const DELIVERY_COST_BY_ID = {
  standard: 5,
  express: 15,
  free: 0,
};

export const PAYMENT_METHOD_BY_ID = {
  card: "Card",
  paypal: "PayPal",
  apple: "Apple Pay",
  google: "Google Pay",
  cash: "Cash on Delivery",
};

export const VALIDATION = {
  passwordMinLength: 8,
  commentMaxLength: 1000,
  ratingMin: 1,
  ratingMax: 5,
};

export default {
  PAYMENT_METHODS,
  DELIVERY_METHODS,
  PAYMENT_STATUS,
  USER_ROLES,
  DELIVERY_METHOD_BY_ID,
  DELIVERY_ESTIMATE_BY_ID,
  DELIVERY_COST_BY_ID,
  PAYMENT_METHOD_BY_ID,
  VALIDATION,
};
