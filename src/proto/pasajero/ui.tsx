/** Piezas de interfaz propias de la vista pasajero: iconos, hoja inferior, esqueleto, check animado, estrellas. */
import { ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'

export const vibrar = (p: number | number[] = 20) => {
  try {
    navigator.vibrate?.(p)
  } catch {
    /* sin háptica */
  }
}

// ---------------------------------------------------------------- iconos de línea propios
const PATHS: Record<string, ReactNode> = {
  ship: (
    <>
      <path d="M3 16.5l1.7 3.5h14.6l1.7-3.5H3z" />
      <path d="M5.5 16.5l1-5h11l1 5" />
      <path d="M9 11.5V8h6v3.5M12 8V4.5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1 5.1-2.1z" />
    </>
  ),
  cup: (
    <>
      <path d="M5 9h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9z" />
      <path d="M16 10h1.5a2 2 0 0 1 0 4H16M8 3.5c0 1.4 1.5 1.4 1.5 2.8M12 3.5c0 1.4 1.5 1.4 1.5 2.8" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  chat: <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />,
  bag: (
    <>
      <path d="M3 4h2.5l2.1 11h10.6l1.9-8H6.4" />
      <circle cx="9.5" cy="19.5" r="1.3" />
      <circle cx="17" cy="19.5" r="1.3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  anchor: (
    <>
      <circle cx="12" cy="5.5" r="2" />
      <path d="M12 7.5V20M8 11h8M5 14c0 3.3 3 6 7 6s7-2.7 7-6" />
    </>
  ),
  leaf: <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14M5 19c2-4 5-7 9-9" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevR: <path d="M9 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  wifioff: (
    <>
      <path d="M3 9a13 13 0 0 1 4-2.4M21 9a13 13 0 0 0-8.4-3.9M6 12.5a8.5 8.5 0 0 1 3-1.8M18 12.5a8.5 8.5 0 0 0-3.4-2.2M9 16a4 4 0 0 1 6 0" />
      <circle cx="12" cy="19" r=".8" />
      <path d="M4 4l16 16" />
    </>
  ),
  star: <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8L12 3.5z" />,
  send: <path d="M4 12l16-8-6 16-2.5-6.5L4 12z" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="4" width="16" height="13" rx="2" />
      <path d="M4 11h16M7 20v-3M17 20v-3" />
      <circle cx="8" cy="14.2" r=".6" />
      <circle cx="16" cy="14.2" r=".6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z" />
      <circle cx="12" cy="11" r="2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  qr: (
    <>
      <rect x="4" y="4" width="6" height="6" />
      <rect x="14" y="4" width="6" height="6" />
      <rect x="4" y="14" width="6" height="6" />
      <path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  logout: <path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9" />,
  alert: (
    <>
      <path d="M12 4l9 16H3L12 4z" />
      <path d="M12 10v4M12 17v.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  flag: <path d="M6 21V4M6 5h11l-2 4 2 4H6" />,
  voucher: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
      <path d="M14 6.5v11" strokeDasharray="1.8 2.4" />
      <path d="M8 10.5h2.5M8 13.5h2.5" />
    </>
  ),
  wave: <path d="M3 12c2.5-3 4.5-3 7 0s4.5 3 7 0 3-2 4-1.5M3 17c2.5-3 4.5-3 7 0s4.5 3 7 0 3-2 4-1.5" />,
}

export function PI({ n, size = 20, sw = 1.9 }: { n: string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      {PATHS[n] ?? PATHS.check}
    </svg>
  )
}

// ---------------------------------------------------------------- hoja inferior (bottom sheet) con arrastre
export function Sheet({ open, onClose, label, children, tall }: { open: boolean; onClose: () => void; label: string; children: ReactNode; tall?: boolean }) {
  const drag = useDragControls()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    const prev = document.activeElement as HTMLElement | null
    const id = window.setTimeout(() => ref.current?.focus(), 60)
    return () => {
      window.removeEventListener('keydown', k)
      window.clearTimeout(id)
      prev?.focus?.()
    }
  }, [open, onClose])
  const host = document.getElementById('pj-phone') ?? document.body
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="pj-sheet-wrap" key="wrap">
          <motion.div className="pj-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={'pj-sheet' + (tall ? ' tall' : '')}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            ref={ref}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, i) => {
              if (i.offset.y > 110 || i.velocity.y > 650) onClose()
            }}
          >
            <div className="pj-grab" onPointerDown={(e) => drag.start(e)} aria-hidden>
              <i />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    host,
  )
}

