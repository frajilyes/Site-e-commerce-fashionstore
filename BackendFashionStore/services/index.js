
const catalogService = require("./catalogService");
const paymentService = require("./paymentService");

module.exports = {
  catalogService,
  paymentService,
  ...catalogService,
  ...paymentService,
};
