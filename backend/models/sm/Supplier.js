const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    supplierId: { type: String, unique: true, index: true },
    companyName: { type: String, required: true },
    address: { type: String, required: true },
    branch: { type: String }, // Added new field

    contactDetails: {
      email: {
        type: String,
        required: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"], //  Email validation
      },
      phone: {
        type: String,
        required: true,
        match: [/^\d{10}$/, "Phone number must be 10 digits"], // Phone validation
      },
    },
    bankAccount: {
      accountNumber: { type: String, required: true },
      bankName: { type: String, required: true },
      branch: { type: String },
    },
    contactPerson: {
      name: { type: String, required: true },
      designation: String,
      phone: { type: String, match: [/^\d{10}$/, "Invalid contact number"] },
    },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", supplierSchema);
