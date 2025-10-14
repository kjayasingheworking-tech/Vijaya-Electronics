// components/StatCard.js
export default function StatCard({ title, value, children, className='' }) {
  return (
    <div className={`statCard ${className}`}>
      <span className="title">{title}</span>
      <div className="value">{value}</div>
      {children}
    </div>
  );
}
