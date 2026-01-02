import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormData, setUserFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    user_type: "student",
    password: "",
  });
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, usersRes, auditRes] = await Promise.all([
          api.get("/dashboard/stats/"),
          api.get("/users/"),
          api.get("/audit-logs/"),
        ]);

        setStats(statsRes.data);
        setUsers(usersRes.data.results || usersRes.data);
        setAuditLogs(auditRes.data.results || auditRes.data);
      } catch (err) {
        setError(
          err.response?.data?.detail || "Failed to load dashboard data"
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/admin/create-user/", userFormData);
      setUsers((prev) => [...prev, res.data]);
      setUserFormData({
        username: "",
        email: "",
        full_name: "",
        user_type: "student",
        password: "",
      });
      setShowUserForm(false);
      alert("User created successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "User creation failed");
    }
  };

  const handleBulkUserUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      alert("Please select a CSV file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("csv_file", csvFile);
      const res = await api.post("/admin/bulk-create-users/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(
        `${res.data.successful} users created, ${res.data.failed} failed`
      );
      setCsvFile(null);
      // Refresh user list
      const usersRes = await api.get("/users/");
      setUsers(usersRes.data.results || usersRes.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Bulk import failed");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/users/${userId}/`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert("User deleted successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "Deletion failed");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Admin Dashboard ⚙️
        </h1>
        <p className="text-gray-600 mt-2">
          System administration and user management
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.total_users || 0}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Students</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.student_count || 0}
                </p>
              </div>
              <div className="text-4xl">🎓</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Mentors</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.mentor_count || 0}
                </p>
              </div>
              <div className="text-4xl">👨‍🏫</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Club Organizers</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.club_organizer_count || 0}
                </p>
              </div>
              <div className="text-4xl">🎉</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Events</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.total_events || 0}
                </p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {["overview", "users", "audit"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              System Health
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-gray-700">Database</span>
                <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded">
                  Healthy
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-gray-700">API Server</span>
                <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded">
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-gray-700">User Authentication</span>
                <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Audit Logs
            </h2>
            {auditLogs.length > 0 ? (
              <div className="space-y-2">
                {auditLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 border border-gray-200 rounded text-sm"
                  >
                    <p className="font-semibold text-gray-900">
                      {log.action}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {log.user?.full_name} -{" "}
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUserForm(!showUserForm)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 font-medium"
              >
                + Create User
              </button>
            </div>
          </div>

          {/* Create User Form */}
          {showUserForm && (
            <form
              onSubmit={handleCreateUser}
              className="bg-gray-50 p-6 rounded mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={userFormData.username}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      username: e.target.value,
                    })
                  }
                  required
                  className="border border-gray-300 rounded px-3 py-2"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={userFormData.email}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, email: e.target.value })
                  }
                  required
                  className="border border-gray-300 rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={userFormData.full_name}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      full_name: e.target.value,
                    })
                  }
                  required
                  className="border border-gray-300 rounded px-3 py-2"
                />
                <select
                  value={userFormData.user_type}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      user_type: e.target.value,
                    })
                  }
                  className="border border-gray-300 rounded px-3 py-2"
                >
                  <option value="student">Student</option>
                  <option value="mentor">Mentor</option>
                  <option value="club_organizer">Club Organizer</option>
                </select>
                <input
                  type="password"
                  placeholder="Password"
                  value={userFormData.password}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      password: e.target.value,
                    })
                  }
                  required
                  className="border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Bulk Import Form */}
          <form
            onSubmit={handleBulkUserUpload}
            className="bg-gray-50 p-6 rounded mb-6"
          >
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bulk Import CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                />
                <p className="text-xs text-gray-600 mt-1">
                  CSV format: username,email,full_name,user_type,password
                </p>
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                Import
              </button>
            </div>
          </form>

          {/* Users Table */}
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Full Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">
                        {u.username}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {u.full_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {u.user_type?.replace("_", " ").title()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded ${
                            u.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No users found</p>
          )}
        </div>
      )}

      {activeTab === "audit" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Audit Logs</h2>
          {auditLogs.length > 0 ? (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {log.action}
                      </p>
                      <p className="text-sm text-gray-600">
                        by {log.user?.full_name}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {log.description || "No description"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No audit logs available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
