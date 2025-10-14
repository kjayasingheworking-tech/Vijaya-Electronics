import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api/notifications";

// Fallback link for legacy notifications (no .link)
const computeLink = (n) => {
 
  if (n?.link) return n.link;

  // Try to route to invoice details instead of PO page
  if (n?.invoice) {
    return n.role === "admin"
      ? `/admin/invoices/${n.invoice}`
      : `/supplier/invoices/${n.invoice}`;
  }

  // Final fallback — still show PO page if no invoice info found
  if (n?.po) {
    return n.role === "admin"
      ? `/admin/purchase-orders/${n.po}`
      : `/supplier/orders/${n.po}`;
  }
  return null;
};

export default function NotificationsModal({ open, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchUnreadNotifications();
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load(); }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && open) onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const count = rows.length;

  const openLink = async (n) => {
    try {
      await markNotificationRead(n._id);
      setRows((prev) => prev.filter((r) => r._id !== n._id));
      const link = computeLink(n);
      if (link?.startsWith("/")) navigate(link);
      else if (link) window.location.href = link;
      onClose?.();
      document.dispatchEvent(new Event("notifications:refresh"));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to open notification");
    }
  };

  const onMarkOne = async (id) => {
    try {
      await markNotificationRead(id);
    } finally {
      setRows((prev) => prev.filter((r) => r._id !== id));
      document.dispatchEvent(new Event("notifications:refresh"));
    }
  };

  const onMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setRows([]);
      onClose?.();
      document.dispatchEvent(new Event("notifications:refresh"));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to mark all as read");
    }
  };

  return (
    <div
      style={backdrop}
      onMouseDown={(e) => !wrapRef.current?.contains(e.target) && onClose?.()}
    >
      <div ref={wrapRef} style={card} onMouseDown={(e) => e.stopPropagation()}>
        <div style={head}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Notifications</h3>
            <span style={{ color: "#64748b", fontSize: 13 }}>{count} unread</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={load} disabled={loading} style={ghostBtn}>
              {loading ? "…" : "Refresh"}
            </button>
            <button onClick={onMarkAll} disabled={count === 0} style={ghostBtn}>
              Mark all read
            </button>
            <button onClick={onClose} style={xBtn} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {count === 0 && <div style={empty}>No new notifications.</div>}

        {count > 0 && (
          <>
            <ul style={list}>
              {rows.map((n) => (
                <li key={n._id} style={item}>
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      {n.title}
                    </div>
                    {n.message && (
                      <div style={{ color: "#334155", fontSize: 14 }}>
                        {n.message}
                      </div>
                    )}
                    {n.poNumber && (
                    <div style={{ color: "#64748b", fontSize: 13 }}>
                      <b></b> {n.poNumber}
                    </div>
                  )}

                    <div style={{ color: "#64748b", fontSize: 12 }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {computeLink(n) && (
                      <button style={linkBtn} onClick={() => openLink(n)}>
                        Open
                      </button>
                    )}
                    <button onClick={() => onMarkOne(n._id)} style={markBtn}>
                      Mark read
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div
              style={{
                borderTop: "1px solid #f1f5f9",
                marginTop: 8,
                paddingTop: 8,
                textAlign: "right",
              }}
            >
              <button
                style={{
                  textDecoration: "none",
                  fontWeight: 700,
                  color: "#0ea5e9",
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                }}
                onClick={() => {
                  onClose?.();
                  navigate("/notifications");
                }}
              >
                View all
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* styles */
const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,18,24,0.36)",
  display: "grid",
  placeItems: "center",
  padding: 16,
  zIndex: 100,
};
const card = {
  width: "min(720px, 96vw)",
  maxHeight: "80vh",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 12,
  boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
  display: "grid",
  gridTemplateRows: "auto 1fr",
  gap: 10,
};
const head = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid #f1f5f9",
  paddingBottom: 8,
};
const list = { listStyle: "none", margin: 0, padding: 0, overflowY: "auto", display: "grid", gap: 8 };
const item = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 10,
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 12,
  background: "#fff",
};
const ghostBtn = { padding: "8px 12px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", fontWeight: 700, cursor: "pointer" };
const xBtn = { padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0f172a", fontWeight: 700, cursor: "pointer" };
const linkBtn = { padding: "8px 12px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#0ea5e9", fontWeight: 800, textDecoration: "none", cursor: "pointer" };
const markBtn = { padding: "8px 12px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#f8fafc", color: "#0f172a", fontWeight: 700, cursor: "pointer" };
const empty = { padding: 12, color: "#64748b" };
