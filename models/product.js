const mongoose = require("mongoose");
const ObjectID = mongoose.Schema.Types.ObjectId;
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: ObjectID,
    ref: "Category",
  },
  description: {
    type: String,
    required: true,
  },
  images:[{
    url:{
      type:String
    },
    filename:{
      type:String
    }
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
