const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ bookId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
