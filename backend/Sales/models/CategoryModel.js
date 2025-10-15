const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
    categoryName:{
        type : String,
        required : true
    },

    description:{
        type : String,
        required  : true
    }
});

const Category = mongoose.model("CategoryModel", CategorySchema);
module.exports = Category;