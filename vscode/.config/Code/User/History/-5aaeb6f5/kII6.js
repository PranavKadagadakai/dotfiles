const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const {
  createBook, getBooks, getBook, updateBook, deleteBook
} = require('../controllers/bookController');
const router = express.Router();

const bookValidation = [
  body('title').isLength({ min: 1, max: 200 }),
  body('author').isLength({ min: 2, max: 100 }),
  body('description').isLength({ min: 10, max: 2000 }),
  body('genre').notEmpty(),
  body('year').isInt({ min: 1000, max: 2025 }),
];

router.get('/', getBooks);
router.get('/:id', getBook);
router.post('/', auth, bookValidation, createBook);
router.put('/:id', auth, bookValidation, updateBook);
router.delete('/:id', auth, deleteBook);

module.exports = router;