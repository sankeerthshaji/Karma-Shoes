const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

const userSchema = new Schema({
  username: {
    type: String,
    lowercase: true,
    required: [true, "Username can't be blank"],
    match: [/^[a-zA-Z]+$/, "please fill a valid username"]
  },

  email: {
    type: String,
    lowercase: true,
    required: [true, "Email can't be blank"],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },

  mobile:{
    type: Number,
    required:true,
    min:10
  },

  password:{
    type:String,
    required:true
  },

  isBlocked: {
    type: Boolean,
    default: false,
  },

  address: [
    {
      houseName: {
        type: String,
      },
      area: {
        type: String,
      },
      landmark: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      country:{
        type: String,
      },
      pincode: {
        type: String,
      },
    },
  ],
  image:[{
    url:{
      type:String
    },
    filename:{
      type:String
    }
  }],

});

userSchema.plugin(uniqueValidator, {message: 'Username or Password is already taken.'});

const User = mongoose.model('User',userSchema)
module.exports=User;