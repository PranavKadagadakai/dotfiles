import Book from "../models/Book.js";
import Review from "../models/Review.js";
import { validationResult } from "express-validator";
import log from "../utils/logger.js";

async function recalculateBookRating(bookId) {
  const reviews = await Review.find({ bookId });
  const reviewCount = reviews.length;
  const averageRating = reviewCount
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(2)
    : 0;
  await Book.findByIdAndUpdate(bookId, {
    averageRating,
    reviewCount,
  });
}

export const addReview = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    log("Add review failed: Validation errors", "error");
    return res
      .status(400)
      .json({ success: false, error: errors.array()[0].msg, statusCode: 400 });
  }
  try {
    const { rating, reviewText } = req.body;
    const { bookId } = req.params;
    const book = await Book.findById(bookId);
    if (!book) {
      log(`Add review failed: Book not found - ID ${bookId}`, "error");
      return res
        .status(404)
        .json({ success: false, error: "Book not found", statusCode: 404 });
    }
    if (book.addedBy.toString() === req.userId) {
      log(
        `Add review failed: User ${req.userId} tried to review their own book - ID ${bookId}`,
        "error"
      );
      return res.status(400).json({
        success: false,
        error: "Cannot review your own book",
        statusCode: 400,
      });
    }
    const exists = await Review.findOne({ bookId, userId: req.userId });
    if (exists) {
      log(
        `Add review failed: User ${req.userId} already reviewed book - ID ${bookId}`,
        "error"
      );
      return res.status(400).json({
        success: false,
        error: "You already reviewed this book",
        statusCode: 400,
      });
    }
    const review = await Review.create({
      bookId,
      userId: req.userId,
      rating,
      reviewText,
    });
    await recalculateBookRating(bookId);
    log(
      `Review added: User ${req.userId} reviewed book - ID ${bookId}`,
      "info"
    );
    return res.status(201).json({
      success: true,
      data: { review },
      message: "Review added successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getBookReviews = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const reviews = await Review.find({ bookId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    const total = reviews.length;
    const avg = total
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(2)
      : 0;
    log(`Fetched reviews for book ID ${bookId}`, "info");
    return res.json({
      success: true,
      data: { reviews, total, averageRating: avg },
      message: "Reviews fetched successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const updateReview = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    log("Update review failed: Validation errors", "error");
    return res
      .status(400)
      .json({ success: false, error: errors.array()[0].msg, statusCode: 400 });
  }
  try {
    const { id } = req.params;
    const { rating, reviewText } = req.body;
    const review = await Review.findById(id);
    if (!review) {
      log(`Update review failed: Review not found - ID ${id}`, "error");
      return res
        .status(404)
        .json({ success: false, error: "Review not found", statusCode: 404 });
    }
    if (review.userId.toString() !== req.userId) {
      log(
        `Update review failed: Unauthorized - User ${req.userId} tried to update review ${id}`,
        "error"
      );
      return res
        .status(403)
        .json({ success: false, error: "Unauthorized", statusCode: 403 });
    }
    if (rating) review.rating = rating;
    if (reviewText) review.reviewText = reviewText;
    await review.save();
    await recalculateBookRating(review.bookId);
    log(`Review updated: ID ${id} by User ${req.userId}`, "info");
    return res.json({
      success: true,
      data: { review },
      message: "Review updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) {
      log(`Delete review failed: Review not found - ID ${id}`, "error");
      return res
        .status(404)
        .json({ success: false, error: "Review not found", statusCode: 404 });
    }
    if (review.userId.toString() !== req.userId) {
      log(
        `Delete review failed: Unauthorized - User ${req.userId} tried to delete review ${id}`,
        "error"
      );
      return res
        .status(403)
        .json({ success: false, error: "Unauthorized", statusCode: 403 });
    }
    await review.deleteOne();
    await recalculateBookRating(review.bookId);
    log(`Review deleted: ID ${id} by User ${req.userId}`, "info");
    return res.json({
      success: true,
      data: null,
      message: "Review deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getRatingDistribution = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const reviews = await Review.find({ bookId });
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      distribution[r.rating - 1] += 1;
    });
    log(`Fetched rating distribution for book ID ${bookId}`, "info");
    return res.json({
      success: true,
      data: { distribution },
      message: "Rating distribution fetched successfully",
    });
  } catch (err) {
    next(err);
  }
};
