import React, { createContext, useContext, useState, useCallback } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]); // [{id, type, msg}]

  const push = useCallback((type, msg, ttl = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, msg }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, ttl);
  }, []);

  const value = {
    success: (m, ttl) => push("success", m, ttl),
    error:   (m, ttl) => push("error", m, ttl),
    info:    (m, ttl) => push("info", m, ttl),
  };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div style={wrap}>
        {toasts.map((t) => (
          <div key={t.id} style={{ ...toast, ...byType[t.type] }}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    // Safe no-op fallback so app doesn't crash if provider isn't mounted yet
    return { success(){}, error(){}, info(){} };
  }
  return ctx;
}

/* styles */
const wrap = {
  position: "fixed",
  top: 88, right: 16, display: "grid", gap: 8, zIndex: 9999,
};
const toast = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 20px rgba(0,0,0,.08)",
  fontWeight: 600,
  background: "#fff",
};
const byType = {
  success: { background: "#ecfdf5", borderColor: "#bbf7d0", color: "#065f46" },
  error:   { background: "#fef2f2", borderColor: "#fecaca", color: "#7f1d1d" },
  info:    { background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e3a8a" },
};
