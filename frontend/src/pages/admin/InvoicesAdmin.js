// src/pages/admin/InvoicesAdmin.js
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminListInvoices } from "../../api/invoices";

const money = (n) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(n || 0));

export default function InvoicesAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();

  const invoiceNumber = params.get("invoiceNumber") || "";
  const status = params.get("status") || "";
  const type = params.get("type") || "";

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminListInvoices({
        invoiceNumber: invoiceNumber || undefined, // ✅ search by invoice number
        status: status || undefined,
        type: type || undefined,
      });
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceNumber, status, type]);

  return (
    <main style={page}>
      {/* Placeholder styling fix */}
      <style>{`
 .inv-search::placeholder {
    color: #64748b;
    opacity: 1;
  }
  .inv-search {
    color: #0f172a;
    caret-color: #0f172a;
  }

  /* 🔹 Animated hover for ALL invoice rows (even + odd) */
  tbody tr:hover {
    background-color: #e2f0ff !important; /* soft blue highlight */
    transform: scale(1.01);
    transition: background-color 0.25s ease, transform 0.2s ease;
    cursor: pointer;
  }
      `}</style>

      <header style={pageHead}>
        <div>
          <h2 style={title}>Invoices</h2>
          <div style={subtitle}>Company-wide invoice list</div>
        </div>
        <button onClick={load} style={btn}>{loading ? "…" : "Refresh"}</button>
      </header>

      {/* Filters (one-line, responsive) */}
      <section
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",          // wraps on small screens
          marginBottom: 12,
        }}
      >
        {/* Search */}
        <input
          className="inv-search"
          placeholder="Search by Invoice Number (e.g., INV-00012)"
          value={invoiceNumber}
          onChange={(e) =>
            setParams((p) => {
              const v = e.target.value;
              if (v) p.set("invoiceNumber", v);
              else p.delete("invoiceNumber");
              return p;
            })
          }
          style={{
            ...input,
            flex: "2 1 360px",       // wider
            width: "auto",
          }}
        />

        {/* Status */}
        <select
          value={status}
          onChange={(e) =>
            setParams((p) => {
              const v = e.target.value;
              if (v) p.set("status", v);
              else p.delete("status");
              return p;
            })
          }
          style={{
            ...input,
            flex: "1 1 220px",
            width: "auto",
          }}
        >
          {["", "issued", "cancelled", "closed"].map((s) => (
            <option key={s} value={s}>{s || "All statuses"}</option>
          ))}
        </select>

        {/* Type */}
        <select
          value={type}
          onChange={(e) =>
            setParams((p) => {
              const v = e.target.value;
              if (v) p.set("type", v);
              else p.delete("type");
              return p;
            })
          }
          style={{
            ...input,
            flex: "1 1 220px",
            width: "auto",
          }}
        >
          {["", "original", "recalculated"].map((s) => (
            <option key={s} value={s}>{s || "All types"}</option>
          ))}
        </select>
      </section>


      {loading ? (
        <div style={muted}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={empty}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>No invoices found</div>
          <div style={muted}>Try changing filters or search terms.</div>
        </div>
      ) : (
        <div style={tableWrap}>
          <table style={tbl}>
            <thead style={thead}>
              <tr>
                <th style={th}>Inv #</th>
                <th style={th}>Type</th>
                <th style={th}>Status</th>
                <th style={{ ...th, textAlign: "right", width: 160 }}>Total</th>
                <th style={th}>PO</th>
                <th style={th}>Created</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r._id} style={{ ...tr, ...(i % 2 ? rowAlt : null) }}>
                  <td style={td}>{r.invoiceNumber || r._id.slice(-6)}</td>
                  <td style={td}>
                    <span style={{ ...chip, ...typeChip[r.type] }}>{r.type}</span>
                  </td>
                  <td style={td}>
                    <span style={{ ...badge, ...statusBadge[r.status] }}>{r.status}</span>
                  </td>
                  <td style={{ ...td, ...totalCell }}>{money(r?.totals?.grandTotal)}</td>
                  <td style={td}>
                    <Link to={`/admin/purchase-orders/${r.purchaseOrder}`} style={link}>
                      Open PO
                    </Link>
                  </td>
                  <td style={td}>{new Date(r.createdAt).toLocaleString()}</td>
                  <td style={td}>
                    <Link to={`/admin/invoices/${r._id}`} style={link}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

/* ===================== Styles (visual only) ===================== */
const page = { minHeight: "100vh", background: "#f8fafc", padding: 16 };
const pageHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 16,
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background:
    "linear-gradient(90deg, rgba(59,130,246,0.06) 0%, rgba(14,165,233,0.06) 100%)",
  boxShadow: "0 8px 24px rgba(2, 6, 23, 0.05)",
  marginBottom: 12,
};
const title = { margin: 0, fontSize: 22, letterSpacing: 0.2 };
const subtitle = { color: "#64748b" };
const btn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};
const filters = { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 };
const input = {
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#fff",
  minWidth: 200,
};
const tableWrap = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  overflow: "hidden",
  background: "#fff",
  boxShadow: "0 8px 24px rgba(2, 6, 23, 0.05)",
};
const tbl = { width: "100%", borderCollapse: "separate", borderSpacing: 0 };
const thead = {
  position: "sticky",
  top: 0,
  background: "rgba(255,255,255,0.95)",
  backdropFilter: "saturate(180%) blur(6px)",
  boxShadow: "inset 0 -1px 0 #e2e8f0",
  zIndex: 1,
};
const th = {
  textAlign: "left",
  fontSize: 12,
  color: "#64748b",
  padding: "12px",
  textTransform: "uppercase",
  letterSpacing: 0.6,
};
const tr = {
  borderTop: "1px solid #eef2f7",
  transition: "background-color 0.25s ease, transform 0.2s ease",
};

const rowAlt = { backgroundColor: "#fcfdff" }; // keep lighter base only

const td = { padding: "12px", fontSize: 14, color: "#0f172a", whiteSpace: "nowrap" };
const totalCell = {
  textAlign: "right",
  fontWeight: 800,
  fontVariantNumeric: "tabular-nums",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};
const link = { color: "#0284c7", textDecoration: "none", fontWeight: 700 };
const badge = {
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  border: "1px solid transparent",
};
const chip = {
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 800,
  border: "1px solid transparent",
};
const statusBadge = {
  issued: { background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" },
  cancelled: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" },
  closed: { background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" },
};
const typeChip = {
  original: { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" },
  recalculated: { background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" },
};
const muted = { color: "#64748b" };
const empty = { padding: 24, textAlign: "center" };
