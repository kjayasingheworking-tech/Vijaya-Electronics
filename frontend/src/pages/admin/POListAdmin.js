import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import "../../styles/admin-po.css";
import StatusPill from "../../components/StatusPill";

const money = (n) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(n || 0));

export default function POListAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [supplier, setSupplier] = useState("");
  const [poNumber, setPoNumber] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/po/admin/purchase-orders", {
          params: {
            status: status || undefined,
            supplier: supplier || undefined,
            poNumber: poNumber || undefined, // ✅ put it inside params
          },
        });
        setRows(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, supplier, poNumber]);

  const suppliers = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      if (r.supplier) map.set(r.supplier._id, r.supplier.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [rows]);

  const filterBar = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",      // wraps on smaller screens
  marginBottom: 12,
};

const control = {
  padding: "10px",
  border: "1px solid #e1e4e8",
  borderRadius: 8,
  background: "#fff",
  width: "auto",
  outline: "none",
};

const selectCtrl = {
  ...control,
  flex: "1 1 220px",
  cursor: "pointer",
  // minimal custom dropdown look
  WebkitAppearance: "none",
  MozAppearance: "none",
  appearance: "none",
  backgroundImage:
    'url("data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 20 20\\"><path d=\\"M5.5 7.5l4.5 5 4.5-5\\" stroke=\\"%23899aad\\" stroke-width=\\"2\\" fill=\\"none\\" stroke-linecap=\\"round\\"/></svg>")',
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  paddingRight: 36,
  backgroundSize: "20px",
};

const searchCtrl = {
  ...control,
  flex: "2 1 360px",
};

  return (
    <div className="po-page">
      <header className="po-head">
        <div>
          <h1>Purchase Orders</h1>
          <p className="muted">Filter and open details to manage statuses.</p>
        </div>
      </header>

 <section className="filters" style={filterBar}>
  <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectCtrl}>
    {[
      "",
      "new",
      "accepted",
      "packing",
      "shipped",
      "delivered",
      "checking",
      "inquired",
      "pending_payment",
      "payment_done",
      "closed",
    ].map((s) => (
      <option value={s} key={s}>
        {s || "All statuses"}
      </option>
    ))}
  </select>

  <select value={supplier} onChange={(e) => setSupplier(e.target.value)} style={selectCtrl}>
    <option value="">All suppliers</option>
    {suppliers.map((s) => (
      <option key={s.id} value={s.id}>
        {s.name}
      </option>
    ))}
  </select>

  <input
    type="text"
    placeholder="Search by PO Number"
    value={poNumber}
    onChange={(e) => setPoNumber(e.target.value)}
    style={searchCtrl}
  />
</section>
      {loading ? (
        <div className="center">Loading...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>PO</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Total</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td>{r.poNumber || r._id}</td>
                <td>{r.supplier?.name || "—"}</td>
                <td><StatusPill value={r.status} /></td>
                <td>{money(r.totals?.grandTotal || 0)}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>
                  <Link className="link" to={`/admin/purchase-orders/${r._id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
