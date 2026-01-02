const express = require('express');
const auth = require('../middleware/auth');
const { createBook, getBooks, getBook, updateBook, deleteBook } = require('../controllers/bookController');
const router = express.Router();

router.get('/', getBooks);
router.get('/:id', getBook);
router.post('/', auth, createBook);
router.put('/:id', auth, updateBook);
router.delete('/:id', auth, deleteBook);

module.exports = router;