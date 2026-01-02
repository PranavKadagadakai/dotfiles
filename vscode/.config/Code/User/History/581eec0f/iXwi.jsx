import React, { useState, useEffect } from "react";
import axios from "axios";

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    event_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    max_participants: "",
    aicte_category: "",
    points_awarded: 0,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get("/events/");
      console.log("Fetched events:", response.data);
      setEvents(response.data);
    } catch (err) {
      setError("Failed to fetch events");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/aicte-categories/");
      setCategories(response.data);
    } catch (err) {
      console.error("Failed to fetch AICTE categories");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (
        formData.end_date &&
        new Date(formData.end_date) < new Date(formData.event_date)
      ) {
        setError("End date must be after start date");
        setLoading(false);
        return;
      }

      if (formData.aicte_category && !formData.points_awarded) {
        setError("Points awarded must be specified for AICTE events");
        setLoading(false);
        return;
      }

      await axios.post("/api/events/", formData);
      setFormData({
        name: "",
        description: "",
        event_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        max_participants: "",
        aicte_category: "",
        points_awarded: 0,
      });
      fetchEvents();
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Event Management</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Event Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="p-2 border rounded"
          />
          <input
            type="number"
            name="max_participants"
            placeholder="Max Participants"
            value={formData.max_participants}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>

        <textarea
          name="description"
          placeholder="Event Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          rows="3"
        />

        <div className="grid grid-cols-3 gap-4">
          <input
            type="date"
            name="event_date"
            value={formData.event_date}
            onChange={handleChange}
            required
            className="p-2 border rounded"
          />
          <input
            type="date"
            name="end_date"
            placeholder="End Date (Optional)"
            value={formData.end_date}
            onChange={handleChange}
            className="p-2 border rounded"
          />
          <input
            type="time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            required
            className="p-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <input
            type="time"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            className="p-2 border rounded"
          />
          <select
            name="aicte_category"
            value={formData.aicte_category}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="">Select AICTE Category (Optional)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="points_awarded"
            placeholder="Points (if category selected)"
            value={formData.points_awarded}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Event"}
        </button>
      </form>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">My Events</h3>
        {events.map((event) => (
          <div key={event.id} className="p-4 border rounded bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold">{event.name}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(event.event_date).toLocaleDateString()}
                  {event.end_date &&
                    ` - ${new Date(event.end_date).toLocaleDateString()}`}
                </p>
                <p className="text-sm">
                  {event.start_time} - {event.end_time}
                </p>
                {event.aicte_category_name && (
                  <p className="text-sm text-green-600">
                    AICTE: {event.aicte_category_name} ({event.points_awarded}{" "}
                    pts)
                  </p>
                )}
              </div>
              <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded text-sm">
                {event.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventManagement;
