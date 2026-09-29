class ApiError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (code) {
      this.code = code;
    }
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", code) {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden", code) {
    return new ApiError(403, message, code);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message = "Resource already exists") {
    return new ApiError(409, message);
  }
}

module.exports = ApiError;
