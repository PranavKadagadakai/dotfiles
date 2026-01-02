import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/books/${id}`).then((res) => {
      const b = res.data.book;
      setForm({
        title: b.title,
        author: b.author,
        description: b.description,
        genre: b.genre,
        year: b.year,
      });
    });
  }, [id]);

  const validate = () => {
    if (!form.title) return "Title is required";
    if (!form.author) return "Author is required";
    if (!form.description || form.description.length < 10) return "Description must be at least 10 characters";
    if (!form.genre) return "Genre is required";
    if (!form.year || isNaN(form.year) || form.year < 1000 || form.year > 2025) return "Year must be between 1000 and 2025";
    return "";
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) return setError(v);
    setError("");
    setLoading(true);
    try {
      await api.put(`/books/${id}`, { ...form, year: Number(form.year) });
      navigate(`/books/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update book");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded shadow">
      <h2 className="text-2xl mb-4 font-bold dark:text-white">Edit Book</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required className="border p-2 rounded" />
        <input name="author" placeholder="Author" value={form.author} onChange={handleChange} required className="border p-2 rounded" />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required className="border p-2 rounded" />
        <input name="genre" placeholder="Genre" value={form.genre} onChange={handleChange} required className="border p-2 rounded" />
        <input name="year" type="number" placeholder="Year" value={form.year} onChange={handleChange} required min={1000} max={2025} className="border p-2 rounded" />
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white py-2 rounded" disabled={loading}>
            {loading ? "Updating..." : "Update Book"}
          </button>
          <button type="button" className="bg-gray-400 text-white py-2 rounded" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
}