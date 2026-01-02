import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const MentorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [mentees, setMentees] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, menteesRes, transactionsRes] = await Promise.all([
          api.get("/dashboard/stats/"),
          api.get("/mentees/"),
          api.get("/aicte-transactions/?status=pending&mentor__id=" + user?.id),
        ]);

        setStats(statsRes.data);
        setMentees(menteesRes.data.results || menteesRes.data);
        setPendingTransactions(
          transactionsRes.data.results || transactionsRes.data
        );
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const handleApproveTransaction = async (transactionId) => {
    try {
      await api.post(`/aicte-transactions/${transactionId}/approve/`);
      alert("Transaction approved!");
      const res = await api.get(
        "/aicte-transactions/?status=pending&mentor__id=" + user?.id
      );
      setPendingTransactions(res.data.results || res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Approval failed");
    }
  };

  const handleRejectTransaction = async (transactionId, reason) => {
    const rejectionReason = prompt("Enter rejection reason:");
    if (!rejectionReason) return;

    try {
      await api.post(`/aicte-transactions/${transactionId}/reject/`, {
        rejection_reason: rejectionReason,
      });
      alert("Transaction rejected!");
      const res = await api.get(
        "/aicte-transactions/?status=pending&mentor__id=" + user?.id
      );
      setPendingTransactions(res.data.results || res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Rejection failed");
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
          Mentor Dashboard 👨‍🏫
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your mentees and validate AICTE point transactions
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Mentees</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.mentee_count || 0}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Events Guided</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.events_mentored || 0}
                </p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Points Validated</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.points_validated || 0}
                </p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Validations</p>
                <p className="text-3xl font-bold text-orange-600">
                  {pendingTransactions.length}
                </p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {["overview", "mentees", "validations"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors ${
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
          {/* Mentees */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Your Mentees
            </h2>
            {mentees.length > 0 ? (
              <div className="space-y-3">
                {mentees.map((mentee) => (
                  <div
                    key={mentee.id}
                    className="border border-gray-200 rounded p-4 hover:bg-gray-50"
                  >
                    <h3 className="font-semibold text-gray-900">
                      {mentee.full_name}
                    </h3>
                    <p className="text-sm text-gray-600">📧 {mentee.email}</p>
                    <p className="text-sm text-gray-600">📚 {mentee.usn}</p>
                    <p className="text-sm text-blue-600 mt-2">
                      Points Earned: {mentee.total_points || 0}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No mentees assigned yet</p>
            )}
          </div>

          {/* Pending Validations Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Pending Validations
            </h2>
            {pendingTransactions.length > 0 ? (
              <div className="space-y-3">
                {pendingTransactions.slice(0, 5).map((trans) => (
                  <div
                    key={trans.id}
                    className="border border-gray-200 rounded p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {trans.student?.full_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {trans.category?.name} - {trans.points_earned} pts
                        </p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        Pending
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {trans.description}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveTransaction(trans.id)}
                        className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleRejectTransaction(
                            trans.id,
                            trans.rejection_reason
                          )
                        }
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No pending validations</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "mentees" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Mentees</h2>
          {mentees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      USN
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mentees.map((mentee) => (
                    <tr key={mentee.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">
                        {mentee.full_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{mentee.usn}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {mentee.email}
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-semibold">
                        {mentee.total_points || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No mentees assigned</p>
          )}
        </div>
      )}

      {activeTab === "validations" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            All Pending Validations
          </h2>
          {pendingTransactions.length > 0 ? (
            <div className="space-y-4">
              {pendingTransactions.map((trans) => (
                <div
                  key={trans.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {trans.student?.full_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {trans.category?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {trans.points_earned}
                      </p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {trans.description}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Submitted: {new Date(trans.created_at).toLocaleString()}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveTransaction(trans.id)}
                      className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        handleRejectTransaction(
                          trans.id,
                          trans.rejection_reason
                        )
                      }
                      className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition-colors font-medium"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No pending validations</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;
