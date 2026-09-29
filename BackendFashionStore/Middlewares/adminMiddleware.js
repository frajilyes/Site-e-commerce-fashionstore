const ApiError = require("../Utils/ApiError");

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized("Authentication required"));
  }

  if (req.user.role !== "admin") {
    return next(ApiError.forbidden("Admin access required"));
  }

  next();
};

const isOwnerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized("Authentication required"));
      }

      if (req.user.role === "admin") return next();

      const ownerId = await getOwnerId(req);
      if (!ownerId) {
        return next(ApiError.notFound("Resource not found"));
      }

      if (ownerId.toString() !== req.user._id.toString()) {
        return next(ApiError.forbidden("You cannot access this resource"));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { isAdmin, isOwnerOrAdmin };
