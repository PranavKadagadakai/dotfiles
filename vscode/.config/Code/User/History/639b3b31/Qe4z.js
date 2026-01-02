import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minlength: 1, maxlength: 200 },
    author: { type: String, required: true, minlength: 2, maxlength: 100 },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 2000,
    },
    genre: { type: String, required: true },
    year: { type: Number, required: true, min: 1000, max: 2025 },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Book", bookSchema);
