const Book = require('../models/Book');
const Review = require('../models/Review');
const { validationResult } = require('express-validator');

exports.createBook = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg, statusCode: 400 });
  }
  try {
    const { title, author, description, genre, year } = req.body;
    const book = await Book.create({
      title, author, description, genre, year, addedBy: req.userId
    });
    return res.status(201).json({
      success: true,
      data: { book },
      message: "Book created successfully"
    });
  } catch (err) {
    next(err);
  }
};

exports.getBooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 5, search = "", genre = "", sort = "" } = req.query;
    const skip = (page - 1) * limit;
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } }
      ];
    }
    if (genre) query.genre = genre;
    let sortObj = {};
    if (sort) {
      if (sort.startsWith("-")) sortObj[sort.slice(1)] = -1;
      else sortObj[sort] = 1;
    } else {
      sortObj.createdAt = -1;
    }
    const total = await Book.countDocuments(query);
    const books = await Book.find(query).sort(sortObj).skip(skip).limit(Number(limit));
    return res.json({
      success: true,
      data: {
        books,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page)
      },
      message: "Books fetched successfully"
    });
  } catch (err) {
    next(err);
  }
};

exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, error: 'Book not found', statusCode: 404 });
    const reviewCount = await Review.countDocuments({ bookId: book._id });
    return res.json({
      success: true,
      data: { book, reviewCount },
      message: "Book fetched successfully"
    });
  } catch (err) {
    next(err);
  }
};

exports.updateBook = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg, statusCode: 400 });
  }
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, error: 'Book not found', statusCode: 404 });
    if (book.addedBy.toString() !== req.userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized', statusCode: 403 });
    }
    const { title, author, description, genre, year } = req.body;
    if (title) book.title = title;
    if (author) book.author = author;
    if (description) book.description = description;
    if (genre) book.genre = genre;
    if (year) book.year = year;
    await book.save();
    return res.json({
      success: true,
      data: { book },
      message: "Book updated successfully"
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, error: 'Book not found', statusCode: 404 });
    if (book.addedBy.toString() !== req.userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized', statusCode: 403 });
    }
    await book.deleteOne();
    await Review.deleteMany({ bookId: book._id });
    return res.json({
      success: true,
      data: null,
      message: "Book deleted successfully"
    });
  } catch (err) {
    next(err);
  }
};