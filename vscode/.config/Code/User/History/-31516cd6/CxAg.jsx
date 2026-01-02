import React, { useEffect, useState } from "react";
import api from "../api";

const ClubDashboard = () => {
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const eventsResponse = await api.get("/events?club=true");
      const bookingsResponse = await api.get("/hall-bookings?club=true");
      setEvents(eventsResponse.data);
      setBookings(bookingsResponse.data);
    };

    fetchData();
  }, []);

  const handleEventStatus = async (eventId, status) => {
    try {
      await api.patch(`/events/${eventId}`, { status });
      alert(`Event marked as ${status}!`);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, status } : event
        )
      );
    } catch (error) {
      console.error("Failed to update event status:", error);
    }
  };

  return (
    <div>
      <h1>Welcome to the Club Organizer Dashboard</h1>
      <h2>Your Events</h2>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            {event.name} - {event.status}
            {event.status === "draft" && (
              <button onClick={() => handleEventStatus(event.id, "scheduled")}>
                Schedule
              </button>
            )}
          </li>
        ))}
      </ul>
      <h2>Your Hall Bookings</h2>
      <ul>
        {bookings.map((booking) => (
          <li key={booking.id}>
            {booking.hall.name} - {booking.booking_date}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClubDashboard;
