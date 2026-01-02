import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function BookDetailsPage() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    api.get(`/books/${id}`).then(res => setBook(res.data.book));
    api.get(`/books/${id}/reviews`).then(res => setReviews(res.data.reviews));
  }, [id, refresh]);

  const handleReview = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/books/${id}/reviews`, { rating, reviewText });
      setReviewText('');
      setRating(5);
      setRefresh(r => !r);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add review');
    }
  };

  if (!book) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <h2 className="text-xl font-bold">{book.title}</h2>
      <div className="text-gray-600">{book.author} ({book.year})</div>
      <div className="text-gray-500">{book.genre}</div>
      <div className="my-2">{book.description}</div>
      <div className="text-yellow-600">★ {book.averageRating || 0} ({book.reviewCount || 0} reviews)</div>
      <hr className="my-4" />
      <h3 className="font-bold mb-2">Add a Review</h3>
      <form onSubmit={handleReview} className="flex flex-col gap-2 mb-4">
        <select value={rating} onChange={e => setRating(Number(e.target.value))} className="border p-1 rounded w-24">
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
        </select>
        <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Write your review..." className="border p-2 rounded" minLength={10} required />
        <button type="submit" className="bg-blue-600 text-white py-1 rounded">Submit Review</button>
        {error && <div className="text-red-600">{error}</div>}
      </form>
      <h3 className="font-bold mb-2">Reviews</h3>
      <div className="flex flex-col gap-2">
        {reviews.length === 0 && <div>No reviews yet.</div>}
        {reviews.map(r => (
          <div key={r._id} className="border p-2 rounded">
            <div className="font-bold">{r.userId?.name || 'User'}</div>
            <div className="text-yellow-600">★ {r.rating}</div>
            <div>{r.reviewText}</div>
          </div>
        ))}
      </div>
    </div>
  );
}