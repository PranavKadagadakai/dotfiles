import { useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/profile")
      .then(res => {
        setUser(res.data?.data?.user || null);
        setBooks(res.data?.data?.books || []);
        setReviews(res.data?.data?.reviews || []);
      })
      .catch(() => {
        setUser(null);
        setBooks([]);
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!user) return <div className="text-red-600">Could not load profile.</div>;

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded shadow">
      <h2 className="text-2xl font-bold mb-2">Profile</h2>
      <div className="mb-4">
        <div><b>Name:</b> {user.name}</div>
        <div><b>Email:</b> {user.email}</div>
      </div>
      <h3 className="font-bold mt-6 mb-2">My Books</h3>
      <ul className="mb-4">
        {books.map(b => (
          <li key={b._id}><a href={`/books/${b._id}`} className="text-blue-600">{b.title}</a></li>
        ))}
        {books.length === 0 && <li>No books added.</li>}
      </ul>
      <h3 className="font-bold mt-6 mb-2">My Reviews</h3>
      <ul>
        {reviews.map(r => (
          <li key={r._id}>
            <span className="font-bold">{r.bookId?.title}</span>: {r.reviewText} <span className="text-yellow-600">★{r.rating}</span>
          </li>
        ))}
        {reviews.length === 0 && <li>No reviews written.</li>}
      </ul>
    </div>
  );
}