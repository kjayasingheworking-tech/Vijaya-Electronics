const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: false }, // Optional for regular customers
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "SalesInvoice", required: true },
  paymentType: { 
    type: String, 
    enum: ["Cash", "Card", "Cheque", "Credit"], 
    required: true 
  },
  amount: { type: Number, required: true },
  
  // Customer snapshot for regular customers (when customerId is null)
  customerSnapshot: {
    name: String,
    email: String,
    phone: String,
    address: String
  },
  
  // Cheque payment details
  chequeDetails: {
    chequeNumber: String,
    bank: String,
    issueDate: Date,
    status: { 
      type: String, 
      enum: ["Pending", "Cleared", "Bounced"], 
      default: "Pending" 
    },
    clearedDate: Date,
    bouncedReason: String
  },
  
  // Credit payment details
  creditDetails: {
    creditLimit: Number,
    dueDate: Date,
    status: { 
      type: String, 
      enum: ["Pending", "Paid", "Overdue"], 
      default: "Pending" 
    },
    paidDate: Date,
    daysOverdue: { type: Number, default: 0 }
  },
  
  // General payment info
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  notes: String,
  
  // Status tracking
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const SalesPayment = mongoose.model("SalesPayment", paymentSchema);
module.exports = SalesPayment;