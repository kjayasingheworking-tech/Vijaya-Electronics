import React, { useEffect, useState } from "react";
import { Bell, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Topbar = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // ✅ Fetch notification count from backend
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("http://localhost:5000/notifications");
      const data = await res.json();

      if (res.ok) {
        const unread = data.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white shadow-md h-16 flex items-center justify-between px-6 border-b border-gray-200">
      {/* Left Side: Title */}
      <h1 className="text-xl font-bold text-[#0057B8]">
        🧾 Repair Management Dashboard
      </h1>

      {/* Right Side: Icons */}
      <div className="flex items-center gap-6">
        {/* Notification Icon */}
        <button
         onClick={() => navigate("/admin/notifications")}
          className="relative"
          title="View Notifications"
        >
          <Bell size={22} className="text-[#0057B8]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#FFA500] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Info */}
        <div className="flex items-center gap-2">
          <User size={22} className="text-[#0057B8]" />
          <span className="text-sm text-gray-700 font-semibold">Admin</span>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
