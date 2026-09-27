import React from 'react';

export default function Logo({ className = "w-9 h-9" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="cloudGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="0.5" stopColor="#6366F1" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="coreGrad" x1="16" y1="18" x2="32" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Hexagon Shield */}
      <path
        d="M24 3L41.3205 13V33L24 43L6.67949 33V13L24 3Z"
        stroke="url(#cloudGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="#0b1120"
        fillOpacity="0.8"
      />

      {/* Cyber Cloud Contour */}
      <path
        d="M17 29C14.7909 29 13 27.2091 13 25C13 22.9554 14.5348 21.269 16.5165 21.0305C17.0673 17.6187 20.0212 15 23.6 15C27.0279 15 29.8783 17.3912 30.5594 20.6234C32.5029 20.9458 34 22.6179 34 24.6429C34 26.852 32.2091 28.6429 30 28.6429L17 29Z"
        fill="url(#coreGrad)"
        fillOpacity="0.25"
        stroke="url(#cloudGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central Pulse / Terminal Node */}
      <circle cx="24" cy="24" r="3" fill="#38BDF8" filter="url(#glow)" />
      <path d="M22 34L26 34" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
