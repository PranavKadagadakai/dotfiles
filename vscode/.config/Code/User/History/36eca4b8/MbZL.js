import express from "express";
import { body } from "express-validator";
import auth from "../middleware/auth.js";
import {
  addReview,
  getBookReviews,
  updateReview,
  deleteReview,
  getRatingDistribution,
} from "../controllers/reviewController.js";
const router = express.Router();

const reviewValidation = [
  body("rating").isInt({ min: 1, max: 5 }),
  body("reviewText").isLength({ min: 10, max: 1000 }),
];

router.post("/books/:bookId/reviews", auth, reviewValidation, addReview);
router.get("/books/:bookId/reviews", getBookReviews);
router.put("/reviews/:id", auth, reviewValidation, updateReview);
router.delete("/reviews/:id", auth, deleteReview);
router.get("/books/:bookId/rating-distribution", getRatingDistribution);

export default router;
