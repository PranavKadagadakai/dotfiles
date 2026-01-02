import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, setUser } = useContext(AuthContext);

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
            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <a href="/login" className="mr-4">
              Login
            </a>
            <a href="/signup">Signup</a>
          </>
        )}
      </div>
    </nav>
  );
}
