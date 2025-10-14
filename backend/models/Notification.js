const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // add "customer" to enum
 role: { type: String, enum: ["admin", "supplier", "customer"], required: true },

    po: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },
    poNumber: { type: String, default: null }, // ✅ new field
    event: { type: String, required: true },
    title: { type: String },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Notification", notificationSchema);
