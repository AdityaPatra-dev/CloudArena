import React from 'react';

export default function Logo({ className = "w-9 h-9", alt = "CloudArena Logo" }) {
  return (
    <img 
      src="/cloudarena.png" 
      alt={alt}
      className={`object-contain select-none transition-all duration-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.4)] ${className}`}
    />
  );
}
