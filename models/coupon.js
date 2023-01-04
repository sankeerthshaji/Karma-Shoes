const mongoose = require("mongoose");
const ObjectID = mongoose.Schema.Types.ObjectId;
const Schema = mongoose.Schema;
const moment = require("moment");

const couponSchema = new Schema({
    userId:{
        type:ObjectID,
        ref:'User',
    },
    couponCodeName:{
        type:String,
        uppercase: true,
        required:true
    },
    discountPrice:{
        type:Number,
        required:true
    },
    minimumLimit:{
        type:Number,
        required:true
    },
    maximumLimit:{
        type:Number,
        required:true
    },
    expiryDate: {
        type: String,
    },
    isActive:{
        type: Boolean,
        default:true
    }
});

const Coupon = mongoose.model('Coupon',couponSchema);
module.exports = Coupon;