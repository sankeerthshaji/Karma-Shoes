const mongoose = require("mongoose");
const ObjectID = mongoose.Schema.Types.ObjectId;
const Schema = mongoose.Schema;

const cartSchema = new Schema({
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
      },
      
      quantity:{
        type:"Number",
        min:1,
        default:1,
        required:true
      }
    }
  ]
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
