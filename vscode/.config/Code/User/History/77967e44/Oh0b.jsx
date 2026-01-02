import React, { useState, useEffect } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

function ProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get("/profile/");
        setProfile(res.data);
        setFormData(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    setProfilePhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });
      if (profilePhoto) {
        data.append("profile_photo", profilePhoto);
      }

      const res = await api.patch("/profile/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfile(res.data);
      setFormData(res.data);
      setEditing(false);
      setProfilePhoto(null);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );

  if (!profile)
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Failed to load profile</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Profile Photo Section */}
          <div className="flex items-center justify-between mb-8 pb-8 border-b">
            <div className="flex items-center gap-6">
              {formData.profile_photo ? (
                <img
                  src={
                    typeof formData.profile_photo === "string"
                      ? formData.profile_photo
                      : URL.createObjectURL(formData.profile_photo)
                  }
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-500">
                  <span className="text-4xl">👤</span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.full_name}
                </h2>
                <p className="text-gray-600">{user?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                  {user?.user_type?.replace("_", " ").title()}
                </span>
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Information */}
          {!editing ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-600">Full Name</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {profile.full_name || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {profile.email || "Not set"}
                  </p>
                </div>
              </div>

              {/* Student-specific fields */}
              {user?.user_type === "student" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                  <div>
                    <label className="text-sm text-gray-600">USN</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {profile.usn || "Not set"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Date of Birth
                    </label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {profile.date_of_birth
                        ? new Date(profile.date_of_birth).toLocaleDateString()
                        : "Not set"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600">Phone Number</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {profile.phone_number || "Not set"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600">Address</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {profile.address || "Not set"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600">
                      Emergency Contact
                    </label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {profile.emergency_contact || "Not set"}
                    </p>
                  </div>
                </div>
              )}

              {/* Mentor-specific fields */}
              {user?.user_type === "mentor" && (
                <div className="grid grid-cols-1 gap-6 border-t pt-6">
                  <div>
                    <label className="text-sm text-gray-600">
                      Qualifications
                    </label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {profile.qualifications || "Not set"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Bio</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {profile.bio || "Not set"}
                    </p>
                  </div>
                </div>
              )}

              {/* Profile Status */}
              <div className="border-t pt-6">
                <p className="text-sm text-gray-600">Profile Status</p>
                <div className="flex items-center gap-2 mt-2">
                  {profile.profile_completed ? (
                    <>
                      <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                      <p className="text-green-600 font-medium">Completed</p>
                    </>
                  ) : (
                    <>
                      <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full"></span>
                      <p className="text-yellow-600 font-medium">Incomplete</p>
                    </>
                  )}
                </div>
                {profile.profile_completed_at && (
                  <p className="text-sm text-gray-600 mt-2">
                    Completed on:{" "}
                    {new Date(profile.profile_completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Edit Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Profile Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="mt-2 border border-gray-300 rounded px-3 py-2 w-full"
                />
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name || ""}
                    onChange={handleChange}
                    className="mt-2 border border-gray-300 rounded px-3 py-2 w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number || ""}
                    onChange={handleChange}
                    className="mt-2 border border-gray-300 rounded px-3 py-2 w-full"
                  />
                </div>
              </div>

              {/* Student-specific fields */}
              {user?.user_type === "student" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      USN
                    </label>
                    <input
                      type="text"
                      name="usn"
                      value={formData.usn || ""}
                      onChange={handleChange}
                      className="mt-2 border border-gray-300 rounded px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth || ""}
                      onChange={handleChange}
                      className="mt-2 border border-gray-300 rounded px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address || ""}
                      onChange={handleChange}
                      className="mt-2 border border-gray-300 rounded px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Emergency Contact
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact"
                      value={formData.emergency_contact || ""}
                      onChange={handleChange}
                      className="mt-2 border border-gray-300 rounded px-3 py-2 w-full"
                    />
                  </div>
                </div>
              )}

              {/* Mentor-specific fields */}
              {user?.user_type === "mentor" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Qualifications
                    </label>
                    <textarea
                      name="qualifications"
                      value={formData.qualifications || ""}
                      onChange={handleChange}
                      className="mt-2 border border-gray-300 rounded px-3 py-2 w-full"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio || ""}
                      onChange={handleChange}
                      className="mt-2 border border-gray-300 rounded px-3 py-2 w-full"
                      rows="3"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-medium"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData(profile);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
