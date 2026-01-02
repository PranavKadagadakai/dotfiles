// FrontEnd/src/components/NotificationPreferences.jsx
import React, { useState, useEffect } from "react";
import api from "../api";

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    email_event_registrations: true,
    email_event_reminders: true,
    email_event_cancellations: true,
    email_certificate_generation: true,
    email_aicte_points: true,
    email_hall_bookings: true,
    in_app_enabled: true,
    in_app_event_notifications: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notification-preferences/");
      setPreferences(response.data);
    } catch (err) {
      console.error("Failed to fetch notification preferences:", err);
      // If not found, keep defaults
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChange = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.put(
        "/notifications/preferences/",
        preferences
      );
      setPreferences(response.data);
      setSuccess("Notification preferences saved successfully!");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Failed to save notification preferences:", err);
      setError("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    const defaultPreferences = {
      email_enabled: true,
      email_event_registrations: true,
      email_event_reminders: true,
      email_event_cancellations: true,
      email_certificate_generation: true,
      email_aicte_points: true,
      email_hall_bookings: true,
      in_app_enabled: true,
      in_app_event_notifications: true,
    };

    setPreferences(defaultPreferences);

    try {
      await api.put("/notifications/preferences/", defaultPreferences);
      setSuccess("Preferences reset to defaults!");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Failed to reset preferences:", err);
      setError("Failed to reset preferences. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="mb-8 pb-8 border-b">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Notification Preferences
          </h2>
          <p className="text-gray-600 mt-1">
            Choose how you want to receive notifications about events,
            certificates, and more
          </p>
        </div>
        <button
          onClick={handleResetDefaults}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Global Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {/* Email Notifications */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-600">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.email_enabled}
                onChange={() => handleToggleChange("email_enabled")}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Individual Email Preferences */}
          <div className="space-y-3 ml-11">
            <div className="flex items-center justify-between p-2 bg-white rounded">
              <span className="text-sm text-gray-700">Event Registrations</span>
              <input
                type="checkbox"
                className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer ${
                  !preferences.email_enabled
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                checked={
                  preferences.email_enabled &&
                  preferences.email_event_registrations
                }
                onChange={() => handleToggleChange("email_event_registrations")}
                disabled={!preferences.email_enabled}
              />
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded">
              <span className="text-sm text-gray-700">Event Reminders</span>
              <input
                type="checkbox"
                className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer ${
                  !preferences.email_enabled
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                checked={
                  preferences.email_enabled && preferences.email_event_reminders
                }
                onChange={() => handleToggleChange("email_event_reminders")}
                disabled={!preferences.email_enabled}
              />
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded">
              <span className="text-sm text-gray-700">Event Cancellations</span>
              <input
                type="checkbox"
                className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer ${
                  !preferences.email_enabled
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                checked={
                  preferences.email_enabled &&
                  preferences.email_event_cancellations
                }
                onChange={() => handleToggleChange("email_event_cancellations")}
                disabled={!preferences.email_enabled}
              />
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded">
              <span className="text-sm text-gray-700">
                Certificate Generation
              </span>
              <input
                type="checkbox"
                className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer ${
                  !preferences.email_enabled
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                checked={
                  preferences.email_enabled &&
                  preferences.email_certificate_generation
                }
                onChange={() =>
                  handleToggleChange("email_certificate_generation")
                }
                disabled={!preferences.email_enabled}
              />
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded">
              <span className="text-sm text-gray-700">
                AICTE Points Updates
              </span>
              <input
                type="checkbox"
                className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer ${
                  !preferences.email_enabled
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                checked={
                  preferences.email_enabled && preferences.email_aicte_points
                }
                onChange={() => handleToggleChange("email_aicte_points")}
                disabled={!preferences.email_enabled}
              />
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded">
              <span className="text-sm text-gray-700">
                Hall Booking Updates
              </span>
              <input
                type="checkbox"
                className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer ${
                  !preferences.email_enabled
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                checked={
                  preferences.email_enabled && preferences.email_hall_bookings
                }
                onChange={() => handleToggleChange("email_hall_bookings")}
                disabled={!preferences.email_enabled}
              />
            </div>
          </div>
        </div>

        {/* In-App Notifications */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  In-App Notifications
                </h3>
                <p className="text-sm text-gray-600">
                  Receive notifications within the app
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.in_app_enabled}
                onChange={() => handleToggleChange("in_app_enabled")}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Individual In-App Preferences */}
          <div className="space-y-3 ml-11">
            <div className="flex items-center justify-between p-2 bg-white rounded">
              <span className="text-sm text-gray-700">Event Notifications</span>
              <input
                type="checkbox"
                className={`w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded cursor-pointer ${
                  !preferences.in_app_enabled
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                checked={
                  preferences.in_app_enabled &&
                  preferences.in_app_event_notifications
                }
                onChange={() =>
                  handleToggleChange("in_app_event_notifications")
                }
                disabled={!preferences.in_app_enabled}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-start">
        <button
          onClick={handleSavePreferences}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </div>
          ) : (
            "Save Preferences"
          )}
        </button>
      </div>

      {/* Info Note */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 text-sm text-blue-700">
            <p>
              Changes take effect immediately. You can modify your preferences
              at any time. Some critical notifications (like security alerts)
              may still be sent regardless of your preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
