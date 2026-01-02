import express from "express";
import { body } from "express-validator";
import auth from "../middleware/auth.js";
import {
  createBook,
  getBooks,
  getBook,
  updateBook,
  deleteBook,
} from "../controllers/bookController.js";
const router = express.Router();

const bookValidation = [
  body("title").isLength({ min: 1, max: 200 }),
  body("author").isLength({ min: 2, max: 100 }),
  body("description").isLength({ min: 10, max: 2000 }),
  body("genre").notEmpty(),
  body("year").isInt({ min: 1000, max: 2025 }),
];

router.get("/", getBooks);
router.get("/:id", getBook);
router.post("/", auth, bookValidation, createBook);
router.put("/:id", auth, bookValidation, updateBook);
router.delete("/:id", auth, deleteBook);

export default router;
