// src/pages/Dashboard.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FileUpload } from "../components/Files/FileUpload";
import { FileList } from "../components/Files/FileList";

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1>SecureFileVault Dashboard</h1>
        <div>
          <span style={{ marginRight: "15px" }}>
            {user?.attributes?.email || user?.username}
          </span>
          <button
            onClick={signOut}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <FileUpload onUploadComplete={handleUploadComplete} />
      <FileList refreshTrigger={refreshTrigger} />
    </div>
  );
};
