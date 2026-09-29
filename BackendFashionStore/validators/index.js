
const mongoose = require("mongoose");
const ApiError = require("../Utils/ApiError");
const {
  PAYMENT_METHODS,
  DELIVERY_METHODS,
} = require("../Models/shippingAddress");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const runChecks = (checks, next) => {
  const errors = checks.filter(Boolean);
  if (errors.length) {
    return next(ApiError.badRequest(errors.join(", ")));
  }
  next();
};

const required = (value, name) =>
  value === undefined || value === null || String(value).trim() === ""
    ? `${name} is required`
    : null;

const oneOf = (value, name, allowed) =>
  value !== undefined && !allowed.includes(value)
    ? `${name} must be one of: ${allowed.join(", ")}`
    : null;

const isString = (value, name) =>
  value !== undefined && value !== null && typeof value !== "string"
    ? `${name} must be a string`
    : null;

const maxLength = (value, name, max) =>
  typeof value === "string" && value.length > max
    ? `${name} must be ${max} characters or fewer`
    : null;

const PASSWORD_MAX_BYTES = 72;

const passwordErrors = (password, name) => {
  if (typeof password !== "string" || !password) return [];
  return [
    password.length < 8 ? `${name} must be at least 8 characters` : null,
    Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES
      ? `${name} must be ${PASSWORD_MAX_BYTES} bytes or fewer`
      : null,
    !/[A-Za-z]/.test(password) || !/\d/.test(password)
      ? `${name} must contain at least one letter and one number`
      : null,
  ];
};

const emailErrors = (email) => [
  required(email, "email"),
  isString(email, "email"),
  maxLength(email, "email", 254),
  typeof email === "string" && email && !EMAIL_REGEX.test(email)
    ? "email is not valid"
    : null,
];

const validateRegister = (req, res, next) => {
  const { firstName, lastName, phone, password } = req.body;

  runChecks(
    [
      required(firstName, "firstName"),
      isString(firstName, "firstName"),
      maxLength(firstName, "firstName", 60),
      required(lastName, "lastName"),
      isString(lastName, "lastName"),
      maxLength(lastName, "lastName", 60),
      ...emailErrors(req.body.email),
      required(phone, "phone"),
      isString(phone, "phone"),
      typeof phone === "string" && phone && !/^[+\d][\d\s().-]{5,24}$/.test(phone)
        ? "phone is not valid"
        : null,
      required(password, "password"),
      isString(password, "password"),
      ...passwordErrors(password, "password"),
    ],
    next,
  );
};

const validateLogin = (req, res, next) => {
  const { password } = req.body;

  runChecks(
    [
      ...emailErrors(req.body.email),
      required(password, "password"),
      isString(password, "password"),
      maxLength(password, "password", 256),
    ],
    next,
  );
};

const validateGoogleAuth = (req, res, next) => {
  const { credential } = req.body;

  runChecks(
    [
      required(credential, "credential"),
      isString(credential, "credential"),
      maxLength(credential, "credential", 4096),
    ],
    next,
  );
};

const validateVerifyEmail = (req, res, next) => {
  const { token } = req.body;

  runChecks(
    [
      required(token, "token"),
      isString(token, "token"),
      token && !/^[a-f0-9]{64}$/i.test(String(token).trim())
        ? "token is not valid"
        : null,
    ],
    next,
  );
};

const validateResendVerification = (req, res, next) => {
  runChecks(emailErrors(req.body.email), next);
};

const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  runChecks(
    [
      required(currentPassword, "currentPassword"),
      isString(currentPassword, "currentPassword"),
      maxLength(currentPassword, "currentPassword", 256),
      required(newPassword, "newPassword"),
      isString(newPassword, "newPassword"),
      ...passwordErrors(newPassword, "newPassword"),
      currentPassword && currentPassword === newPassword
        ? "newPassword must be different from currentPassword"
        : null,
    ],
    next,
  );
};

const validateClothes = (req, res, next) => {
  const { title, price, category, image } = req.body;

  runChecks(
    [
      required(title, "title"),
      required(category, "category"),
      required(image, "image"),
      required(price, "price"),
      price !== undefined && (isNaN(price) || Number(price) < 0)
        ? "price must be a positive number"
        : null,
      req.body.oldPrice !== undefined &&
      (isNaN(req.body.oldPrice) || Number(req.body.oldPrice) < 0)
        ? "oldPrice must be a positive number"
        : null,
    ],
    next,
  );
};

const validateReview = (req, res, next) => {
  const { rating, comment } = req.body;

  runChecks(
    [
      required(rating, "rating"),
      rating !== undefined &&
      (isNaN(rating) || !Number.isInteger(Number(rating)) || rating < 1 || rating > 5)
        ? "rating must be an integer between 1 and 5"
        : null,
      isString(comment, "comment"),
      typeof comment === "string" && comment.length > 1000
        ? "comment must be 1000 characters or fewer"
        : null,
    ],
    next,
  );
};

