// FrontEnd/src/components/ProfileCompletionWidget.jsx
import React from "react";

const ProfileCompletionWidget = ({
  profile,
  requiredFields,
  getRequiredFields,
}) => {
  if (!profile) return null;

  const allRequiredFields = getRequiredFields?.() || requiredFields;
  const user = profile.user || {};

  // Check completion status for each field
  const checkFieldCompletion = (fieldName) => {
    const value = profile[fieldName] || user[fieldName];
    return value !== null && value !== undefined && value !== "";
  };

  // Count completed fields
  const completedFields = allRequiredFields.filter(checkFieldCompletion).length;
  const completionPercentage = Math.round(
    (completedFields / allRequiredFields.length) * 100
  );

  // Get missing fields
  const missingFields = allRequiredFields.filter(
    (field) => !checkFieldCompletion(field)
  );

  // Field display names mapping
  const fieldDisplayNames = {
    phone_number: "Phone Number",
    date_of_birth: "Date of Birth",
    address: "Address",
    emergency_contact_name: "Emergency Contact Name",
    emergency_contact_phone: "Emergency Contact Phone",
    qualifications: "Qualifications",
    designation_in_club: "Club Designation",
  };

  // Get progress bar color based on completion
  const getProgressBarColor = () => {
    if (completionPercentage >= 80) return "bg-green-500";
    if (completionPercentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Get status text and color
  const getStatusInfo = () => {
    if (profile.profile_completed) {
      return { text: "Profile Complete!", color: "text-green-600", icon: "✅" };
    }
    if (completionPercentage >= 80) {
      return {
        text: "Almost Complete!",
        color: "text-yellow-600",
        icon: "⚠️",
      };
    }
    return {
      text: "Profile Incomplete",
      color: "text-red-600",
      icon: "❌",
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="text-2xl mr-3">{statusInfo.icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Profile Completion
            </h3>
            <p className={`text-sm font-medium ${statusInfo.color}`}>
              {completionPercentage}% Complete - {statusInfo.text}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {completedFields}/{allRequiredFields.length}
          </div>
          <div className="text-sm text-gray-500">Fields Completed</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Missing Fields */}
      {missingFields.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Missing Information:
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {missingFields.map((field) => (
              <li key={field} className="flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-2 flex-shrink-0"></span>
                {fieldDisplayNames[field] ||
                  field
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Achievement Notice */}
      {profile.profile_completed && profile.profile_completed_at && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-green-800">
                Profile completed successfully!
              </p>
              <p className="text-green-600 mt-1">
                Completed on{" "}
                {new Date(profile.profile_completed_at).toLocaleDateString(
                  "en-IN",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Encouragement Message */}
      {!profile.profile_completed && completionPercentage < 50 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-yellow-800">
                Complete your profile to unlock full access
              </p>
              <p className="text-yellow-700 mt-1">
                Fill in the missing information above to complete your profile
                and get the best experience.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionWidget;
