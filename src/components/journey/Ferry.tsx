import { C } from './paleta'

/** Fast ferry tipo catamarán (casco blanco, franjas navy y amarilla). Caja 120×48, proa a la derecha. Sin marcas. */
export function FerryShape() {
  return (
    <g>
      <path d="M10 37 H50 L46 45 H14Z" fill="#dfe5ef" />
      <path d="M70 37 H110 L104 45 H74Z" fill="#dfe5ef" />
      <path d="M4 29 H114 L108 38 H12Z" fill="#fff" stroke="#cfd6e4" strokeWidth=".8" />
      <path d="M5.6 31.6 H113" stroke={C.yellow} strokeWidth="2.4" />
      <path d="M8 35 H110.5" stroke={C.navy} strokeWidth="2.6" />
      <rect x="14" y="21" width="88" height="9" rx="2" fill="#fff" stroke="#cfd6e4" strokeWidth=".8" />
      {Array.from({ length: 11 }).map((_, i) => (
        <rect key={i} x={19 + i * 7.6} y="23.5" width="4.6" height="3.2" rx=".8" fill={C.navy} />
      ))}
      <path d="M28 21 L35 11 H85 L93 21Z" fill="#fff" stroke="#cfd6e4" strokeWidth=".8" />
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} x={38 + i * 7.8} y="14" width="5.2" height="3.6" rx=".8" fill={C.navy} />
      ))}
      <rect x="50" y="3.5" width="38" height="8" rx="2" fill="#fff" stroke="#cfd6e4" strokeWidth=".8" />
      <rect x="53" y="5.6" width="32" height="3.2" rx="1" fill={C.navy} />
      <path d="M69 3.5 V0" stroke={C.g4} strokeWidth="1" />
      <rect x="28" y="19.6" width="66" height="1.8" fill={C.yellow} />
    </g>
  )
}

export function FerrySvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 48" aria-hidden focusable="false">
      <FerryShape />
    </svg>
  )
}
