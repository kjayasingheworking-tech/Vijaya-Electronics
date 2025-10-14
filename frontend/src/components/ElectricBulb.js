import '../styles/Bulb.css';

export default function ElectricBulb(){
  return (
    <div className="bulbWrap" aria-hidden="true">
      <svg className="bulbSVG" viewBox="0 0 200 280">
        <defs>
          <radialGradient id="haloGrad" cx="50%" cy="45%">
            <stop offset="0%"  stopColor="#FFA500" stopOpacity="0.40"/>
            <stop offset="45%" stopColor="#FFA500" stopOpacity="0.14"/>
            <stop offset="100%" stopColor="#FFA500" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="glassGrad" cx="50%" cy="40%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06"/>
          </radialGradient>
          <linearGradient id="baseGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#2a3550"/>
            <stop offset="100%" stopColor="#0f1729"/>
          </linearGradient>
        </defs>

        {/* Glow halo */}
        <circle className="halo" cx="100" cy="120" r="90" fill="url(#haloGrad)"/>

        {/* Glass bulb */}
        <ellipse cx="100" cy="120" rx="70" ry="85" fill="url(#glassGrad)"
                 stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>

        {/* Filament posts */}
        <line x1="82" y1="155" x2="82" y2="128" stroke="#888fb4" strokeWidth="3"/>
        <line x1="118" y1="155" x2="118" y2="128" stroke="#888fb4" strokeWidth="3"/>

        {/* Filament coil */}
        <path className="filament"
              d="M82 128 q10 -12 18 0 q8 12 18 0"
              fill="none" stroke="#FFA500" strokeWidth="3" strokeLinecap="round"/>

        {/* Neck */}
        <rect x="78" y="160" width="44" height="16" rx="4" fill="url(#baseGrad)"/>
        {/* Screw base */}
        <g fill="url(#baseGrad)">
          <rect x="74" y="176" width="52" height="12" rx="4"/>
          <rect x="74" y="189" width="52" height="12" rx="4"/>
          <rect x="74" y="202" width="52" height="12" rx="4"/>
        </g>

        {/* Electric orbits */}
        <g className="orbits" stroke="#0057B8" strokeOpacity="0.35" fill="none" strokeWidth="1.2">
          <ellipse cx="100" cy="120" rx="78" ry="24"/>
          <ellipse cx="100" cy="120" rx="66" ry="20" transform="rotate(22 100 120)"/>
          <ellipse cx="100" cy="120" rx="54" ry="16" transform="rotate(-18 100 120)"/>
        </g>
      </svg>
    </div>
  );
}
