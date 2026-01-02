const User = require('../models/User');
const Book = require('../models/Book');
const Review = require('../models/Review');
const generateToken = require('../utils/generateToken');

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required', statusCode: 400 });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters', statusCode: 400 });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, error: 'Email already registered', statusCode: 400 });
    }
    const user = await User.create({ name, email, password });
    return res.status(201).json({
      success: true,
      data: { user: { _id: user._id, name: user.name, email: user.email } },
      message: 'Registration successful'
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid credentials', statusCode: 400 });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid credentials', statusCode: 400 });
    }
    const token = generateToken(user);
    return res.json({
      success: true,
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email }
      },
      message: 'Login successful'
    });
  } catch (err) {
    next(err);
  }
};

exports.profile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ success: false, error: "User not found", statusCode: 404 });
    const books = await Book.find({ addedBy: req.userId });
    const reviews = await Review.find({ userId: req.userId }).populate("bookId", "title author");
    return res.json({
      success: true,
      data: { user, books, reviews },
      message: "Profile fetched successfully"
    });
  } catch (err) {
    next(err);
  }
};