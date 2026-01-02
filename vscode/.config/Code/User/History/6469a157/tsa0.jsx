import { useEffect, useState } from "react";
import api from "../services/api";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get("/auth/profile").then(res => {
      setUser(res.data.user);
      setBooks(res.data.books);
      setReviews(res.data.reviews);
    });
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto mt-8">
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