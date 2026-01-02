import React, { useState } from "react";
import { useEvents } from "../hooks/useEvents";
import EventCard from "../components/EventCard";
import { eventsApi } from "../services/eventsApi";

const EventsListPage = () => {
  const [filters, setFilters] = useState({});
  const { events, loading, error, refetch } = useEvents(filters);

  const handleRegister = async (eventId) => {
    try {
      await eventsApi.registerForEvent(eventId);
      alert("Successfully registered for event!");
      refetch();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to register for event");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Events</h1>

        <div className="flex gap-4">
          <select
            onChange={(e) =>
              setFilters({ ...filters, event_status: e.target.value })
            }
            className="px-4 py-2 border rounded-md"
          >
            <option value="">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            onChange={(e) =>
              setFilters({ ...filters, event_type: e.target.value })
            }
            className="px-4 py-2 border rounded-md"
          >
            <option value="">All Types</option>
            <option value="TECHNICAL">Technical</option>
            <option value="CULTURAL">Cultural</option>
            <option value="SPORTS">Sports</option>
          </select>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No events found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onRegister={handleRegister}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsListPage;
