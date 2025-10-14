import React from "react";

const MAP = {
  new: "#111827",
  accepted: "#2563eb",
  packing: "#7c3aed",
  shipped: "#0891b2",
  delivered: "#10b981",
  checking: "#f59e0b",
  inquired: "#ef4444",
  pending_payment: "#0ea5e9",
  payment_done: "#16a34a",
  closed: "#334155",
};

export default function StatusPill({ value }) {
  const bg = MAP[value] || "#475569";
  return (
    <span
      style={{
        background: bg,
        color: "#fff",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}
    >
      {value}
    </span>
  );
}
