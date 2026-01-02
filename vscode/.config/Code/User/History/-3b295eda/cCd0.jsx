// src/components/Files/FileUpload.jsx
import React, { useState, useCallback } from "react";
import { apiService } from "../../services/api";
import { useFiles } from "../../context/FilesContext";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { getErrorMessage } from "../../utils/errorMessages";
import { toast } from "react-toastify";
import axios from "axios";

export const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { loadFiles } = useFiles();

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024 * 1024) {
        toast.error("File size exceeds 5GB limit");
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);

    try {
      const response = await apiService.uploadFile(
        selectedFile.name,
        selectedFile.size,
        selectedFile.type
      );

      const { fileId, uploadUrl } = response;

      if (!uploadUrl) {
        throw new Error("Failed to get upload URL from server");
      }

      await axios.put(uploadUrl, selectedFile, {
        headers: { "Content-Type": selectedFile.type },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        },
      });

      await apiService.uploadComplete(fileId);

      toast.success("File uploaded successfully!");
      setSelectedFile(null);
      setProgress(0);
      loadFiles();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Upload File
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-10 h-10 mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Maximum file size: 5GB
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        </div>

        {selectedFile && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              {progress}%
            </p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          loading={uploading}
          className="w-full"
        >
          Upload
        </Button>
      </div>
    </Card>
  );
};
