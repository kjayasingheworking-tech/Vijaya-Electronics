// src/pages/supplier/InvoicesList.js
import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listMyInvoices } from "../../api/supplier";

const money = (n) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(n || 0));

export default function InvoicesList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();

  // URL query params
  const invoiceNumber = params.get("invoiceNumber") || "";
  const status = params.get("status") || "";
  const type = params.get("type") || "";

  const load = async () => {
    setLoading(true);
    try {
      const data = await listMyInvoices({
        invoiceNumber: invoiceNumber || undefined, //  search by invoice number
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

  // Optional client-side pass
  const visibleRows = useMemo(() => {
    return (rows || []).filter((r) => {
      const okType = !type || r.type === type;
      const okStatus = !status || r.status === status;
      const okInv =
        !invoiceNumber ||
        (r.invoiceNumber || "").toLowerCase().includes(invoiceNumber.toLowerCase());
      return okType && okStatus && okInv;
    });
  }, [rows, type, status, invoiceNumber]);

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

      /* 🔹 Hover animation for ALL rows */
      tbody tr:hover {
        background-color: #e2f0ff !important; /* soft blue hover */
        transform: scale(1.01);
        transition: background-color 0.25s ease, transform 0.2s ease;
      }
      `}</style>

      <div style={card}>
        <header style={header}>
          <div>
            <h2 style={title}>My Invoices</h2>
            <div style={subtitle}>All your Invoices</div>
          </div>
          <button onClick={load} style={btn}>{loading ? "…" : "Refresh"}</button>
        </header>

        <section style={filters}>
          {/* 🔎 Search by Invoice Number */}
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
            style={input}
          />

          {/* Status filter */}
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
            style={input}
          >
            <option value="">All statuses</option>
            <option value="issued">issued</option>
            <option value="cancelled">cancelled</option>
            <option value="closed">closed</option>
          </select>

          {/* Type filter */}
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
            style={input}
          >
            <option value="">All types</option>
            <option value="original">original</option>
            <option value="recalculated">recalculated</option>
          </select>
        </section>

        {loading ? (
          <div style={muted}>Loading…</div>
        ) : visibleRows.length === 0 ? (
          <div style={empty}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>No invoices match your filters</div>
            <div style={muted}>Try clearing filters or click Refresh.</div>
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
                {visibleRows.map((r, i) => (
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
                      <Link to={`/supplier/orders/${r.purchaseOrder?._id || r.purchaseOrder}`} style={link}>Open PO</Link>

                    </td>

                    <td style={td}>{new Date(r.createdAt).toLocaleString()}</td>

                    <td style={td}>
                      <Link to={`/supplier/invoices/${r._id}?po=${r.purchaseOrder}`} style={link}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

/* ================= Styles (visual-only) ================ */
const page = { minHeight: "100vh", background: "#f8fafc", padding: 24 };
const card = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  boxShadow: "0 8px 24px rgba(2, 6, 23, 0.05)",
  overflow: "hidden",
};
const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 16px",
  background: "linear-gradient(90deg, rgba(59,130,246,0.06) 0%, rgba(14,165,233,0.06) 100%)",
  borderBottom: "1px solid #e2e8f0",
};
const title = { margin: 0, letterSpacing: 0.2, fontSize: 20 };
const subtitle = { color: "#64748b" };
const btn = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  fontWeight: 700,
  cursor: "pointer",
  transition: "transform 120ms ease, box-shadow 120ms ease",
};
const filters = {
  display: "flex",
  gap: 8,
  padding: 16,
  flexWrap: "nowrap",        // 🔹 keep all on one line
  alignItems: "center",      // 🔹 vertically center everything
  justifyContent: "flex-start", // optional: align to left
  overflowX: "auto",         // 🔹 prevent layout break on smaller screens
};

const input = {
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#fff",
  outline: "none",
  minWidth: 220,
  transition: "box-shadow 120ms ease, border-color 120ms ease",
};
const tableWrap = { borderTop: "1px solid #e2e8f0", overflow: "auto" };
const tbl = { width: "100%", borderCollapse: "separate", borderSpacing: 0 };
const thead = {
  position: "sticky",
  top: 0,
  background: "rgba(255,255,255,0.9)",
  backdropFilter: "saturate(180%) blur(6px)",
  boxShadow: "inset 0 -1px 0 #e2e8f0",
  zIndex: 1,
};
const th = {
  textAlign: "left",
  fontSize: 12,
  color: "#64748b",
  padding: "12px 12px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.6,
};
const tr = {
  borderTop: "1px solid #eef2f7",
  transition: "background-color 0.25s ease, transform 0.2s ease",
  cursor: "pointer",
};

const rowAlt = { backgroundColor: "#fcfdff" };
const td = { padding: "12px", fontSize: 14, color: "#0f172a", whiteSpace: "nowrap" };
const totalCell = {
  textAlign: "right",
  fontWeight: 800,
  fontVariantNumeric: "tabular-nums",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};
const link = {
  color: "#0284c7",
  textDecoration: "none",
  fontWeight: 700,
  borderBottom: "1px solid transparent",
  paddingBottom: 2,
};
const muted = { color: "#64748b" };
const empty = { padding: 24, textAlign: "center" };
const badge = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.2,
};
const chip = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
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
