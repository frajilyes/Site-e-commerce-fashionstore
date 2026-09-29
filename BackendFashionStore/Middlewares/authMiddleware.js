const mongoose = require("mongoose");
const user = require("../Models/userAuth");
const ApiError = require("../Utils/ApiError");
const asyncHandler = require("../Utils/asyncHandler");
const {
  verifyToken,
  safeVerifyToken,
  extractBearerToken,
  isTokenCurrent,
} = require("../Utils/jwt");

const loadUser = async (decoded) => {
  if (!decoded?.id || !mongoose.Types.ObjectId.isValid(decoded.id)) return null;

  const found = await user.findById(decoded.id).select("-password");
  if (!found || !isTokenCurrent(decoded, found)) return null;

  return found;
};

const protect = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    throw ApiError.unauthorized("No token provided");
  }

  const currentUser = await loadUser(verifyToken(token));
  if (!currentUser) {
    throw ApiError.unauthorized("Session expired, please log in again");
  }

  req.user = currentUser;
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req);
  const decoded = token ? safeVerifyToken(token) : null;

  req.user = decoded ? await loadUser(decoded) : null;

  next();
});

module.exports = { protect, optionalAuth };
