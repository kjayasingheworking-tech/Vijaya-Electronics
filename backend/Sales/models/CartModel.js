const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  unitPrice: Number,
  quantity: { type: Number, default: 1 }
});

const cartSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  items: [cartItemSchema],
  updatedAt: { type: Date, default: Date.now }
});

const CustomerCart = mongoose.model("CustomerCart", cartSchema);
module.exports = CustomerCart;
