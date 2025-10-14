const mongoose = require("mongoose");

const inquiryItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "SupProduct", required: true },
    rejectedQty: { type: Number, required: true, min: 1 },
    note: { type: String, default: "" }
  },
  { _id: false }
);

const damageInquirySchema = new mongoose.Schema(
  {
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true, index: true },
    originalInvoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    recalculatedInvoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // admin
    items: { type: [inquiryItemSchema], required: true },
    status: { type: String, enum: ["open","applied"], default: "open", index: true },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DamageInquiry", damageInquirySchema);
