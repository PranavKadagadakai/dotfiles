import { useState, useEffect, useCallback } from "react";
import { eventsApi } from "../services/eventsApi";

export const useEvents = (filters = {}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    totalPages: 1,
    totalCount: 0,
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await eventsApi.getEvents({
        ...filters,
        page: pagination.page,
        page_size: pagination.pageSize,
      });

      setEvents(data.results || data.data || data);

      if (data.pagination) {
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const refetch = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, pagination, refetch, setEvents };
};
