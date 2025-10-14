const mongoose = require("mongoose");

const PO_STATUS = {
  NEW: "new",                     // created by company (admin) → notify supplier
  ACCEPTED: "accepted",           // supplier accepts → notify company
  PACKING: "packing",             // supplier packing → notify company
  SHIPPED: "shipped",             // supplier shipped → notify company
  DELIVERED: "delivered",         // company confirms goods received → notify supplier
  CHECKING: "checking",           // company QA checking → notify supplier
  INQUIRED: "inquired",           // issues/damages → notify supplier
  PENDING_PAYMENT: "pending_payment", // QA ok → payment pending → notify supplier
  PAYMENT_DONE: "payment_done",   // company paid → notify supplier
  CLOSED: "closed"                // company closes order → notify supplier
};

const poItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "SupProduct", required: true },
    name: { type: String, required: true },            // denormalized for snapshot
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const poHistorySchema = new mongoose.Schema(
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

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, unique: true, index: true }, 
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, // supplier user
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },             // company admin
    status: { 
      type: String, 
      enum: Object.values(PO_STATUS), 
      default: PO_STATUS.NEW, 
      index: true 
    },
    items: { type: [poItemSchema], required: true },
    totals: {
      subTotal: { type: Number, required: true, min: 0 },
      grandTotal: { type: Number, required: true, min: 0 }
    },
    notes: { type: String, default: "" },
    history: { type: [poHistorySchema], default: [] }
  },
  { timestamps: true }
);

// helper to recalc totals
purchaseOrderSchema.methods.recalcTotals = function() {
  const sub = this.items.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
  this.items.forEach(it => it.lineTotal = it.unitPrice * it.quantity);
  this.totals.subTotal = sub;
  this.totals.grandTotal = sub; // ✅ no tax anymore
};


module.exports = {
  PurchaseOrder: mongoose.model("PurchaseOrder", purchaseOrderSchema),
  PO_STATUS
};