// ---------------------------------------------------------------- esqueleto de carga
export function Skeleton({ filas = 4 }: { filas?: number }) {
  return (
    <div className="pj-skel" aria-hidden>
      <div className="blk h1" />
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="row">
          <div className="blk sq" />
          <div className="col">
            <div className="blk l1" />
            <div className="blk l2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- check que se dibuja
export function CheckDraw({ size = 88, color = 'var(--fob-green)' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 52 52" width={size} height={size} aria-hidden>
      <motion.circle cx="26" cy="26" r="23" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.55, ease: 'easeOut' }} />
      <motion.path d="M15 27.5l8 8 14.5-16.5" fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.45, ease: 'easeOut' }} />
    </svg>
  )
}

// ---------------------------------------------------------------- estrellas
export function Stars({ valor, onChange, etiqueta }: { valor: number; onChange: (n: number) => void; etiqueta: (n: number) => string }) {
  return (
    <div className="pj-stars" role="radiogroup" aria-label="Valoración">
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          aria-label={etiqueta(n)}
          className={n <= valor ? 'on' : ''}
          whileTap={{ scale: 0.8 }}
          animate={n <= valor ? { scale: [1, 1.3, 1], rotate: [0, -12, 0] } : { scale: 1 }}
          transition={{ duration: 0.35, delay: n <= valor ? (n - 1) * 0.04 : 0 }}
          onClick={() => {
            vibrar(15)
            onChange(n)
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill={n <= valor ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
            {PATHS.star}
          </svg>
        </motion.button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- olas SVG sutiles
export function Olas({ className = '', color = '#ffffff', opacity = 0.14, fondo }: { className?: string; color?: string; opacity?: number; fondo?: string }) {
  const d = 'M0 40 C 60 10, 120 10, 180 40 S 300 70, 360 40 S 480 10, 540 40 S 660 70, 720 40 V 80 H 0 Z'
  const capa = (cls: string, fill: string, op: number) => (
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className={cls} style={{ opacity: op }}>
      <path d={d} fill={fill} />
      <path d={d} fill={fill} transform="translate(720 0)" />
    </svg>
  )
  return (
    <div className={'pj-waves ' + className} aria-hidden>
      {capa('w1', color, opacity)}
      {capa('w2', color, opacity * 0.7)}
      {fondo && capa('w3', fondo, 1)}
    </div>
  )
}

/** Silueta de barco para la barra de progreso y la bienvenida. */
export function BarcoSVG({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 64 40" aria-hidden>
      <path d="M4 26h56l-6 10H12L4 26z" fill="#fff" />
      <path d="M4 26h56" stroke="#ffcc00" strokeWidth="2.2" />
      <path d="M14 26v-8h30l6 8" fill="#dbe6f7" />
      <rect x="20" y="12" width="14" height="6" rx="1" fill="#fff" />
      <rect x="26" y="5" width="6" height="7" rx="1" fill="#ffcc00" />
      <g fill="#0b3478">
        <rect x="19" y="20.5" width="4" height="3" rx=".6" />
        <rect x="26" y="20.5" width="4" height="3" rx=".6" />
        <rect x="33" y="20.5" width="4" height="3" rx=".6" />
        <rect x="40" y="20.5" width="4" height="3" rx=".6" />
      </g>
    </svg>
  )
}
