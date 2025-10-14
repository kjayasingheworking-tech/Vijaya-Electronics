// src/pages/supplier/MyProducts.js
import React, { useEffect, useMemo, useState } from "react";
import {
  listMyProducts,
  createMyProduct,
  updateMyProduct,
  deleteMyProduct,
  getProductHistory,
  uploadProductImages,
} from "../../api/supProducts";

const C = {
  text: "#1e293b",
  sub: "#64748b",
  primary: "#2563eb",
  ok: "#22C55E",
  warn: "#F59E0B",
  danger: "#EF4444",
};

function Badge({ tone = "ok", children }) {
  const bg =
    tone === "ok"
      ? "rgba(34,197,94,.14)"
      : tone === "warn"
      ? "rgba(245,158,11,.14)"
      : "rgba(239,68,68,.14)";
  const col = tone === "ok" ? "#22C55E" : tone === "warn" ? "#F59E0B" : "#EF4444";
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        color: col,
        background: bg,
      }}
    >
      {children}
    </span>
  );
}

function Chip({ children, tone = "neutral" }) {
  const styles = {
    neutral: { bg: "#eef2ff", col: "#4338ca" }, // indigo
    warn: { bg: "#fef3c7", col: "#b45309" }, // amber
    ok: { bg: "#dcfce7", col: "#166534" }, // green
  };
  const s = styles[tone] || styles.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        background: s.bg,
        color: s.col,
        border: "1px solid rgba(0,0,0,0.05)",
      }}
    >
      {children}
    </span>
  );
}

function SpecRows({ value, onChange }) {
  const [rows, setRows] = useState(value || []);
  useEffect(() => onChange(rows), [rows]); // propagate
  const add = () => setRows([...rows, { key: "", value: "" }]);
  const del = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const set = (i, field, v) => {
    const next = rows.slice();
    next[i] = { ...next[i], [field]: v };
    setRows(next);
  };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 8 }}>
        <strong style={{ color: C.sub }}>Key</strong>
        <strong style={{ color: C.sub }}>Value</strong>
        <span />
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 8, marginTop: 8 }}
        >
          <input
            value={r.key}
            onChange={(e) => set(i, "key", e.target.value)}
            placeholder="e.g., Color"
            className="inp"
          />
          <input
            value={r.value}
            onChange={(e) => set(i, "value", e.target.value)}
            placeholder="e.g., Blue"
            className="inp"
          />
          <button className="btn ghost" type="button" onClick={() => del(i)}>
            Remove
          </button>
        </div>
      ))}
      <button className="btn" type="button" style={{ marginTop: 10 }} onClick={add}>
        + Add spec
      </button>
    </div>
  );
}

