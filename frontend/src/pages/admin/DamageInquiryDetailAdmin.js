import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { adminGetDamageInquiry } from "../../api/inquiries";

export default function DamageInquiryDetailAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetDamageInquiry(id);
      setRow(data || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

const fmtPO = (po) => {
  if (!po) return "";
  if (typeof po === "string") return po.slice(-6);
  return po.poNumber || (po._id ? po._id.slice(-6) : "");
};

const fmtInv = (inv) => {
  if (!inv) return "";
  if (typeof inv === "string") return inv.slice(-6);
  return inv.invoiceNumber || (inv._id ? inv._id.slice(-6) : "");
};


  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (!row) return (
    <div style={{ padding: 16 }}>
      Not found. <button onClick={() => navigate(-1)} style={btn}>Go back</button>
    </div>
  );

  const poId   = row.purchaseOrder?._id || row.purchaseOrder;
  const origId = row.originalInvoice?._id || row.originalInvoice;
  const recId  = row.recalculatedInvoice?._id || row.recalculatedInvoice;

  return (
    <main style={page}>
      <header style={head}>
        <h2 style={{ margin: 0 }}>Damage Inquiry #{row._id.slice(-6)}</h2>
        <button onClick={load} style={ghostBtn}>Refresh</button>
      </header>

      <section style={card}>
        <div style={kvRow}>
          <div style={k}>Purchase Order</div>
          <div style={v}>
            {poId ? (
              <Link to={`/admin/purchase-orders/${poId}`} style={link}>
                {fmtPO(row.purchaseOrder) || "PO"}
              </Link>
            ) : "—"}
          </div>
        </div>

        <div style={kvRow}>
          <div style={k}>Original Invoice</div>
          <div style={v}>
            {origId ? (
              <Link to={`/admin/invoices/${origId}`} style={link}>
                {fmtInv(row.originalInvoice) || "Invoice"}
              </Link>
            ) : "—"}
          </div>
        </div>

        <div style={kvRow}>
          <div style={k}>Recalculated Invoice</div>
          <div style={v}>
            {recId ? (
              <Link to={`/admin/invoices/${recId}`} style={link}>
                {fmtInv(row.recalculatedInvoice) || "Recalc"}
              </Link>
            ) : (
              <span style={{ color: "#64748b" }}>— not issued yet —</span>
            )}
          </div>
        </div>

        <div style={kvRow}>
          <div style={k}>Created</div>
          <div style={v}>{new Date(row.createdAt).toLocaleString()}</div>
        </div>

        {row.note && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, color: "#334155", marginBottom: 6 }}>Inquiry note</div>
            <div style={noteBox}>{row.note}</div>
          </div>
        )}
      </section>

      <section style={card}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Rejected / Damaged Items</div>
        <div style={{ overflow: "auto" }}>
          <table style={tbl}>
            <thead style={thead}>
              <tr>
                <th style={th}>Item</th>
                <th style={th}>Rejected Qty</th>
                <th style={th}>Note</th>
              </tr>
            </thead>
            <tbody>
              {(row.items || []).map((it, i) => (
                <tr key={i} style={tr}>
                  <td style={td}>{it.product?.name || it.productName || it.product || "—"}</td>
                  <td style={td}>{it.rejectedQty}</td>
                  <td style={td}>{it.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

/* ---------- styles ---------- */
const page = { minHeight: "100vh", padding: 16, background: "#f8fafc" };
const head = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  marginBottom: 12, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 12,
};
const card = {
  background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, marginBottom: 12,
};
const kvRow = { display: "grid", gridTemplateColumns: "220px 1fr", gap: 8, padding: "6px 0" };
const k = { color: "#64748b", fontWeight: 700 };
const v = { color: "#0f172a", fontWeight: 700 };
const link = { color: "#0ea5e9", textDecoration: "none", fontWeight: 800 };
const noteBox = {
  border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc", color: "#334155",
};
const tbl = { width: "100%", borderCollapse: "separate", borderSpacing: 0 };
const thead = { background: "linear-gradient(90deg, #f1f5f9, #eef2f7)" };
const th = { textAlign: "left", fontSize: 12, fontWeight: 800, color: "#475569", padding: 10 };
const tr = { borderTop: "1px solid #e2e8f0", background: "#fff" };
const td = { padding: 10, fontSize: 14, color: "#334155", whiteSpace: "nowrap" };
const btn = { padding: "8px 12px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", fontWeight: 800 };
const ghostBtn = { ...btn, background: "#f8fafc" };
