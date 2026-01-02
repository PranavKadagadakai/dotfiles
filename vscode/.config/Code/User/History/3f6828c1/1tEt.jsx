// src/pages/Dashboard.jsx
import React, { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { FileUpload } from "../components/Files/FileUpload";
import { FileList } from "../components/Files/FileList";

export const Dashboard = () => {
  const { user, signOut } = useAuth();

  const memoizedSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold">SecureFileVault Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">
              {user?.signInDetails?.loginId || user?.username}
            </span>
            <button
              onClick={memoizedSignOut}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-900 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Content - Using a grid for layout consistency */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <FileUpload />
          </div>
          <div className="lg:col-span-2">
            <FileList />
          </div>
        </div>
      </div>
    </div>
  );
};
