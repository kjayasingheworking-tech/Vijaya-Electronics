const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  //password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ["customer", "supplier", "admin", "sales_manager"], default: "customer" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model("UserTemp", userSchema);
module.exports = User;
