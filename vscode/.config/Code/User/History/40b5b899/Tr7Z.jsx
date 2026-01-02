// FrontEnd/src/components/EventAttendanceForm.jsx
import React, { useState, useEffect } from "react";
import api from "../api";

const EventAttendanceForm = ({ eventId }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]); // preview list of participants (student_id, usn, full_name)
  const [file, setFile] = useState(null);
  const [attendancePreview, setAttendancePreview] = useState([]); // parsed preview from file
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClubEvents();
  }, []);

  const fetchClubEvents = async () => {
    try {
      const res = await api.get("/events/?club=true");
      setEvents(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to fetch events", err);
    }
  };

  const loadParticipants = async (eventId) => {
    try {
      setLoading(true);
      const res = await api.get(`/events/${eventId}/participants/`);
      setParticipants(res.data.participants || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load participants");
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (e) => {
    const id = e.target.value;
    setSelectedEvent(id);
    setAttendancePreview([]);
    setFile(null);
    if (id) loadParticipants(id);
  };

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    setFile(f);
    setAttendancePreview([]);

    // Basic client-side preview parsing for CSV only (xlsx preview omitted for simplicity)
    if (!f) return;
    const name = f.name.toLowerCase();
    if (name.endsWith(".csv")) {
      const text = await f.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) return;
      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const cells = line.split(",").map((c) => c.trim());
        const obj = {};
        headers.forEach((h, i) => (obj[h] = cells[i] || ""));
        return obj;
      });
      setAttendancePreview(rows.slice(0, 200)); // limit preview
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      // For a simple preview we won't parse XLSX on client; just inform user we'll parse server-side.
      setAttendancePreview([
        {
          note: "XLSX file selected — preview will be generated server-side after upload.",
        },
      ]);
    } else {
      alert("Only CSV and XLSX files are supported");
      setFile(null);
    }
  };

  const submitAttendance = async () => {
    if (!selectedEvent) {
      alert("Select an event first");
      return;
    }
    if (!file) {
      // fallback: ask user to manually mark attendance through UI (not implemented here)
      alert("Please choose a CSV/XLSX file containing attendance.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await api.post(
        `/events/${selectedEvent}/upload-attendance/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      alert(res.data.message || "Attendance uploaded");
      // refresh participants/preview
      await loadParticipants(selectedEvent);
      setFile(null);
      setAttendancePreview([]);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to upload attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">
        Upload Attendance (CSV / XLSX)
      </h2>

      <div className="mb-4">
        <label className="block mb-2 font-medium">Select Event</label>
        <select
          value={selectedEvent || ""}
          onChange={handleEventChange}
          className="border p-2 w-full rounded"
        >
          <option value="">-- Select Event --</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} — {new Date(ev.event_date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <>
          <div className="mb-4">
            <h3 className="font-medium mb-2">Participants (preview)</h3>
            {loading ? (
              <div>Loading participants...</div>
            ) : participants.length === 0 ? (
              <div className="text-gray-600">
                No registrations found for this event.
              </div>
            ) : (
              <div className="overflow-auto max-h-56 border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-2 border">Student ID</th>
                      <th className="p-2 border">USN</th>
                      <th className="p-2 border">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => (
                      <tr key={p.student_id}>
                        <td className="p-2 border">{p.student_id}</td>
                        <td className="p-2 border">{p.usn}</td>
                        <td className="p-2 border">{p.full_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Download this list if you want to update attendance offline and
              then upload CSV/XLSX with columns `student_id, usn, attendance`
              (attendance: present/cancelled/no-show or is_present boolean).
            </p>
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Choose CSV or XLSX file
            </label>
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xlsx, .xls"
              onChange={handleFileChange}
            />
          </div>

          {attendancePreview.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Preview (first rows)</h4>
              <div className="overflow-auto max-h-44 border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {Object.keys(attendancePreview[0]).map((key) => (
                        <th key={key} className="p-1 border text-left">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attendancePreview.map((r, idx) => (
                      <tr key={idx}>
                        {Object.keys(attendancePreview[0]).map((key) => (
                          <td key={key} className="p-1 border">
                            {r[key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={submitAttendance}
              className="px-4 py-2 bg-blue-600 text-white rounded"
              disabled={loading}
            >
              Upload & Process Attendance
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EventAttendanceForm;
