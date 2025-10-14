import React, { useEffect, useMemo, useState } from "react";
 import {
   adminCreateDamageInquiryAndRecalculate,
   adminListOriginalIssuedInvoicesForPo,
 } from "../../api/invoices";
import { useToast } from "../../components/ToastProvider";

/**
 * Props:
 *  - open: boolean
 *  - onClose: fn()
 *  - po: the *full* PO object from PODetailAdmin (needs items[] + _id)
 */
export default function DamageInquiryModal({ open, onClose, po }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [invLoading, setInvLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [originalInvoiceId, setOriginalInvoiceId] = useState("");
  const [rows, setRows] = useState([]); // [{product, name, qtyOrdered, rejectedQty, note}]
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    // Map PO items to inquiry rows
    const seed = (po?.items || []).map((it) => ({
      product: it.product,
      name: it.name,
      qtyOrdered: it.quantity,
      rejectedQty: 0,
      note: "",
    }));
    setRows(seed);
    setNote("");
    setOriginalInvoiceId("");
  }, [open, po]);

  // Load supplier ORIGINAL invoices so admin can pick the original as base
  useEffect(() => {
    if (!open || !po?._id) return;
    (async () => {
      setInvLoading(true);
      try {
       const originals = await adminListOriginalIssuedInvoicesForPo(po._id);
       setInvoices(Array.isArray(originals) ? originals : []);
      if ((originals || []).length) setOriginalInvoiceId(originals[0]._id);
      } catch {
        setInvoices([]);
      } finally {
        setInvLoading(false);
      }
    })();
  }, [open, po]);

  const canSubmit = useMemo(() => {
    const hasQty = rows.some((r) => Number(r.rejectedQty) > 0);
    return !!(po?._id && originalInvoiceId && hasQty);
  }, [rows, po, originalInvoiceId]);

  const setQty = (idx, v) => {
    const val = Math.max(0, Math.min(Number(v || 0), rows[idx].qtyOrdered));
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, rejectedQty: val } : r)));
  };

  const setRowNote = (idx, v) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, note: v } : r)));
  };

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const items = rows
        .filter((r) => Number(r.rejectedQty) > 0)
        .map((r) => ({ product: r.product, rejectedQty: Number(r.rejectedQty), note: r.note || "" }));

      const payload = {
        purchaseOrder: po._id,
        originalInvoice: originalInvoiceId,
        items,
        note,
      };

      const res = await adminCreateDamageInquiryAndRecalculate(payload);
      toast.success("Damage inquiry applied. Recalculated invoice issued.");
      // Let bells/notifications refresh
      document.dispatchEvent(new Event("notifications:refresh"));
      onClose?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create damage inquiry");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={backdrop} onMouseDown={(e) => onClose?.()}>
      <div style={card} onMouseDown={(e) => e.stopPropagation()}>
        <div style={head}>
          <h3 style={{ margin: 0 }}>Create Damage Inquiry</h3>
          <button onClick={onClose} style={xBtn}>✕</button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 4 }}>
              Select original invoice (base for recalculation)
            </div>
            <select
              value={originalInvoiceId}
              onChange={(e) => setOriginalInvoiceId(e.target.value)}
              disabled={invLoading}
              style={input}
            >
              {invoices.length === 0 && <option value="">No issued original invoices</option>}
              {invoices.map((inv) => (
                <option key={inv._id} value={inv._id}>
                    {inv.invoiceNumber || inv._id.slice(-6)} ({inv.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ marginBottom: 6, fontWeight: 700 }}>Rejected / Damaged Items</div>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={th}>Item</th>
                  <th style={{ ...th, textAlign: "right" }}>Ordered</th>
                  <th style={{ ...th, textAlign: "right" }}>Rejected Qty</th>
                  <th style={th}>Note</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.product} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td style={td}>{r.name}</td>
                    <td style={{ ...td, textAlign: "right" }}>{r.qtyOrdered}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <input
                        type="number"
                        min={0}
                        max={r.qtyOrdered}
                        value={r.rejectedQty}
                        onChange={(e) => setQty(i, e.target.value)}
                        style={{ ...input, width: 100, textAlign: "right" }}
                      />
                    </td>
                    <td style={td}>
                      <input
                        placeholder="Optional"
                        value={r.note}
                        onChange={(e) => setRowNote(i, e.target.value)}
                        style={input}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 4 }}>Inquiry note (optional)</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{ ...input, resize: "vertical" }}
              placeholder="Any additional info for this inquiry…"
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={btn}>Cancel</button>
          <button onClick={submit} disabled={!canSubmit || loading} style={primaryBtn}>
            {loading ? "Applying…" : "Apply Inquiry & Recalculate"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* styles */
const backdrop = { position: "fixed", inset: 0, background: "rgba(15,18,24,.36)", display: "grid", placeItems: "center", padding: 16, zIndex: 100 };
const card = { width: "min(900px,96vw)", maxHeight: "85vh", overflowY: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, boxShadow: "0 20px 50px rgba(0,0,0,.25)" };
const head = { display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8, marginBottom: 8 };
const xBtn = { padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0f172a", fontWeight: 700, cursor: "pointer" };
const input = { width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 10, outline: "none" };
const tbl = { width: "100%", borderCollapse: "collapse" };
const th = { textAlign: "left", fontSize: 12, color: "#64748b", padding: "8px 0" };
const td = { padding: "8px 0", fontSize: 14 };
const btn = { padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", fontWeight: 700, cursor: "pointer" };
const primaryBtn = { padding: "10px 14px", background: "#0ea5e9", color: "#fff", border: "1px solid #0284c7", borderRadius: 10, fontWeight: 800, cursor: "pointer" };
