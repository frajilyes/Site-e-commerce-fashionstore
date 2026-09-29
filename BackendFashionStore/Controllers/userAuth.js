const user = require("../Models/userAuth");
const bcrypt = require("bcrypt");
const env = require("../config/env");
const ApiError = require("../Utils/ApiError");
const asyncHandler = require("../Utils/asyncHandler");
const generateToken = require("../Utils/generateToken");
const { verifyGoogleIdToken } = require("../Utils/googleClient");
const {
  hashToken,
  setEmailVerificationToken,
  sendVerificationEmail,
} = require("../Utils/emailVerification");

const sessionToken = (u) => generateToken(u._id, u.role, u.tokenVersion);

const DUMMY_HASH = bcrypt.hashSync(
  "timing-equalizer-not-a-real-password",
  env.security.bcryptRounds,
);

const publicUser = (u) => ({
  id: u._id,
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  phone: u.phone,
  role: u.role,
  provider: u.provider,
  avatar: u.avatar,
  isEmailVerified: u.isEmailVerified,
});

const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;

  const existentUser = await user.findOne({ email: email });
  if (existentUser) {
    if (existentUser.provider === "local" && !existentUser.isEmailVerified) {
      const rawToken = setEmailVerificationToken(existentUser);
      await existentUser.save();
      await sendVerificationEmail(existentUser, rawToken);

      return res.status(200).json({
        message:
          "This account is waiting for confirmation. A new link has been sent to your email address.",
        user: publicUser(existentUser),
      });
    }

    throw ApiError.conflict("An account with this email already exists");
  }

  const newUser = new user({
    firstName: firstName,
    lastName: lastName,
    email: email,
    phone: phone,
    password: await bcrypt.hash(password, env.security.bcryptRounds),
  });

  const rawToken = setEmailVerificationToken(newUser);
  await newUser.save();
  await sendVerificationEmail(newUser, rawToken);

  res.status(201).json({
    message:
      "Account created. Check your inbox and click the confirmation link to activate it.",
    user: publicUser(newUser),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const existentUser = await user
    .findOne({ email: String(email).toLowerCase() })
    .select("+password");

  const comparedPassword = await bcrypt.compare(
    password,
    existentUser?.password || DUMMY_HASH,
  );

  if (!existentUser || !comparedPassword) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!existentUser.isEmailVerified) {
    throw ApiError.forbidden(
      "Please confirm your email address before signing in. Check your inbox for the confirmation link.",
      "EMAIL_NOT_VERIFIED",
    );
  }

  res.status(200).json({
    message: "Login successful",
    token: sessionToken(existentUser),
    user: publicUser(existentUser),
  });
});

const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  const profile = await verifyGoogleIdToken(credential);

  let existentUser = await user.findOne({ googleId: profile.googleId });

  if (!existentUser) {
    existentUser = await user.findOne({ email: profile.email });

    if (existentUser) {
      existentUser.googleId = profile.googleId;
      if (!existentUser.avatar) {
        existentUser.avatar = profile.avatar;
      }
      existentUser.isEmailVerified = true;
      existentUser.emailVerificationToken = undefined;
      existentUser.emailVerificationExpires = undefined;
      await existentUser.save();
    }
  }

  const isNewUser = !existentUser;
  if (isNewUser) {
    existentUser = await user.create({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      googleId: profile.googleId,
      avatar: profile.avatar,
      provider: "google",
      isEmailVerified: true,
    });
  }

  res.status(isNewUser ? 201 : 200).json({
    message: isNewUser ? "Account created with Google" : "Login successful",
    token: sessionToken(existentUser),
    user: publicUser(existentUser),
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const existentUser = await user
    .findOne({ emailVerificationToken: hashToken(token) })
    .select("+emailVerificationExpires");

  if (!existentUser) {
    throw ApiError.badRequest(
      "This confirmation link is invalid or has already been used.",
      "INVALID_VERIFICATION_TOKEN",
    );
  }

  if (existentUser.emailVerificationExpires < Date.now()) {
    throw ApiError.badRequest(
      "This confirmation link has expired. Request a new one.",
      "EXPIRED_VERIFICATION_TOKEN",
    );
  }

  existentUser.isEmailVerified = true;
  existentUser.emailVerificationToken = undefined;
  existentUser.emailVerificationExpires = undefined;
  await existentUser.save();

  res.status(200).json({
    message: "Email confirmed successfully",
    token: sessionToken(existentUser),
    user: publicUser(existentUser),
  });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const existentUser = await user.findOne({ email: email });

  if (
    existentUser &&
    existentUser.provider === "local" &&
    !existentUser.isEmailVerified
  ) {
    const rawToken = setEmailVerificationToken(existentUser);
    await existentUser.save();
    await sendVerificationEmail(existentUser, rawToken);
  }

  res.status(200).json({
    message:
      "If this address matches an account awaiting confirmation, a new link has been sent.",
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

module.exports = {
  registerUser,
  login,
  googleAuth,
  verifyEmail,
  resendVerification,
  getMe,
};
