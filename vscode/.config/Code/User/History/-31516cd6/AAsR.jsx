import React, { useEffect, useState } from "react";
import api from "../api";
import HallBookingForm from "../components/HallBookingForm";
import EventManagement from "../components/EventManagement";

// Club Coordinator Signature Upload Component
const ClubSignaturePanel = () => {
  const [signatureStatus, setSignatureStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSignatureStatus();
  }, []);

  const fetchSignatureStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get("/profile/club-organizer/");
      // Check if signature exists in the user data
      const hasSignature = response.data.user && response.data.user.signature;
      setSignatureStatus({
        has_signature: !!hasSignature,
        signature_url: response.data.user?.signature || null,
        name: response.data.user?.first_name + " " + response.data.user?.last_name || "Club Coordinator"
      });
    } catch (err) {
      setError("Failed to load signature status");
      console.error("Error loading signature:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("signature", file);

      const response = await api.patch("/profile/club-organizer/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update status after successful upload
      const updatedHasSignature = response.data.user && response.data.user.signature;
      setSignatureStatus({
        has_signature: !!updatedHasSignature,
        signature_url: response.data.user?.signature || null,
        name: response.data.user?.first_name + " " + response.data.user?.last_name || "Club Coordinator"
      });
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.signature?.[0] || "Failed to upload signature");
      console.error("Error uploading signature:", err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading signature status...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Club Coordinator Signature
      </h3>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="text-md font-semibold text-gray-800">
            {signatureStatus?.name}
          </h4>
          <p className="text-sm text-gray-600">
            Your signature will be used on certificates generated for your club's events
          </p>
        </div>

        <div className="flex items-center gap-4">
          {signatureStatus?.has_signature ? (
            <div className="text-green-600 flex items-center gap-2">
              <span className="text-sm">✓ Signature Available</span>
              {signatureStatus.signature_url && (
                <img
                  src={signatureStatus.signature_url}
                  alt="Coordinator Signature"
                  className="h-12 w-auto border border-gray-300 rounded"
                />
              )}
            </div>
          ) : (
            <span className="text-red-600 text-sm">
              ⚠ No signature uploaded
            </span>
          )}

          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            {uploading
              ? "Uploading..."
              : signatureStatus?.has_signature
              ? "Update Signature"
              : "Upload Signature"}
          </label>
        </div>
      </div>
    </div>
  );
};

const ClubDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("events"); // 'events', 'bookings', or 'organization'

  const fetchData = async () => {
    try {
      const [bookingsResponse, eventsResponse] = await Promise.all([
        api.get("/hall-bookings/?club=true"),
        api.get("/events/?club=true"),
      ]);
      setBookings(bookingsResponse.data);
      setEvents(eventsResponse.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchData();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Check if hall booking is handled automatically through events
  const hasAutomaticHallBookings = events.some(
    (event) => event.assigned_hall || event.primary_hall || event.secondary_hall
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">
          Club Organizer Dashboard
        </h1>
        <p className="text-gray-600 mb-6">
          Manage your club events and hall bookings
        </p>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-300">
          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-3 font-medium transition ${
              activeTab === "events"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📅 Events Management
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-4 py-3 font-medium transition ${
              activeTab === "bookings"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🏛️ Hall Bookings
          </button>
          <button
            onClick={() => setActiveTab("organization")}
            className={`px-4 py-3 font-medium transition ${
              activeTab === "organization"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            ⚙️ Organization Settings
          </button>
        </div>

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <EventManagement
              onEventCreated={(event) => {
                if (event && event.id) {
                  fetchData();
                }
              }}
              onEventUpdated={(event) => {
                fetchData();
              }}
            />
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div
            className={`grid gap-6 ${
              hasAutomaticHallBookings
                ? "grid-cols-1 max-w-4xl mx-auto"
                : "grid-cols-1 lg:grid-cols-2"
            }`}
          >
            {/* Hall Bookings List */}
            <div
              className={`bg-white p-6 rounded-lg shadow-lg ${
                hasAutomaticHallBookings ? "col-span-full" : ""
              }`}
            >
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                {hasAutomaticHallBookings
                  ? "Hall Booking Status"
                  : "Your Hall Bookings"}
              </h2>

              {hasAutomaticHallBookings && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📝 Hall bookings are managed automatically when scheduling
                    events. Use the Events Management tab to assign halls during
                    event creation.
                  </p>
                </div>
              )}

              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading bookings...
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {hasAutomaticHallBookings
                    ? "No hall bookings yet. Assign halls when scheduling events."
                    : "No bookings yet. Create your first booking!"}
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {booking.hall?.name}
                          </h3>
                          {booking.event && (
                            <p className="text-sm text-gray-600">
                              Event: {booking.event.name}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            booking.booking_status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : booking.booking_status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : booking.booking_status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {booking.booking_status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        📍 {booking.hall?.location}
                      </p>
                      <p className="text-sm text-gray-600">
                        📅 {new Date(booking.booking_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        🕐 {booking.start_time} - {booking.end_time}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Capacity: {booking.hall?.capacity} seats
                      </p>
                      {booking.booking_status === "REJECTED" &&
                        booking.rejection_reason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            Reason: {booking.rejection_reason}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Hall Booking Form - Only show if no automatic bookings */}
            {!hasAutomaticHallBookings && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                  Create Hall Booking
                </h2>
                <HallBookingForm
                  onBookingCreated={(newBooking) => {
                    setBookings((prev) => [...prev, newBooking]);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Organization Settings Tab */}
        {activeTab === "organization" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                Organization Settings
              </h2>

              {/* Club Coordinator Signature Upload */}
              <ClubSignaturePanel />

              {/* Club Information Display */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  Club Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Role:</span>{" "}
                    <span className="text-gray-600">Club Organizer</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Total Events:</span>{" "}
                    <span className="text-gray-600">{events.length}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Hall Bookings:</span>{" "}
                    <span className="text-gray-600">{bookings.length}</span>
                  </div>
                </div>
