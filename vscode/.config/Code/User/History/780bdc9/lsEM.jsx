import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function EditBookPage() {
  const { id } = useParams();
  const [form, setForm] = useState({
    title: "",
    author: "",
    description: "",
    genre: "",
    year: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookNotFound, setBookNotFound] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set initial loading state
    setLoading(true);
    setBookNotFound(false);

    api
      .get(`/books/${id}`)
      .then((res) => {
        const b = res.data?.data?.book;

        if (!b) {
          setBookNotFound(true);
          return;
        }

        if (b.title && b.author && b.description) {
          setForm({
            title: b.title,
            author: b.author,
            description: b.description,
            genre: b.genre || "",
            year: b.year,
          });
        } else {
          setBookNotFound(true);
        }
      })
      .catch((err) => {
        console.error("Error fetching book:", err);
        setBookNotFound(true);
        setError(err.response?.data?.error || "Failed to load book data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const validate = () => {
    if (!form.title) return "Title is required";
    if (!form.author) return "Author is required";
    if (!form.description || form.description.length < 10)
      return "Description must be at least 10 characters";
    if (!form.genre) return "Genre is required";
    if (!form.year || isNaN(form.year) || form.year < 1000 || form.year > 2025)
      return "Year must be between 1000 and 2025";
    return "";
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) return setError(v);
    setError("");
    setIsUpdating(true);
    try {
      await api.put(`/books/${id}`, { ...form, year: Number(form.year) });
      navigate(`/books/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update book");
    }
    setIsUpdating(false);
  };

  if (loading) return <LoadingSpinner />;
  if (bookNotFound)
    return (
      <div className="text-center mt-10 text-xl text-red-600">
        Book Not Found or an Error Occurred.
      </div>
    );

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded shadow">
      <h2 className="text-2xl mb-4 font-bold dark:text-white">Edit Book</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
          className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          name="author"
          placeholder="Author"
          value={form.author}
          onChange={handleChange}
          required
          className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
          className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          name="genre"
          placeholder="Genre"
          value={form.genre}
          onChange={handleChange}
          required
          className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          name="year"
          value={form.year}
          onChange={handleChange}
          required
          className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="" disabled>
            Published Year
          </option>
          {Array.from({ length: 2025 - 1000 + 1 }, (_, i) => 2025 - i).map(
            (y) => (
              <option key={y} value={y}>
                {y}
              </option>
            )
          )}
        </select>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded"
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update Book"}
          </button>
          <button
            type="button"
            className="bg-gray-400 text-white p-2 rounded"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
}
