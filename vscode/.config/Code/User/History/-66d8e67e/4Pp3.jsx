// src/context/FilesContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { apiService } from "../services/api";
import { toast } from "react-toastify";

const FilesContext = createContext(null);

export const FilesProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      const userId = user.userId;
      const response = await apiService.listFiles(userId);
      setFiles(response.items || []);
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("Failed to load files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFile = useCallback(async (fileId) => {
    try {
      await apiService.deleteFile(fileId);
      setFiles((prev) => prev.filter((file) => file.fileId !== fileId));
      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
      throw error;
    }
  }, []);

  const addFile = useCallback((file) => {
    setFiles((prev) => [file, ...prev]);
  }, []);

  return (
    <FilesContext.Provider
      value={{ files, loading, loadFiles, deleteFile, addFile }}
    >
      {children}
    </FilesContext.Provider>
  );
};

export const useFiles = () => {
  const context = useContext(FilesContext);
  if (!context) {
    throw new Error("useFiles must be used within FilesProvider");
  }
  return context;
};
