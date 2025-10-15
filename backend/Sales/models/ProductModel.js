const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryModel',
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  price: {
    type: Number,
    required: true
  }
}, { timestamps: true, collection: 'salesproducts' });

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
