import { useState, useCallback } from "react";
import apiClient from "../api/client";

export const useApi = (initialState = {}) => {
  const [data, setData] = useState(initialState.data || null);
  const [loading, setLoading] = useState(initialState.loading || false);
  const [error, setError] = useState(initialState.error || null);

  const request = useCallback(async (config) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient(config);
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "An error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, request, setData };
};
