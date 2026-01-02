import React from "react";
import { useNavigate } from "react-router-dom";

const EventCard = ({ event, onRegister }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-200 text-gray-800",
      SCHEDULED: "bg-blue-200 text-blue-800",
      ONGOING: "bg-green-200 text-green-800",
      COMPLETED: "bg-purple-200 text-purple-800",
      CANCELLED: "bg-red-200 text-red-800",
    };
    return colors[status] || "bg-gray-200 text-gray-800";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {event.banner_image_url && (
        <img
          src={event.banner_image_url}
          alt={event.event_name}
          className="w-full h-48 object-cover rounded-md mb-4"
        />
      )}

      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-900">{event.event_name}</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
            event.event_status
          )}`}
        >
          {event.event_status}
        </span>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-2">
        {event.event_description}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-700">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {new Date(event.event_date).toLocaleDateString()} at{" "}
          {event.start_time}
        </div>

        <div className="flex items-center text-sm text-gray-700">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {event.registrations_count || 0} / {event.max_participants || "∞"}{" "}
          registered
        </div>

        <div className="flex items-center text-sm text-gray-700">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          {event.club_name}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/events/${event.id}`)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>

        {event.can_register && !event.is_registered && (
          <button
            onClick={() => onRegister(event.id)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Register
          </button>
        )}

        {event.is_registered && (
          <span className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-center">
            Registered
          </span>
        )}
      </div>
    </div>
  );
};

export default EventCard;
