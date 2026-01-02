import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      if (!user) return;
      try {
        const response = await api.get("/notifications/");
        const notifications = Array.isArray(response.data) ? response.data : [];
        const unreadCount = notifications.filter((n) => !n.is_read).length;
        setUnreadNotifications(unreadCount);
      } catch (error) {
        console.error("Failed to fetch notifications count:", error);
      }
    };

    fetchUnreadNotifications();
  }, [user]);

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        {user ? (
          <Link to="/dashboard" className="text-lg font-bold">
            CertifyTrack
          </Link>
        ) : (
          <Link to="/" className="text-lg font-bold">
            CertifyTrack
          </Link>
        )}
        <div className="space-x-4">
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/profile">Profile</Link>
              <button onClick={logout} className="bg-red-500 px-4 py-2 rounded">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Signup</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
