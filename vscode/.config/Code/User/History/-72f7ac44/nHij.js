const express = require('express');
const auth = require('../middleware/auth');
const { addReview, getBookReviews, updateReview, deleteReview } = require('../controllers/reviewController');
const router = express.Router();

router.post('/books/:bookId/reviews', auth, addReview);
router.get('/books/:bookId/reviews', getBookReviews);
router.put('/reviews/:id', auth, updateReview);
router.delete('/reviews/:id', auth, deleteReview);

module.exports = router;