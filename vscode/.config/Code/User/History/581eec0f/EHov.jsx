import React, { useState, useEffect } from "react";
import api from "../api";

const EventManagement = ({ clubId, onEventCreated, onEventUpdated }) => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

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

  // ───────────────────────────────────────────────
  // FETCH EVENTS + AICTE CATEGORIES
  // ───────────────────────────────────────────────
  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/?club=true");
      setEvents(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (err) {
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/aicte-categories/");
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch AICTE categories");
    }
  };

  // ───────────────────────────────────────────────
  // FORM HANDLERS
  // ───────────────────────────────────────────────
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ───────────────────────────────────────────────
  // CREATE / UPDATE
  // ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      formData.end_date &&
      new Date(formData.end_date) < new Date(formData.event_date)
    ) {
      setError("End date must be after start date");
      return;
    }

    if (formData.aicte_category && !formData.points_awarded) {
      setError("Points awarded must be specified for AICTE events");
      return;
    }

    setLoading(true);

    try {
      if (editingEvent) {
        // Update
        await api.patch(`/events/${editingEvent.id}/`, formData);
        setSuccess("Event updated successfully!");
        onEventUpdated?.(formData);
      } else {
        // Create
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
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────
  // EDIT
  // ───────────────────────────────────────────────
  const handleEdit = (event) => {
    setFormData({
      name: event.name,
      description: event.description || "",
      event_date: event.event_date,
      end_date: event.end_date || "",
      start_time: event.start_time,
      end_time: event.end_time || "",
      max_participants: event.max_participants || "",
      aicte_category: event.aicte_category || "",
      points_awarded: event.points_awarded || 0,
    });
    setEditingEvent(event);
    setShowForm(true);
  };

  // ───────────────────────────────────────────────
  // DELETE
  // ───────────────────────────────────────────────
  const handleDelete = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await api.delete(`/events/${eventId}/`);
      setSuccess("Event deleted successfully!");
      fetchEvents();
    } catch (err) {
      setError("Failed to delete event");
    }
  };

  // ───────────────────────────────────────────────
  // STATUS CHANGE
  // ───────────────────────────────────────────────
  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await api.patch(`/events/${eventId}/`, { status: newStatus });
      setSuccess(`Event status updated to ${newStatus}`);
      fetchEvents();
    } catch (err) {
      setError("Failed to update event status");
    }
  };

  // ───────────────────────────────────────────────
  // UI
  // ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* MESSAGES */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg border">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-100 text-green-700 rounded-lg border">
          {success}
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex gap-4">
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          {showForm ? "Cancel" : "+ Create Event"}
        </button>

        <button
          onClick={fetchEvents}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          Refresh
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md space-y-4 border-l-4 border-blue-500"
        >
          <h3 className="text-lg font-semibold">
            {editingEvent ? "Edit Event" : "Create New Event"}
          </h3>

          {/* NAME + MAX PARTICIPANTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded"
              placeholder="Event Name"
            />
            <input
              type="number"
              name="max_participants"
              value={formData.max_participants}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded"
              placeholder="Max Participants"
              min="1"
            />
          </div>

          {/* DESCRIPTION */}
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-2 border rounded"
            placeholder="Event Description"
          />

          {/* DATES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              value={formData.end_date}
              onChange={handleChange}
              className="p-2 border rounded"
              placeholder="End Date"
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

          {/* TIME + AICTE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value="">Select AICTE Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              name="points_awarded"
              placeholder="Points"
              value={formData.points_awarded}
              onChange={handleChange}
              className="p-2 border rounded"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
          >
            {loading
              ? "Saving..."
              : editingEvent
              ? "Update Event"
              : "Create Event"}
          </button>
        </form>
      )}

      {/* EVENTS LIST */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold">Your Events</h3>
        </div>

        {loading && events.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : events.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No events yet. Create one!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm">Event Name</th>
                  <th className="px-6 py-3 text-left text-sm">Date</th>
                  <th className="px-6 py-3 text-left text-sm">Time</th>
                  <th className="px-6 py-3 text-left text-sm">Status</th>
                  <th className="px-6 py-3 text-left text-sm">Participants</th>
                  <th className="px-6 py-3 text-left text-sm">Actions</th>
                </tr>
              </thead>

              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">{event.name}</td>
                    <td className="px-6 py-4">
                      {new Date(event.event_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {event.start_time} - {event.end_time || ""}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          event.status === "draft"
                            ? "bg-gray-100 text-gray-800"
                            : event.status === "scheduled"
                            ? "bg-blue-100 text-blue-800"
                            : event.status === "ongoing"
                            ? "bg-yellow-100 text-yellow-800"
                            : event.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {event.registrations?.length || 0} /{" "}
                      {event.max_participants || "∞"}
                    </td>

                    <td className="px-6 py-4 space-x-2">
                      {event.status === "draft" && (
                        <>
                          <button
                            onClick={() => handleEdit(event)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(event.id, "scheduled")
                            }
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                          >
                            Schedule
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                          >
                            Delete
                          </button>
                        </>
                      )}

                      {event.status === "scheduled" && (
                        <button
                          onClick={() =>
                            handleStatusChange(event.id, "ongoing")
                          }
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Start
                        </button>
                      )}

                      {event.status === "ongoing" && (
                        <button
                          onClick={() =>
                            handleStatusChange(event.id, "completed")
                          }
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventManagement;
