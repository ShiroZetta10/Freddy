import { useCallback, useEffect, useRef, useState } from 'react'
import { CafeteriaId, Pedido, ProtoState, EstadoPedido, Insumo, Unidad } from '../store'

export const CAFS: CafeteriaId[] = ['proa', 'popa', 'oro']
export const CAF_CORTO: Record<CafeteriaId, string> = { proa: 'Proa', popa: 'Popa', oro: 'Oro' }
export const ESTADO_LABEL: Record<EstadoPedido, string> = {
  recibido: 'Recibido',
  preparando: 'Preparando',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}
export const FASE_LABEL = {
  antes: 'Antes de zarpar',
  embarque: 'Embarque',
  navegando: 'Navegando',
  llegando: 'Llegando',
  llegado: 'Llegado',
} as const

/** Reloj de pared en tiempo real (para temporizadores). */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(id)
  }, [ms])
  return now
}

const CAF_KEY = 'fob-barra-caf'
export function useCafSeleccionada(): [CafeteriaId, (c: CafeteriaId) => void] {
  const [caf, setCafState] = useState<CafeteriaId>(() => {
    try {
      const v = sessionStorage.getItem(CAF_KEY) as CafeteriaId | null
      if (v && CAFS.includes(v)) return v
    } catch {
      /* sin sessionStorage */
    }
    return 'proa'
  })
  const setCaf = useCallback((c: CafeteriaId) => {
    setCafState(c)
    try {
      sessionStorage.setItem(CAF_KEY, c)
    } catch {
      /* ignorar */
    }
  }, [])
  return [caf, setCaf]
}

// ---------------------------------------------------------------- sonido (WebAudio, opcional)
const MUTE_KEY = 'fob-barra-mute'
let ctx: AudioContext | null = null
export function pitar() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx = ctx ?? new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    const t0 = ctx.currentTime
    ;[880, 1175].forEach((f, i) => {
      const o = ctx!.createOscillator()
      const g = ctx!.createGain()
      o.type = 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t0 + i * 0.13)
      g.gain.exponentialRampToValueAtTime(0.18, t0 + i * 0.13 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.13 + 0.16)
      o.connect(g).connect(ctx!.destination)
      o.start(t0 + i * 0.13)
      o.stop(t0 + i * 0.13 + 0.18)
    })
  } catch {
    /* audio no disponible */
  }
}
export function useSilencio(): [boolean, () => void] {
  const [mute, setMute] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === '1'
    } catch {
      return false
    }
  })
  const toggle = useCallback(() => {
    setMute((m) => {
      try {
        localStorage.setItem(MUTE_KEY, m ? '0' : '1')
      } catch {
        /* ignorar */
      }
      if (m) pitar() // al activar el sonido, una muestra
      return !m
    })
  }, [])
  return [mute, toggle]
}

