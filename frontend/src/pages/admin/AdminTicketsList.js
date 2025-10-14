import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

// Status color mapping
const STATUS_COLORS = {
  NEW: { text: "#3b82f6", border: "#3b82f655", bg: "rgba(59,130,246,.08)" },
  IN_PROGRESS: { text: "#06b6d4", border: "#06b6d455", bg: "rgba(6,182,212,.08)" },
  AWAITING_CUSTOMER_REPLY: { text: "#eab308", border: "#eab30855", bg: "rgba(234,179,8,.08)" },
  RESOLVED: { text: "#22c55e", border: "#22c55e55", bg: "rgba(34,197,94,.08)" },
  CLOSED: { text: "#9ca3af", border: "#9ca3af55", bg: "rgba(156,163,175,.08)" },
  UNDER_REVIEW: { text: "#f5c542", border: "#f5c54266", bg: "rgba(245,197,66,.12)" },
};
const normStatus = (s = "") => s.toUpperCase().replace(/\s+/g, "_");

export default function AdminTicketsList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tickets");
      setTickets(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const types = useMemo(() => {
    const s = new Set();
    tickets.forEach((t) => t.type && s.add(t.type));
    return ["All", ...Array.from(s)];
  }, [tickets]);

  const statuses = [
    "All",
    "NEW",
    "UNDER REVIEW",
    "IN PROGRESS",
    "AWAITING CUSTOMER REPLY",
    "RESOLVED",
    "CLOSED",
  ];

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      (t.ticketNo || "").toLowerCase().includes(q) ||
      (t.name || "").toLowerCase().includes(q) ||
      (t.type || "").toLowerCase().includes(q);
    const matchS = status === "All" || t.status === status;
    const matchT = type === "All" || t.type === type;
    return matchQ && matchS && matchT;
  });

  const badgeStyle = (s) => {
    const c = STATUS_COLORS[normStatus(s)] || STATUS_COLORS.NEW;
    return {
      display: "inline-block",
      padding: "6px 14px",
      borderRadius: "25px",
      fontSize: "14px",
      fontWeight: 600,
      color: c.text,
      background: c.bg,
      border: `1px solid ${c.border}`,
    };
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.headerWrap}>
        <div style={styles.headerBox}>
          <div>
            <h2 style={styles.headerTitle}>🎫 Ticket Management</h2>
            <p style={styles.headerSub}>View, filter, and manage all support tickets</p>
          </div>
          <button style={styles.refreshBtn} onClick={fetchTickets}>
            ⟳ Refresh
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div style={styles.container}>
        <div style={styles.filterBox}>
          <input
            type="text"
            placeholder="Search by Ticket No, customer, or Type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={styles.select}
          >
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={styles.select}
          >
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div style={styles.container}>
        {loading ? (
          <div style={styles.card}>
            <p style={{ color: "#666", textAlign: "center", fontSize: 16 }}>
              Loading tickets...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.card}>
            <p style={{ color: "#666", textAlign: "center", fontSize: 16 }}>
              No matching tickets found.
            </p>
          </div>
        ) : (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Ticket No</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Created</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr
                    key={t._id}
                    style={{
                      background: i % 2 === 0 ? "#ffffff" : "#f8fbff",
                      transition: "0.25s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#e8f1ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        i % 2 === 0 ? "#ffffff" : "#f8fbff")
                    }
                  >
                    <td style={styles.td}>{t.ticketNo}</td>
                    <td style={styles.td}>{t.name}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          background: "#e6f0ff",
                          color: "#003366",
                          fontWeight: 600,
                          padding: "5px 12px",
                        }}
                      >
                        {t.type || "—"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={badgeStyle(t.status)}>{t.status}</span>
                    </td>
                    <td style={styles.td}>
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <Link to={`/admin/tickets/${t._id}`} style={styles.viewBtn}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// 💅 Styles
const styles = {
  page: {
    minHeight: "100vh",
    fontFamily: "Poppins, sans-serif",
    background: "linear-gradient(to top, #e7f1ff 0%, #ffffff 90%)",
    paddingBottom: "50px",
  },
  headerWrap: {
    padding: "25px 0 10px",
  },
  headerBox: {
    background: "linear-gradient(90deg, #eaf2ff 0%, #fdfdfd 100%)",
    maxWidth: "1200px",
    margin: "0 auto",
    borderRadius: "12px",
    padding: "25px 35px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
  },
  headerTitle: {
    fontSize: "28px",
    fontWeight: "700",
    margin: 0,
    color: "#002f5c",
  },
  headerSub: {
    marginTop: 6,
    fontSize: "15px",
    color: "#4a5568",
  },
  refreshBtn: {
    background: "linear-gradient(90deg, #2563eb, #60a5fa)",
    border: "none",
    color: "#fff",
    fontWeight: 600,
    borderRadius: "10px",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: 15,
    boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
    transition: "transform 0.2s ease",
  },
  container: {
    maxWidth: "1200px",
    margin: "25px auto",
    padding: "0 25px",
  },
  filterBox: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    padding: "25px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "18px",
  },
  input: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #cfd6e2",
    fontSize: "15px",
    color: "#111",
    background: "#fff",
  },
  select: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #cfd6e2",
    fontSize: "15px",
    background: "#fff",
    color: "#111",
  },
  card: {
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
    padding: "25px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "15px",
  },
  th: {
    textAlign: "left",
    padding: "14px 12px",
    color: "#222",
    background: "#f2f6fc",
    fontWeight: 700,
    fontSize: "15px",
  },
  td: {
    padding: "14px 12px",
    color: "#333",
    verticalAlign: "middle",
    fontSize: "15px",
  },
  badge: {
    display: "inline-block",
    borderRadius: "25px",
    fontSize: "14px",
  },
  viewBtn: {
    background: "linear-gradient(to right, #3b82f6, #fbbf24)",
    color: "#fff",
    padding: "8px 18px",
    borderRadius: "10px",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 15,
    boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
  },
};
