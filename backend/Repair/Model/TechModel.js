const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const techSchema = new mongoose.Schema({
  Job_No: {
    type: Number,
    immutable: true,
    unique: true,
  },
  Name: { type: String, required: true },
  Email: { type: String, required: true },
  NIC: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 12,
    match: [/^[0-9]{9}[VvXx]|^[0-9]{12}$/, "NIC must be 10 digits + V/v/X/x or 12 digits"],
  },
  Technician: { type: String },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "Technician", required: true },
  Mobile: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 10,
    match: [/^07\d{8}$/, "Invalid mobile number format. Must start with 07 and contain 10 digits."],
  },
  Repair_Description: { type: String },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "Cancelled"],
    default: "Pending",
  },
});

techSchema.plugin(AutoIncrement, { inc_field: "Job_No", start_seq: 1 });

module.exports = mongoose.model("TechModel", techSchema);
