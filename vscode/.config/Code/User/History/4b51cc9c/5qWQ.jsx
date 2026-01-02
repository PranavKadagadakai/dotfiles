import React from 'react';

const EventCard = ({ event }) => {
  return (
    <div className="border rounded p-4 shadow-md">
      <h3 className="text-xl font-bold">{event.name}</h3>
      <p className="text-gray-600">{event.description}</p>
      <p className="text-gray-800">Date: {event.event_date}</p>
      <p className="text-gray-800">Time: {event.start_time} - {event.end_time}</p>
    </div>
  );
};

export default EventCard;