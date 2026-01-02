// src/components/Files/FileUpload.jsx
import React, { useState } from "react";
import { apiService } from "../../services/api";
import axios from "axios";

export const FileUpload = ({ onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024 * 1024) {
        setError("File size exceeds 5GB limit");
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");
    setProgress(0);

    try {
      // Step 1: Request presigned URL
      const response = await apiService.uploadFile(
        selectedFile.name,
        selectedFile.size,
        selectedFile.type
      );

      console.log("API response:", response);

      // Check for common nesting patterns (like 'data' or 'body')
      // The structure you need is { fileId, uploadUrl, message }
      const { fileId, uploadUrl } = response.data || response;
      console.log("Received upload URL:", uploadUrl);
      console.log("File ID:", fileId);

      if (!uploadUrl) {
        // This condition might be met, and it proceeds with a bad URL
        console.error("Upload URL is missing from the API response.");
        return;
      }

      // Step 2: Upload file directly to S3
      await axios.put(uploadUrl, selectedFile, {
        headers: { "Content-Type": selectedFile.type },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        },
      });

      // Step 3: Notify backend upload is complete
      await apiService.uploadComplete(fileId);

      setSelectedFile(null);
      setProgress(0);
      alert("File uploaded successfully!");
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "5px" }}
    >
      <h3>Upload File</h3>
      <input
        type="file"
        onChange={handleFileSelect}
        disabled={uploading}
        style={{ marginBottom: "10px" }}
      />
      {selectedFile && (
        <p>
          Selected: {selectedFile.name} (
          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      )}
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
      )}
      {uploading && (
        <div style={{ marginBottom: "10px" }}>
          <div
            style={{
              width: "100%",
              backgroundColor: "#f0f0f0",
              borderRadius: "5px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                backgroundColor: "#4CAF50",
                height: "20px",
                transition: "width 0.3s",
              }}
            />
          </div>
          <p>{progress}%</p>
        </div>
      )}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        style={{ padding: "10px 20px", cursor: "pointer" }}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
};
