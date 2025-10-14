// src/pages/notifications/AllNotifications.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchUnreadNotifications,
  fetchAllNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api/notifications";

// Fallback link for legacy notifications without .link.
// role is the audience: 'admin' (open admin UI) | 'supplier' (open supplier UI).
const computeLink = (n) => {
  if (n?.link) return n.link;
  if (!n?.po) return null;
  return n.role === "admin"
    ? `/admin/purchase-orders/${n.po}`
    : `/supplier/orders/${n.po}`;
};

export default function AllNotifications() {
  const [tab, setTab] = useState("all"); // 'all' | 'unread'
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = async (which = tab) => {
    setLoading(true);
    try {
      const data =
        which === "unread"
          ? await fetchUnreadNotifications()
          : await fetchAllNotifications();
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const openNote = async (n) => {
    const link = computeLink(n);
    if (!link) return;
    await markNotificationRead(n._id);
    document.dispatchEvent(new Event("notifications:refresh"));
    if (link.startsWith("/")) navigate(link);
    else window.location.href = link;
  };

  const onMarkOne = async (id) => {
    await markNotificationRead(id);
    document.dispatchEvent(new Event("notifications:refresh"));
    load(tab);
  };

  const onMarkAll = async () => {
    await markAllNotificationsRead();
    document.dispatchEvent(new Event("notifications:refresh"));
    load(tab);
  };

  return (
    <main style={{ minHeight: "100vh", background: "#fff", padding: 16 }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ margin: 0 }}>Notifications</h2>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setTab("all")}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid",
                borderColor: tab === "all" ? "#0284c7" : "#cbd5e1",
                background: tab === "all" ? "#0ea5e9" : "#fff",
                color: tab === "all" ? "#fff" : "#0f172a",
                fontWeight: 700,
              }}
            >
              All
            </button>
            <button
              onClick={() => setTab("unread")}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid",
                borderColor: tab === "unread" ? "#0284c7" : "#cbd5e1",
                background: tab === "unread" ? "#0ea5e9" : "#fff",
                color: tab === "unread" ? "#fff" : "#0f172a",
                fontWeight: 700,
              }}
            >
              Unread
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => load(tab)} style={btn}>
            {loading ? "…" : "Refresh"}
          </button>
          <button onClick={onMarkAll} style={btn}>
            Mark all read
          </button>
        </div>
      </header>

      <div style={{ display: "grid", gap: 8 }}>
        {!loading && rows.length === 0 && (
          <div style={{ color: "#64748b" }}>
            {tab === "unread" ? "No unread notifications." : "No notifications yet."}
          </div>
        )}

        {rows.map((n) => (
          <article
            key={n._id}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{n.title}</div>
                  {n.message && (
                    <div style={{ color: "#334155", marginTop: 4 }}>
                      {n.message}
                      {n.poNumber && (
                        <div style={{ color: "#64748b", fontSize: 13 }}>
                          <b>PO:</b> {n.poNumber}
                        </div>
                      )}
                    </div>
                  )}

                <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                  {new Date(n.createdAt).toLocaleString()}
                  {n.read && (
                    <span style={{ marginLeft: 8, color: "#94a3b8" }}>(read)</span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {computeLink(n) && (
                  <button onClick={() => openNote(n)} style={btn}>
                    Open
                  </button>
                )}
                {!n.read && (
                  <button onClick={() => onMarkOne(n._id)} style={btn}>
                    Mark read
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

const btn = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#fff",
  fontWeight: 700,
  textDecoration: "none",
  color: "#0f172a",
  cursor: "pointer",
};
