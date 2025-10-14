// src/api/axios.js
import axios from "axios";
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5001";

const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // optional auto-logout on expired token
      ["token","electra_user","user"].forEach(k=>localStorage.removeItem(k));
      if (window.location.pathname !== "/") window.location.replace("/");
    }
    return Promise.reject(err);
  }
);

export default api;
