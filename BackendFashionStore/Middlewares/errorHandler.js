const env = require("../config/env");
const ApiError = require("../Utils/ApiError");
const { fail } = require("../Utils/response");

const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.path.slice(0, 200)} not found`));
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Malformed JSON body";
  }
  if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `This ${field} is already in use`;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired, please log in again";
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File is too large";
  }

  if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message = "Too many files, or unexpected field name";
  }

  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.path}`, err);
    if (env.isProduction && !err.isOperational) {
      message = "Internal server error";
    }
  }

  fail(res, statusCode, message, {
    code: err.isOperational ? err.code : undefined,
    stack: err.stack,
  });
};

module.exports = { notFound, errorHandler };
