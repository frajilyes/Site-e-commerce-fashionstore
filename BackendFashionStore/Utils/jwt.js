
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const ApiError = require("./ApiError");

const ALGORITHM = "HS256";

const signToken = (payload, options = {}) =>
  jwt.sign(payload, env.jwt.secret, {
    algorithm: ALGORITHM,
    expiresIn: env.jwt.expiresIn,
    ...options,
  });

const generateToken = (userId, role, tokenVersion = 0) =>
  signToken({ id: String(userId), role: role, v: tokenVersion });

const isTokenCurrent = (decoded, userDoc) =>
  (decoded.v ?? 0) === (userDoc.tokenVersion ?? 0);

const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.secret, { algorithms: [ALGORITHM] });
  } catch (err) {
    throw ApiError.unauthorized("Invalid or expired token");
  }
};

const safeVerifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.secret, { algorithms: [ALGORITHM] });
  } catch (err) {
    return null;
  }
};

const extractBearerToken = (req) => {
  const header = req.headers?.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token && token.length <= 4096 ? token : null;
};

module.exports = {
  ALGORITHM,
  signToken,
  generateToken,
  isTokenCurrent,
  verifyToken,
  safeVerifyToken,
  extractBearerToken,
};
