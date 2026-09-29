const mongoose = require("mongoose");

const isLocalAccount = function () {
  return this.provider === "local";
};

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: isLocalAccount,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      required: isLocalAccount,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
      index: { sparse: true },
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
    },
    stripeCustomerId: {
      type: String,
    },
  },
  { timestamps: true },
);

const PRIVATE_FIELDS = [
  "password",
  "emailVerificationToken",
  "emailVerificationExpires",
  "tokenVersion",
  "stripeCustomerId",
  "googleId",
  "__v",
];

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    PRIVATE_FIELDS.forEach((field) => delete ret[field]);
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
