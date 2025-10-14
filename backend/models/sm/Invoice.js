const mongoose = require("mongoose");

const INVOICE_STATUS = {
  ISSUED: "issued",          // created (original or recalculated)
  CANCELLED: "cancelled",    // previous invoice cancelled when recalculated is created
  CLOSED: "closed"           // company closes after payment settlement
};

const INVOICE_TYPE = {
  ORIGINAL: "original",
  RECALCULATED: "recalculated"
};

const invItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "SupProduct", required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const chargeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const deductionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "SupProduct", required: true },
    reason: { type: String, default: "damage/rejected" },
    qty: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 } // qty * unitPrice snapshot
  },
  { _id: false }
);

const histSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin","supplier"], required: true },
    from: { type: String },
    to: { type: String, required: true },
    note: { type: String, default: "" }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, index: true }, //  human-readable invoice ID
    type: { type: String, enum: Object.values(INVOICE_TYPE), default: INVOICE_TYPE.ORIGINAL, index: true },
    status: { type: String, enum: Object.values(INVOICE_STATUS), default: INVOICE_STATUS.ISSUED, index: true },

    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true, index: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    originalInvoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" }, // set for recalculated invoices

    items: { type: [invItemSchema], required: true },
    additionalCharges: { type: [chargeSchema], default: [] },
    deductions: { type: [deductionSchema], default: [] },   // only used by recalculated invoices

    totals: {
      subTotal: { type: Number, required: true, min: 0 },
      chargesTotal: { type: Number, required: true, min: 0 },
      deductionTotal: { type: Number, required: true, min: 0, default: 0 },
      grandTotal: { type: Number, required: true, min: 0 }
    },

    history: { type: [histSchema], default: [] },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

// helpers
invoiceSchema.methods.recalcTotals = function() {
  this.items.forEach(it => it.lineTotal = it.unitPrice * it.quantity);
  const sub = this.items.reduce((s, it) => s + it.lineTotal, 0);
  const chg = (this.additionalCharges || []).reduce((s, c) => s + c.amount, 0);
  const ded = (this.deductions || []).reduce((s, d) => s + d.amount, 0);
  this.totals.subTotal = sub;
  this.totals.chargesTotal = chg;
  this.totals.deductionTotal = ded;
  this.totals.grandTotal = Math.max(0, sub + chg - ded);
};

module.exports = {
  Invoice: mongoose.model("Invoice", invoiceSchema),
  INVOICE_STATUS,
  INVOICE_TYPE
};
