const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { addReview, getBookReviews, updateReview, deleteReview, getRatingDistribution } = require('../controllers/reviewController');
const router = express.Router();

const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }),
  body('reviewText').isLength({ min: 10, max: 1000 }),
];

router.post('/books/:bookId/reviews', auth, reviewValidation, addReview);
router.get('/books/:bookId/reviews', getBookReviews);
router.put('/reviews/:id', auth, reviewValidation, updateReview);
router.delete('/reviews/:id', auth, deleteReview);
router.get('/books/:bookId/rating-distribution', getRatingDistribution);

module.exports = router;