import React, { useEffect, useState } from "react";
import api from "../api";

const MentorDashboard = () => {
  const [mentees, setMentees] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const menteesResponse = await api.get("/students/mentees");
      const transactionsResponse = await api.get(
        "/aicte-transactions?status=PENDING"
      );
      setMentees(menteesResponse.data);
      setPendingTransactions(transactionsResponse.data);
    };

    fetchData();
  }, []);

  const handleApproval = async (transactionId, status) => {
    try {
      await api.post(`/aicte-transactions/${transactionId}/${status}`);
      alert(`Transaction ${status.toLowerCase()} successfully!`);
      setPendingTransactions((prev) =>
        prev.filter((transaction) => transaction.id !== transactionId)
      );
    } catch (error) {
      console.error("Approval failed:", error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Mentor Dashboard</h1>
      <p>Welcome, Mentor!</p>

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <div className="md:col-span-1">
          <h2 className="text-2xl font-semibold mb-4">Your Mentees</h2>
          {mentees.length > 0 ? (
            <ul className="space-y-2">
              {mentees.map((mentee) => (
                <li key={mentee.id} className="p-3 bg-white rounded shadow">
                  {mentee.name} ({mentee.usn})
                </li>
              ))}
            </ul>
          ) : (
            <p>You have no assigned mentees.</p>
          )}
        </div>

        <div className="md:col-span-1">
          <h2 className="text-2xl font-semibold mb-4">
            Pending AICTE Transactions
          </h2>
          {pendingTransactions.length > 0 ? (
            <ul className="space-y-3">
              {pendingTransactions.map((transaction) => (
                <li
                  key={transaction.id}
                  className="flex justify-between items-center p-3 bg-white rounded shadow"
                >
                  <span>
                    {transaction.student.name} -{" "}
                    {transaction.points_allocated} points
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleApproval(transaction.id, "approve")
                      }
                      className="text-sm px-3 py-1 bg-green-500 text-white rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(transaction.id, "reject")}
                      className="text-sm px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No pending transactions.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
