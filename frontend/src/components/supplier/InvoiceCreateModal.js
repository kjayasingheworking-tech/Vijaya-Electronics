// src/components/supplier/InvoiceCreateModal.js
import React, { useMemo, useState } from "react";
import { supplierCreateInvoice } from "../../api/supplier";

const money = (n) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(n || 0));

export default function InvoiceCreateModal({ po, open, onClose, onCreated }) {
  const [charges, setCharges] = useState([{ label: "Shipping", amount: 0 }]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const subTotal = useMemo(
    () => (po?.items || []).reduce((s, it) => s + (it.unitPrice * it.quantity), 0),
    [po]
  );

  const chargesTotal = useMemo(
    () => (charges || []).reduce((s, c) => s + (Number(c.amount) || 0), 0),
    [charges]
  );

  const grand = subTotal + chargesTotal;

  const setCharge = (idx, key, val) => {
    const next = charges.slice();
    next[idx] = { ...next[idx], [key]: key === "amount" ? Number(val) : val };
    setCharges(next);
  };

  const addCharge = () => setCharges((prev) => [...prev, { label: "", amount: 0 }]);
  const removeCharge = (idx) => setCharges((prev) => prev.filter((_, i) => i !== idx));

  const create = async () => {
    const confirm = window.confirm(
      "Are you sure you want to generate this invoice? Once created, it cannot be undone."
    );
    if (!confirm) return;

    try {
      setLoading(true);
      const payload = {
        purchaseOrder: po._id,
        additionalCharges: (charges || []).filter((c) => (c.label || "").trim()),
        notes,
      };
      const inv = await supplierCreateInvoice(payload);
      alert(`Invoice ${inv?.invoiceNumber || ""} created successfully!`);
      onCreated?.(inv);
      onClose?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={modalWrap}>
      <div style={modalCard}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Issue Invoice for PO #{po?.poNumber || po?._id?.slice(-6)}</h3>
          <button onClick={onClose} style={xBtn}>✕</button>
        </div>

        {/* Body */}
        <div style={{ display: "grid", gap: 8 }}>
          <div>
            <div style={row}>
              <span>Items Subtotal</span>
              <b>{money(subTotal)}</b>
            </div>

            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Additional Charges</div>

              {(charges || []).map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 140px 36px",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <input
                    placeholder="Label (e.g., Shipping)"
                    value={c.label}
                    onChange={(e) => setCharge(i, "label", e.target.value)}
                    style={inp}
                  />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={c.amount}
                    onChange={(e) => setCharge(i, "amount", e.target.value)}
                    style={inp}
                  />
                  <button onClick={() => removeCharge(i)} style={smallBtn}>
                    🗑️
                  </button>
                </div>
              ))}

              <button onClick={addCharge} style={ghostBtn}>
                + Add Charge
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                Notes (optional)
              </label>
              <textarea
                placeholder="Add notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={textArea}
              />
            </div>
          </div>

          <div style={{ ...row, marginTop: 6 }}>
            <span>Total (Rs.)</span>
            <b>{money(grand)}</b>
          </div>

          {/* Footer Buttons */}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 6,
            }}
          >
            <button onClick={onClose} style={ghostBtn}>
              Cancel
            </button>
            <button
              onClick={create}
              style={primaryBtn}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==== Styles ==== */
const modalWrap = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,18,24,0.36)",
  display: "grid",
  placeItems: "center",
  padding: 16,
  zIndex: 50,
};
const modalCard = {
  width: "min(720px, 100%)",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
};
const xBtn = {
  background: "transparent",
  border: "none",
  fontSize: 20,
  cursor: "pointer",
};
const row = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
const inp = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  fontSize: 14,
  outline: "none",
};
const textArea = {
  ...inp,
  resize: "none",
};
const primaryBtn = {
  padding: "10px 14px",
  background: "#16a34a",
  color: "#fff",
  border: "1px solid #15803d",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};
const ghostBtn = {
  padding: "10px 14px",
  background: "#fff",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};
const smallBtn = {
  padding: "8px",
  background: "#fff",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  cursor: "pointer",
};
