import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api/notifications";

// Fallback link for legacy notifications that don't have .link saved.
// role here is the *audience*: 'admin' (go to admin UI) or 'supplier' (supplier UI).
const computeLink = (n) => {
  if (n?.link) return n.link;
  // legacy fallbacks here if you ever store ticketId:
  if (n.role === "customer" && n.ticketId) return `/customer/tickets/${n.ticketId}`;
  if (n?.po) return n.role === "admin" ? `/admin/purchase-orders/${n.po}` : `/supplier/orders/${n.po}`;
  return null;
};

export default function NotificationsBell({ pollMs = 20000, onOpenModal }) {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (document.hidden) return;
    setLoading(true);
    try {
      const data = await fetchUnreadNotifications();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    timerRef.current = setInterval(() => {
      if (!document.hidden) load();
    }, pollMs);
    return () => clearInterval(timerRef.current);
  }, [load, pollMs]);

  useEffect(() => {
    const handler = () => load();
    document.addEventListener("notifications:refresh", handler);
    return () => document.removeEventListener("notifications:refresh", handler);
  }, [load]);

  useEffect(() => {
    const onVis = () => !document.hidden && load();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpenDropdown(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const count = rows.length;

  const onBellClick = () => {
    if (typeof onOpenModal === "function") return onOpenModal();
    setOpenDropdown((v) => {
      const next = !v;
      if (next && rows.length === 0) load();
      return next;
    });
  };

  const openLink = async (n) => {
    try {
      await markNotificationRead(n._id);
      setRows((prev) => prev.filter((r) => r._id !== n._id));
      const link = computeLink(n);
      if (link?.startsWith("/")) navigate(link);
      else if (link) window.location.href = link;
      document.dispatchEvent(new Event("notifications:refresh"));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to open notification");
    }
  };

  const onMarkOne = async (id) => {
    try {
      await markNotificationRead(id);
      setRows((prev) => prev.filter((r) => r._id !== id));
      document.dispatchEvent(new Event("notifications:refresh"));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to mark as read");
    }
  };

  const onMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setRows([]);
      setOpenDropdown(false);
      document.dispatchEvent(new Event("notifications:refresh"));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to mark all as read");
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button onClick={onBellClick} aria-label="Notifications" title="Notifications" style={bellBtn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        {count > 0 && <span style={badge}>{count > 99 ? "99+" : count}</span>}
      </button>

      {!onOpenModal && openDropdown && (
        <div style={dropdown}>
          <div style={ddHead}>
            <div style={{ fontWeight: 700 }}>Notifications</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={load} disabled={loading} style={ghostBtn}>{loading ? "…" : "Refresh"}</button>
              <button onClick={onMarkAll} disabled={count === 0} style={ghostBtn}>Mark all read</button>
            </div>
          </div>

          {count === 0 && <div style={empty}>No new notifications.</div>}

          {count > 0 && (
            <ul style={list}>
              {rows.map((n) => (
                <li key={n._id} style={item}>
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{n.title || "Notification"}</div>
                    {n.message && <div style={{ fontSize: 13, color: "#334155" }}>{n.message}</div>}
                    <div style={{ fontSize: 12, color: "#64748b" }}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {computeLink(n) && (
                      <button style={linkBtn} onClick={() => openLink(n)}>Open</button>
                    )}
                    <button onClick={() => onMarkOne(n._id)} style={markBtn}>Mark read</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* styles */
const bellBtn = {
  position: "relative",
  display: "grid",
  placeItems: "center",
  width: 36,
  height: 36,
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#0f172a",
  cursor: "pointer",
};
const badge = {
  position: "absolute",
  top: -4,
  right: -4,
  minWidth: 18,
  height: 18,
  padding: "0 4px",
  background: "#ef4444",
  color: "#fff",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 800,
  display: "grid",
  placeItems: "center",
  border: "1px solid #fff",
};
const dropdown = {
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  width: 360,
  maxWidth: "min(92vw, 360px)",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  padding: 10,
  zIndex: 60,
};
const ddHead = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "2px 4px 8px 4px",
  borderBottom: "1px solid #f1f5f9",
};
const empty = { padding: 10, color: "#64748b", fontSize: 14 };
const list = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  maxHeight: 300,
  overflowY: "auto",
  display: "grid",
  gap: 8,
  marginTop: 8,
};
const item = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  justifyContent: "space-between",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: 10,
  background: "#ffffff",
};
const ghostBtn = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 600,
  cursor: "pointer",
};
const linkBtn = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0ea5e9",
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
};
const markBtn = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer",
};
