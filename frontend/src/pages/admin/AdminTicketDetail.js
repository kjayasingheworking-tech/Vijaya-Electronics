// src/pages/admin/AdminTicketDetail.js
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useToast } from "../../components/ToastProvider";

// Localized timestamp (use "Asia/Colombo" to fix to LK time)
const fmtTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });


// Resolve relative upload paths → full URLs
const fileUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = (api?.defaults?.baseURL || "").replace(/\/api\/?$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const STATUS_STYLES = {
  NEW: { bg: "#e8f0ff", text: "#1a56db", pill: "#cfe1ff", btn: "#1a56db" },
  "UNDER REVIEW": { bg: "#fff4e5", text: "#b76e00", pill: "#ffe3b3", btn: "#b76e00" },
  "IN PROGRESS": { bg: "#eaf7ff", text: "#0b6b8e", pill: "#cfeefe", btn: "#0b6b8e" },
  "AWAITING CUSTOMER REPLY": { bg: "#fff3f0", text: "#c03a2b", pill: "#ffd6cf", btn: "#c03a2b" },
  RESOLVED: { bg: "#eaf9f0", text: "#1d7b4f", pill: "#c6f3d9", btn: "#1d7b4f" },
  CLOSED: { bg: "#f1f5f9", text: "#475569", pill: "#e2e8f0", btn: "#475569" },
};



// Status flow
const NEXT_STEPS = {
  NEW: ["UNDER REVIEW"],
  "UNDER REVIEW": ["IN PROGRESS"],
  "IN PROGRESS": ["AWAITING CUSTOMER REPLY", "RESOLVED"],
  "AWAITING CUSTOMER REPLY": ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export default function AdminTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [ticket, setTicket] = useState(null);
  const isClosed = ticket?.status === "CLOSED";

  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [lightboxList, setLightboxList] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    const onKey = (e) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImg();
      if (e.key === "ArrowLeft") prevImg();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  const openLightbox = (list, startIdx = 0) => {
    const absList = list.map(fileUrl);
    setLightboxList(absList);
    setLightboxIdx(startIdx);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };
  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };
  const nextImg = () => setLightboxIdx((i) => (i + 1) % lightboxList.length);
  const prevImg = () => setLightboxIdx((i) => (i - 1 + lightboxList.length) % lightboxList.length);

  const fetchData = async () => {
    try {
      setLoading(true);
      const t = await api.get(`/tickets/${id}`);
      setTicket(t.data);
      const m = await api.get(`/tickets/${id}/messages`);
      setMessages(m.data);
    } catch {
      toast.error("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  const onSendReply = async () => {
    if (!reply.trim()) {
      toast.error("Reply message cannot be empty");
      return;
    }
    try {
      await api.post(`/tickets/${id}/replies`, { message: reply });
      setReply("");
      toast.success("Reply sent successfully");
      fetchData();
    } catch {
      toast.error("Failed to send reply");
    }
  };

  const onUpdateStatus = async (nextStatus) => {
    if (!window.confirm(`Change status to "${nextStatus}"?`)) return;
    try {
      setUpdating(true);
      await api.patch(`/tickets/${id}/status`, { status: nextStatus });
      toast.success(`Status updated to ${nextStatus}`);
      await fetchData();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this CLOSED ticket?")) return;
    try {
      await api.delete(`/tickets/${id}`);
      toast.success("Ticket deleted successfully");
      navigate("/admin/tickets");
    } catch {
      toast.error("Failed to delete ticket");
    }
  };

  const statusStyle = useMemo(
    () => (ticket ? STATUS_STYLES[ticket.status] || STATUS_STYLES.NEW : STATUS_STYLES.NEW),
    [ticket]
  );

  if (loading) return <p style={{ padding: 24 }}>Loading...</p>;
  if (!ticket) return <p style={{ padding: 24 }}>Ticket not found.</p>;

  // Helper to download any image blob
  const handleDownload = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = url.split("/").pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={{ ...styles.header, background: "linear-gradient(90deg, #0ea5e9, #f59e0b)" }}>
        <div style={styles.headerLeft}>
          <div style={styles.ticketNoRow}>
            <span style={styles.ticketNo}>{ticket.ticketNo}</span>
            <span
              style={{
                ...styles.badge,
                backgroundColor: statusStyle.pill,
                color: statusStyle.text,
              }}
            >
              {ticket.status}
            </span>
          </div>
          <div style={styles.metaRow}>
            <span><strong>Customer:</strong> {ticket.name}</span>
            <span style={styles.dot}>•</span>
            <span><strong>Type:</strong> {ticket.type}</span>
            <span style={styles.dot}>•</span>
            <span><strong>Contact:</strong> {ticket.contact_number}</span>
          </div>
        </div>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
      </div>

      {/* Content */}
      <div style={styles.body}>
        {/* Conversation */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Conversation</div>
          <div style={styles.threadBox}>
              {messages.map((m) => {
                const isCompany = m.senderType === "company";
                return (
                  <div
                    key={m._id}
                    style={{
                      ...styles.replyBubble,
                      alignSelf: isCompany ? "flex-end" : "flex-start",
                      backgroundColor: isCompany ? "#e6f0ff" : "#f9fafb",
                      border: `1px solid ${isCompany ? "#b0c9ff" : "#d1d5db"}`,
                      borderRadius: isCompany ? "14px 14px 0 14px" : "14px 14px 14px 0",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 14, color: "#111" }}>{m.message}</p>
                    <small
                      style={{
                        color: "#6b7280",
                        fontSize: 12,
                        marginTop: 4,
                        display: "block",
                        textAlign: isCompany ? "right" : "left",
                      }}
                      title={new Date(m.createdAt).toISOString()}
                    >
                      {(m.senderType === "company" ? "Company" : "Customer")} • {fmtTime(m.createdAt)}
                    </small>

                  </div>
                );
              })}

          </div>
          {isClosed && (
              <div style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "#fef3c7", color: "#92400e", fontWeight: 600 }}>
                This ticket is closed. New replies are not allowed.
              </div>
            )}

          <div style={styles.replyRow}>
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={isClosed ? "Ticket is closed — replies are disabled" : "Write a reply…"}
              disabled={isClosed}
              style={{ ...styles.textInput, opacity: isClosed ? 0.6 : 1, cursor: isClosed ? "not-allowed" : "text" }}
            />
            <button
              onClick={() => {
                if (isClosed) { toast.error("Ticket is closed; replies are not allowed."); return; }
                onSendReply();
              }}
              disabled={isClosed}
              style={{ ...styles.primaryBtn, opacity: isClosed ? 0.6 : 1, cursor: isClosed ? "not-allowed" : "pointer" }}
            >
              Send
            </button>

          </div>
        </div>

        {/* Side panel */}
        <div style={styles.sideCard}>
          <div style={styles.sectionTitle}>Ticket Details</div>
          <div style={styles.detailBox}>
            {Object.entries(ticket.fields || {}).map(([key, val]) => (
              <div key={key} style={styles.detailRow}>
                <span style={styles.detailKey}>{key.replaceAll("_", " ")}:</span>
                {Array.isArray(val) && key.toLowerCase().includes("photo") ? (
                  <div style={styles.imageList}>
                    {val.map((src, i) => {
                      const abs = fileUrl(src);
                      return (
                        <button
                          key={i}
                          type="button"
                          style={styles.imageBtn}
                          title={`Attachment ${i + 1}`}
                          onClick={() => openLightbox(val, i)}
                        >
                          <img
                            src={abs}
                            alt={`Attachment ${i + 1}`}
                            style={styles.imageThumb}
                          />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span style={styles.detailVal}>
                    {Array.isArray(val) ? val.join(", ") : val?.toString()}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div style={styles.sectionTitle}>Status</div>
          <span
            style={{
              ...styles.badgeLg,
              backgroundColor: statusStyle.pill,
              color: statusStyle.text,
            }}
          >
            {ticket.status}
          </span>

          <div style={{ marginTop: 12, fontWeight: 600 }}>Next Step</div>
          <div style={styles.nextRow}>
            {NEXT_STEPS[ticket.status]?.length ? (
              NEXT_STEPS[ticket.status].map((ns) => (
                <button
                  key={ns}
                  disabled={updating}
                  onClick={() => onUpdateStatus(ns)}
                  style={{
                    ...styles.nextBtn,
                    borderColor: STATUS_STYLES[ns]?.btn,
                    color: STATUS_STYLES[ns]?.btn,
                  }}
                >
                  {ns}
                </button>
              ))
            ) : (
              <div style={{ color: "#64748b" }}>No further actions</div>
            )}
          </div>

          {ticket.status === "CLOSED" && (
            <>
              <div style={{ marginTop: 18, fontWeight: 600 }}>Danger Zone</div>
              <button onClick={onDelete} style={styles.dangerBtn}>Delete Ticket</button>
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          style={styles.lbOverlay}
          onClick={(e) => e.target === e.currentTarget && closeLightbox()}
        >
          <div style={styles.lbCard}>
            <img
              src={lightboxList[lightboxIdx]}
              alt={`Attachment ${lightboxIdx + 1}`}
              style={styles.lbImage}
            />
            <div style={styles.lbTopBar}>
              <span style={styles.lbCounter}>
                {lightboxIdx + 1} / {lightboxList.length}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={lightboxList[lightboxIdx]}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.lbSmallBtnBlue}
                >
                  Open
                </a>
                <button
                  onClick={() => handleDownload(lightboxList[lightboxIdx])}
                  style={styles.lbSmallBtnBlue}
                >
                  Download ⤓
                </button>
                <button onClick={closeLightbox} style={styles.lbSmallBtnGold}>
                  Close ✕
                </button>
              </div>
            </div>
            {lightboxList.length > 1 && (
              <>
                <button onClick={prevImg} style={styles.lbNavLeft}>◀</button>
                <button onClick={nextImg} style={styles.lbNavRight}>▶</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Styles ---------------- */
const styles = {
  page: { maxWidth: 1100, margin: "20px auto", padding: 12 },
  header: {
    color: "white",
    borderRadius: 14,
    padding: "18px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: 6 },
  ticketNoRow: { display: "flex", gap: 10, alignItems: "center" },
  ticketNo: { fontSize: 20, fontWeight: 800 },
  badge: { padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  badgeLg: { padding: "6px 12px", borderRadius: 999, fontSize: 13, fontWeight: 800 },
  metaRow: { display: "flex", gap: 10, fontSize: 13 },
  dot: { opacity: 0.7 },

  body: { marginTop: 16, display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 },
  card: {
    background: "white",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  },
  sideCard: {
    background: "white",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  },

  sectionTitle: { fontWeight: 700, color: "#0f172a", marginBottom: 10 },
  replyRow: { display: "flex", gap: 8, marginTop: 10 },
  textInput: {
    flex: 1,
    border: "1px solid #d0e1f9",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    background: "linear-gradient(90deg, #f8fbff, #eef6ff)",
    color: "#0f172a",
  },
  primaryBtn: {
    background: "linear-gradient(90deg, #2563eb, #0ea5e9)",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },

  nextRow: { display: "flex", gap: 8, marginTop: 6 },
  nextBtn: {
    background: "linear-gradient(to bottom, #ffffff, #f8fafc)",
    border: "2px solid #d1d5db",
    padding: "8px 10px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
    color: "#334155",
    transition: "all 0.15s ease-in-out",
  },

  backBtn: {
    background: "rgba(255,255,255,0.2)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.5)",
    padding: "8px 12px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },
  dangerBtn: {
    background: "linear-gradient(90deg, #ef4444, #f97316)",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  imageList: { display: "flex", gap: 8, flexWrap: "wrap" },
  imageBtn: {
    padding: 0,
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  imageThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    objectFit: "cover",
    border: "1px solid #d1d5db",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  },

  // lightbox
  lbOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16,
  },
  lbCard: {
    position: "relative",
    background: "linear-gradient(180deg, #0b1220, #0b1726)",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
    maxWidth: "90vw",
    maxHeight: "85vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 0 60px",
    },
    lbImage: {
    display: "block",
    maxWidth: "88vw",
    maxHeight: "75vh",
    objectFit: "contain",
    borderRadius: 8,
    boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
    },
    lbTopBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    zIndex: 10,
    },
    lbCounter: { color: "white", fontWeight: 600, opacity: 0.9 },

    lbSmallBtnBlue: {
    background: "linear-gradient(90deg, #2563eb, #0ea5e9)",
    color: "white",
    fontWeight: 700,
    padding: "8px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    boxShadow: "0 3px 8px rgba(14,165,233,0.35)",
    },
    lbSmallBtnGold: {
    background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
    color: "#0f172a",
    fontWeight: 700,
    padding: "8px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    boxShadow: "0 3px 8px rgba(251,191,36,0.35)",
    },
    lbNavLeft: {
    position: "absolute",
    top: "50%",
    left: 18,
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.25)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    padding: "12px 14px",
    cursor: "pointer",
    fontSize: 20,
    fontWeight: 800,
    zIndex: 10,
    },
    lbNavRight: {
    position: "absolute",
    top: "50%",
    right: 18,
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.25)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    padding: "12px 14px",
    cursor: "pointer",
    fontSize: 20,
    fontWeight: 800,
    zIndex: 10,
    },
    detailKey: {
    fontWeight: "600",
    color: "#495f92ff",
    marginRight: 8,
    textTransform: "capitalize",
  },

  replyBubble: {
  maxWidth: "75%",
  padding: "10px 14px",
  margin: "8px 0",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  wordBreak: "break-word",
  display: "flex",
  flexDirection: "column",
},


    };