function HistoryItem({ h, prevSnapshot, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const time = new Date(h.createdAt).toLocaleString();

  const formatVal = (k, v) => {
    if (v == null) return "-";
    switch (k) {
      case "unitPrice":
        return `Rs. ${Number(v || 0).toLocaleString()}`;
      case "isAvailable":
        return v ? "true" : "false";
      case "categories":
        return (v || []).join(", ");
      case "images":
        return Array.isArray(v) ? `${v.length} image(s)` : "0";
      case "specifications":
        return Array.isArray(v) && v.length
          ? v.map((s, i) => `${s.key || "-"}: ${s.value || "-"}`).join("; ")
          : "-";
      default:
        return String(v);
    }
  };

  const display = [
    ["name", "Name"],
    ["sku", "SKU"],
    ["unitPrice", "Price"],
    ["isAvailable", "Available"],
    ["categories", "Categories"],
    ["images", "Images"],
    ["description", "Description"],
    ["specifications", "Specifications"],
    ["updatedAt", "Updated At"],
  ];

  return (
    <div className={`hist ${open ? "open" : ""}`}>
      <div className="hist-top">
        <div className="hist-left">
          <Chip>v{h.version}</Chip>
          <span className="muted">{time}</span>
          {(h.changedFields || []).length > 0 && (
            <div className="chips">
              {h.changedFields.map((f, i) => (
                <Chip key={i} tone="warn">
                  {f}
                </Chip>
              ))}
            </div>
          )}
        </div>
        <button className="btn sm" onClick={() => setOpen(!open)}>
          {open ? "Collapse" : "Expand"}
        </button>
      </div>

      {open && (
        <div className="hist-body">
          <table className="tbl small">
            <tbody>
              {display.map(([k, label]) => {
                const cur = k === "updatedAt" ? h.snapshot?.updatedAt : h.snapshot?.[k];
                const prev = prevSnapshot ? (k === "updatedAt" ? prevSnapshot.updatedAt : prevSnapshot[k]) : undefined;
                const changed = prevSnapshot && JSON.stringify(cur) !== JSON.stringify(prev);
                return (
                  <tr key={k} className={changed ? "changed" : ""}>
                    <td style={{ fontWeight: 600 }}>{label}</td>
                    <td>
                      {prevSnapshot && changed ? (
                        <span>
                          <span className="prevval">{formatVal(k, prev)}</span>
                          <span className="arrow"> → </span>
                          <span className="newval">{formatVal(k, cur)}</span>
                        </span>
                      ) : (
                        <span>{formatVal(k, cur)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HistoryDrawer({ product, open, onClose }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (open && product?._id) {
      getProductHistory(product._id)
        .then(({ data }) => setItems(data)) // newest → oldest
        .catch((e) => alert(e?.response?.data?.message || e.message));
    } else if (!open) {
      setItems(null);
    }
  }, [open, product?._id]);

  return (
    <div className={`drawer ${open ? "open" : ""}`}>
      <div className="drawer-head sticky">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <strong>Version History — {product?.name || "-"}</strong>
          {product && <Chip tone="ok">Current v{product.version ?? "?"}</Chip>}
        </div>
        <button className="btn ghost" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="drawer-body">
        {!items ? (
          <div className="muted">Loading…</div>
        ) : items.length === 0 ? (
          <div className="muted">No history yet.</div>
        ) : (
          items.map((h, idx) => {
            const prev = items[idx + 1]?.snapshot;
            return <HistoryItem key={h._id} h={h} prevSnapshot={prev} defaultOpen={idx === 0} />;
          })
        )}
      </div>
    </div>
  );
}

function ProductForm({ initial, onCreated, onUpdated, onCancel }) {
  const editing = !!(initial && initial._id);
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [unitPrice, setUnitPrice] = useState(initial?.unitPrice ?? "");
  const [isAvailable, setIsAvailable] = useState(initial?.isAvailable ?? true);
  const [categories, setCategories] = useState((initial?.categories || []).join(", "));
  const [sku, setSku] = useState(initial?.sku || "");
  const [specifications, setSpecifications] = useState(initial?.specifications || []);
  const [images, setImages] = useState(null); // only on create
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!editing) {
        const fd = new FormData();
        fd.append("name", name);
        fd.append("unitPrice", String(unitPrice || 0));
        fd.append("isAvailable", String(isAvailable));
        if (description) fd.append("description", description);
        if (sku) fd.append("sku", sku);
        const cats = categories
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        cats.forEach((c) => fd.append("categories", c));
        fd.append("specifications", JSON.stringify(specifications));
        if (images && images.length) {
          Array.from(images).forEach((f) => fd.append("images", f));
        }
        const { data } = await createMyProduct(fd);
        onCreated?.(data);
      } else {
        const payload = {
          name,
          description,
          unitPrice: Number(unitPrice || 0),
          isAvailable,
          sku,
          categories: categories
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          specifications,
        };
        const { data } = await updateMyProduct(initial._id, payload);
        onUpdated?.(data);
      }
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card modal-card">
      <h3 style={{ marginTop: 0 }}>{editing ? "Edit Product" : "Add New Product"}</h3>
      <div className="grid2">
        <div>
          <label>Name *</label>
          <input className="inp" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Unit Price *</label>
          <input
            className="inp"
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label>SKU</label>
          <input className="inp" value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
        <div>
          <label>Available</label>
          <select
            className="inp"
            value={String(isAvailable)}
            onChange={(e) => setIsAvailable(e.target.value === "true")}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="col-span">
          <label>Description</label>
          <textarea
            className="inp"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="col-span">
          <label>Categories (comma separated)</label>
          <input className="inp" value={categories} onChange={(e) => setCategories(e.target.value)} />
        </div>
        <div className="col-span">
          <label>Specifications</label>
          <SpecRows value={specifications} onChange={setSpecifications} />
        </div>
        {!editing && (
          <div className="col-span">
            <label>Images (max 5)</label>
            <input
              className="inp"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages(e.target.files)}
            />
            <small className="muted">You can also store image URLs on the backend if supported.</small>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end" }}>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function MyProducts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("list"); // list | create | edit
  const [current, setCurrent] = useState(null);
  const [histOpen, setHistOpen] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");


  const load = async () => {
    setLoading(true);
    try {
      const { data } = await listMyProducts();
      setRows(data || []);
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(t) ||
        (r.sku || "").toLowerCase().includes(t) ||
        (r.categories || []).join(", ").toLowerCase().includes(t)
    );
  }, [q, rows]);

const onCreated = (p) => {
  setRows([p, ...rows]);
  setMode("list");
  setSuccessMsg(`✅ "${p.name}" added successfully!`);
  setTimeout(() => setSuccessMsg(""), 3000);
};




  const onUpdated = (p) => {
    setRows(rows.map((r) => (r._id === p._id ? p : r)));
    setMode("list");
    setCurrent(null);
  };

const onDelete = async (p) => {
  if (!window.confirm(`Delete "${p.name}"?`)) return;
  try {
    await deleteMyProduct(p._id);
    setRows(rows.filter((r) => r._id !== p._id));
    setSuccessMsg(` "${p.name}" deleted successfully!`);
    setTimeout(() => setSuccessMsg(""), 3000);
  } catch (e) {
    alert(e?.response?.data?.message || e.message);
  }
};

  const onUploadImages = async (p, files) => {
    if (!files || !files.length) return;
    setImgUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("images", f));
      const { data } = await uploadProductImages(p._id, fd);
      setRows(rows.map((r) => (r._id === p._id ? data.product : r)));
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setImgUploading(false);
    }
  };

  const isModalOpen = mode === "create" || (mode === "edit" && current);

  return (
    <div className="page">
      {mode === "list" && (
        <>
          <div className="head">
            <div>
              <h2>My Products</h2>
              <p className="muted">Create, update, upload images, and view version history.</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                className="inp"
                placeholder="Search by name, SKU, category…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ minWidth: 260 }}
              />
              <button className="btn" onClick={() => setMode("create")}>
                + Add Product
              </button>
            </div>
          </div>



          <div className="card">
            {loading ? (
              <div className="muted">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="muted">No products yet.</div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Avail.</th>
                    <th>Categories</th>
                    <th>Images</th>
                    <th className="center">Actions</th>

                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="cell">
                          <div className="thumbs">
                            {(p.images || []).slice(0, 3).map((u, i) => (
                              <img key={i} src={u} alt="" />
                            ))}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div className="muted small">{p.description?.slice(0, 80)}</div>
                          </div>
                        </div>
                      </td>
                      <td>{p.sku || "-"}</td>
                      <td>Rs. {Number(p.unitPrice || 0).toLocaleString()}</td>
                      <td>{p.isAvailable ? <Badge>Available</Badge> : <Badge tone="warn">Unavailable</Badge>}</td>
                      <td className="small">{(p.categories || []).join(", ") || "-"}</td>
                      <td>{(p.images || []).length}</td>
                      <td className="center">

                        <div className="row-actions">
                          <label className="btn ghost">
                            {imgUploading ? "Uploading…" : "Add Images"}
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => onUploadImages(p, e.target.files)}
                            />
                          </label>
                          <button
                            className="btn ghost"
                            onClick={() => {
                              setCurrent(p);
                              setMode("edit");
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn ghost"
                            onClick={() => {
                              setCurrent(p);
                              setHistOpen(true);
                            }}
                          >
                            History
                          </button>
                          <button className="btn danger" onClick={() => onDelete(p)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Modal (for Add / Edit) */}
      {isModalOpen && (
        <>
          <div className="modal-backdrop" onClick={() => setMode("list")} />
          <div className="modal-container" role="dialog" aria-modal="true">
            <div className="modal-shell">
              {mode === "create" && <ProductForm onCreated={onCreated} onCancel={() => setMode("list")} />}
              {mode === "edit" && current && (
                <ProductForm
                  initial={current}
                  onUpdated={onUpdated}
                  onCancel={() => {
                    setMode("list");
                    setCurrent(null);
                  }}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* History Drawer stays exactly as before */}
      <HistoryDrawer product={current} open={histOpen} onClose={() => setHistOpen(false)} />

        {successMsg && (
      <div className="toast-msg">
          {successMsg}
        </div>
      )}

      {/* Embedded styles (you can delete MyProducts.css) */}
      <style>{`
.page { 
  min-height: 100vh;
  background: linear-gradient(to bottom, #f8fafc 0%, #ebf4fa 40%, #dbeeff 100%);
  color: #1e293b;
  font-family: Arial, sans-serif;
  padding: 20px;
  background-attachment: fixed;
}


        .head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; gap:12px; flex-wrap:wrap; }
        h2 { margin:0 0 4px 0; }
        .muted { color:#64748b; }
        .small { font-size:12px; color:#64748b; }

        .card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.08); width:100%; max-width:100%; margin:0; }

        .grid2 { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
        .grid2 .col-span { grid-column: 1 / -1; }

        label { display:block; margin-bottom:6px; color:#475569; font-size:13px; }

        .inp { width:100%; padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; color:#1e293b; }
        textarea.inp { resize:vertical; }

        .btn { background:#2563eb; border:none; color:white; padding:10px 14px; border-radius:8px; cursor:pointer; font-weight:600; transition:transform .06s ease }
        .btn:hover { background:#1d4ed8; }
        .btn:active { transform: translateY(1px) }
        .btn.ghost { background:#f8fafc; border:1px solid #cbd5e1; color:#334155; }
        .btn.ghost:hover { background:#f1f5f9; }
        .btn.danger { background:#ef4444; color:white; }
        .btn.danger:hover { background:#dc2626; }
        .btn.sm { padding:6px 10px; border-radius:6px; font-size:12px; }

        .tbl { width:100%; border-collapse: collapse; font-size:14px; }
        .tbl th, .tbl td { border-bottom:1px solid #e2e8f0; padding:10px; vertical-align:top; }
        .tbl th { background:#f9fafb; text-align:left; }
        .tbl tbody tr:hover { background:#fafafa; }

        .center {
          text-align: center !important;
          vertical-align: middle !important;
        }

        .row-actions {
          display: inline-flex;       /* makes width fit content */
          justify-content: center;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cell { display:flex; align-items:flex-start; gap:12px; }
        .thumbs { display:flex; gap:6px; }
        .thumbs img { width:38px; height:38px; border-radius:6px; object-fit:cover; border:1px solid #e2e8f0; }

        /* Drawer (history) */
        .drawer { position: fixed; top:0; right:-560px; width:560px; height:100%; background:#ffffff; border-left:1px solid #e2e8f0; transition: right .25s ease; display:flex; flex-direction:column; z-index: 50; box-shadow: -2px 0 6px rgba(0,0,0,0.08); }
        .drawer.open { right:0; }
        .drawer-head { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid #e2e8f0; }
        .drawer-head.sticky { position:sticky; top:0; background:#fff; z-index:1; }
        .drawer-body { padding:12px 14px; overflow:auto; }

        /* History item */
        .hist { border:1px solid #e2e8f0; border-radius:10px; padding:12px; margin-bottom:12px; background:#f8fafc; }
        .hist-top { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .hist-left { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .chips { display:flex; gap:6px; flex-wrap:wrap; }
        .snapshot { background:#f1f5f9; color:#0f172a; border-radius:8px; padding:10px; overflow:auto; font-size:12px; }
        .hist-body { margin-top:10px; }
        .hist-body table { width:100%; border-collapse:collapse; }
        .hist-body td { border-bottom:1px solid #e5e7eb; padding:8px 10px; font-size:13px; }
        .hist-body td:first-child { width:140px; color:#334155; }
        .changed { background:#fff7ed; }
        .prevval { color:#64748b; text-decoration:line-through; }
        .newval { color:#0f172a; font-weight:600; }
        .arrow { margin:0 6px; color:#334155; }

        /* ===== Modal (Add/Edit) ===== */
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(4px); /* soft blur */
          -webkit-backdrop-filter: blur(4px);
          opacity: 0; pointer-events: none; transition: opacity .18s ease;
          z-index: 60;
        }
        /* When modal is open we render the backdrop; since it's mounted only on open, show immediately */
        .modal-backdrop { opacity: 1; pointer-events: auto; }

        .modal-container {
          position: fixed; inset: 0; display: grid; place-items: center; z-index: 61;
          padding: 16px;
        }
        .modal-shell {
          width: 100%;
          max-width: 650px;  /* smaller modal */
          animation: modalIn .22s ease;
        }
        .modal-card {
          margin: 0; padding: 18px 18px 16px;
          border-radius: 14px;
          box-shadow: 0 20px 40px rgba(2,6,23,0.16), 0 2px 6px rgba(2,6,23,0.06);
          border: 1px solid #e2e8f0;
        }

        @keyframes modalIn {
          from { opacity: 0; transform: translateY(10px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 900px) {
          .grid2 { grid-template-columns: 1fr; }
          .drawer { width: 100%; }
          .modal-shell { max-width: 94vw; }
        }


        .toast-msg {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
          padding: 12px 18px;
          border-radius: 8px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          animation: fadeSlideIn 0.4s ease, fadeOut 3s ease forwards 2.6s;
        }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeOut {
          to { opacity: 0; transform: translateY(20px); }
        }


      `}</style>
    </div>
  );
}
