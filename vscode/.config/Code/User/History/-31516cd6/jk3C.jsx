import React, { useState, useEffect } from "react";
import api from "../api";

const ClubDashboard = () => {
  const [organizer, setOrganizer] = useState(null);
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Signature upload states
  const [signature, setSignature] = useState(null);
  const [signatureLoading, setSignatureLoading] = useState(false);

  useEffect(() => {
    fetchOrganizerDetails();
  }, []);

  const fetchOrganizerDetails = async () => {
    try {
      setLoading(true);

      // Get organizer profile
      const [organizerRes, profileRes] = await Promise.all([
        api.get("/profile/"),
        api.get("/profile/club-organizer/"),
      ]);

      setOrganizer(organizerRes.data);
      setClub(profileRes.data.club);

      setLoading(false);
    } catch (err) {
      setError("Failed to load organizer details");
      setLoading(false);
    }
  };

  const handleSignatureUpload = async () => {
    if (!signature) return;

    setSignatureLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("signature", signature);

      // Assuming signature upload endpoint exists - you might need to adjust this
      await api.post("/organizer/upload_signature/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Signature uploaded successfully!");
      setSignature(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload signature");
    } finally {
      setSignatureLoading(false);
    }
  };

  if (loading)
    return <div className="text-center py-10">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Club Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage {club?.name || "your club"} activities and settings
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Signature Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-bold mb-4">Club Signature Management</h3>
          <p className="text-gray-600 mb-4">
            Upload your signature for certificate signing. This signature will
            be used on certificates generated for club events.
          </p>

          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSignature(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={handleSignatureUpload}
              disabled={!signature || signatureLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {signatureLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              📝 Upload Signature
            </button>
          </div>
          {signature && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {signature.name}
            </p>
          )}
        </div>

        {/* Club Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Club Information</h3>
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {club?.name || "Not assigned"}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {club?.description || "Not available"}
              </p>
              <p>
                <strong>Status:</strong>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs ${
                    club?.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {club?.is_active ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Your Role</h3>
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {organizer?.user?.first_name || ""}{" "}
                {organizer?.user?.last_name || ""}
              </p>
              <p>
                <strong>Role:</strong> Club Organizer
              </p>
              <p>
                <strong>Joined:</strong>{" "}
                {organizer?.created_at
                  ? new Date(organizer.created_at).toLocaleDateString()
                  : "Not available"}
              </p>
              <p>
                <strong>Profile Status:</strong>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs ${
                    organizer?.profile_completed
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {organizer?.profile_completed ? "Complete" : "Incomplete"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => (window.location.href = "/events")}
            >
              📅 Manage Events
            </button>
            <button
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              onClick={() => (window.location.href = "/hall-bookings")}
            >
              🏛 Book Halls
            </button>
            <button
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              onClick={() => (window.location.href = "/certificates")}
            >
              🎓 View Certificates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubDashboard;
