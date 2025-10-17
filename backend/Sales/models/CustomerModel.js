const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const customerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "UserTemp" }, 
  name: String,
  email: String,
  phone: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  companyName: String, // optional company name for wholesale customers

  // customerId field
  customerId: { 
    type: String, 
    unique: true, 
    required: true,
    default: () => `CUST-${uuidv4()}`
  },

  // customer type: "regular" or "wholesale"
  type: { type: String, enum: ["regular","wholesale"], default: "regular" },

  // loyalty/points
  tier: { type: String, enum: ["diamond","gold","silver"], default: "silver" },
  pointsBalance: { type: Number, default: 0 },
  totalPointsEarned: {type: Number, default: 0},
  totalPointsRedeemed: {type: Number, default: 0},
  totalPurchaseAmount: {type: Number, default: 0},

  // customer status
  blocked: { type: Boolean, default: false },
  blockedReason: { type: String, default: "" }, // "cheque_pending", "credit_exceeded", "overdue", "manual"

  // credit system for wholesale customers
  creditLimit: { type: Number, default: 0 },
  currentCreditUsed: { type: Number, default: 0 },
  creditAvailable: { type: Number, default: 0 },

  // track claimed discounts to prevent duplicate claims
  claimedDiscounts: [{ type: mongoose.Schema.Types.ObjectId, ref: "SalesDiscount" }]
}, { timestamps: true, collection: 'customerprofiles' });

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
