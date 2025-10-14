// src/api/supProducts.js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5001";

const api = axios.create({
  baseURL: `${API_BASE}/api/supproducts`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Supplier self-service endpoints
export const listMyProducts = () => api.get("/me/products");

export const createMyProduct = (formData) =>
  api.post("/me/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateMyProduct = (id, payload) => {
  const isFormData = payload instanceof FormData;
  return api.patch(`/me/products/${id}`, payload, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });
};

export const deleteMyProduct = (id) => api.delete(`/me/products/${id}`);

export const getProductHistory = (id) =>
  api.get(`/me/products/${id}/history`);

export const uploadProductImages = (id, formData) =>
  api.post(`/me/products/${id}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export default api;
