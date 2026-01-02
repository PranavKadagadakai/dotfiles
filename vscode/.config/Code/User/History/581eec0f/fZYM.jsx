import React, { useState, useEffect } from "react";
import api from "../api";

const EventManagement = ({ clubId, onEventCreated, onEventUpdated }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [categories, setCategories] = useState([]);
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

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/?club=true");
      setEvents(response.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/aicte-categories/");
      setCategories(response.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch AICTE categories");
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

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
      if (editingEvent) {
        // Update event
        await api.patch(`/events/${editingEvent.id}/`, formData);
        setSuccess("Event updated successfully!");
        onEventUpdated?.(formData);
      } else {
        // Create new event
        const response = await api.post("/events/", formData);
        setSuccess("Event created successfully!");
        onEventCreated?.(response.data);
      }
      fetchEvents();
      resetForm();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to save event"
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEdit = (event) => {
    setFormData({
      name: event.name,
      description: event.description || "",
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time || "",
      max_participants: event.max_participants || "",
      status: event.status,
    });
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await api.delete(`/events/${eventId}/`);
        setSuccess("Event deleted successfully!");
        fetchEvents();
      } catch (err) {
        setError("Failed to delete event");
        console.error(err);
      }
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await api.patch(`/events/${eventId}/`, { status: newStatus });
      setSuccess(`Event status updated to ${newStatus}`);
      fetchEvents();
    } catch (err) {
      setError("Failed to update event status");
      console.error(err);
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
