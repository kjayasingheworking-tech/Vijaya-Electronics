import React from "react";

export default function QtyInput({ value, onChange }) {
  return (
    <input
      type="number"
      min={1}
      value={value}
      onChange={(e) => onChange?.(Number(e.target.value))}
      style={{
        width: 72,
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
      }}
    />
  );
}
