import React, { useEffect, useState } from "react";
import { listSupplierPOs } from "../../api/supplier";
import PoStatusBadge from "../../components/supplier/PoStatusBadge";
import { Link } from "react-router-dom";

const money = (n) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(n || 0));

const FILTERS = [
  { key: "", label: "All" },
  { key: "new", label: "New" },
  { key: "accepted", label: "Accepted" },
  { key: "packing", label: "Packing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "checking", label: "Checking" },
  { key: "inquired", label: "Inquired" },
  { key: "pending_payment", label: "Pending" },
  { key: "payment_done", label: "Paid" },
  { key: "closed", label: "Closed" },
];

export default function OrdersPage() {
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listSupplierPOs(status || undefined);
      setRows(data);
    } catch (e) {
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); // eslint-disable-next-line
  }, [status]);

  return (
    <main style={page}>
      <header style={head}>
        <div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Supplier Orders</h2>
          <div style={{ color: "#64748b" }}>Browse purchase orders assigned to you.</div>
        </div>

        <div style={filterWrap}>
          {FILTERS.map((f) => (
            <button
              key={f.key || "all"}
              onClick={() => setStatus(f.key)}
              style={{
                ...chip,
                background:
                  status === f.key
                    ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
                    : "#fff",
                color: status === f.key ? "#fff" : "#0f172a",
                borderColor: status === f.key ? "#0284c7" : "#cbd5e1",
                transform: status === f.key ? "scale(1.05)" : "scale(1)",
                boxShadow:
                  status === f.key
                    ? "0 2px 8px rgba(14,165,233,0.3)"
                    : "0 1px 2px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {loading && <div style={{ padding: 12 }}>Loading…</div>}
      {!loading && (!rows || rows.length === 0) && (
        <div style={{ padding: 12 }}>No orders.</div>
      )}

      <div style={grid}>
        {(rows || []).map((po, i) => (
          <article
            key={po._id}
            className="po-card"
            style={{
              ...card,
              animation: `fadeIn 0.5s ease ${(i + 1) * 0.08}s both`,
            }}
          >
            <div style={cardHead}>
              <div style={{ fontWeight: 700, fontSize: "1.1em" }}>
                {po.poNumber || `PO #${po._id.slice(-6)}`}
              </div>
              <PoStatusBadge value={po.status} />
            </div>

            <div style={{ marginTop: 6 }}>
              <div style={row}>
                <span>Items</span>
                <b>{po.items?.length || 0}</b>
              </div>
              <div style={row}>
                <span>Total</span>
                <b>{money(po?.totals?.grandTotal)}</b>
              </div>
            </div>

            <div style={cardFooter}>
              <Link to={`/supplier/orders/${po._id}`} style={ghostBtn}>
                View
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Inline Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .po-card {
          transition: all 0.3s ease;
        }

        .po-card:hover {
          transform: translateY(-6px) scale(1.02);
          border-color: #38bdf8;
          box-shadow: 0 8px 18px rgba(56,189,248,0.25);
          background: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%);
        }

        .po-card:hover span, 
        .po-card:hover b {
          color: #0369a1;
        }



        .po-card:hover a:hover {
          background: #0284c7;
        }

         .po-card:hover a {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: white;
          border-color: #0ea5e9;
          box-shadow: 0 4px 10px rgba(14,165,233,0.25);
          transform: scale(1.03);
        }

        .po-card a {
          transition: all 0.3s ease;
        }

        .po-card a:hover {
          background: linear-gradient(135deg, #0284c7, #0369a1);
          box-shadow: 0 6px 12px rgba(14,165,233,0.35);
          transform: scale(1.06);
        }

        .po-card a:active {
          transform: scale(0.97);
          box-shadow: 0 3px 8px rgba(14,165,233,0.3);
        }
      `}</style>
    </main>
  );
}

// 💅 Styles
const page = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fafc 0%, #e0f2fe 100%)",
  padding: "24px",
  color: "#0f172a",
  fontFamily: "Inter, sans-serif",
};

const head = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 18,
  flexWrap: "wrap",
  gap: 12,
};

const filterWrap = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 16,
  marginTop: 8,
};

const card = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
  transition: "all 0.3s ease",
  cursor: "pointer",
  position: "relative",
};

const cardHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const row = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "4px 0",
};

const cardFooter = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
  marginTop: 10,
};

const chip = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid",
  cursor: "pointer",
  fontWeight: 600,
  background: "#fff",
};

const ghostBtn = {
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  textDecoration: "none",
  color: "#0f172a",
  fontWeight: 700,
  background: "#f1f5f9",
  transition: "all 0.25s ease",
  display: "inline-block",
};