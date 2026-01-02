import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const ClubDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showEventForm, setShowEventForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    participant_limit: "",
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, eventsRes, bookingsRes] = await Promise.all([
          api.get("/dashboard/stats/"),
          api.get("/events/?club_id=" + user?.id),
          api.get("/hall-bookings/?organizer_id=" + user?.id),
        ]);

        setStats(statsRes.data);
        setEvents(eventsRes.data.results || eventsRes.data);
        setBookings(bookingsRes.data.results || bookingsRes.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const handleEventStatusChange = async (eventId, status) => {
    try {
      await api.patch(`/events/${eventId}/`, { status });
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status } : e))
      );
      alert(`Event ${status.toLowerCase()}!`);
    } catch (err) {
      alert(err.response?.data?.detail || "Status update failed");
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      await api.post(`/hall-bookings/${bookingId}/approve/`);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, booking_status: "approved" } : b
        )
      );
      alert("Booking approved!");
    } catch (err) {
      alert(err.response?.data?.detail || "Approval failed");
    }
  };

  const handleRejectBooking = async (bookingId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      await api.post(`/hall-bookings/${bookingId}/reject/`, {
        rejection_reason: reason,
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, booking_status: "rejected" } : b
        )
      );
      alert("Booking rejected!");
    } catch (err) {
      alert(err.response?.data?.detail || "Rejection failed");
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/events/", formData);
      setEvents((prev) => [...prev, res.data]);
      setFormData({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        location: "",
        participant_limit: "",
      });
      setShowEventForm(false);
      alert("Event created successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "Event creation failed");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Club Organizer Dashboard 🎉
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your events, hall bookings, and members
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Events</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.events_organized || 0}
                </p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Participants</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.total_participants || 0}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Hall Bookings</p>
                <p className="text-3xl font-bold text-purple-600">
                  {bookings.length}
                </p>
              </div>
              <div className="text-4xl">🏛️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Club Members</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.club_members || 0}
                </p>
              </div>
              <div className="text-4xl">👨‍💼</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {["overview", "events", "bookings"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Events
            </h2>
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {event.description?.substring(0, 50)}...
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          event.status === "draft"
                            ? "bg-gray-100 text-gray-800"
                            : event.status === "scheduled"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      📅 {new Date(event.start_time).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      👥 {event.participant_count}/{event.participant_limit}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No events created yet</p>
            )}
            <button
              onClick={() => setShowEventForm(true)}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 font-medium"
            >
              + Create Event
            </button>
          </div>

          {/* Pending Bookings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Hall Bookings
            </h2>
            {bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {booking.hall?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking.booking_date}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          booking.booking_status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : booking.booking_status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {booking.booking_status}
                      </span>
                    </div>
                    {booking.booking_status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveBooking(booking.id)}
                          className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectBooking(booking.id)}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No hall bookings</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "events" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">All Events</h2>
            <button
              onClick={() => setShowEventForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 font-medium"
            >
              + Create Event
            </button>
          </div>

          {showEventForm && (
            <form
              onSubmit={handleCreateEvent}
              className="bg-gray-50 p-6 rounded mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Event Title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="border border-gray-300 rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="border border-gray-300 rounded px-3 py-2"
                />
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  required
                  className="border border-gray-300 rounded px-3 py-2"
                />
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  required
                  className="border border-gray-300 rounded px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Participant Limit"
                  value={formData.participant_limit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      participant_limit: e.target.value,
                    })
                  }
                  className="border border-gray-300 rounded px-3 py-2"
                />
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="border border-gray-300 rounded px-3 py-2 md:col-span-2"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowEventForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {event.description}
                  </p>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>📅 {new Date(event.start_time).toLocaleString()}</p>
                    <p>📍 {event.location || "TBD"}</p>
                    <p>
                      👥 {event.participant_count}/{event.participant_limit}
                    </p>
                  </div>
                  <select
                    value={event.status}
                    onChange={(e) =>
                      handleEventStatusChange(event.id, e.target.value)
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No events created yet</p>
          )}
        </div>
      )}

      {activeTab === "bookings" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            All Hall Bookings
          </h2>
          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.hall?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {booking.booking_date}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        booking.booking_status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : booking.booking_status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {booking.booking_status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Time:{" "}
                    {booking.start_time && booking.end_time
                      ? `${booking.start_time} - ${booking.end_time}`
                      : "TBD"}
                  </p>
                  {booking.booking_status === "pending" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveBooking(booking.id)}
                        className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectBooking(booking.id)}
                        className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition-colors font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hall bookings</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ClubDashboard;
