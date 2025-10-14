import '../styles/InfoRail.css';

export default function InfoRail(){
  return (
    <div className="infoRail" aria-hidden="false">
      <div className="rail">
        {/* Fast Delivery */}
        <div className="chip">
          <span className="icon">
            {/* truck icon */}
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 6h11v8H3V6zm11 0h3l3 4v4h-6V6zM6 19.5a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5zm10 0a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5zM4.5 13H8V9H4.5v4z"/></svg>
          </span>
          <div className="txt">
            <strong>Fast Delivery</strong>
            <small>24–48h dispatch</small>
          </div>
        </div>
        {/* Secure Payments */}
        <div className="chip">
          <span className="icon">
            {/* shield icon */}
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l8 4v6c0 5.25-3.438 9.75-8 11-4.562-1.25-8-5.75-8-11V6l8-4z"/></svg>
          </span>
          <div className="txt">
            <strong>Secure Payments</strong>
            <small>SSL & PCI compliant</small>
          </div>
        </div>
        {/* Warranty */}
        <div className="chip">
          <span className="icon">
            {/* spark/bolt icon */}
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
          </span>
          <div className="txt">
            <strong>Warranty</strong>
            <small>Up to 2 years</small>
          </div>
        </div>
      </div>
    </div>
  );
}
