// src/api/supplier.js
import api from "../api/axios";

// ---------- PURCHASE ORDERS (Supplier) ----------
export const listSupplierPOs = async (status) => {
  const { data } = await api.get("/po/me/purchase-orders", {
    params: status ? { status } : {},
  });
  return data;
};

export const getSupplierPO = async (id) => {
  const { data } = await api.get(`/po/me/purchase-orders/${id}`);
  return data;
};

export const supplierChangePOStatus = async (id, to, note) => {
  const { data } = await api.patch(`/po/me/purchase-orders/${id}/status`, { to, note });
  return data;
};

// ---------- INVOICES (Supplier) ----------
export const listMyInvoices = async ({ status, po } = {}) => {
  const { data } = await api.get("/inv/me/invoices", {
    params: { status, po },
  });
  return data;
};

export const supplierCreateInvoice = async ({ purchaseOrder, additionalCharges = [], notes = "" }) => {
  const payload = { purchaseOrder, additionalCharges, notes };
  const { data } = await api.post("/inv/me/invoices", payload);
  return data;
};



// Get one of my invoices by id (we fetch by PO when available for efficiency)
export const getMyInvoiceById = async (id, hintPoId) => {
  const params = hintPoId ? { po: hintPoId } : {};
  const { data } = await api.get("/inv/me/invoices", { params });   // ← /inv not /invoice
  const rows = Array.isArray(data) ? data : [];
  return rows.find((r) => r._id === id) || null;
};