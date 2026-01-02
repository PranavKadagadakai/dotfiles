// src/components/Files/FileList.jsx
import React, { useEffect } from "react";
import { useFiles } from "../../context/FilesContext"; // Import the context hook
import { Card } from "../common/Card";
import { toast } from "react-toastify";
// Removed: getCurrentUser, apiService, useState, useCallback, refreshTrigger prop

export const FileList = () => {
  // Use state and functions from the centralized context
  const { files, loading, loadFiles, deleteFile } = useFiles();

  useEffect(() => {
    // Load files on initial mount
    loadFiles();
  }, [loadFiles]);

  const handleDownload = async (fileId, fileName) => {
    try {
      const { downloadUrl } = await apiService.downloadFile(fileId);
      window.open(downloadUrl, "_blank");
    } catch (err) {
      toast.error("Download failed: " + err.message);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await deleteFile(fileId); // Use the deleteFile function from context
      // Note: deleteFile in FilesContext already updates the state and shows a toast
    } catch (err) {
      // toast.error is handled inside deleteFile in context
    }
  };

  if (loading)
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Loading files...
        </div>
      </Card>
    );
  // NOTE: Assuming the context handles setting a global error state or the calling component (Dashboard) handles the full error view.
  // For simplicity here, we'll assume if loading is false and files is empty, it's either an empty state or a silent load error.

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Your Files ({files.length})
      </h3>
      {files.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No files uploaded yet
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Size
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Uploaded
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {files.map((file) => (
                <tr
                  key={file.fileId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {file.fileName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {/* Assuming no formatFileSize util is available, keeping the MB calculation for now */}
                    {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {file.fileType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(file.uploadedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDownload(file.fileId, file.fileName)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 mr-4 transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(file.fileId)}
                      className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
