// src/utils/errorMessages.js
export const getErrorMessage = (error) => {
  // Axios errors
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.error || error.response.data?.message;

    if (status === 404) return "Resource not found";
    if (status === 403)
      return "You do not have permission to perform this action";
    if (status === 401) return "Your session has expired. Please sign in again";
    if (status === 413) return "File is too large";
    if (status === 500) return "Server error. Please try again later";
    if (message) return message;
  }

  // Network errors
  if (error.code === "ERR_NETWORK") {
    return "Network error. Please check your connection";
  }

  // Amplify errors
  if (error.name === "NotAuthorizedException") {
    return "Invalid email or password";
  }
  if (error.name === "UserNotFoundException") {
    return "User not found";
  }
  if (error.name === "UsernameExistsException") {
    return "An account with this email already exists";
  }
  if (error.name === "CodeMismatchException") {
    return "Invalid verification code";
  }

  // Default
  return error.message || "An unexpected error occurred";
};
