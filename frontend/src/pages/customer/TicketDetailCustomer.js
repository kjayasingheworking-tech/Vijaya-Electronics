// src/pages/customer/TicketDetailCustomer.js
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { fetchUnreadNotifications, markNotificationRead } from "../../api/notifications";

// Resolve "/uploads/xxx.png" -> "http://<backend-origin>/uploads/xxx.png"
const fileUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;         // already absolute
  const base = (api?.defaults?.baseURL || "").replace(/\/api\/?$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

// Format time safely (works in all browsers)
const fmtTime = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });


/* ---------------- Consistent status colors ---------------- */
const STATUS_STYLE = {

  NEW: { text: "#3b82f6", border: "#3b82f655", bg: "rgba(59,130,246,.08)" },
  IN_PROGRESS: { text: "#06b6d4", border: "#06b6d455", bg: "rgba(6,182,212,.08)" },
  AWAITING_CUSTOMER_REPLY: { text: "#eab308", border: "#eab30855", bg: "rgba(234,179,8,.08)" },
  RESOLVED: { text: "#22c55e", border: "#22c55e55", bg: "rgba(34,197,94,.08)" },
  CLOSED: { text: "#9ca3af", border: "#9ca3af55", bg: "rgba(156,163,175,.08)" },
  UNDER_REVIEW: { text: "#f5c542", border: "#f5c54266", bg: "rgba(245,197,66,.12)" },
};
const normalizeStatusKey = (s = "") =>
  s.toString().trim().toUpperCase().replace(/[\s-]+/g, "_");
const getStatusStyle = (status) =>
  STATUS_STYLE[normalizeStatusKey(status)] || {
    text: "#9aa8b6",
    border: "#9aa8b655",
    bg: "rgba(154,168,182,.08)",
  };

/* ---------------- Tiny Toast Component ---------------- */
function Toast({ show, type = "success", message, onClose }) {
  if (!show) return null;

  const isSuccess = type === "success";
  const bg = isSuccess
    ? "linear-gradient(135deg, #0f5132, #198754)"
    : "linear-gradient(135deg, #842029, #dc3545)";
  const border = isSuccess ? "#2ecc71" : "#ff6b6b";
  const color = "#fff";
  const shadow = isSuccess
    ? "0 8px 20px rgba(46, 204, 113, 0.4)"
    : "0 8px 20px rgba(255, 107, 107, 0.4)";

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        background: bg,
        border: `1px solid ${border}`,
        color,
        padding: "14px 18px",
        borderRadius: 14,
        boxShadow: shadow,
        fontFamily:
          "Poppins, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontWeight: 600,
        fontSize: "0.95rem",
        transform: "translateY(0)",
        transition: "transform 0.3s ease, opacity 0.3s ease",
        opacity: show ? 1 : 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <span
        style={{
          display: "inline-block",
          fontWeight: 700,
          marginRight: 6,
        }}
      >
        {isSuccess ? " Reply Sent:" : "Error:"}
      </span>
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          marginLeft: 8,
          background: "transparent",
          border: "none",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
        }}
        aria-label="Close toast"
        title="Close"
      >
        ×
      </button>
    </div>
  );
}


