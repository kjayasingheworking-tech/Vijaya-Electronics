const { Schema, model, Types } = require("mongoose");

const commentSchema = new Schema(
  {
    author: { type: Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true, _id: true }
);

const feedbackSchema = new Schema(
  {
    author: { type: Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, default: "company", enum: ["company"] },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String, trim: true },
    body: { type: String, trim: true },
    comments: [commentSchema],
  },
  { timestamps: true }
);

module.exports = model("Feedback", feedbackSchema);
