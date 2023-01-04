const mongoose = require("mongoose");
const ObjectID = mongoose.Schema.Types.ObjectId;

const orderSchema = new mongoose.Schema({
  address: {
    type: ObjectID,
    ref: "User",
    required: true,
  },

  userId: {
    type: ObjectID,
    ref: "User",
    required: true,
  },

  username:{
    type:String,
    required:true
  },

  products: [
    {
      productId: {
        type: ObjectID,
        ref: "Product",
        required: true,
      },

      quantity: {
        type: "Number",
        min: 1,
        default: 1,
        required: true,
      },
    },
  ],

  total: {
    type: Number,
    required: true,
  },

  payment_method:{
    type:String,
    required:true
  },

  order_status: {
    type: String,
    required: true,
  },

  payment_status:{
    type: String,
    required: true,
  },

  orderDate: {
    type: String,
},

 deliveryDate: {
    type: String,
},

},

{
  timestamps:true
}

);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
