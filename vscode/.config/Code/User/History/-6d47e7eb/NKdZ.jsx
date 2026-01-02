// src/components/common/SkeletonLoader.jsx
import React from "react";

export const SkeletonLoader = ({ rows = 3 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"
        />
      ))}
    </div>
  );
};
