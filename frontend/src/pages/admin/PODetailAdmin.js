import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/axios";
import "../../styles/admin-po.css";
import StatusPill from "../../components/StatusPill";
import { useToast } from "../../components/ToastProvider";
import DamageInquiryModal from "../../components/admin/DamageInquiryModal";

// Admin transition flow (must match backend)
const ADMIN_FLOW = {
  shipped: ["delivered"],
  delivered: ["checking"],
  checking: ["inquired", "pending_payment"],
  inquired: ["checking", "pending_payment"],
  pending_payment: ["payment_done"],
  payment_done: ["closed"],
};

const money = (n) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(
    Number(n || 0)
  );

export default function PODetailAdmin() {
  const { id } = useParams();
  const toast = useToast();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [openInquiry, setOpenInquiry] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/po/admin/purchase-orders/${id}`); // GET admin PO
      setPo(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const nextStates = useMemo(() => ADMIN_FLOW[po?.status] || [], [po]);
const changeStatus = async (to) => {
  //  Step 1: Ask confirmation first
  const confirmed = window.confirm(
    `Are you sure you want to change the status to "${to}"?`
  );
  if (!confirmed) return;

  try {
    setBusy(true);
    // Step 2: Proceed with existing logic (unchanged)
    await api.patch(`/po/admin/purchase-orders/${po._id}/status`, { to, note });
    setNote("");
    toast.success(`Status updated to "${to}".`);

    // Refresh notifications & UI
    document.dispatchEvent(new Event("notifications:refresh"));
    await load();

    //  Step 3: Open inquiry modal only when required
    if (to === "inquired") {
      setOpenInquiry(true);
    }
  } catch (e) {
    toast.error(
      e?.response?.data?.message || e.message || "Failed to change status"
    );
  } finally {
    setBusy(false);
  }
};


  if (loading)
    return (
      <div className="po-page">
        <div className="center">Loading...</div>
      </div>
    );
  if (!po)
    return (
      <div className="po-page">
        <div className="center">Not found</div>
      </div>
    );

  return (
    <div className="po-page">
      <header className="po-head">
        <div>
          <h1>{po.poNumber || po._id}</h1>
          <p className="muted">Supplier: {po.supplier?.name || "—"}</p>
        </div>
        <StatusPill value={po.status} />
      </header>

      <section className="po-sections">
        <div className="section">
          <h3>Items</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit Price</th>
                <th>Qty</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((it, i) => (
                <tr key={i}>
                  <td>{it.name}</td>
                  <td>{money(it.unitPrice)}</td>
                  <td>{it.quantity}</td>
                  <td>{money(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="right mt-8">
            <b>Grand Total: {money(po.totals?.grandTotal || 0)}</b>
          </div>
        </div>

        <div className="section">
          <h3>History</h3>
          <table className="table">
            <thead>
              <tr>
                <th>At</th>
                <th>Role</th>
                <th>From → To</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {(po.history || []).map((h, i) => (
                <tr key={i}>
                  <td>{new Date(h.at).toLocaleString()}</td>
                  <td>{h.role}</td>
                  <td>
                    {(h.from || "—")} → {h.to}
                  </td>
                  <td>{h.note || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section">
          <h3>Next Status</h3>
          {nextStates.length === 0 ? (
            <p className="muted">
              No further transitions available for current status.
            </p>
          ) : (
            <div className="row">
              <input
                placeholder="Optional note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              {nextStates.map((st) => (
                <button
                  key={st}
                  className="btn"
                  disabled={busy}
                  onClick={() => changeStatus(st)}
                >
                  Set {st}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mt-16">
        <Link className="link" to="/admin/purchase-orders">
          ← Back to list
        </Link>
      </div>

      {/* Damage Inquiry modal */}
      <DamageInquiryModal
        open={openInquiry}
        onClose={() => setOpenInquiry(false)}
        po={po}
     />
    </div>
  );
}
