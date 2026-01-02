import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa6";

export default function Navbar() {
  const { user, setUser } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <nav className="flex justify-between items-center p-4 bg-blue-600 text-white">
      <a href="/" className="font-bold text-lg">
        Book Review Platform
      </a>
      <div>
        {user ? (
          <>
            <span className="mr-4">Hello, {user.name}</span>
            <a href="/" className="mr-4">
              Home
            </a>
            <a href="/add-book" className="mr-4">
              Add Book
            </a>
            <a href="/profile" className="mr-4">
              Profile
            </a>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <a href="/" className="mr-4">
              Home
            </a>
            <a href="/login" className="mr-4">
              Login
            </a>
            <a href="/signup">Signup</a>
          </>
        )}
        <button
          onClick={toggleTheme}
          className="p-1 ml-4 rounded-lg bg-gray-200 dark:bg-gray-700"
          title="Toggle Theme"
        >
          {theme === "dark" ? <FaSun /> : <FaMoon />}
        </button>
      </div>
    </nav>
  );
}
