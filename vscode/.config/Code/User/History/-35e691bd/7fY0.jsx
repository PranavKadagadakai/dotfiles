// src/components/Files/FileList.jsx
import React, { useState, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { apiService } from "../../services/api";

export const FileList = ({ refreshTrigger }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger]);

  const loadFiles = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await getCurrentUser();
      const userId = user.userId;
      const response = await apiService.listFiles(userId);
      setFiles(response.data.files || []);
    } catch (err) {
      console.error("Error loading files:", err);
      setError("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const { downloadUrl } = await apiService.downloadFile(fileId);
      window.open(downloadUrl, "_blank");
    } catch (err) {
      alert("Download failed: " + err.message);
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await apiService.deleteFile(fileId);
      alert("File deleted successfully");
      loadFiles();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  if (loading) return <div>Loading files...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Your Files ({files.length})</h3>
      {files.length === 0 ? (
        <p>No files uploaded yet</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ccc" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Size</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Type</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Uploaded</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.fileId} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px" }}>{file.fileName}</td>
                <td style={{ padding: "10px" }}>
                  {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                </td>
                <td style={{ padding: "10px" }}>{file.fileType}</td>
                <td style={{ padding: "10px" }}>
                  {new Date(file.uploadedAt).toLocaleString()}
                </td>
                <td style={{ padding: "10px" }}>
                  <button
                    onClick={() => handleDownload(file.fileId, file.fileName)}
                    style={{ marginRight: "10px", cursor: "pointer" }}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(file.fileId)}
                    style={{ cursor: "pointer", color: "red" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
