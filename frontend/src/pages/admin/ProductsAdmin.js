import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import useAdminPOCart from "../../hooks/useAdminPOCart";
import QtyInput from "../../components/QtyInput";
import { generateProductsReport } from "../../utils/pdfGenerator";
import "../../styles/admin-po.css";

export default function ProductsAdmin() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [qtyDraft, setQtyDraft] = useState({});
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const { supplier, items, subTotal, addItem, updateQty, removeItem, clear } =
    useAdminPOCart();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/supproducts/admin/products"); // baseURL has /api
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.response?.data?.message || e.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => (r.categories || []).forEach((c) => set.add(c)));
    return ["", ...Array.from(set).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const sup = supplierName.trim().toLowerCase();
    return rows.filter((r) => {
      const okQ =
        !qq ||
        r.name.toLowerCase().includes(qq) ||
        (r.description || "").toLowerCase().includes(qq) ||
        (r.sku || "").toLowerCase().includes(qq);
      const okC = !category || (r.categories || []).includes(category);
      const okS = !sup || (r.supplier?.name || "").toLowerCase().includes(sup);
      return okQ && okC && okS && r.isActive !== false && r.isAvailable !== false;
    });
  }, [rows, q, category, supplierName]);

  const onAdd = (prod) => {
    setError("");
    const qty = Number(qtyDraft[prod._id] || 1);
    try {
      addItem(prod, qty);
      setQtyDraft((d) => ({ ...d, [prod._id]: 1 }));
    } catch (e) {
      setError(e.message);
    }
  };

  const canCreate = items.length > 0 && supplier && !creating;

const createPO = async () => {
  if (!canCreate) return;

  //  Step 1: Ask for confirmation first
  const confirmed = window.confirm(
    `Are you sure you want to create this purchase order for supplier "${supplier?.name || "Unknown"}"?`
  );
  if (!confirmed) return;

  try {
    setCreating(true);
    const body = {
      supplier: supplier._id || supplier,
      items: items.map((it) => ({ product: it.product, quantity: it.quantity })),
      notes: "",
    };

    //  Step 2: Create the PO
    const { data } = await api.post("/po/admin/purchase-orders", body);

    //  Step 3: Clear cart after success
    clear();

    //  Step 4: Show PO Number instead of ID
    const poNumber = data?.poNumber || data?.po?.poNumber || `PO-${data?._id?.slice(-6)}`;
    alert(` Purchase Order created successfully!\n\nPO Number: ${poNumber}`);

  } catch (e) {
    alert(e?.response?.data?.message || e.message || "Failed to create PO");
  } finally {
    setCreating(false);
  }
};

const downloadProductsPDF = () => {
  try {
    const filters = {
      search: q,
      category: category,
      supplier: supplierName
    };
    const pdf = generateProductsReport(filtered, filters);
    const filename = `products-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    setError("Failed to generate PDF report");
  }
};


 return (
  <div className="po-page">

    {/* 2-column layout: left content + right cart */}
    <div className="po-layout">
      {/* LEFT: title, subtext, filters, grid */}
      <div className="po-left">
        <header className="po-head">
          <div>
            <h1>Supplier Products</h1>
            <p className="muted">
              Browse all supplier products and create purchase orders.
            </p>
          </div>
        </header>

        {/* Filters */}
        <section
          className="filters"
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          <input
            placeholder="Search name / sku / description"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              flex: 2,
              padding: "10px",
              border: "1px solid #e1e4e8",
              borderRadius: "8px",
            }}
          />
          <input
            placeholder="Filter by supplier name"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            style={{
              flex: 2,
              padding: "10px",
              border: "1px solid #e1e4e8",
              borderRadius: "8px",
            }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              flex: 1,
              padding: "10px",
              border: "1px solid #e1e4e8",
              borderRadius: "8px",
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c || "All categories"}
              </option>
            ))}
          </select>
          <button 
            onClick={downloadProductsPDF}
            style={{
              background: '#FFA500',
              color: '#212529',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              minWidth: 'fit-content'
            }}
          >
            📄 Export PDF
          </button>
        </section>


        {error ? <div className="error">{error}</div> : null}

        {/* Product grid */}
        {loading ? (
          <div className="center">Loading...</div>
        ) : (
          <div className="grid">
            {filtered.map((p) => (
              <article className="card" key={p._id}>
                <div
                  className="thumb"
                  style={{ backgroundImage: `url(${(p.images && p.images[0]) || ""})` }}
                />
                <div className="card-body">
                  <h3>{p.name}</h3>
                  <p className="muted">{p.supplier?.name || ""}</p>
                  <p className="desc">{p.description || "—"}</p>

                  {/* price row */}
                  <div className="row">
                    <div className="price">Rs. {Number(p.unitPrice || 0).toFixed(2)}</div>
                  </div>

                  {/* chips row */}
                  {p.categories?.length > 0 && (
                    <div className="chips">
                      {p.categories.slice(0, 3).map((c) => (
                        <span key={c} className="chip">{c}</span>
                      ))}
                    </div>
                  )}

                  {/* qty + button */}
                  <div className="row">
                    <QtyInput
                      value={qtyDraft[p._id] || 1}
                      onChange={(v) => setQtyDraft((d) => ({ ...d, [p._id]: v }))}
                    />
                    <button className="btn" onClick={() => onAdd(p)}>Add to PO</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: sticky PO cart */}
      <aside className="po-right">
        <div className="cart-box sticky">
          <h3>PO Cart</h3>
          {supplier ? (
            <p className="small">Supplier: <b>{supplier.name || supplier._id}</b></p>
          ) : (
            <p className="small">No supplier selected</p>
          )}

          <div className="cart-items">
            {items.map((it) => (
              <div className="cart-row" key={it.product}>
                <div className="cart-name">{it.name}</div>
                <QtyInput
                  value={it.quantity}
                  onChange={(v) => updateQty(it.product, v)}
                />
                <div className="cart-price">Rs. {(it.unitPrice * it.quantity).toFixed(2)}</div>
                <button className="btn ghost" onClick={() => removeItem(it.product)}>Remove</button>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <div>Sub Total</div>
            <div className="cart-total">Rs. {subTotal.toFixed(2)}</div>
          </div>

          <div className="cart-actions">
            <button className="btn" disabled={!(items.length && supplier) || creating} onClick={createPO}>
              {creating ? "Creating..." : "Create PO"}
            </button>
            <button className="btn ghost" onClick={clear} disabled={!items.length}>Clear</button>
          </div>
        </div>
      </aside>
    </div>
  </div>
);

}
