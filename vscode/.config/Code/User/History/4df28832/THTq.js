import Book from "../models/Book.js";
import Review from "../models/Review.js";
import { validationResult } from "express-validator";
import log from "../utils/logger.js";

export const createBook = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    log("Create book failed: Validation errors", "error");
    return res
      .status(400)
      .json({ success: false, error: errors.array()[0].msg, statusCode: 400 });
  }
  try {
    const { title, author, description, genre, year } = req.body;
    const book = await Book.create({
      title,
      author,
      description,
      genre,
      year,
      addedBy: req.userId,
    });
    log(`Book created: ${title} by user ${req.userId}`, "success");
    return res.status(201).json({
      success: true,
      data: { book },
      message: "Book created successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getBooks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 5,
      search = "",
      genre = "",
      sort = "",
    } = req.query;
    const skip = (page - 1) * limit;
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
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
    const books = await Book.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));
    log(
      `Fetched books: page ${page}, limit ${limit}, search "${search}", genre "${genre}", sort "${sort}"`,
      "info"
    );
    return res.json({
      success: true,
      data: {
        books,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
      },
      message: "Books fetched successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      log(`Book not found: ID ${req.params.id}`, "error");
      return res
        .status(404)
        .json({ success: false, error: "Book not found", statusCode: 404 });
    }
    const reviewCount = await Review.countDocuments({ bookId: book._id });
    log(`Fetched book: ID ${req.params.id}`, "info");
    return res.json({
      success: true,
      data: { book, reviewCount },
      message: "Book fetched successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const updateBook = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    log("Update book failed: Validation errors", "error");
    return res
      .status(400)
      .json({ success: false, error: errors.array()[0].msg, statusCode: 400 });
  }
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      log(`Update book failed: Book not found - ID ${req.params.id}`, "error");
      return res
        .status(404)
        .json({ success: false, error: "Book not found", statusCode: 404 });
    }
    if (book.addedBy.toString() !== req.userId) {
      log(
        `Update book failed: Unauthorized - User ${req.userId} tried to update book ${req.params.id}`,
        "error"
      );
      return res
        .status(403)
        .json({ success: false, error: "Unauthorized", statusCode: 403 });
    }
    const { title, author, description, genre, year } = req.body;
    if (title) book.title = title;
    if (author) book.author = author;
    if (description) book.description = description;
    if (genre) book.genre = genre;
    if (year) book.year = year;
    await book.save();
    log(`Book updated: ID ${req.params.id} by user ${req.userId}`, "success");
    return res.json({
      success: true,
      data: { book },
      message: "Book updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      log(`Delete book failed: Book not found - ID ${req.params.id}`, "error");
      return res
        .status(404)
        .json({ success: false, error: "Book not found", statusCode: 404 });
    }
    if (book.addedBy.toString() !== req.userId) {
      log(
        `Delete book failed: Unauthorized - User ${req.userId} tried to delete book ${req.params.id}`,
        "error"
      );
      return res
        .status(403)
        .json({ success: false, error: "Unauthorized", statusCode: 403 });
    }
    await book.deleteOne();
    await Review.deleteMany({ bookId: book._id });
    log(`Book deleted: ID ${req.params.id} by user ${req.userId}`, "success");
    return res.json({
      success: true,
      data: null,
      message: "Book deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
