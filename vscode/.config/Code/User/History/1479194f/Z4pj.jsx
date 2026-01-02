import React, { useEffect, useState } from "react";
import axios from "../api";
import EventCard from "../components/EventCard";

const StudentDashboard = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios
      .get("/events/")
      .then((response) => {
        setEvents(response.data);
      })
      .catch((err) => {
        console.error("Failed to fetch events:", err);
      });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Upcoming Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.length > 0 ? (
          events.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <p>No events available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
