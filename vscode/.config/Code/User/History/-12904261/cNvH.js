const Review = require('../models/Review');
const Book = require('../models/Book');

async function recalculateBookRating(bookId) {
  const reviews = await Review.find({ bookId });
  const reviewCount = reviews.length;
  const averageRating = reviewCount
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(2)
    : 0;
  await Book.findByIdAndUpdate(bookId, {
    averageRating,
    reviewCount
  });
}

exports.addReview = async (req, res, next) => {
  try {
    const { rating, reviewText } = req.body;
    const { bookId } = req.params;
    if (!rating || !reviewText) {
      return res.status(400).json({ success: false, error: 'Rating and review text required' });
    }
    if (reviewText.length < 10) {
      return res.status(400).json({ success: false, error: 'Review text too short' });
    }
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ success: false, error: 'Book not found' });
    if (book.addedBy.toString() === req.userId) {
      return res.status(400).json({ success: false, error: 'Cannot review your own book' });
    }
    const exists = await Review.findOne({ bookId, userId: req.userId });
    if (exists) {
      return res.status(400).json({ success: false, error: 'You already reviewed this book' });
    }
    const review = await Review.create({ bookId, userId: req.userId, rating, reviewText });
    await recalculateBookRating(bookId);
    res.status(201).json({ success: true, review });
  } catch (err) {
    next(err);
  }
};

exports.getBookReviews = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const reviews = await Review.find({ bookId }).populate('userId', 'name');
    const total = reviews.length;
    const avg = total ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(2) : 0;
    res.json({ success: true, reviews, total, averageRating: avg });
  } catch (err) {
    next(err);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, reviewText } = req.body;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
    if (review.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    if (rating) review.rating = rating;
    if (reviewText) review.reviewText = reviewText;
    await review.save();
    await recalculateBookRating(review.bookId);
    res.json({ success: true, review });
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
    if (review.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    await review.deleteOne();
    await recalculateBookRating(review.bookId);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};