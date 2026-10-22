// Ilustración plana y sobria para las piezas: mar, barco y taza de café. Solo formas, sin fotografías.

export function Mar({ claro = false, barco = true, className = '' }: { claro?: boolean; barco?: boolean; className?: string }) {
  return (
    <svg className={`co-mar ${claro ? 'co-mar-claro' : ''} ${className}`} viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path className="m3" d="M0 92 Q50 84 100 92 T200 92 T300 92 T400 92 V160 H0Z" />
      {barco && (
        <g>
          <path className="casco" d="M96 78 H300 L282 98 H114 Z" />
          <rect className="cabina" x="126" y="58" width="150" height="20" rx="2" />
          <rect className="cabina" x="152" y="42" width="98" height="16" rx="2" />
          <rect className="chimenea" x="190" y="26" width="22" height="16" rx="2" />
          <g className="vent">
            {[134, 152, 170, 188, 206, 224, 242, 260].map((x) => <rect key={x} x={x} y="64" width="9" height="6" rx="1" />)}
            {[162, 180, 198, 216, 234].map((x) => <rect key={x} x={x} y="47" width="9" height="6" rx="1" />)}
          </g>
        </g>
      )}
      <path className="m2" d="M0 102 Q40 94 80 102 T160 102 T240 102 T320 102 T400 102 V160 H0Z" />
      <path className="m1" d="M0 120 Q50 112 100 120 T200 120 T300 120 T400 120 V160 H0Z" />
    </svg>
  )
}

export function Taza({ className = '' }: { className?: string }) {
  return (
    <svg className={`co-taza ${className}`} viewBox="0 0 120 100" aria-hidden="true" focusable="false">
      <path d="M44 8 q-6 8 0 16 M60 4 q-6 8 0 16 M76 8 q-6 8 0 16" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="4" strokeLinecap="round" />
      <path d="M22 34 H88 V62 Q88 82 66 82 H44 Q22 82 22 62 Z" fill="#fff" />
      <path d="M88 42 H98 Q108 42 108 54 Q108 66 96 66 H88" fill="none" stroke="#fff" strokeWidth="6" />
      <rect x="22" y="34" width="66" height="9" fill="#7a4b2a" />
      <ellipse cx="55" cy="90" rx="46" ry="7" fill="#fff" fillOpacity=".9" />
    </svg>
  )
}

export function Flecha({ className = '' }: { className?: string }) {
  return (
    <svg className={`co-flecha ${className}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d="M12 38 H58 V16 L92 50 L58 84 V62 H12 Z" fill="currentColor" />
    </svg>
  )
}

export function Bolsa({ className = '' }: { className?: string }) {
  return (
    <svg className={`co-bolsa ${className}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d="M30 34 H70 L76 84 H24 Z" fill="currentColor" />
      <path d="M38 40 V28 Q38 14 50 14 Q62 14 62 28 V40" fill="none" stroke="currentColor" strokeWidth="6" />
    </svg>
  )
}
