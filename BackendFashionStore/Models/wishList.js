const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  clothes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Clothes" }],
});

module.exports = mongoose.model("Wishlist", wishlistSchema);
