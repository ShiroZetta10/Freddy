import type { Avatar as A } from '../../data/comunicacion'

// Avatar original y esquemático: sin rasgos reales ni personas reconocibles.
export default function AvatarSvg({ a, size = 96 }: { a: A; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Ilustración de la persona" style={{ display: 'block', borderRadius: '50%' }}>
      <rect width="100" height="100" fill={a.fondo} />
      <path d="M14 100c2-20 18-30 36-30s34 10 36 30z" fill={a.ropa} />
      <rect x="43" y="56" width="14" height="14" rx="5" fill={a.piel} />
      {a.peloTipo === 'largo' && <path d="M26 44c0-20 10-28 24-28s24 8 24 28v26c-4 2-8 0-10-6V42H36v22c-2 6-6 8-10 6z" fill={a.pelo} />}
      {a.peloTipo === 'moño' && <circle cx="50" cy="14" r="9" fill={a.pelo} />}
      <ellipse cx="50" cy="44" rx="17" ry="20" fill={a.piel} />
      {a.peloTipo === 'largo' && <path d="M32 40c4-14 12-18 20-18 8 0 14 5 16 18-8-6-22-8-36 0z" fill={a.pelo} />}
      {a.peloTipo === 'moño' && <path d="M32 42c2-16 10-22 18-22s16 6 18 22c-8-6-28-6-36 0z" fill={a.pelo} />}
      {a.peloTipo === 'corto' && <path d="M32 42c0-16 8-24 18-24s18 8 18 24c-6-8-30-8-36 0z" fill={a.pelo} />}
      {a.peloTipo === 'gorra' && (
        <>
          <path d="M31 40c0-16 8-24 19-24s19 8 19 24z" fill={a.pelo} />
          <path d="M30 40h46c0 3-3 5-8 5H30z" fill={a.ropa} />
        </>
      )}
      {a.peloTipo === 'calvo' && <path d="M33 38c1-4 4-6 6-6M67 38c-1-4-4-6-6-6" stroke={a.pelo} strokeWidth="4" strokeLinecap="round" fill="none" />}
      <circle cx="43" cy="46" r="1.8" fill="#1c2433" />
      <circle cx="57" cy="46" r="1.8" fill="#1c2433" />
      <path d="M44 55c4 3 8 3 12 0" stroke="#1c2433" strokeWidth="2" strokeLinecap="round" fill="none" />
      {a.gafas && (
        <g stroke="#1c2433" strokeWidth="1.8" fill="none">
          <circle cx="43" cy="46" r="5" />
          <circle cx="57" cy="46" r="5" />
          <path d="M48 46h4" />
        </g>
      )}
    </svg>
  )
}
