import api from "../api/axios";

// Admin: list invoices (optional filters: supplier, po, status, type)
export const adminListInvoices = async (params = {}) => {
  const { data } = await api.get("/inv/admin/invoices", { params });
  return data;
};

// Admin: get invoice
export const adminGetInvoice = async (id) => {
  const { data } = await api.get(`/inv/admin/invoices/${id}`);
  return data;
};

// Admin: close invoice
export const adminCloseInvoice = async (id) => {
  const { data } = await api.patch(`/inv/admin/invoices/${id}/close`);
  return data;
};

// Admin: create damage inquiry and auto-recalculate invoice
// payload: { purchaseOrder, originalInvoice, items: [{product, rejectedQty, note?}], note? }
export const adminCreateDamageInquiryAndRecalculate = async (payload) => {
  const { data } = await api.post(
    "/inv/admin/damage-inquiries/recalculate",
    payload
  );
  return data; // { inquiry, recalculatedInvoice, cancelledInvoice }
};

// Supplier (if you need to fetch originals to pick from)
export const supplierListInvoicesForPo = async (poId) => {
  const { data } = await api.get("/inv/me/invoices", { params: { po: poId } });
  return data;
};
// NEW: Admin – list ORIGINAL, ISSUED invoices for a given PO
export const adminListOriginalIssuedInvoicesForPo = async (poId) => {
  const { data } = await api.get("/inv/admin/invoices", {
    params: { po: poId, type: "original", status: "issued" },
  });
  return data;
};