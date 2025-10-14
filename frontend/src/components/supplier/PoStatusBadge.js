// src/components/supplier/PoStatusBadge.js
import React from "react";

const MAP = {
  new: { label: "New", bg: "#e2e8f0", color: "#0f172a" },
  accepted: { label: "Accepted", bg: "#dcfce7", color: "#14532d" },
  packing: { label: "Packing", bg: "#fee2e2", color: "#7f1d1d" },
  shipped: { label: "Shipped", bg: "#dbeafe", color: "#1e3a8a" },
  delivered: { label: "Delivered", bg: "#ede9fe", color: "#4c1d95" },
  checking: { label: "Checking", bg: "#fef9c3", color: "#78350f" },
  inquired: { label: "Inquired", bg: "#ffe4e6", color: "#881337" },
  pending_payment: { label: "Pending Payment", bg: "#f1f5f9", color: "#334155" },
  payment_done: { label: "Payment Done", bg: "#d1fae5", color: "#064e3b" },
  closed: { label: "Closed", bg: "#f8fafc", color: "#0f172a" },
};

export default function PoStatusBadge({ value }) {
  const v = (value || "").toLowerCase();
  const sty = MAP[v] || MAP.new;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: 999,
        background: sty.bg,
        color: sty.color,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {sty.label}
    </span>
  );
}
