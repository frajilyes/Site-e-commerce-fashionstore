const mongoose = require("mongoose");

const shippingAddressSchema = new mongoose.Schema({
  FirstName: {
    type: String,
    required: true,
  },

  LastName: {
    type: String,
    required: true,
  },

  Email: {
    type: String,
  },

  Phone: {
    type: String,
    required: true,
  },

  StreetAddress: {
    type: String,
    required: true,
  },

  ApartementSuite: {
    type: String,
  },

  StateProvince: {
    type: String,
  },

  ZipCode: {
    type: Number,
    required: true,
  },

  City: {
    type: String,
    required: true,
  },

  Country: {
    type: String,
  },
});

const PAYMENT_METHODS = [
  "Card",
  "Visa",
  "MasterCard",
  "PayPal",
  "Apple Pay",
  "Google Pay",
  "Cash on Delivery",
];

const DELIVERY_METHODS = [
  "Standard Delivery",
  "Express Delivery",
  "Free Delivery",
];

module.exports = { shippingAddressSchema, PAYMENT_METHODS, DELIVERY_METHODS };
