import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import { CafeteriaId, getState, setPausa } from '../store'

export const C = { navy: '#0b3478', sky: '#a9c2ea', gold: '#e3a600', teal: '#2a8f84' }
export const CAFS: CafeteriaId[] = ['proa', 'popa', 'oro']
export const CAF_COLOR: Record<CafeteriaId, string> = { proa: C.navy, popa: C.sky, oro: C.gold }

export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const i = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(i)
  }, [ms])
  return now
}

export function hace(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 5) return 'ahora'
  if (s < 60) return `hace ${s} s`
  return `hace ${Math.floor(s / 60)} min`
}

export const hhmm = (t: number) => new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
export const num = (n: number, d = 0) => n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d })
export const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

/** Contador animado (cuenta hacia el nuevo valor). */
export function Counter({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const reduce = useReducedMotion()
  const [v, setV] = useState(reduce ? value : 0)
  const ref = useRef(reduce ? value : 0)
  useEffect(() => {
    if (reduce) {
      ref.current = value
      setV(value)
      return
    }
    const c = animate(ref.current, value, {
      duration: 0.8,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (x) => {
        ref.current = x
        setV(x)
      },
    })
    return () => c.stop()
  }, [value, reduce])
  return (
    <span>
      {num(v, decimals)}
      {suffix}
    </span>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`mg-switch${checked ? ' on' : ''}`} onClick={() => onChange(!checked)}>
      <i />
    </button>
  )
}

/** Campo numérico con pasos; confirma al salir del campo o con Enter. */
export function NumField({
  value,
  onCommit,
  step = 1,
  decimals = 0,
  min = 0,
  max = 100000,
  suffix,
  label,
}: {
  value: number
  onCommit: (n: number) => void
  step?: number
  decimals?: number
  min?: number
  max?: number
  suffix?: string
  label: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? value.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: false })
  const fix = (n: number) => Math.round(clamp(n, min, max) * 100) / 100
  const commit = (raw: string) => {
    const n = parseFloat(raw.replace(',', '.'))
    setDraft(null)
    if (!isNaN(n) && fix(n) !== value) onCommit(fix(n))
  }
  return (
    <div className="mg-num">
      <button type="button" aria-label={`Disminuir ${label}`} onClick={() => onCommit(fix(value - step))} disabled={value <= min}>
        −
      </button>
      <input
        inputMode="decimal"
        aria-label={label}
        value={shown}
        onFocus={(e) => e.target.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
      {suffix && <em>{suffix}</em>}
      <button type="button" aria-label={`Aumentar ${label}`} onClick={() => onCommit(fix(value + step))} disabled={value >= max}>
        +
      </button>
    </div>
  )
}

export function Card({ title, sub, right, children, className = '' }: { title?: string; sub?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`fob-card mg-card ${className}`}>
      {(title || right) && (
        <header className="mg-card-h">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <p className="mg-sub">{sub}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

export function Dot({ tone }: { tone: 'ok' | 'warn' | 'ko' | 'nd' }) {
  return <span className={`mg-dot ${tone}`} aria-hidden />
}

// ---------------------------------------------------------------- pausa temporal de cafeterías
export type PausaCtl = {
  hasta: Partial<Record<CafeteriaId, number>>
  pausar: (c: CafeteriaId, min?: number) => void
  reanudar: (c: CafeteriaId) => void
  alternar: (c: CafeteriaId) => void
}

export function usePausaCtl(): PausaCtl {
  const [hasta, setHasta] = useState<Partial<Record<CafeteriaId, number>>>({})
  const timers = useRef<Partial<Record<CafeteriaId, number>>>({})
  const limpiar = useCallback((c: CafeteriaId) => {
    const t = timers.current[c]
    if (t) window.clearTimeout(t)
    delete timers.current[c]
    setHasta((h) => {
      if (!(c in h)) return h
      const n = { ...h }
      delete n[c]
      return n
    })
  }, [])
  const reanudar = useCallback(
    (c: CafeteriaId) => {
      limpiar(c)
      setPausa(c, false)
    },
    [limpiar],
  )
  const pausar = useCallback(
    (c: CafeteriaId, min = 0) => {
      limpiar(c)
      setPausa(c, true)
      if (min > 0) {
        timers.current[c] = window.setTimeout(() => reanudar(c), min * 60000)
        setHasta((h) => ({ ...h, [c]: Date.now() + min * 60000 }))
      }
    },
    [limpiar, reanudar],
  )
  const alternar = useCallback((c: CafeteriaId) => (getState().ajustes.pausa[c] ? reanudar(c) : pausar(c)), [pausar, reanudar])
  useEffect(
    () => () => {
      // al salir de la vista no dejamos cafeterías en pausa temporal
      for (const c of CAFS) if (timers.current[c]) {
        window.clearTimeout(timers.current[c])
        setPausa(c, false)
      }
    },
    [],
  )
  return { hasta, pausar, reanudar, alternar }
}

export function cuentaAtras(hasta: number | undefined, now: number) {
  if (!hasta) return ''
  const s = Math.max(0, Math.round((hasta - now) / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// iconos propios (línea)
export function Ico({ name, size = 20 }: { name: 'live' | 'caja' | 'carta' | 'sliders' | 'msg' | 'chart' | 'demo' | 'download' | 'pause' | 'play' | 'alert' | 'ship' | 'star'; size?: number }) {
  const P: Record<string, ReactNode> = {
    live: <path d="M3 12h4l3-7 4 14 3-7h4" />,
    caja: (
      <>
        <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" />
        <path d="M4 8l8 4 8-4M12 12v8" />
      </>
    ),
    carta: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </>
    ),
    msg: <path d="M4 5h16v11H9l-5 4V5z" />,
    chart: (
      <>
        <path d="M4 20V4M4 20h16" />
        <path d="M8 16v-5M12 16V8M16 16v-3" />
      </>
    ),
    demo: (
      <>
        <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
        <path d="M7.5 15h9" />
      </>
    ),
    download: <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />,
    pause: <path d="M8 5v14M16 5v14" />,
    play: <path d="M7 4l12 8-12 8V4z" />,
    alert: (
      <>
        <path d="M12 4l9 16H3L12 4z" />
        <path d="M12 10v4M12 17v.5" />
      </>
    ),
    ship: <path d="M3 15l2 4h14l2-4-9-3-9 3zM12 12V4h4M8 9h8" />,
    star: <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8L12 3.5z" />,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {P[name]}
    </svg>
  )
}
