const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Update", "Delete"], required: true },
    message: { type: String, required: true },
    customerName: { type: String },
    jobNo: { type: Number },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
