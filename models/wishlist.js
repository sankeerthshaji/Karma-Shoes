const mongoose = require("mongoose");
const ObjectID = mongoose.Schema.Types.ObjectId;
const Schema = mongoose.Schema;

const wishlistSchema = new Schema({
  userId: {
    type: ObjectID,
    ref: "User",
    required: true,
  },
  products: [
    {
      productId: {
        type: ObjectID,
        ref: "Product",
        required: true,
      }
    }
  ]
});

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
module.exports = Wishlist;