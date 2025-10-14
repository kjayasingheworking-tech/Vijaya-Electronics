import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSupplierPO, listMyInvoices } from "../../api/supplier";
import PoStatusBadge from "../../components/supplier/PoStatusBadge";
import StatusActions from "../../components/supplier/StatusActions";
import InvoiceCreateModal from "../../components/supplier/InvoiceCreateModal";
import { useToast } from "../../components/ToastProvider";

const money = (n) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
  }).format(Number(n || 0));

export default function OrderView() {
  const { id } = useParams(); // current PO id
  const toast = useToast();

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [openInv, setOpenInv] = useState(false);

  // ✅ Load current PO details
  const loadPO = async () => {
    setLoading(true);
    try {
      const data = await getSupplierPO(id);
      setPo(data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load purchase order");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load only invoices linked to this PO
  const loadInvoices = async () => {
    try {
      const rows = await listMyInvoices({ po: id }); // filter by PO id
      setInvoices(rows || []);
    } catch (e) {
      console.error("Error loading invoices:", e);
    }
  };

  useEffect(() => {
    loadPO();
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canCreateInvoice = useMemo(() => {
    const s = (po?.status || "").toLowerCase();
    return [
      "accepted",
      "packing",
      "shipped",
      "delivered",
      "checking",
      "inquired",
      "pending_payment",
    ].includes(s);
  }, [po]);

  if (loading)
    return (
      <main style={page}>
        <div style={{ padding: 12 }}>Loading…</div>
      </main>
    );

  if (!po)
    return (
      <main style={page}>
        <div style={{ padding: 12 }}>Purchase order not found.</div>
      </main>
    );

  return (
    <main style={page}>
      {/* ===== Header ===== */}
      <header style={head}>
        <div>
          <h2 style={{ margin: 0 }}>
            {po.poNumber || `PO-${po._id.slice(-6)}`}
          </h2>
          <div style={{ color: "#64748b" }}>
            Created {new Date(po.createdAt).toLocaleString()}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PoStatusBadge value={po.status} />
          <Link to="/supplier/orders" style={ghostBtn}>
            Back
          </Link>
        </div>
      </header>

      {/* ===== Order Items ===== */}
      <section style={sectionRow}>
        <article style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Order Items</h3>
            <div style={{ fontWeight: 700 }}>{money(po?.totals?.grandTotal)}</div>
          </div>

          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>Product</th>
                <th style={{ ...th, textAlign: "right" }}>Qty</th>
                <th style={{ ...th, textAlign: "right" }}>Unit Price</th>
                <th style={{ ...th, textAlign: "right" }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {(po.items || []).map((it, i) => (
                <tr key={i} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={td}>{it.name}</td>
                  <td style={{ ...td, textAlign: "right" }}>{it.quantity}</td>
                  <td style={{ ...td, textAlign: "right" }}>{money(it.unitPrice)}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>
                    {money(it.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <StatusActions
              po={po}
              onChanged={(updated) => {
                // ✅ Show confirmation before applying state change
                const confirmed = window.confirm(
                  `Are you sure you want to change the status to "${updated.status}"?`
                );
                if (!confirmed) return;

                // ✅ Continue original logic (unchanged)
                setPo(updated);
                toast.success(`Status updated to "${updated.status}".`);
                document.dispatchEvent(new Event("notifications:refresh"));
              }}
            />


            {canCreateInvoice && (
              <button onClick={() => setOpenInv(true)} style={primaryBtn}>
                Generate Invoice
              </button>
            )}
          </div>
        </article>

        {/* ===== Order History ===== */}
        <article style={card}>
          <h3 style={{ margin: 0 }}>Order History</h3>
          <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
            {(po.history || [])
              .slice()
              .reverse()
              .map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <b>{h.role}</b>{" "}
                    {h.from ? `changed ${h.from} → ${h.to}` : `set to ${h.to}`}
                    {h.note ? ` — ${h.note}` : ""}
                  </div>
                  <div style={{ color: "#64748b" }}>
                    {new Date(h.at).toLocaleString()}
                  </div>
                </div>
              ))}
          </div>
        </article>
      </section>

      {/* ===== Related Invoices ===== */}
      <section style={{ ...card, marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Invoices for this PO</h3>
          <button onClick={loadInvoices} style={ghostBtn}>
            Refresh
          </button>
        </div>

        {invoices.length === 0 && (
          <div style={{ marginTop: 8 }}>No invoices yet.</div>
        )}

        {invoices.length > 0 && (
          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>Invoice #</th>
                <th style={th}>Type</th>
                <th style={th}>Status</th>
                <th style={{ ...th, textAlign: "right" }}>Total</th>
                <th style={th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((r) => (
                <tr key={r._id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={td}>
                    <Link to={`/supplier/invoices/${r._id}`} style={link}>
                      {r.invoiceNumber || r._id.slice(-6)}
                    </Link>
                  </td>
                  <td style={td}>{r.type}</td>
                  <td style={td}>{r.status}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>
                    {money(r?.totals?.grandTotal)}
                  </td>
                  <td style={td}>
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ===== Invoice Modal ===== */}
      <InvoiceCreateModal
        po={po}
        open={openInv}
        onClose={() => setOpenInv(false)}
        onCreated={() => loadInvoices()}
      />
    </main>
  );
}

/* ---------- Styles ---------- */
const page = {
  minHeight: "100vh",
  background: "linear-gradient(to right, #f9fafb, #f1f5f9)",
  padding: 24,
  color: "#0f172a",
  fontFamily: "'Inter', sans-serif",
};
const head = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 20,
  gap: 12,
  padding: "16px 20px",
  borderRadius: 12,
  background: "#fff",
  border: "1px solid #e2e8f0",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
};
const sectionRow = {
  display: "grid",
  gridTemplateColumns: "1.6fr 1fr",
  gap: 20,
  marginTop: 12,
};
const card = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
};
const tbl = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const th = {
  textAlign: "left",
  fontSize: 13,
  fontWeight: 600,
  color: "#475569",
  padding: "10px 6px",
  borderBottom: "1px solid #e2e8f0",
};
const td = {
  padding: "10px 6px",
  fontSize: 14,
  verticalAlign: "top",
  color: "#334155",
};
const ghostBtn = {
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  textDecoration: "none",
  color: "#0f172a",
  fontWeight: 600,
  background: "#f8fafc",
  cursor: "pointer",
};
const primaryBtn = {
  padding: "10px 16px",
  background: "linear-gradient(to right, #16a34a, #22c55e)",
  color: "#fff",
  border: "1px solid #15803d",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(22,163,74,0.2)",
};
const link = { color: "#0ea5e9", textDecoration: "none", fontWeight: 600 };
