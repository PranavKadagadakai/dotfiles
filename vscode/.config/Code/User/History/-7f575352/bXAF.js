const Book = require('../models/Book');
const Review = require('../models/Review');

exports.createBook = async (req, res, next) => {
  try {
    const { title, author, description, genre, year } = req.body;
    if (!title || !author || !description || !genre || !year) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    if (year < 1000 || year > 2025) {
      return res.status(400).json({ success: false, error: 'Year must be between 1000 and 2025' });
    }
    const book = await Book.create({
      title, author, description, genre, year, addedBy: req.userId
    });
    res.status(201).json({ success: true, book });
  } catch (err) {
    next(err);
  }
};

exports.getBooks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const total = await Book.countDocuments();
    const books = await Book.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({
      success: true,
      books,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (err) {
    next(err);
  }
};

exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, error: 'Book not found' });
    const reviewCount = await Review.countDocuments({ bookId: book._id });
    res.json({ success: true, book, reviewCount });
  } catch (err) {
    next(err);
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, error: 'Book not found' });
    if (book.addedBy.toString() !== req.userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const { title, author, description, genre, year } = req.body;
    if (year && (year < 1000 || year > 2025)) {
      return res.status(400).json({ success: false, error: 'Year must be between 1000 and 2025' });
    }
    if (title) book.title = title;
    if (author) book.author = author;
    if (description) book.description = description;
    if (genre) book.genre = genre;
    if (year) book.year = year;
    await book.save();
    res.json({ success: true, book });
  } catch (err) {
    next(err);
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, error: 'Book not found' });
    if (book.addedBy.toString() !== req.userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    await book.deleteOne();
    await Review.deleteMany({ bookId: book._id });
    res.json({ success: true, message: 'Book deleted' });
  } catch (err) {
    next(err);
  }
};