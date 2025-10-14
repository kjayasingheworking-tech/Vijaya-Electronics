// src/components/supplier/StatusActions.js
import React from "react";
import { supplierChangePOStatus } from "../../api/supplier";

const NEXT_BY_STATUS = {
  new: { to: "accepted", label: "Accept Order" },
  accepted: { to: "packing", label: "Start Packing" },
  packing: { to: "shipped", label: "Mark as Shipped" },
};

export default function StatusActions({ po, onChanged }) {
  const curr = (po?.status || "").toLowerCase();
  const next = NEXT_BY_STATUS[curr];

  if (!next) return null;

  const handle = async () => {
    try {
      const updated = await supplierChangePOStatus(po._id, next.to, "");
      onChanged?.(updated);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to change status");
    }
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={handle}
        style={{
          padding: "10px 14px",
          background: "#0ea5e9",
          color: "#fff",
          border: "1px solid #0284c7",
          borderRadius: 10,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {next.label}
      </button>
    </div>
  );
}
