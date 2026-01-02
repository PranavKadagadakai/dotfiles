import apiClient from "../../../core/api/client";
import { ENDPOINTS } from "../../../core/api/endpoints";

export const eventsApi = {
  // Get all events
  getEvents: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.EVENTS.LIST, { params });
    return response.data;
  },

  // Get single event
  getEvent: async (id) => {
    const response = await apiClient.get(ENDPOINTS.EVENTS.DETAIL(id));
    return response.data;
  },

  // Create event
  createEvent: async (eventData) => {
    const response = await apiClient.post(ENDPOINTS.EVENTS.LIST, eventData);
    return response.data;
  },

  // Update event
  updateEvent: async (id, eventData) => {
    const response = await apiClient.patch(
      ENDPOINTS.EVENTS.DETAIL(id),
      eventData
    );
    return response.data;
  },

  // Delete event
  deleteEvent: async (id) => {
    const response = await apiClient.delete(ENDPOINTS.EVENTS.DETAIL(id));
    return response.data;
  },

  // Register for event
  registerForEvent: async (id) => {
    const response = await apiClient.post(ENDPOINTS.EVENTS.REGISTER(id));
    return response.data;
  },

  // Mark attendance
  markAttendance: async (id, attendanceData) => {
    const response = await apiClient.post(
      ENDPOINTS.EVENTS.ATTENDANCE(id),
      attendanceData
    );
    return response.data;
  },

  // Start event
  startEvent: async (id) => {
    const response = await apiClient.post(ENDPOINTS.EVENTS.START(id));
    return response.data;
  },

  // Complete event
  completeEvent: async (id) => {
    const response = await apiClient.post(ENDPOINTS.EVENTS.COMPLETE(id));
    return response.data;
  },
};
