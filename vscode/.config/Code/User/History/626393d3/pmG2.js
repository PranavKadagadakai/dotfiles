import User from "../models/User.js";
import Book from "../models/Book.js";
import Review from "../models/Review.js";
import generateToken from "../utils/generateToken.js";
import { validationResult } from "express-validator";
import log from "../utils/logger.js";

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      log("Signup failed: Missing fields", "error");
      return res.status(400).json({
        success: false,
        error: "All fields are required",
        statusCode: 400,
      });
    }
    if (password.length < 6) {
      log("Signup failed: Password too short", "error");
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
        statusCode: 400,
      });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      log("Signup failed: Email already registered", "error");
      return res.status(400).json({
        success: false,
        error: "Email already registered",
        statusCode: 400,
      });
    }
    const user = await User.create({ name, email, password });
    log(`User registered: ${email}`, "success");
    return res.status(201).json({
      success: true,
      data: { user: { _id: user._id, name: user.name, email: user.email } },
      message: "Registration successful",
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      log("Login failed: User not found", "error");
      return res.status(400).json({
        success: false,
        error: "Invalid credentials",
        statusCode: 400,
      });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      log("Login failed: Incorrect password", "error");
      return res.status(400).json({
        success: false,
        error: "Invalid credentials",
        statusCode: 400,
      });
    }
    const token = generateToken(user);
    log(`User logged in: ${email}`, "success");
    return res.json({
      success: true,
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email },
      },
      message: "Login successful",
    });
  } catch (err) {
    next(err);
  }
};

export const profile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      log("Profile fetch failed: User not found", "error");
      return res
        .status(404)
        .json({ success: false, error: "User not found", statusCode: 404 });
    }
    const books = await Book.find({ addedBy: req.userId });
    const reviews = await Review.find({ userId: req.userId }).populate(
      "bookId",
      "title author"
    );
    log(`Profile fetched: ${user.email}`, "info");
    return res.json({
      success: true,
      data: { user, books, reviews },
      message: "Profile fetched successfully",
    });
  } catch (err) {
    next(err);
  }
};
