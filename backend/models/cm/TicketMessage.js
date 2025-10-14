const mongoose = require("mongoose");

const ticketMessageSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true },
    senderType: { type: String, enum: ["customer", "company"], required: true },
    message: { type: String, required: true },
    attachments: [{ type: String }], // URLs or file paths
  },
  { timestamps: true }
);

module.exports = mongoose.model("TicketMessage", ticketMessageSchema);
