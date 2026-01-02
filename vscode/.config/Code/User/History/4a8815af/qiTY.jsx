import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, setUser } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-md">
      <Link
        to="/"
        className="font-bold text-lg text-blue-600 dark:text-blue-400"
      >
        Book Review Platform
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="hidden sm:inline">Hello, {user.name}</span>
            <Link to="/" className="hover:text-blue-500">
              Home
            </Link>
            <Link to="/add-book" className="hover:text-blue-500">
              Add Book
            </Link>
            <Link to="/profile" className="hover:text-blue-500">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/" className="hover:text-blue-500">
              Home
            </Link>
            <Link to="/login" className="hover:text-blue-500">
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
            >
              Signup
            </Link>
          </>
        )}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          title="Toggle Theme"
        >
          {theme === "dark" ? <FaSun /> : <FaMoon />}
        </button>
      </div>
    </nav>
  );
}
