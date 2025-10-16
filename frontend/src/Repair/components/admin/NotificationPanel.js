import React, { useEffect, useState } from "react";
import { Bell, Trash2, Check } from "lucide-react";

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch all notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:5000/notifications");
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to fetch notifications");

      setNotifications(data);
    } catch (err) {
      console.error(err);
      setError("⚠️ Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ✅ Mark as read
  const markAsRead = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/notifications/${id}/read`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert("Error updating notification.");
    }
  };

  // ✅ Delete notification
  const deleteNotification = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      const res = await fetch(`http://localhost:5000/notifications/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete notification");
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert("Error deleting notification.");
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold text-[#0057B8] mb-6 flex items-center gap-2">
        <Bell size={24} className="text-[#FFA500]" />
        Notifications
      </h2>

      {loading && <p className="text-gray-500 animate-pulse">Loading notifications...</p>}
      {error && (
        <p className="text-red-600 font-medium bg-red-50 border-l-4 border-red-500 p-3 rounded">
          {error}
        </p>
      )}

      {!loading && !error && notifications.length === 0 && (
        <p className="text-gray-500 italic">No notifications yet.</p>
      )}

      {!loading && !error && notifications.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {notifications.map((note) => (
            <li
              key={note._id}
              className={`flex justify-between items-center p-4 rounded-lg transition ${
                note.isRead ? "bg-gray-50" : "bg-[#FFF8E1]"
              }`}
            >
              <div>
                <p className="font-semibold text-[#0057B8]">{note.message}</p>
                <p className="text-sm text-gray-600">
                  {note.customerName ? `${note.customerName} • ` : ""}
                  {note.jobNo ? `Job #${note.jobNo}` : ""}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                {!note.isRead && (
                  <button
                    onClick={() => markAsRead(note._id)}
                    className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
                    title="Mark as Read"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(note._id)}
                  className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationPanel;
