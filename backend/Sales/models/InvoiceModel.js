// models/InvoiceModel.js
const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: String,
  unitPrice: Number,
  quantity: Number,
  total: Number
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  customerSnapshot: { type: Object }, // store name/email at moment of purchase
  items: [invoiceItemSchema],
  subtotal: Number,
  discountId: { type: mongoose.Schema.Types.ObjectId, ref: "SalesDiscount" },
  discountType: { type: String, enum: ["Percentage", "Amount"], default: "Percentage" },
  discountPercent: Number,
  discountAmount: Number,
  discountDescription: String,
  totalAmount: Number,
  paymentMethod: String,
  paymentDetails: Object, // cheque info etc
  status: { type: String, default: "Pending" },
  statusUpdatedAt: { type: Date },
  pointsRedeemed: { type: Number, default: 0 },
  pointsAwarded: { type: Number, default: 0 },
},{timestamps: true});

const SalesInvoice = mongoose.model("SalesInvoice", invoiceSchema);
module.exports = SalesInvoice;
