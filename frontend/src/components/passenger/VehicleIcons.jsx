import React from 'react';

// ── Ultra-Realistic Uber Fleet Vehicle Icons (3D Top-Down Perspective) ──

export function BikeIcon({ size = 48, className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <defs>
        <linearGradient id="bikeBodyGrad" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="bikeSeatGrad" x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <filter id="bikeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#00edff" floodOpacity="0.4" />
        </filter>
      </defs>
      {/* Drop Shadow */}
      <ellipse cx="32" cy="34" rx="12" ry="26" fill="rgba(0,0,0,0.55)" />
      {/* Wheels */}
      <rect x="29" y="4" width="6" height="13" rx="3" fill="#1e293b" stroke="#00edff" strokeWidth="1.5" />
      <rect x="29" y="47" width="6" height="13" rx="3" fill="#1e293b" stroke="#00edff" strokeWidth="1.5" />
      {/* Front Mudguard & Fork */}
      <path d="M26 12C26 8 38 8 38 12L36 18H28L26 12Z" fill="#0284c7" />
      {/* Handlebars & Side Mirrors */}
      <path d="M12 18H52" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="10" cy="18" r="3" fill="#00edff" stroke="#0f172a" strokeWidth="1" />
      <circle cx="54" cy="18" r="3" fill="#00edff" stroke="#0f172a" strokeWidth="1" />
      <path d="M16 18L24 22M48 18L40 22" stroke="#38bdf8" strokeWidth="1.5" />
      {/* Fuel Tank & Frame Body */}
      <path d="M24 20C24 18 27 17 32 17C37 17 40 18 40 20L42 34C42 38 38 40 32 40C26 40 22 38 22 34L24 20Z" fill="url(#bikeBodyGrad)" stroke="#00edff" strokeWidth="1.5" filter="url(#bikeGlow)" />
      {/* Dual Seat Cushion */}
      <ellipse cx="32" cy="33" rx="6.5" ry="9" fill="url(#bikeSeatGrad)" stroke="#475569" strokeWidth="1" />
      {/* Rider Helmet Contour */}
      <circle cx="32" cy="27" r="5" fill="#f8fafc" opacity="0.9" />
      {/* Xenon Headlight Beam */}
      <path d="M30 6L32 2L34 6Z" fill="#ffffff" />
      <circle cx="32" cy="8" r="2.5" fill="#ffffff" />
    </svg>
  );
}

export function AutoIcon({ size = 48, className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <defs>
        <linearGradient id="autoRoofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="35%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <linearGradient id="autoGlass" x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" opacity="0.9" />
          <stop offset="100%" stopColor="#0284c7" opacity="0.4" />
        </linearGradient>
        <filter id="autoGlow">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#eab308" floodOpacity="0.35" />
        </filter>
      </defs>
      {/* Ground Shadow */}
      <ellipse cx="32" cy="36" rx="22" ry="26" fill="rgba(0,0,0,0.6)" />
      {/* Exposed Heavy Rear Tires */}
      <rect x="7" y="40" width="8" height="16" rx="3.5" fill="#0f172a" stroke="#ca8a04" strokeWidth="1.5" />
      <rect x="49" y="40" width="8" height="16" rx="3.5" fill="#0f172a" stroke="#ca8a04" strokeWidth="1.5" />
      {/* Single Front Wheel */}
      <rect x="29" y="3" width="6" height="11" rx="3" fill="#0f172a" stroke="#eab308" strokeWidth="1.5" />
      {/* Front Nose Bonnet */}
      <path d="M23 13C23 10 27 8 32 8C37 8 41 10 41 13V22H23V13Z" fill="#eab308" stroke="#fef08a" strokeWidth="1.5" filter="url(#autoGlow)" />
      <circle cx="32" cy="11" r="2.5" fill="#ffffff" />
      {/* Glass Windshield curved */}
      <path d="M20 20C20 18 24 17 32 17C40 17 44 18 44 20L42 27H22L20 20Z" fill="url(#autoGlass)" stroke="#38bdf8" strokeWidth="1.2" />
      {/* Main Canopy Green/Yellow Body */}
      <path d="M14 26C14 23 18 22 32 22C46 22 50 23 50 26L49 54C49 57 43 58 32 58C21 58 15 57 15 54L14 26Z" fill="#15803d" stroke="#22c55e" strokeWidth="2" />
      {/* Black Soft-Top Canopy Roof Cover */}
      <rect x="18" y="27" width="28" height="26" rx="5" fill="#0f172a" stroke="#eab308" strokeWidth="1.5" />
      {/* Roof Canvas Stitches */}
      <line x1="18" y1="35" x2="46" y2="35" stroke="#334155" strokeWidth="1.5" />
      <line x1="18" y1="43" x2="46" y2="43" stroke="#334155" strokeWidth="1.5" />
      {/* Rear Taillights */}
      <rect x="16" y="55" width="7" height="2.5" rx="1" fill="#ef4444" />
      <rect x="41" y="55" width="7" height="2.5" rx="1" fill="#ef4444" />
    </svg>
  );
}

