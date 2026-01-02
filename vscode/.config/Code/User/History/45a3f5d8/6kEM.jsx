import { useState } from "react";
import api from "../services/api";

export default function AddBookPage() {
  const [form, setForm] = useState({
    title: "",
    author: "",
    description: "",
    genre: "",
    year: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/books", { ...form, year: Number(form.year) });
      window.location.replace("/");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add book");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl mb-4 font-bold">Add Book</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required className="border p-2 rounded" />
        <input name="author" placeholder="Author" value={form.author} onChange={handleChange} required className="border p-2 rounded" />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required className="border p-2 rounded" />
        <input name="genre" placeholder="Genre" value={form.genre} onChange={handleChange} required className="border p-2 rounded" />
        <input name="year" type="number" placeholder="Year" value={form.year} onChange={handleChange} required min={1000} max={2025} className="border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white py-2 rounded" disabled={loading}>
          {loading ? "Adding..." : "Add Book"}
        </button>
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
}