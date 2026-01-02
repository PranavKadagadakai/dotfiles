// src/components/common/Spinner.jsx
import React from "react";
import clsx from "clsx";

export const Spinner = ({ size = "md", className }) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={clsx(
          "animate-spin rounded-full border-4 border-gray-300 border-t-blue-600",
          "dark:border-gray-600 dark:border-t-blue-400",
          sizes[size],
          className
        )}
      />
    </div>
  );
};