export function MiniIcon({ size = 48, className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <defs>
        <linearGradient id="miniBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="40%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="miniGlass" x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" opacity="0.95" />
          <stop offset="100%" stopColor="#0369a1" opacity="0.6" />
        </linearGradient>
        <filter id="miniGlow">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.4" />
        </filter>
      </defs>
      {/* Ground Shadow */}
      <ellipse cx="32" cy="34" rx="20" ry="26" fill="rgba(0,0,0,0.6)" />
      {/* Wheels */}
      <rect x="10" y="14" width="4" height="12" rx="2" fill="#0f172a" />
      <rect x="50" y="14" width="4" height="12" rx="2" fill="#0f172a" />
      <rect x="10" y="40" width="4" height="12" rx="2" fill="#0f172a" />
      <rect x="50" y="40" width="4" height="12" rx="2" fill="#0f172a" />
      {/* Outer Car Body Frame */}
      <rect x="14" y="6" width="36" height="52" rx="12" fill="url(#miniBody)" stroke="#38bdf8" strokeWidth="2" filter="url(#miniGlow)" />
      {/* Side Mirrors */}
      <rect x="8" y="18" width="6" height="4" rx="2" fill="#38bdf8" stroke="#0f172a" strokeWidth="1" />
      <rect x="50" y="18" width="6" height="4" rx="2" fill="#38bdf8" stroke="#0f172a" strokeWidth="1" />
      {/* Front Windshield */}
      <path d="M20 16C20 13 24 12 32 12C40 12 44 13 44 16L41 24H23L20 16Z" fill="url(#miniGlass)" stroke="#7dd3fc" strokeWidth="1.2" />
      {/* Cabin Roof */}
      <rect x="22" y="26" width="20" height="16" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
      {/* Rear Windshield */}
      <path d="M21 44H43L42 49C42 51 38 52 32 52C26 52 22 51 22 49L21 44Z" fill="url(#miniGlass)" stroke="#7dd3fc" strokeWidth="1.2" />
      {/* LED Headlights */}
      <ellipse cx="19" cy="8" rx="2.5" ry="1.5" fill="#ffffff" />
      <ellipse cx="45" cy="8" rx="2.5" ry="1.5" fill="#ffffff" />
      {/* LED Taillights */}
      <rect x="17" y="55" width="7" height="2" rx="1" fill="#ef4444" />
      <rect x="40" y="55" width="7" height="2" rx="1" fill="#ef4444" />
    </svg>
  );
}

