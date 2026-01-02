import { useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function HomePage() {
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBooks = () => {
    setLoading(true);
    api
      .get(`/books?page=${page}&search=${search}&genre=${genre}&sort=${sort}`)
      .then((res) => {
        setBooks(res.data?.data?.books || []);
        setTotalPages(res.data?.data?.totalPages || 1);
      })
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBooks();
    // eslint-disable-next-line
  }, [page, search, genre, sort]);

  return (
    <div className="max-w-3xl mx-auto mt-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Books</h1>
      <div className="flex gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title/author" className="border p-2 rounded" />
        <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Genre" className="border p-2 rounded" />
        <select value={sort} onChange={e => setSort(e.target.value)} className="border p-2 rounded">
          <option value="">Sort</option>
          <option value="year">Year ↑</option>
          <option value="-year">Year ↓</option>
          <option value="averageRating">Rating ↑</option>
          <option value="-averageRating">Rating ↓</option>
        </select>
        <button onClick={() => setPage(1)} className="bg-blue-600 text-white px-3 py-1 rounded">Apply</button>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4">
          {books.length === 0 && <div>No books found.</div>}
          {books.map(book => (
            <a key={book._id} href={`/books/${book._id}`} className="block border p-4 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="font-bold">{book.title}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{book.author} ({book.year})</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{book.genre}</div>
              <div className="text-yellow-600">★ {book.averageRating || 0} ({book.reviewCount || 0} reviews)</div>
            </a>
          ))}
        </div>
      )}
      <div className="flex gap-2 mt-4">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded">Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded">Next</button>
      </div>
    </div>
  );
}