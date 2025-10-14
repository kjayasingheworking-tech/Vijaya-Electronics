const mongoose = require('mongoose');

const specSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const supProductSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    specifications: { type: [specSchema], default: [] },
    unitPrice: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
    categories: { type: [String], default: [] },
    sku: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
    images: { type: [String], default: [] } 
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupProduct', supProductSchema);
