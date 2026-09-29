const { OAuth2Client } = require("google-auth-library");
const env = require("../config/env");
const ApiError = require("./ApiError");

let client = null;

const getClientId = () => {
  const clientId = env.google.clientId;
  if (!clientId) {
    throw new ApiError(503, "Google Sign-In is not configured on the server");
  }
  return clientId;
};

const verifyGoogleIdToken = async (credential) => {
  const clientId = getClientId();
  if (!client) {
    client = new OAuth2Client(clientId);
  }

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
  } catch (err) {
    throw ApiError.unauthorized("Invalid or expired Google token");
  }

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw ApiError.unauthorized("Google account did not provide an email");
  }
  if (payload.email_verified === false) {
    throw ApiError.unauthorized("This Google email address is not verified");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    firstName: String(payload.given_name || payload.name || "Google").slice(0, 60),
    lastName: String(payload.family_name || "User").slice(0, 60),
    avatar: payload.picture || "",
  };
};

module.exports = { verifyGoogleIdToken };
