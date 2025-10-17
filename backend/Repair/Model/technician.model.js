
const mongoose = require("mongoose");

const TechnicianSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    mobile: { type: String, trim: true },
    specialization: { type: String, trim: true },
    isActive: { type: Boolean, default: true },

    // For job assignment logic
    currentActiveJobs: { type: Number, default: 0 },
    maxJobs: { type: Number, default: 5 },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Technician", TechnicianSchema);
