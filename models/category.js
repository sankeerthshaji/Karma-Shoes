const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name:{
        type:String,
        uppercase: true,
        required:true
    },
    
    isActive:{
        type: Boolean,
        default:true
      }
})

const Category = mongoose.model('Category',categorySchema)

module.exports = Category;