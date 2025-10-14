import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminListDamageInquiries } from "../../api/inquiries";

export default function DamageInquiriesAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminListDamageInquiries();
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
const fmtPO = (po) => {
  if (!po) return "";
  if (typeof po === "string") return po.slice(-6);         // ✅ handle string id
  return po.poNumber || (po._id ? po._id.slice(-6) : "");
};

const fmtInv = (inv) => {
  if (!inv) return "";
  if (typeof inv === "string") return inv.slice(-6);       // ✅ handle string id
  return inv.invoiceNumber || (inv._id ? inv._id.slice(-6) : "");
};


  return (
    <main style={page}>
      <header style={head}>
        <h2 style={{ margin: 0 }}>Damage Inquiries</h2>
        <button onClick={load} style={ghostBtn}>{loading ? "…" : "Refresh"}</button>
      </header>

      {loading ? (
        <div style={loadingWrap}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={emptyCard}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>No inquiries yet</div>
          <div style={{ color: "#64748b" }}>When recalculations occur, they’ll appear here.</div>
        </div>
      ) : (
        <div style={tableCard}>
          <table style={tbl}>
            <thead style={thead}>
              <tr>
                <th style={th}>Inquiry #</th>
                <th style={th}>PO</th>
                <th style={th}>Original Invoice</th>
                <th style={th}>Recalculated Invoice</th>
                <th style={th}>Created</th>
                <th style={{ ...th, textAlign: "right" }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                // support APIs that return just ids OR populated docs
                const poId   = r.purchaseOrder?._id || r.purchaseOrder;
                const origId = r.originalInvoice?._id || r.originalInvoice;
                const recId  = r.recalculatedInvoice?._id || r.recalculatedInvoice;

                return (
                  <tr key={r._id} style={tr}>
                    <td style={td}>{r._id.slice(-6)}</td>

                    <td style={td}>
                      {poId ? (
                        <Link to={`/admin/purchase-orders/${poId}`} style={link}>
                          {fmtPO(r.purchaseOrder) || "PO"}
                        </Link>
                      ) : "—"}
                    </td>

                    <td style={td}>
                      {origId ? (
                        <Link to={`/admin/invoices/${origId}`} style={link}>
                          {fmtInv(r.originalInvoice) || "Invoice"}
                        </Link>
                      ) : "—"}
                    </td>

                    <td style={td}>
                      {recId ? (
                        <Link to={`/admin/invoices/${recId}`} style={link}>
                          {fmtInv(r.recalculatedInvoice) || "Recalc"}
                        </Link>
                      ) : "—"}
                    </td>

                    <td style={td}>{new Date(r.createdAt).toLocaleString()}</td>

                    <td style={{ ...td, textAlign: "right" }}>
                      <Link to={`/admin/damage-inquiries/${r._id}`} style={link}>View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

/* ---------- styles ---------- */
const page = {
  minHeight: "100vh",
  padding: "16px 12px",
  background: "linear-gradient(180deg, #f8fafc, #eef2f7)",
  color: "#0f172a",
};
const head = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  margin: "0 0 12px",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: "12px 14px",
  boxShadow: "0 2px 6px rgba(0,0,0,.05)",
};
const loadingWrap = {
  margin: "12px 0",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
};
const emptyCard = {
  margin: "12px 0",
  background: "#fff",
  border: "1px dashed #cbd5e1",
  borderRadius: 14,
  padding: 18,
  textAlign: "center",
  boxShadow: "0 1px 3px rgba(0,0,0,.04)",
};
const tableCard = {
  margin: "12px 0",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  boxShadow: "0 2px 6px rgba(0,0,0,.05)",
  overflow: "hidden",
};
const tbl = { width: "100%", borderCollapse: "separate", borderSpacing: 0 };
const thead = { background: "linear-gradient(90deg, #f1f5f9, #eef2f7)" };
const th = {
  textAlign: "left",
  fontSize: 12,
  fontWeight: 700,
  color: "#475569",
  padding: "12px 14px",
  borderBottom: "1px solid #e2e8f0",
};
const tr = { borderTop: "1px solid #e2e8f0", background: "#fff" };
const td = { padding: "12px 14px", fontSize: 14, color: "#334155", whiteSpace: "nowrap" };
const link = { color: "#0ea5e9", textDecoration: "none", fontWeight: 700 };
const ghostBtn = {
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  fontWeight: 700,
  cursor: "pointer",
};
