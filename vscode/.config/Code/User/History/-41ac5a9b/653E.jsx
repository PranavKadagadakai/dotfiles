// src/components/common/Card.jsx
import React from "react";
import clsx from "clsx";

export const Card = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(
        "bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
