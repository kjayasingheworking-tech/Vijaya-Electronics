import React from "react";

export default function RatingStars({ value = 0, size = 18 }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div aria-label={`Rating ${value} of 5`} style={{ display: "inline-flex", gap: 4 }}>
      {stars.map((s) => (
        <svg
          key={s}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          style={{
            filter: s <= value ? "drop-shadow(0 0 4px rgba(255,200,0,.6))" : "none",
          }}
        >
          <path
            fill={s <= value ? "#fbbf24" : "#e5e7eb"}
            d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          />
        </svg>
      ))}
    </div>
  );
}