/* ---------------- Component ---------------- */
export default function TicketDetailCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  // Check if ticket is closed
  const isClosed = ticket?.status === "CLOSED";
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  // toast state
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });
  const showToast = (type, message, timeout = 2500) => {
    setToast({ show: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast((t) => ({ ...t, show: false })), timeout);
  };

  useEffect(() => {
    api.get(`/tickets/${id}`).then((res) => setTicket(res.data));
    api.get(`/tickets/${id}/messages`).then((res) => setMessages(res.data));
  }, [id]);

  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    try {
      setSending(true);
      await api.post(`/tickets/${id}/replies`, { message: reply });
      setReply("");
      const res = await api.get(`/tickets/${id}/messages`);
      setMessages(res.data);
      showToast("success", "Reply sent");
    } catch (e) {
      showToast("error", "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const niceLabel = (k) =>
    String(k)
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());

  const fieldEntries = useMemo(() => {
    if (!ticket?.fields || typeof ticket.fields !== "object") return [];
    return Object.entries(ticket.fields);
  }, [ticket]);

  if (!ticket)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(to bottom right, #0b1221, #111a2e)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "18px",
          fontFamily: "Poppins, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        Loading...
      </div>
    );

  const st = getStatusStyle(ticket.status);

  return (
    <>
      {/* Toast */}
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />

      {/* Page */}
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(to bottom right, #0b1221, #111a2e)",
          color: "#fff",
          padding: "40px 20px",
          fontFamily: "Poppins, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "16px",
            boxShadow: "0 0 25px rgba(0,0,0,0.4)",
            padding: "30px",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "linear-gradient(to right, #007bff, #00d4ff)",
              border: "none",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              marginBottom: "24px",
              transition: "0.3s",
            }}
            onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
          >
            ← Back
          </button>

          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "10px",
              alignItems: "start",
              marginBottom: "16px",
            }}
          >
            <h2
              style={{
                fontSize: "1.9rem",
                fontWeight: "700",
                margin: 0,
                background: "linear-gradient(to right, #4facfe, #00f2fe)",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              {ticket.ticketNo}
            </h2>

            <span
              style={{
                alignSelf: "center",
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "0.85rem",
                fontWeight: 700,
                background: st.bg,
                border: `1px solid ${st.border}`,
                color: st.text,
                textTransform: "capitalize",
                justifySelf: "end",
              }}
            >
              {niceLabel(ticket.status)}
            </span>
          </div>

          {/* Meta */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: 12,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ opacity: 0.8, fontSize: 12 }}>Type</div>
              <div style={{ fontWeight: 600 }}>{ticket.type}</div>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: 12,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ opacity: 0.8, fontSize: 12 }}>Created</div>
              <div style={{ fontWeight: 600 }}>
                {new Date(ticket.createdAt).toLocaleString()}
              </div>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: 12,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ opacity: 0.8, fontSize: 12 }}>Customer Name</div>
              <div style={{ fontWeight: 600 }}>{ticket.name}</div>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: 12,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ opacity: 0.8, fontSize: 12 }}>Contact Number</div>
              <div style={{ fontWeight: 600 }}>{ticket.contact_number}</div>
            </div>
          </div>

          <hr style={{ borderColor: "rgba(255,255,255,0.2)", margin: "18px 0 22px" }} />

          {/* Inquiry Details */}
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 12 }}>
            Inquiry Details
          </h3>

          {fieldEntries.length === 0 ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px dashed rgba(255,255,255,0.15)",
                marginBottom: 20,
                opacity: 0.85,
              }}
            >
              No additional fields provided.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {fieldEntries.map(([k, v]) => {
                const isImagesArray =
                  Array.isArray(v) &&
                  v.length > 0 &&
                  v.every(
                    (x) =>
                      typeof x === "string" &&
                      /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(x)
                  );

                return (
                  <div
                    key={k}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 12,
                      padding: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      transition: "transform .2s ease, box-shadow .2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ opacity: 0.75, fontSize: 12, marginBottom: 6 }}>
                      {niceLabel(k)}
                    </div>

                    {isImagesArray ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {v.map((src, idx) => (
                          <a
                            key={idx}
                             href={fileUrl(src)} 
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-block",
                              borderRadius: 8,
                              overflow: "hidden",
                              border: "1px solid rgba(255,255,255,0.12)",
                            }}
                            title="Open image"
                          >
                            <img
                              src={fileUrl(src)}
                              alt={`attachment-${idx + 1}`}
                              style={{
                                width: 84,
                                height: 84,
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          </a>
                        ))}
                      </div>
                    ) : Array.isArray(v) ? (
                      <div style={{ fontWeight: 600 }}>{v.join(", ")}</div>
                    ) : typeof v === "object" && v !== null ? (
                      <pre
                        style={{
                          margin: 0,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          fontSize: 12,
                          lineHeight: 1.4,
                          opacity: 0.95,
                        }}
                      >
{JSON.stringify(v, null, 2)}
                      </pre>
                    ) : (
                      <div style={{ fontWeight: 600 }}>{String(v)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <hr style={{ borderColor: "rgba(255,255,255,0.2)", margin: "6px 0 18px" }} />

          {/* Conversation */}
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 12 }}>
            Conversation
          </h3>

          <div style={{ maxHeight: 350, overflowY: "auto", paddingRight: 5 }}>
            {messages.map((m) => (
              <div
                key={m._id}
                style={{
                  marginBottom: 12,
                  padding: "12px 15px",
                  borderRadius: 10,
                  background:
                    m.senderType === "customer"
                      ? "linear-gradient(to right, #002bff22, #007bff33)"
                      : "rgba(255,255,255,0.07)",
                  borderLeft:
                    m.senderType === "customer"
                      ? "4px solid #00c6ff"
                      : "4px solid #ffaa00",
                  transition: "0.3s",
                }}
              >
                <p style={{ fontSize: "0.95rem", marginBottom: 4 }}>{m.message}</p>
                <small
                  style={{ color: "#aaa", fontSize: "0.8rem" }}
                  title={new Date(m.createdAt).toISOString()}
                >
                  {m.senderType === "customer" ? "You" : "Support Team"} • {fmtTime(m.createdAt)}
                </small>

              </div>
            ))}
          </div>

          {/* Reply box */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 20,
              alignItems: "center",
            }}
          >
            {isClosed && (
              <div
                style={{
                  background: "rgba(255, 193, 7, 0.15)",
                  border: "1px solid rgba(255,193,7,0.35)",
                  padding: "10px 14px",
                  borderRadius: 8,
                  marginTop: 10,
                  marginBottom: 6,
                  textAlign: "center",
                  fontWeight: 600,
                  color: "#ffcc00",
                }}
              >
                This ticket is closed. New replies are not allowed.
              </div>
            )}


            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply..."
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                border: "none",
                outline: "none",
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: "0.95rem",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendReply();
              }}
            />
            <button
              onClick={sendReply}
              disabled={sending}
              style={{
                background: "linear-gradient(to right, #007bff, #00d4ff)",
                border: "none",
                color: "#fff",
                padding: "12px 22px",
                borderRadius: 8,
                cursor: sending ? "not-allowed" : "pointer",
                opacity: sending ? 0.7 : 1,
                fontWeight: 600,
                transition: "0.3s",
              }}
              onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
              onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
