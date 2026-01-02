import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [registeredEvents, setRegisteredEvents] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, eventsRes, certificatesRes] = await Promise.all([
          api.get("/dashboard/stats/"),
          api.get("/events/?status=scheduled"),
          api.get("/certificates/?student__id=" + user?.id),
        ]);

        setStats(statsRes.data);
        setEvents(eventsRes.data.results || eventsRes.data);
        setCertificates(certificatesRes.data.results || certificatesRes.data);

        // Fetch registered events
        const regRes = await api.get("/events/registered/");
        setRegisteredEvents(regRes.data.results || regRes.data);
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

  const handleRegisterEvent = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/register/`);
      alert("Registered for event successfully!");
      // Refresh registered events
      const res = await api.get("/events/registered/");
      setRegisteredEvents(res.data.results || res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Registration failed");
    }
  };

  const handleUnregisterEvent = async (eventId) => {
    try {
      await api.delete(`/events/${eventId}/unregister/`);
      alert("Unregistered from event");
      const res = await api.get("/events/registered/");
      setRegisteredEvents(res.data.results || res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Unregistration failed");
    }
  };

  const downloadCertificate = (certificateId) => {
    window.location.href = `/api/certificates/${certificateId}/download/`;
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
          Welcome, {user?.full_name || user?.username}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Track your AICTE points, attend events, and earn certificates
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
                <p className="text-gray-600 text-sm">Total Points</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.total_points || 0}
                </p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Events Attended</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.events_attended || 0}
                </p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Certificates Earned</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.certificates_count || 0}
                </p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Mentor Assigned</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.mentor_name ? "✓" : "✗"}
                </p>
              </div>
              <div className="text-4xl">👨‍🏫</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {["overview", "events", "certificates"].map((tab) => (
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
          {/* Registered Events */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Registered Events
            </h2>
            {registeredEvents.length > 0 ? (
              <div className="space-y-3">
                {registeredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded p-3 hover:bg-gray-50"
                  >
                    <h3 className="font-semibold text-gray-900">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      📅 {new Date(event.start_time).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      📍 {event.location || "TBD"}
                    </p>
                    <button
                      onClick={() => handleUnregisterEvent(event.id)}
                      className="mt-2 text-red-500 text-sm hover:text-red-700"
                    >
                      Unregister
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No registered events</p>
            )}
          </div>

          {/* Recent Certificates */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Certificates
            </h2>
            {certificates.length > 0 ? (
              <div className="space-y-3">
                {certificates.slice(0, 5).map((cert) => (
                  <div
                    key={cert.id}
                    className="border border-gray-200 rounded p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {cert.event?.title || "Certificate"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(cert.issued_date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadCertificate(cert.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No certificates yet</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "events" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Available Events
          </h2>
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((event) => {
                const isRegistered = registeredEvents.some(
                  (e) => e.id === event.id
                );
                return (
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
                    <button
                      onClick={() =>
                        isRegistered
                          ? handleUnregisterEvent(event.id)
                          : handleRegisterEvent(event.id)
                      }
                      className={`w-full py-2 rounded font-medium transition-colors ${
                        isRegistered
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {isRegistered ? "Unregister" : "Register"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No events available</p>
          )}
        </div>
      )}

      {activeTab === "certificates" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            All Certificates
          </h2>
          {certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {cert.event?.title || "Certificate"}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Issued: {new Date(cert.issued_date).toLocaleDateString()}
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => downloadCertificate(cert.id)}
                      className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                      Download PDF
                    </button>
                    {cert.verification_hash && (
                      <p className="text-xs text-gray-500 break-all">
                        Hash: {cert.verification_hash.substring(0, 16)}...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No certificates earned yet</p>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
