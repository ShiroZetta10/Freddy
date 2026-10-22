/**
 * Piezas compartidas por las tres vistas del prototipo FredOnBoard.
 */
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { Fase, irAFase, resetDemo, setOnline, setViaje, setAjustes, useProtoState, fase, horaDe } from './store'

// ---------------------------------------------------------------- pantalla completa
export function useFullscreen() {
  const [fs, setFs] = useState(!!document.fullscreenElement)
  useEffect(() => {
    const f = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', f)
    return () => document.removeEventListener('fullscreenchange', f)
  }, [])
  const toggle = useCallback(() => {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void }
    if (!document.fullscreenElement) {
      // En barra y manager, al pasar a pantalla completa intentamos fijar la orientación horizontal (Android/Chrome).
      const fijarHorizontal = () => {
        if (!/#\/app\/(barra|manager)/.test(window.location.hash)) return
        const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
        o?.lock?.('landscape').catch(() => {})
      }
      if (el.requestFullscreen) el.requestFullscreen().then(fijarHorizontal).catch(() => {})
      else el.webkitRequestFullscreen?.()
    } else document.exitFullscreen?.().catch(() => {})
  }, [])
  const soportado = !!(document.documentElement.requestFullscreen || (document.documentElement as unknown as { webkitRequestFullscreen?: unknown }).webkitRequestFullscreen)
  return { fs, toggle, soportado }
}

export function FullscreenButton() {
  const { fs, toggle, soportado } = useFullscreen()
  if (!soportado) return null
  return (
    <button className="fob-chip-btn" onClick={toggle} aria-label={fs ? 'Salir de pantalla completa' : 'Pantalla completa'}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        {fs ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
      </svg>
      <span className="fob-hide-xs">{fs ? 'Salir' : 'Pantalla completa'}</span>
    </button>
  )
}

// ---------------------------------------------------------------- barra superior común
export function ProtoChrome({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <header className="fob-chrome">
      <Link
        to="/prototipo"
        target={window.location.hash.includes('land=1') ? '_top' : undefined}
        className="fob-logo"
        style={{ color: '#fff', textDecoration: 'none' }}
        aria-label="Volver al prototipo"
      >
        <img className="fob-flag" src="logos/fo-bandera.png" alt="Fred. Olsen Express" />
        FredOnBoard
        <span style={{ fontWeight: 500, opacity: 0.7, fontSize: 12 }}>· {titulo}</span>
      </Link>
      <div className="fob-spacer" />
      {children}
      <FullscreenButton />
    </header>
  )
}

// ---------------------------------------------------------------- toasts (notificaciones push simuladas)
type Toast = { id: number; titulo: string; texto?: string; icono?: string }
const ToastCtx = createContext<(t: Omit<Toast, 'id'>) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts((x) => [...x, { ...t, id }])
    if ('vibrate' in navigator) navigator.vibrate?.(60)
    window.setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 4200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fob-toasts" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className="fob-toast"
              initial={{ y: -30, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            >
              <div className="ico">
                <Icon name={t.icono ?? 'bell'} size={16} />
              </div>
              <div>
                <b>{t.titulo}</b>
                {t.texto && <span>{t.texto}</span>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

// ---------------------------------------------------------------- controles de demo (flotante)
const FASES: { id: Fase; l: string }[] = [
  { id: 'antes', l: 'Antes' },
  { id: 'embarque', l: 'Embarque' },
  { id: 'navegando', l: 'Navegando' },
  { id: 'llegando', l: 'Llegando' },
  { id: 'llegado', l: 'Llegado' },
]

export function DemoControls() {
  const s = useProtoState()
  const [open, setOpen] = useState(false)
  const f = fase(s)
  return (
    <div className="fob-demo">
      <AnimatePresence>
        {open && (
          <motion.div
            className="fob-demo-panel"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <h4>Controles de demo</h4>
            <div className="fob-muted" style={{ fontSize: 12 }}>
              Hora simulada <b style={{ color: 'var(--fob-navy)' }}>{horaDe(s, s.viaje.minuto)}</b> · minuto {Math.round(s.viaje.minuto)} de {s.viaje.duracionMin}
            </div>
            <div className="fob-seg">
              {FASES.map((x) => (
                <button key={x.id} className={f === x.id ? 'on' : ''} onClick={() => irAFase(x.id)}>
                  {x.l}
                </button>
              ))}
            </div>
            <h4>Velocidad del viaje</h4>
            <div className="fob-seg">
              {[0, 0.5, 2, 6].map((v) => (
                <button key={v} className={s.viaje.velocidad === v ? 'on' : ''} onClick={() => setViaje({ velocidad: v })}>
                  {v === 0 ? 'Pausa' : `×${v} min/s`}
                </button>
              ))}
            </div>
            <label className="fob-switch">
              <span>Conexión del barco (Starlink)</span>
              <input type="checkbox" checked={s.ajustes.online} onChange={(e) => setOnline(e.target.checked)} />
            </label>
            <label className="fob-switch">
              <span>Otros pasajeros pidiendo (bot)</span>
              <input type="checkbox" checked={s.ajustes.bot} onChange={(e) => setAjustes({ bot: e.target.checked })} />
            </label>
            <button className="fob-btn ghost" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => resetDemo()}>
              Reiniciar demo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button className="fob-demo-toggle" onClick={() => setOpen((o) => !o)} aria-label="Controles de demo" aria-expanded={open}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      </button>
    </div>
  )
}

/** Ilustración simple de producto (sin imágenes externas): círculo de color con iniciales. */
export function ProductoArt({ nombre, color, size = 56 }: { nombre: string; color: string; size?: number }) {
  const ini = nombre
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,.45), transparent 45%), ${color}`,
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 800,
        fontSize: size * 0.32,
        textShadow: '0 1px 2px rgba(0,0,0,.25)',
        flex: 'none',
      }}
    >
      {ini}
    </div>
  )
}

// ---------------------------------------------------------------- distintivo «Elaborado en Canarias»
/** Ruta del archivo oficial del distintivo (public/logos/elaborado-en-canarias.png). Hay que obtenerlo de la marca; ver docs/PROTO_BRIEF.md. */
export const LOGO_ELABORADO_SRC = 'logos/elaborado-en-canarias.png'

/**
 * Distintivo oficial «Elaborado en Canarias». NO se dibuja ni se imita: se muestra el archivo oficial si existe en public/logos/
 * y, si no carga, aparece la etiqueta de texto `fallback` («Producto canario»). Su uso requiere autorización de la marca y solo
 * puede acompañar a productos certificados.
 */
export function ElaboradoLogo({ fallback, height = 32 }: { fallback: ReactNode; height?: number }) {
  const [fallo, setFallo] = useState(false)
  if (fallo) return <>{fallback}</>
  // el archivo oficial es cuadrado (256×256): a 32 px de alto se ve nítido en pantallas de 2×; width:auto conserva la proporción (sin deformar)
  return <img className="fob-elab-logo" src={LOGO_ELABORADO_SRC} alt="Elaborado en Canarias" height={height} decoding="async" style={{ height, width: 'auto', display: 'inline-block', verticalAlign: 'middle', flex: 'none' }} onError={() => setFallo(true)} />
}
