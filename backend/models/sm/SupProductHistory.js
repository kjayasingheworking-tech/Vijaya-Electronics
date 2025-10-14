const mongoose = require('mongoose');

const supProductHistorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'SupProduct', required: true },
    version: { type: Number, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    snapshot: { type: Object, required: true },
    changedFields: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupProductHistory', supProductHistorySchema);
