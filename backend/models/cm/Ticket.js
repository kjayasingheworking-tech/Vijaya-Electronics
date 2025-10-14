const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketNo: { type: String, unique: true, required: true }, // for frontend use
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true }, // ✅ Added name field
    contact_number: { type: String, required: true }, // ✅ Added contact number field

    type: {
      type: String,
      enum: [
        "Product Inquiry",
        "Product Complaint",
        "Delivery Delay",
        "Product Usage Guidelines",
        "Service Request",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "NEW",
        "UNDER REVIEW",
        "AWAITING CUSTOMER REPLY",
        "IN PROGRESS",
        "RESOLVED",
        "CLOSED",
      ],
      default: "NEW",
    },

    fields: mongoose.Schema.Types.Mixed, // ✅ Holds all custom type-specific fields
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