const ADDRESS_TEXT_FIELDS = [
  "FirstName",
  "LastName",
  "Email",
  "Phone",
  "StreetAddress",
  "ApartementSuite",
  "StateProvince",
  "City",
  "Country",
];

const shippingErrors = (address, prefix) => {
  if (!address || typeof address !== "object") {
    return [`${prefix} is required`];
  }

  return [
    required(address.FirstName, `${prefix}.FirstName`),
    required(address.LastName, `${prefix}.LastName`),
    required(address.Phone, `${prefix}.Phone`),
    required(address.StreetAddress, `${prefix}.StreetAddress`),
    required(address.City, `${prefix}.City`),
    required(address.ZipCode, `${prefix}.ZipCode`),
    address.ZipCode !== undefined && isNaN(address.ZipCode)
      ? `${prefix}.ZipCode must be a number`
      : null,
    address.Email && !EMAIL_REGEX.test(address.Email)
      ? `${prefix}.Email is not valid`
      : null,
    ...ADDRESS_TEXT_FIELDS.flatMap((field) => [
      isString(address[field], `${prefix}.${field}`),
      maxLength(address[field], `${prefix}.${field}`, 200),
    ]),
  ];
};

const validateOrderReview = (req, res, next) => {
  const { order, ShippingAddress, DeliveryMethod, PaymentMethod } = req.body;

  runChecks(
    [
      required(order, "order"),
      order && !mongoose.Types.ObjectId.isValid(order)
        ? "order is not a valid id"
        : null,
      ...shippingErrors(ShippingAddress, "ShippingAddress"),
      oneOf(DeliveryMethod, "DeliveryMethod", DELIVERY_METHODS),
      oneOf(PaymentMethod, "PaymentMethod", PAYMENT_METHODS),
    ],
    next,
  );
};

const validatePayement = (req, res, next) => {
  const { order, shipping, paymentMethod, deliveryMethod } = req.body;

  runChecks(
    [
      required(order, "order"),
      order && !mongoose.Types.ObjectId.isValid(order)
        ? "order is not a valid id"
        : null,
      ...shippingErrors(shipping, "shipping"),
      oneOf(paymentMethod, "paymentMethod", PAYMENT_METHODS),
      oneOf(deliveryMethod, "deliveryMethod", DELIVERY_METHODS),
    ],
    next,
  );
};

const RAW_CARD_FIELDS = [
  "CartNumber",
  "CardNumber",
  "cardNumber",
  "number",
  "CVV",
  "cvv",
  "cvc",
];

const validateCart = (requirePaymentMethod = true) => {
  return (req, res, next) => {
    const { paymentMethodId } = req.body;
    const sent = RAW_CARD_FIELDS.filter((f) => req.body[f] !== undefined);

    runChecks(
      [
        sent.length
          ? `raw card data is not accepted (${sent.join(", ")}): tokenize the ` +
            "card with Stripe.js and send paymentMethodId instead"
          : null,
        requirePaymentMethod ? required(paymentMethodId, "paymentMethodId") : null,
        paymentMethodId && !String(paymentMethodId).startsWith("pm_")
          ? "paymentMethodId must be a Stripe payment method id (pm_...)"
          : null,
      ],
      next,
    );
  };
};
const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
      return next(ApiError.badRequest(`Invalid ${paramName}`));
    }
    next();
  };
};

const validateOrder = (req, res, next) => {
  const { items, deliveryMethod } = req.body;

  const itemErrors = !Array.isArray(items)
    ? ["items must be an array"]
    : items.length === 0
      ? ["items must contain at least one line"]
      : items
          .map((item, index) =>
            !item?.clothes || !mongoose.Types.ObjectId.isValid(item.clothes)
              ? `items[${index}].clothes is not a valid id`
              : item?.quantity !== undefined &&
                  (isNaN(item.quantity) || Number(item.quantity) < 1)
                ? `items[${index}].quantity must be at least 1`
                : null,
          )
          .filter(Boolean);

  runChecks(
    [...itemErrors, oneOf(deliveryMethod, "deliveryMethod", DELIVERY_METHODS)],
    next,
  );
};

module.exports = {
  EMAIL_REGEX,
  runChecks,
  required,
  oneOf,
  isString,
  maxLength,
  validateRegister,
  validateLogin,
  validateGoogleAuth,
  validateVerifyEmail,
  validateResendVerification,
  validateChangePassword,
  validateClothes,
  validateReview,
  validateOrder,
  validateOrderReview,
  validatePayement,
  validateCart,
  validateObjectId,
};
