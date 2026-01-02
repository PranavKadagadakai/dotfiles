import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function BookDetailsPage() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [distribution, setDistribution] = useState([0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [error, setError] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editReviewText, setEditReviewText] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [targetId, setTargetId] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/books/${id}`),
      api.get(`/books/${id}/reviews`),
      api.get(`/books/${id}/rating-distribution`),
    ])
      .then(([bookRes, reviewsRes, distRes]) => {
        setBook(bookRes.data?.data?.book || null);
        setReviews(reviewsRes.data?.data?.reviews || []);
        setDistribution(distRes.data?.data?.distribution || [0, 0, 0, 0, 0]);
      })
      .catch(() => {
        setBook(null);
        setReviews([]);
        setDistribution([0, 0, 0, 0, 0]);
      })
      .finally(() => setLoading(false));
  }, [id, refresh]);

  const handleReview = async (e) => {
    e.preventDefault();
    setError("");
    if (!reviewText || reviewText.length < 10) {
      setError("Review must be at least 10 characters.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setError("Rating must be between 1 and 5.");
      return;
    }
    try {
      await api.post(`/books/${id}/reviews`, { rating, reviewText });
      setReviewText("");
      setRating(5);
      setRefresh((r) => !r);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add review");
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review._id);
    setEditReviewText(review.reviewText);
    setEditRating(review.rating);
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/reviews/${editingReviewId}`, {
        rating: editRating,
        reviewText: editReviewText,
      });
      setEditingReviewId(null);
      setRefresh((r) => !r);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update review");
    }
  };

  const confirmDeleteBook = () => {
    setModalTitle("Confirm Book Deletion");
    setModalMessage(
      "Are you sure you want to delete this book? This action cannot be undone."
    );
    setConfirmAction(() => executeDeleteBook);
    setTargetId(null);
    setIsModalOpen(true);
  };

  const executeDeleteBook = async () => {
    setIsModalOpen(false);
    setIsDeleting(true);
    try {
      await api.delete(`/books/${id}`);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to delete book");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteReview = (reviewId) => {
    setModalTitle("Confirm Review Deletion");
    setModalMessage("Are you sure you want to delete this review?");
    setConfirmAction(() => executeDeleteReview);
    setTargetId(reviewId);
    setIsModalOpen(true);
  };

  const executeDeleteReview = async () => {
    setIsModalOpen(false);
    try {
      await api.delete(`/reviews/${targetId}`);
      setRefresh((r) => !r);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete review");
    } finally {
      setTargetId(null);
    }
  };

  const handleModalConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!book) return <div className="text-red-600">Book not found.</div>;

  return (
    <div className="max-w-2xl mx-auto mt-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded shadow">
      <h2 className="text-xl font-bold">{book.title}</h2>
      <div className="text-gray-600">
        {book.author} ({book.year})
      </div>
      <div className="text-gray-500">{book.genre}</div>
      <div className="my-2">{book.description}</div>
      <div className="text-yellow-600">
        ★ {book.averageRating || 0} ({book.reviewCount || 0} reviews)
      </div>
      {user && book.addedBy === user._id && (
        <div className="flex gap-2 my-2">
          <button
            onClick={() => navigate(`/books/${id}/edit`)}
            className="bg-yellow-500 text-white px-3 py-1 rounded"
          >
            Edit
          </button>
          <button
            onClick={confirmDeleteBook}
            disabled={isDeleting}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      )}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleModalConfirm}
        title={modalTitle}
        message={modalMessage}
      />
      <hr className="my-4 border-gray-200 dark:border-gray-700" />
      <h3 className="font-bold mb-2">Add a Review</h3>
      <form onSubmit={handleReview} className="flex flex-col gap-2 mb-4">
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="border border-gray-300 dark:border-gray-600 p-1 rounded w-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} Star{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Write your review..."
          className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          minLength={10}
          required
        />
        <button type="submit" className="bg-blue-600 text-white py-1 rounded">
          Submit Review
        </button>
        {error && <div className="text-red-600">{error}</div>}
      </form>
      <h3 className="font-bold mb-2">Reviews</h3>
      <div className="flex flex-col gap-2">
        {reviews.length === 0 && <div>No reviews yet.</div>}
        {reviews
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((r) => (
            <div
              key={r._id}
              className="border border-gray-200 dark:border-gray-700 p-2 rounded"
            >
              <div className="font-bold">{r.userId?.name || "User"}</div>
              <div className="text-yellow-600">★ {r.rating}</div>
              <div>{r.reviewText}</div>
              <div className="text-xs text-gray-500">
                {new Date(r.createdAt).toLocaleString()}
              </div>
              {editingReviewId === r._id ? (
                <form
                  onSubmit={handleUpdateReview}
                  className="flex flex-col gap-2 mt-2"
                >
                  <select
                    value={editRating}
                    onChange={(e) => setEditRating(Number(e.target.value))}
                    className="border border-gray-300 dark:border-gray-600 p-1 rounded w-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} Star{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={editReviewText}
                    onChange={(e) => setEditReviewText(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    minLength={10}
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-2 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingReviewId(null)}
                      className="bg-gray-400 text-white px-2 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex gap-2 mt-1">
                  {user && r.userId?._id === user._id && (
                    <>
                      <button
                        onClick={() => handleEditReview(r)}
                        className="text-blue-600 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDeleteReview(r._id)}
                        className="text-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
      <h3 className="font-bold mb-2">Rating Distribution</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={distribution.map((v, i) => ({ star: `${i + 1}★`, count: v }))}
        >
          <XAxis dataKey="star" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
