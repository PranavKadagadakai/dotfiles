const jwt = require("jsonwebtoken");

module.exports = {
  verifyToken: (token) => {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error("Invalid token");
    }
  },

  getUserIdFromEvent: (event) => {
    const token = event.headers.Authorization?.replace("Bearer ", "");
    if (!token) {
      throw new Error("No authorization token provided");
    }
    const decoded = jwt.decode(token);
    return decoded.sub || decoded["cognito:username"];
  },

  hasPermission: (userGroups, requiredRole) => {
    const roleHierarchy = { Admin: 3, PowerUser: 2, Viewer: 1 };
    const userRole = userGroups?.[0] || "Viewer";
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  },
};