export function SedanIcon({ size = 48, className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <defs>
        <linearGradient id="sedanBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00edff" />
          <stop offset="35%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#090d16" />
        </linearGradient>
        <linearGradient id="sedanGlass" x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0%" stopColor="#a5f3fc" opacity="0.95" />
          <stop offset="100%" stopColor="#0284c7" opacity="0.6" />
        </linearGradient>
        <filter id="sedanGlow">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#00edff" floodOpacity="0.45" />
        </filter>
      </defs>
      {/* Ground Shadow */}
      <ellipse cx="32" cy="34" rx="21" ry="27" fill="rgba(0,0,0,0.65)" />
      {/* Wheels */}
      <rect x="9" y="14" width="4" height="12" rx="2" fill="#0f172a" />
      <rect x="51" y="14" width="4" height="12" rx="2" fill="#0f172a" />
      <rect x="9" y="40" width="4" height="12" rx="2" fill="#0f172a" />
      <rect x="51" y="40" width="4" height="12" rx="2" fill="#0f172a" />
      {/* Sleek Aerodynamic Body */}
      <path d="M16 10C16 5 22 4 32 4C42 4 48 5 48 10L50 52C50 57 43 58 32 58C21 58 14 57 14 52L16 10Z" fill="url(#sedanBody)" stroke="#00edff" strokeWidth="2" filter="url(#sedanGlow)" />
      {/* Front Chrome Grill Accent */}
      <path d="M22 6C24 5 28 4.5 32 4.5C36 4.5 40 5 42 6" stroke="#ffffff" strokeWidth="1.5" />
      {/* Side Mirrors */}
      <rect x="8" y="18" width="6" height="4" rx="2" fill="#00edff" stroke="#0f172a" strokeWidth="1" />
      <rect x="50" y="18" width="6" height="4" rx="2" fill="#00edff" stroke="#0f172a" strokeWidth="1" />
      {/* Curved Windshield */}
      <path d="M19 16C19 13 23 12 32 12C41 12 45 13 45 16L42 25H22L19 16Z" fill="url(#sedanGlass)" stroke="#a5f3fc" strokeWidth="1.2" />
      {/* Panoramic Roof Cover */}
      <rect x="21" y="27" width="22" height="17" rx="4" fill="#0f172a" stroke="#00edff" strokeWidth="1.2" />
      {/* Rear Slanted Glass */}
      <path d="M21 46H43L42 51C42 53 38 54 32 54C26 54 22 53 22 51L21 46Z" fill="url(#sedanGlass)" stroke="#a5f3fc" strokeWidth="1.2" />
      {/* Dual Xenon Headlights */}
      <ellipse cx="18" cy="7" rx="3" ry="1.5" fill="#ffffff" />
      <ellipse cx="46" cy="7" rx="3" ry="1.5" fill="#ffffff" />
      {/* Red LED Taillight Bar */}
      <path d="M16 55H25M39 55H48" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function SuvIcon({ size = 48, className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <defs>
        <linearGradient id="suvBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="40%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="suvGlass" x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0%" stopColor="#c7d2fe" opacity="0.95" />
          <stop offset="100%" stopColor="#4338ca" opacity="0.6" />
        </linearGradient>
        <filter id="suvGlow">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#818cf8" floodOpacity="0.45" />
        </filter>
      </defs>
      {/* Ground Shadow */}
      <ellipse cx="32" cy="34" rx="23" ry="27" fill="rgba(0,0,0,0.7)" />
      {/* Heavy SUV Tires */}
      <rect x="7" y="13" width="5" height="14" rx="2" fill="#0f172a" />
      <rect x="52" y="13" width="5" height="14" rx="2" fill="#0f172a" />
      <rect x="7" y="39" width="5" height="14" rx="2" fill="#0f172a" />
      <rect x="52" y="39" width="5" height="14" rx="2" fill="#0f172a" />
      {/* Broad SUV Body */}
      <path d="M13 8C13 4 20 3 32 3C44 3 51 4 51 8L52 53C52 57 44 58 32 58C20 58 12 57 12 53L13 8Z" fill="url(#suvBody)" stroke="#818cf8" strokeWidth="2" filter="url(#suvGlow)" />
      {/* Roof Rack Rails */}
      <rect x="15" y="16" width="2.5" height="32" fill="#e0e7ff" rx="1" />
      <rect x="46.5" y="16" width="2.5" height="32" fill="#e0e7ff" rx="1" />
      {/* Side Mirrors */}
      <rect x="6" y="17" width="6" height="5" rx="2" fill="#818cf8" stroke="#0f172a" strokeWidth="1" />
      <rect x="52" y="17" width="6" height="5" rx="2" fill="#818cf8" stroke="#0f172a" strokeWidth="1" />
      {/* Front Windshield */}
      <path d="M18 15C18 13 22 12 32 12C42 12 46 13 46 15L43 24H21L18 15Z" fill="url(#suvGlass)" stroke="#c7d2fe" strokeWidth="1.2" />
      {/* Cabin Roof */}
      <rect x="20" y="26" width="24" height="20" rx="4" fill="#0f172a" stroke="#818cf8" strokeWidth="1.2" />
      {/* Rear Glass */}
      <path d="M20 48H44L43 52C43 54 39 55 32 55C25 55 21 54 21 52L20 48Z" fill="url(#suvGlass)" stroke="#c7d2fe" strokeWidth="1.2" />
      {/* Dual Headlights */}
      <ellipse cx="17" cy="6" rx="3.5" ry="1.8" fill="#ffffff" />
      <ellipse cx="47" cy="6" rx="3.5" ry="1.8" fill="#ffffff" />
    </svg>
  );
}

export function PrimeIcon({ size = 48, className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <defs>
        <linearGradient id="primeBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="40%" stopColor="#059669" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>
        <linearGradient id="primeGlass" x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0%" stopColor="#a7f3d0" opacity="0.95" />
          <stop offset="100%" stopColor="#047857" opacity="0.6" />
        </linearGradient>
        <filter id="primeGlow">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#34d399" floodOpacity="0.5" />
        </filter>
      </defs>
      {/* Ground Shadow */}
      <ellipse cx="32" cy="34" rx="21" ry="27" fill="rgba(0,0,0,0.65)" />
      {/* EV Aerodynamic Body */}
      <path d="M15 9C15 4 21 3 32 3C43 3 49 4 49 9L50 52C50 57 43 58 32 58C21 58 14 57 14 52L15 9Z" fill="url(#primeBody)" stroke="#34d399" strokeWidth="2" filter="url(#primeGlow)" />
      {/* EV Signature Lightbar (Front) */}
      <path d="M18 5C24 4 40 4 46 5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      {/* Mirrors */}
      <rect x="7" y="17" width="6" height="4" rx="2" fill="#34d399" stroke="#0f172a" strokeWidth="1" />
      <rect x="51" y="17" width="6" height="4" rx="2" fill="#34d399" stroke="#0f172a" strokeWidth="1" />
      {/* Panoramic Glass Roof */}
      <path d="M18 15C18 12 22 11 32 11C42 11 46 12 46 15L43 48C43 51 39 52 32 52C25 52 21 51 21 48L18 15Z" fill="url(#primeGlass)" stroke="#a7f3d0" strokeWidth="1.2" />
      {/* Electric Sparkle Emblem */}
      <circle cx="32" cy="28" r="4" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  );
}

export function VehicleIcon({ type = 'mini', size = 48, className = '', style = {} }) {
  const t = String(type).toLowerCase();
  if (t.includes('bike') || t.includes('moto') || type === '🏍️') {
    return <BikeIcon size={size} className={className} style={style} />;
  }
  if (t.includes('auto') || type === '🛺') {
    return <AutoIcon size={size} className={className} style={style} />;
  }
  if (t.includes('sedan') || t.includes('premier') || type === '🚙') {
    return <SedanIcon size={size} className={className} style={style} />;
  }
  if (t.includes('suv') || t.includes('xl') || type === '🚐') {
    return <SuvIcon size={size} className={className} style={style} />;
  }
  if (t.includes('prime') || t.includes('electric') || t.includes('ev') || type === '✨' || type === '⚡') {
    return <PrimeIcon size={size} className={className} style={style} />;
  }
  return <MiniIcon size={size} className={className} style={style} />;
}

export function getVehicleSvgString(type = 'mini') {
  const t = String(type).toLowerCase();
  if (t.includes('bike') || t.includes('moto') || type === '🏍️') {
    return `<svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="34" rx="12" ry="26" fill="rgba(0,0,0,0.55)"/><rect x="29" y="4" width="6" height="13" rx="3" fill="#1e293b" stroke="#00edff" stroke-width="1.5"/><rect x="29" y="47" width="6" height="13" rx="3" fill="#1e293b" stroke="#00edff" stroke-width="1.5"/><path d="M12 18H52" stroke="#64748b" stroke-width="3.5" stroke-linecap="round"/><circle cx="10" cy="18" r="3" fill="#00edff"/><circle cx="54" cy="18" r="3" fill="#00edff"/><path d="M24 20C24 18 27 17 32 17C37 17 40 18 40 20L42 34C42 38 38 40 32 40C26 40 22 38 22 34L24 20Z" fill="#0284c7" stroke="#00edff" stroke-width="1.5"/><circle cx="32" cy="27" r="5" fill="#f8fafc"/></svg>`;
  }
  if (t.includes('auto') || type === '🛺') {
    return `<svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="36" rx="22" ry="26" fill="rgba(0,0,0,0.6)"/><rect x="7" y="40" width="8" height="16" rx="3.5" fill="#0f172a" stroke="#ca8a04" stroke-width="1.5"/><rect x="49" y="40" width="8" height="16" rx="3.5" fill="#0f172a" stroke="#ca8a04" stroke-width="1.5"/><rect x="29" y="3" width="6" height="11" rx="3" fill="#0f172a" stroke="#eab308" stroke-width="1.5"/><path d="M23 13C23 10 27 8 32 8C37 8 41 10 41 13V22H23V13Z" fill="#eab308" stroke="#fef08a" stroke-width="1.5"/><path d="M14 26C14 23 18 22 32 22C46 22 50 23 50 26L49 54C49 57 43 58 32 58C21 58 15 57 15 54L14 26Z" fill="#15803d" stroke="#22c55e" stroke-width="2"/><rect x="18" y="27" width="28" height="26" rx="5" fill="#0f172a" stroke="#eab308" stroke-width="1.5"/></svg>`;
  }
  if (t.includes('sedan') || t.includes('premier') || type === '🚙') {
    return `<svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="34" rx="21" ry="27" fill="rgba(0,0,0,0.65)"/><path d="M16 10C16 5 22 4 32 4C42 4 48 5 48 10L50 52C50 57 43 58 32 58C21 58 14 57 14 52L16 10Z" fill="#0284c7" stroke="#00edff" stroke-width="2"/><path d="M19 16C19 13 23 12 32 12C41 12 45 13 45 16L42 25H22L19 16Z" fill="#a5f3fc" opacity="0.9"/><rect x="21" y="27" width="22" height="17" rx="4" fill="#0f172a" stroke="#00edff" stroke-width="1.2"/><ellipse cx="18" cy="7" rx="3" ry="1.5" fill="#ffffff"/><ellipse cx="46" cy="7" rx="3" ry="1.5" fill="#ffffff"/></svg>`;
  }
  if (t.includes('suv') || t.includes('xl') || type === '🚐') {
    return `<svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="34" rx="23" ry="27" fill="rgba(0,0,0,0.7)"/><path d="M13 8C13 4 20 3 32 3C44 3 51 4 51 8L52 53C52 57 44 58 32 58C20 58 12 57 12 53L13 8Z" fill="#4f46e5" stroke="#818cf8" stroke-width="2"/><rect x="15" y="16" width="2.5" height="32" fill="#e0e7ff" rx="1"/><rect x="46.5" y="16" width="2.5" height="32" fill="#e0e7ff" rx="1"/><ellipse cx="17" cy="6" rx="3.5" ry="1.8" fill="#ffffff"/><ellipse cx="47" cy="6" rx="3.5" ry="1.8" fill="#ffffff"/></svg>`;
  }
  if (t.includes('prime') || t.includes('electric') || t.includes('ev') || type === '✨' || type === '⚡') {
    return `<svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="34" rx="21" ry="27" fill="rgba(0,0,0,0.65)"/><path d="M15 9C15 4 21 3 32 3C43 3 49 4 49 9L50 52C50 57 43 58 32 58C21 58 14 57 14 52L15 9Z" fill="#059669" stroke="#34d399" stroke-width="2"/><path d="M18 5C24 4 40 4 46 5" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="28" r="4" fill="#34d399" stroke="#ffffff" stroke-width="1.5"/></svg>`;
  }
  return `<svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="34" rx="20" ry="26" fill="rgba(0,0,0,0.6)"/><rect x="14" y="6" width="36" height="52" rx="12" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/><path d="M20 16C20 13 24 12 32 12C40 12 44 13 44 16L41 24H23L20 16Z" fill="#7dd3fc" opacity="0.95"/><ellipse cx="19" cy="8" rx="2.5" ry="1.5" fill="#ffffff"/><ellipse cx="45" cy="8" rx="2.5" ry="1.5" fill="#ffffff"/></svg>`;
}

export default VehicleIcon;