export function mmss(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
export function duracionLarga(seg: number) {
  if (!seg) return '—'
  if (seg < 60) return `${Math.round(seg)} s`
  return `${Math.floor(seg / 60)} min ${Math.round(seg % 60)} s`
}

/** Misma lógica de búsqueda que entregarPorQR (FOB:<id>:<clientKey> o número). */
export function buscarPedido(s: ProtoState, codigo: string): Pedido | undefined {
  const c = codigo.trim().replace(/^#/, '')
  const m = /^FOB:(\d+):(.+)$/.exec(c)
  return m ? s.pedidos.find((x) => x.id === Number(m[1]) && x.clientKey === m[2]) : s.pedidos.find((x) => String(x.id) === c)
}

/** Hook: detecta pedidos nuevos (estado recibido) en la cafetería para destello, sonido y aviso accesible. */
export function usePedidosNuevos(pedidos: Pedido[], caf: CafeteriaId, silencio: boolean) {
  const seen = useRef<{ caf: CafeteriaId; ids: Set<number> } | null>(null)
  const [fresh, setFresh] = useState<Set<number>>(new Set())
  const [anuncio, setAnuncio] = useState('')
  useEffect(() => {
    if (!seen.current || seen.current.caf !== caf) {
      seen.current = { caf, ids: new Set(pedidos.map((p) => p.id)) }
      return
    }
    const ids = seen.current.ids
    const nuevos = pedidos.filter((p) => !ids.has(p.id))
    nuevos.forEach((p) => ids.add(p.id))
    if (!nuevos.length) return
    const nIds = nuevos.map((p) => p.id)
    setFresh((f) => new Set([...f, ...nIds]))
    window.setTimeout(() => setFresh((f) => new Set([...f].filter((x) => !nIds.includes(x)))), 2800)
    setAnuncio(nuevos.length === 1 ? `Nuevo pedido número ${nuevos[0].id}, ${nuevos[0].nombre}` : `${nuevos.length} pedidos nuevos`)
    if (!silencio) pitar()
  }, [pedidos, caf, silencio])
  return { fresh, anuncio }
}

// ---------------------------------------------------------------- iconos propios (línea)
const I: Record<string, JSX.Element> = {
  pause: <path d="M8 5v14M16 5v14" />,
  play: <path d="M7 5l12 7-12 7V5z" />,
  sound: <><path d="M4 10v4h3l5 4V6L7 10H4z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></>,
  mute: <><path d="M4 10v4h3l5 4V6L7 10H4z" /><path d="M16 9l5 6M21 9l-5 6" /></>,
  chevron: <path d="M6 9l6 6 6-6" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  warn: <><path d="M12 4l9 16H3L12 4z" /><path d="M12 10v4M12 17v.5" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4V8z" /><circle cx="12" cy="13" r="3.5" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  ship: <><path d="M3 15l2 4h14l2-4-9-3-9 3z" /><path d="M12 12V4M12 4l5 4h-5" /></>,
  wifi: <><path d="M3 9a13 13 0 0 1 18 0M6 12.5a8.5 8.5 0 0 1 12 0M9 16a4 4 0 0 1 6 0" /><circle cx="12" cy="19" r=".8" /></>,
  nowifi: <><path d="M3 9a13 13 0 0 1 18 0M6 12.5a8.5 8.5 0 0 1 12 0M9 16a4 4 0 0 1 6 0" /><path d="M4 4l16 16" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" /></>,
  cross: <><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  snow: <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5" />,
  box: <><path d="M4 8l8-4 8 4v9l-8 4-8-4V8z" /><path d="M4 8l8 4 8-4M12 12v9" /></>,
  down: <path d="M12 5v13M6 13l6 6 6-6" />,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></>,
  truck: <><path d="M2 6h11v10H2zM13 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  back: <><path d="M4 7h10a6 6 0 0 1 0 12H8" /><path d="M8 3L4 7l4 4" /></>,
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  leaf: <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14M5 19c2-4 5-7 9-9" />,
  bell: <><path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4l2-2z" /><path d="M10 21h4" /></>,
  voucher: <><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" /><path d="M14 6.5v11" strokeDasharray="1.8 2.4" /></>,
}
export function Ico({ n, size = 20 }: { n: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      {I[n]}
    </svg>
  )
}

// ---------------------------------------------------------------- inventario
const nf = (max: number) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: max })
/** Cantidad con su unidad; g y ml pasan a kg y l a partir de 1000. */
export function fmtQty(n: number, u: Unidad): string {
  if ((u === 'g' || u === 'ml') && Math.abs(n) >= 1000) return `${nf(2).format(n / 1000)} ${u === 'g' ? 'kg' : 'l'}`
  return `${nf(u === 'ud' ? 0 : 1).format(Math.round(n * 10) / 10)} ${u}`
}
export type NivelInsumo = 'ok' | 'bajo' | 'critico'
/** verde / ámbar (bajo 1,5 x mínimo) / rojo (bajo mínimo). */
export function nivelInsumo(i: Pick<Insumo, 'stock' | 'minimo'>): NivelInsumo {
  if (i.stock < i.minimo) return 'critico'
  if (i.stock < i.minimo * 1.5) return 'bajo'
  return 'ok'
}
export const NIVEL_LABEL: Record<NivelInsumo, string> = { ok: 'Correcto', bajo: 'Bajo', critico: 'Bajo mínimo' }
export const TIPO_MOV_LABEL = { venta: 'Venta', cancelacion: 'Cancelación', entrada: 'Entrada', merma: 'Merma', ajuste: 'Ajuste' } as const
export const horaReal = (t: number) => new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
