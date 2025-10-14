import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getMyInvoiceById } from "../../api/supplier";

const money = (n) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(n || 0));

export default function InvoiceView() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const poHint = sp.get("po") || undefined;

  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const inv = await getMyInvoiceById(id, poHint);
      setRow(inv || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable */ }, [id, poHint]);

  if (loading) return <main style={page}><div style={muted}>Loading…</div></main>;
  if (!row)   return <main style={page}><div style={muted}>Invoice not found.</div></main>;

  return (
    <main style={page}>
      {/* Top header */}
      <header style={head}>
        <div>
          <h2 style={h2}>
            Invoice <span style={mono}>{row.invoiceNumber || `#${row._id.slice(-6)}`}</span>
          </h2>

          <div style={subline}>
            <span style={{ ...chip, ...typeChip[row.type] }}>{row.type}</span>
            <span style={{ ...badge, ...statusBadge[row.status] }}>{row.status}</span>
            {row.createdAt && (
              <span style={muted}>• {new Date(row.createdAt).toLocaleString()}</span>
            )}
          </div>
        </div>

        <div style={actions}>
          <Link
            to={`/supplier/orders/${row.purchaseOrder?._id || row.purchaseOrder}`}
            style={ghostBtn}
          >
            Open PO
          </Link>
          <Link to="/supplier/invoices" style={ghostBtn}>Back</Link>
        </div>
      </header>

      {/* Items + totals */}
      <section style={card}>
        <div style={cardHead}>
          <h3 style={h3}>Items</h3>
          <div style={grandWrap}>
            <div style={mutedSmall}>Grand Total</div>
            <div style={grand}>{money(row?.totals?.grandTotal)}</div>
          </div>
        </div>

        <div style={tableWrap}>
          <table style={tbl}>
            <thead style={thead}>
              <tr>
                <th style={th}>Product</th>
                <th style={{ ...th, textAlign: "right", width: 100 }}>Qty</th>
                <th style={{ ...th, textAlign: "right", width: 140 }}>Unit Price</th>
                <th style={{ ...th, textAlign: "right", width: 160 }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {(row.items || []).map((it, i) => (
                <tr key={i} style={{ ...tr, ...(i % 2 ? rowAlt : null) }}>
                  <td style={td}>{it.name}</td>
                  <td style={{ ...td, textAlign: "right" }}>{it.quantity}</td>
                  <td style={{ ...td, textAlign: "right" }}>{money(it.unitPrice)}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>
                    {money(it.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ✅ Additional charges (match admin view) */}
        {(row.additionalCharges || []).length > 0 && (
          <>
            <h4 style={kicker}>Additional charges</h4>
            <ul style={{ marginTop: 6 }}>
              {row.additionalCharges.map((c, i) => (
                <li key={i}>
                  {c.label}: <b>{money(c.amount)}</b>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Deductions (already present) */}
        {(row.deductions || []).length > 0 && (
          <>
            <h4 style={kicker}>Deductions</h4>
            <ul style={{ marginTop: 6 }}>
              {row.deductions.map((d, i) => (
                <li key={i}>
                  <span style={mono}>qty {d.qty}</span> — {d.reason} <b>({money(d.amount)})</b>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}

/* =================== Styles (visual only) =================== */
const page   = { minHeight: "100vh", background: "#f8fafc", padding: 16, color: "#0f172a" };

const head = {
  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
  padding: 16, border: "1px solid #e2e8f0", borderRadius: 14,
  background: "linear-gradient(90deg, rgba(59,130,246,0.06) 0%, rgba(14,165,233,0.06) 100%)",
  boxShadow: "0 8px 24px rgba(2, 6, 23, 0.05)", marginBottom: 12
};
const h2 = { margin: 0, fontSize: 22, letterSpacing: 0.2 };
const subline = { display: "flex", gap: 8, alignItems: "center", marginTop: 6, flexWrap: "wrap" };
const actions = { display: "flex", gap: 8, flexWrap: "wrap" };

const card = {
  background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 14,
  boxShadow: "0 8px 24px rgba(2, 6, 23, 0.05)"
};
const cardHead = { display: "flex", justifyContent: "space-between", alignItems: "baseline" };
const h3 = { margin: 0, fontSize: 18 };

const tableWrap = { marginTop: 8, border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" };
const tbl   = { width: "100%", borderCollapse: "separate", borderSpacing: 0 };
const thead = { position: "sticky", top: 0, background: "#fff", boxShadow: "inset 0 -1px 0 #e2e8f0", zIndex: 1 };
const th    = { textAlign: "left", fontSize: 12, color: "#64748b", padding: "12px", textTransform: "uppercase", letterSpacing: 0.6 };
const tr    = { borderTop: "1px solid #eef2f7" };
const rowAlt= { background: "#fcfdff" };
const td    = { padding: 12, fontSize: 14, verticalAlign: "top" };

const badge = { display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800 };
const chip  = { display: "inline-block", padding: "2px 10px", borderRadius: 8,   fontSize: 12, fontWeight: 800, border: "1px solid transparent" };
const statusBadge = {
  issued:    { background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" },
  cancelled: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" },
  closed:    { background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" },
};
const typeChip = {
  original:     { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" },
  recalculated: { background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" },
};

const mono       = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" };
const grandWrap  = { textAlign: "right" };
const grand      = { fontSize: 20, fontWeight: 900, fontVariantNumeric: "tabular-nums", ...mono };
const muted      = { color: "#64748b" };
const mutedSmall = { ...muted, fontSize: 12 };

const ghostBtn = {
  padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1",
  background: "#fff", color: "#0f172a", fontWeight: 700, textDecoration: "none"
};

const kicker = { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6, color: "#64748b", marginTop: 14 };
