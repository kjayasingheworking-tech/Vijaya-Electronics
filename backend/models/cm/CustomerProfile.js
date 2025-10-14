const { Schema, model, Types } = require("mongoose");

const customerProfileSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", unique: true, required: true },

    // Custom customer ID (human-readable, e.g., CUST0001)
    customerId: { type: String, unique: true, required: true },
    phone: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    country: { type: String },

  },
  { timestamps: true }
);


module.exports = model("CustomerProfile", customerProfileSchema);
