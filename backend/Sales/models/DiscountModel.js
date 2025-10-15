const mongoose = require("mongoose");

const DiscountSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  discountAmount: { type: Number, required: true }, // fixed amount or percentage
  discountType: { type: String, enum: ["Percentage", "Amount"], default: "Percentage" },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ["Active", "Expired", "Upcoming"], default: "Upcoming" },
  validCustomerTiers: [{ type: String, enum: ["Silver", "Gold", "Diamond"] }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // sales manager
}, { timestamps: true });

 const SalesDiscount = mongoose.model("SalesDiscount", DiscountSchema);
 module.exports = SalesDiscount;