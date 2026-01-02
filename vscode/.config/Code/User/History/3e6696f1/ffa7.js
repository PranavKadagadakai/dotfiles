// src/utils/env.js
const requiredEnvVars = [
  "VITE_AWS_REGION",
  "VITE_AWS_USER_POOL_ID",
  "VITE_AWS_USER_POOL_CLIENT_ID",
  "VITE_AWS_IDENTITY_POOL_ID",
  "VITE_AWS_API_URL",
  "VITE_AWS_FILES_BUCKET_NAME",
];

export const validateEnv = () => {
  const missing = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        "Please check your .env file and ensure all variables are set."
    );
  }
};

export const getEnv = (key) => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
};
