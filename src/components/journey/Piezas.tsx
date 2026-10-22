import { createContext, useContext, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { C } from './paleta'
import { FerryShape } from './Ferry'

// Piezas SVG reutilizables para componer las escenas del journey. Caja de escena: 320 × 180, suelo en y = 150.

export const ReducidoCtx = createContext(false)
export const useReducido = () => useContext(ReducidoCtx)

export type Tono = 'hoy' | 'con'
const ease = [0.22, 1, 0.36, 1] as const

/* ───────────── movimiento ───────────── */

export function Entra({ d = 0, x = 0, y = 8, children }: { d?: number; x?: number; y?: number; children: ReactNode }) {
  const r = useReducido()
  if (r) return <g>{children}</g>
  return (
    <motion.g initial={{ opacity: 0, x, y }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: d, duration: 0.5, ease }}>
      {children}
    </motion.g>
  )
}

export function Pop({ d = 0, ox = 0.2, oy = 1, children }: { d?: number; ox?: number; oy?: number; children: ReactNode }) {
  const r = useReducido()
  if (r) return <g>{children}</g>
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: d, type: 'spring', stiffness: 320, damping: 18 }}
      style={{ originX: ox, originY: oy }}
    >
      {children}
    </motion.g>
  )
}

export function Loop({ x = 0, y = 0, rot = 0, scale = 1, dur = 3, d = 0, ox = 0.5, oy = 0.5, children }: { x?: number; y?: number; rot?: number; scale?: number; dur?: number; d?: number; ox?: number; oy?: number; children: ReactNode }) {
  const r = useReducido()
  if (r) return <g>{children}</g>
  return (
    <motion.g
      animate={{ x: [0, x, 0], y: [0, y, 0], rotate: [0, rot, 0], scale: [1, scale, 1] }}
      transition={{ duration: dur, delay: d, repeat: Infinity, ease: 'easeInOut' }}
      style={{ originX: ox, originY: oy }}
    >
      {children}
    </motion.g>
  )
}

/* ───────────── texto ───────────── */

export function T({ x, y, s = 9, w = 600, c = C.ink, a = 'start', children }: { x: number; y: number; s?: number; w?: number; c?: string; a?: 'start' | 'middle' | 'end'; children: ReactNode }) {
  return (
    <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>
      {children}
    </text>
  )
}

export function Pastilla({ x, y, w, txt, tono = 'ok' }: { x: number; y: number; w: number; txt: string; tono?: 'ok' | 'warn' | 'info' | 'off' }) {
  const col = { ok: C.verde, warn: C.ambar, info: C.navy2, off: C.g4 }[tono]
  return (
    <g>
      <rect x={x} y={y} width={w} height={11} rx={5.5} fill={col} />
      <T x={x + w / 2} y={y + 8} s={7} c="#fff" a="middle" w={700}>
        {txt}
      </T>
    </g>
  )
}

/* ───────────── iconos pequeños (caja 16×16 centrada en x,y) ───────────── */

export type IcoK = 'tick' | 'x' | 'q' | 'campana' | 'cafe' | 'agua' | 'bocata' | 'croissant' | 'qr' | 'wifi' | 'estrella' | 'moneda' | 'papel' | 'reloj' | 'bus'

export function Ico({ k, x, y, s = 1, c }: { k: IcoK; x: number; y: number; s?: number; c?: string }) {
  const f = (d: string) => c ?? d
  let g: ReactNode = null
  switch (k) {
    case 'tick':
      g = (
        <>
          <circle r={7} fill={c ?? C.verde} />
          <path d="M-3.5 0 L-1 2.8 L3.8 -2.8" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )
      break
    case 'x':
      g = (
        <>
          <circle r={7} fill={c ?? C.rojo} />
          <path d="M-3 -3 L3 3 M3 -3 L-3 3" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </>
      )
      break
    case 'q':
      g = (
        <text textAnchor="middle" y={5.5} fontSize={16} fontWeight={800} fill={c ?? C.navy}>
          ?
        </text>
      )
      break
    case 'campana':
      g = (
        <>
          <path d="M-5 3 V-1 a5 5 0 0 1 10 0 V3 L6.5 5 h-13Z" fill={f(C.yellow)} />
          <circle cy={6.5} r={1.8} fill={f(C.yellow)} />
        </>
      )
      break
    case 'cafe':
      g = (
        <>
          <path d="M-6 -3 H4 V3 a4 4 0 0 1-4 4 h-2 a4 4 0 0 1-4-4Z" fill={f(C.navy)} />
          <path d="M4 -1 h2 a2.5 2.5 0 0 1 0 5 h-2" stroke={f(C.navy)} strokeWidth={1.6} fill="none" />
          <path d="M-3 -5 q-1.5 -2 0 -4 M0 -5 q-1.5 -2 0 -4" stroke={C.g4} strokeWidth={1.2} fill="none" strokeLinecap="round" />
        </>
      )
      break
    case 'agua':
      g = (
        <>
          <rect x={-3.5} y={-4} width={7} height={12} rx={2} fill={f('#8fb8e8')} />
          <rect x={-2} y={-8} width={4} height={4} rx={1} fill={f(C.navy)} />
        </>
      )
      break
    case 'bocata':
      g = (
        <>
          <path d="M-8 -1 Q0 -9 8 -1Z" fill={f('#d9a35b')} />
          <rect x={-8} y={-1} width={16} height={3} fill={f('#6aa84f')} />
          <rect x={-8} y={2} width={16} height={3.5} rx={1.2} fill={f('#c7864a')} />
        </>
      )
      break
    case 'croissant':
      g = <path d="M-8 4 Q-6 -7 0 -7 Q6 -7 8 4 Q4 0 0 0 Q-4 0 -8 4Z" fill={f('#d89a4a')} />
      break
    case 'qr':
      g = (
        <>
          <rect x={-8} y={-8} width={16} height={16} rx={2} fill="#fff" />
          <rect x={-6} y={-6} width={5} height={5} fill={C.navy} />
          <rect x={1} y={-6} width={5} height={5} fill={C.navy} />
          <rect x={-6} y={1} width={5} height={5} fill={C.navy} />
          <rect x={1.5} y={1.5} width={2} height={2} fill={C.navy} />
          <rect x={4.2} y={4.2} width={2} height={2} fill={C.navy} />
        </>
      )
      break
    case 'wifi':
      g = (
        <>
          <path d="M-8 -2 a11 11 0 0 1 16 0 M-5 1.5 a7 7 0 0 1 10 0" stroke={f(C.navy)} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <circle cy={5} r={1.5} fill={f(C.navy)} />
        </>
      )
      break
    case 'estrella':
      g = <path d="M0 -7 L2 -2.2 L7 -2 L3.2 1.3 L4.4 6.5 L0 3.7 L-4.4 6.5 L-3.2 1.3 L-7 -2 L-2 -2.2Z" fill={f(C.yellow)} stroke={C.yellowD} strokeWidth={0.6} />
      break
    case 'moneda':
      g = (
        <>
          <circle r={7} fill={f(C.yellow)} stroke={C.yellowD} strokeWidth={1} />
          <text textAnchor="middle" y={3.4} fontSize={9} fontWeight={800} fill={C.navy}>
            €
          </text>
        </>
      )
      break
    case 'papel':
      g = (
        <>
          <rect x={-5.5} y={-8} width={11} height={16} rx={1.5} fill="#fff" stroke={f(C.g4)} strokeWidth={1} />
          <path d="M-3 -4 H3 M-3 -1 H3 M-3 2 H1" stroke={f(C.g4)} strokeWidth={1} />
        </>
      )
      break
    case 'reloj':
      g = (
        <>
          <circle r={7} fill="#fff" stroke={f(C.navy)} strokeWidth={1.8} />
          <path d="M0 -4 V0 L3 2" stroke={f(C.navy)} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </>
      )
      break
    case 'bus':
      g = (
        <>
          <rect x={-8} y={-6} width={16} height={11} rx={2.5} fill={f(C.yellow)} />
          <rect x={-6} y={-4} width={5} height={4} fill={C.navy} />
          <rect x={0.5} y={-4} width={5} height={4} fill={C.navy} />
          <circle cx={-4} cy={5.5} r={1.8} fill={C.ink} />
          <circle cx={4} cy={5.5} r={1.8} fill={C.ink} />
        </>
      )
      break
  }
  return <g transform={`translate(${x} ${y}) scale(${s})`}>{g}</g>
}

/* ───────────── burbuja ───────────── */

const TONOS = {
  blanca: { fill: '#fff', stroke: C.g3 },
  gris: { fill: C.g2, stroke: C.g3 },
  navy: { fill: C.navy, stroke: C.navy },
  amarilla: { fill: C.yellow, stroke: C.yellowD },
}

/** Márgenes interiores del bocadillo (unidades del viewBox 320×180) y margen mínimo al borde de la escena. */
const PAD_X = 8
const PAD_Y = 5
const BORDE = 4
const ESC_W = 320

/**
 * Bocadillo que se dimensiona según su contenido: tras el render mide el contenido (getBBox) y amplía el
 * rectángulo (ancho y alto) para que texto e iconos queden dentro con padding. Crece hacia la derecha y hacia
 * arriba (la cola sigue apuntando al personaje) y se desplaza si no cabe, para no salirse del SVG de la escena.
 * `w` y `h` son el tamaño mínimo; las coordenadas de los hijos son relativas a la esquina del bocadillo.
 */
export function Burbuja({ x, y, w, h, tono = 'blanca', cola = 'abajo', colaX = 12, d = 0, children }: { x: number; y: number; w: number; h: number; tono?: keyof typeof TONOS; cola?: 'abajo' | 'nada'; colaX?: number; d?: number; children?: ReactNode }) {
  const t = TONOS[tono]
  const contenido = useRef<SVGGElement>(null)
  const [med, setMed] = useState<{ w: number; h: number } | null>(null)

  useLayoutEffect(() => {
    const el = contenido.current
    if (!el) return
    const medir = () => {
      const bb = el.getBBox()
      if (!bb.width && !bb.height) return
      const nw = Math.max(w, Math.ceil(bb.x + bb.width + PAD_X))
      const nh = Math.max(h, Math.ceil(bb.y + bb.height + PAD_Y))
      setMed((m) => (m && m.w === nw && m.h === nh ? m : { w: nw, h: nh }))
    }
    medir()
    // Si la tipografía web llega después del primer render, vuelve a medir
    let vivo = true
    document.fonts?.ready.then(() => vivo && medir())
    return () => {
      vivo = false
    }
  }, [w, h, children])

  const W = Math.min(med?.w ?? w, ESC_W - 2 * BORDE)
  const H = med?.h ?? h
  // crece hacia arriba (mantiene la cola sobre el personaje); si no hay sitio arriba, hacia abajo
  const subir = Math.min(H - h, Math.max(0, y - BORDE))
  const Y = y - subir
  // si se sale por la derecha, se desplaza a la izquierda y la cola compensa para apuntar al mismo sitio
  const X = Math.max(BORDE, Math.min(x, ESC_W - BORDE - W))
  const cx = Math.max(10, Math.min(colaX + (x - X), W - 18))

  return (
    <g transform={`translate(${X} ${Y})`} data-burbuja>
      <Pop d={d} ox={cx / W} oy={1}>
        <rect data-bg width={W} height={H} rx={7} fill={t.fill} stroke={t.stroke} strokeWidth={1} />
        {cola === 'abajo' && (
          <>
            <path d={`M${cx} ${H} L${cx + 2} ${H + 8} L${cx + 9} ${H}`} fill={t.fill} stroke={t.stroke} strokeWidth={1} />
            <rect x={cx + 0.8} y={H - 1.2} width={7.4} height={2.4} fill={t.fill} />
          </>
        )}
        <g ref={contenido}>{children}</g>
      </Pop>
    </g>
  )
}

export function MiniCola({ x, y, n, c = C.g4 }: { x: number; y: number; n: number; c?: string }) {
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <g key={i} fill={c}>
          <circle cx={x + i * 8} cy={y} r={2.6} />
          <rect x={x + i * 8 - 3} y={y + 3} width={6} height={7} rx={3} />
        </g>
      ))}
    </g>
  )
}

/* ───────────── personas ───────────── */

export type Rol = 'carmen' | 'javi' | 'resp' | 'a' | 'b' | 'c'
type Brazo = 'abajo' | 'movil' | 'alzado' | 'tiende' | 'tiendeMovil'
type Pantalla = 'gris' | 'azul' | 'amarillo' | 'verde' | 'qr'
type Animo = 'neutro' | 'feliz' | 'triste'

const ROLES: Record<Rol, { piel: string; pelo: string; top: string; pant: string; pelot: 'larga' | 'corto' | 'moño' }> = {
  carmen: { piel: '#e3b08a', pelo: '#3b2a22', top: C.yellow, pant: '#23324f', pelot: 'larga' },
  javi: { piel: '#c68a63', pelo: '#1f1a17', top: '#ffffff', pant: '#2b2f3a', pelot: 'corto' },
  resp: { piel: '#d9a47c', pelo: '#5a3f33', top: C.navy, pant: '#3c4658', pelot: 'moño' },
  a: { piel: '#d9a47c', pelo: '#2b2420', top: '#8a94a8', pant: '#3c4658', pelot: 'corto' },
  b: { piel: '#f0c8a8', pelo: '#7a5a3a', top: '#5b78ad', pant: '#2b3347', pelot: 'larga' },
  c: { piel: '#a9714a', pelo: '#171310', top: '#c5cddb', pant: '#4a5568', pelot: 'corto' },
}

const PANT: Record<Pantalla, string> = { gris: C.g3, azul: '#8fb8e8', amarillo: C.yellow, verde: '#7fd1a0', qr: '#fff' }

function Movil({ x, y, w = 7, h = 12, p }: { x: number; y: number; w?: number; h?: number; p: Pantalla }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={1.8} fill={C.navy} />
      <rect x={x + 1} y={y + 1.2} width={w - 2} height={h - 2.4} rx={1} fill={PANT[p]} />
      {p === 'qr' && (
        <>
          <rect x={x + 2} y={y + 3} width={2} height={2} fill={C.navy} />
          <rect x={x + w - 4} y={y + 3} width={2} height={2} fill={C.navy} />
          <rect x={x + 2} y={y + h - 5} width={2} height={2} fill={C.navy} />
        </>
      )}
    </g>
  )
}

export function Persona({
  x,
  y = 150,
  rol = 'carmen',
  sentada = false,
  brazo = 'abajo',
  pantalla = 'azul',
  animo = 'neutro',
  flip = false,
  s = 1,
  bolsa = false,
  d = 0,
  quieta = false,
}: {
  x: number
  y?: number
  rol?: Rol
  sentada?: boolean
  brazo?: Brazo
  pantalla?: Pantalla
  animo?: Animo
  flip?: boolean
  s?: number
  bolsa?: boolean
  d?: number
  quieta?: boolean
}) {
  const R = ROLES[rol]
  const dy = sentada ? 8 : 0
  const arm = { stroke: R.top === '#ffffff' ? C.g3 : R.top, strokeWidth: 5.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  const mano = (cx: number, cy: number) => <circle cx={cx} cy={cy} r={2.8} fill={R.piel} />
  const boca = animo === 'feliz' ? 'M2.5 -63.5 Q5.2 -60.5 8 -63.5' : animo === 'triste' ? 'M2.5 -61.5 Q5.2 -64.5 8 -61.5' : 'M3 -62.5 H7.5'

  const cuerpo = (
    <g transform={`translate(0 ${dy})`}>
      {/* brazo trasero + bolsa */}
      <path d="M-8 -50 L-11 -30" {...arm} />
      {mano(-11, -27)}
      {bolsa && (
        <g>
          <path d="M-15 -26 q3 -7 6 0" stroke={C.navy2} strokeWidth={1.4} fill="none" />
          <rect x={-18} y={-26} width={12} height={10} rx={2} fill={C.navy2} />
          <rect x={-18} y={-23} width={12} height={2} fill={C.yellow} />
        </g>
      )}
      {/* torso */}
      <rect x={-10} y={-56} width={20} height={32} rx={8} fill={R.top} stroke={R.top === '#ffffff' ? C.g3 : 'none'} strokeWidth={0.8} />
      {rol === 'javi' && <path d="M-7 -44 H7 V-24 H-7Z" fill={C.navy} />}
      {rol === 'resp' && <path d="M-3.5 -56 L0 -45 L3.5 -56Z" fill="#fff" />}
      {rol === 'carmen' && <rect x={-6} y={-57} width={12} height={4} rx={2} fill={C.navy} />}
      {/* brazo delantero */}
      {brazo === 'abajo' && (
        <>
          <path d="M8 -50 L10.5 -30" {...arm} />
          {mano(10.5, -27)}
        </>
      )}
      {brazo === 'movil' && (
        <>
          <path d="M8 -50 L14 -38 L19 -45" {...arm} />
          {mano(19, -46)}
          <Movil x={18} y={-58} p={pantalla} />
        </>
      )}
      {brazo === 'alzado' && (
        <>
          <path d="M8 -50 L16 -55 L19 -66" {...arm} />
          {mano(19, -68)}
        </>
      )}
      {brazo === 'tiende' && (
        <>
          <path d="M8 -50 L20 -46 L28 -46" {...arm} />
          {mano(29, -46)}
        </>
      )}
      {brazo === 'tiendeMovil' && (
        <>
          <path d="M8 -50 L20 -47 L28 -47" {...arm} />
          {mano(28.5, -47)}
          <Movil x={27} y={-56} w={8} h={14} p={pantalla} />
        </>
      )}
      {/* cabeza */}
      <rect x={-2.5} y={-61} width={5} height={6} fill={R.piel} />
      {R.pelot === 'larga' && <rect x={-11} y={-77} width={13} height={20} rx={6} fill={R.pelo} />}
      {R.pelot === 'moño' && (
        <>
          <circle cx={-6} cy={-77} r={4.6} fill={R.pelo} />
          <rect x={-9} y={-76} width={11} height={14} rx={5} fill={R.pelo} />
        </>
      )}
      <circle cx={1} cy={-67} r={8.5} fill={R.piel} />
      <path d="M-8 -68 C-7 -79 9 -79 10 -68 C6 -73 -2 -72 -8 -68Z" fill={R.pelo} />
      <circle cx={5} cy={-67} r={1} fill={C.ink} />
      <path d={boca} stroke={C.ink} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </g>
  )

  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Entra d={d} x={flip ? 10 : -10} y={0}>
        {sentada ? (
          <>
            <rect x={-8} y={-22} width={22} height={7} rx={3.5} fill={R.pant} />
            <rect x={9} y={-22} width={7} height={22} rx={3} fill={R.pant} />
            <rect x={9} y={-3} width={11} height={3.5} rx={1.7} fill={C.ink} />
          </>
        ) : (
          <>
            <rect x={-7.5} y={-30} width={7} height={30} rx={3} fill={R.pant} />
            <rect x={0.5} y={-30} width={7} height={30} rx={3} fill={R.pant} />
            <rect x={-8.5} y={-3} width={10} height={3.5} rx={1.7} fill={C.ink} />
            <rect x={-0.5} y={-3} width={10} height={3.5} rx={1.7} fill={C.ink} />
          </>
        )}
        {quieta ? cuerpo : (
          <Loop y={-0.8} dur={3.2} d={d}>
            {cuerpo}
          </Loop>
        )}
      </Entra>
    </g>
  )
}

/** Cola de personas: casi no avanza (leve balanceo). */
export function Cola({ x, y = 150, n, paso = 20, d = 0 }: { x: number; y?: number; n: number; paso?: number; d?: number }) {
  const roles: Rol[] = ['a', 'b', 'c']
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <Loop key={i} x={1.3} dur={2.6 + i * 0.35} d={i * 0.25}>
          <Persona x={x + i * paso} y={y} rol={roles[i % 3]} s={0.92} animo="neutro" d={d + i * 0.08} quieta />
        </Loop>
      ))}
    </g>
  )
}

/* ───────────── objetos ───────────── */

export function Reloj({ x, y, r = 12, hora, rapido = false, rojo = false }: { x: number; y: number; r?: number; hora?: string; rapido?: boolean; rojo?: boolean }) {
  const red = useReducido()
  const L = r * 0.72
  const col = rojo ? C.rojo : C.navy
  return (
    <g>
      <g transform={`translate(${x} ${y})`}>
        <circle r={r} fill="#fff" stroke={C.navy} strokeWidth={2} />
        {[0, 90, 180, 270].map((a) => (
          <line key={a} x1={0} y1={-r + 2} x2={0} y2={-r + 4.2} transform={`rotate(${a})`} stroke={C.g4} strokeWidth={1.2} />
        ))}
        <line x1={0} y1={0} x2={0} y2={-r * 0.45} stroke={C.navy} strokeWidth={2} strokeLinecap="round" transform="rotate(300)" />
        {red ? (
          <line x1={0} y1={0} x2={0} y2={-L} stroke={col} strokeWidth={1.4} strokeLinecap="round" transform="rotate(70)" />
        ) : (
          <motion.g animate={{ rotate: 360 }} transition={{ duration: rapido ? 2.4 : 10, repeat: Infinity, ease: 'linear' }} style={{ originX: 0.5, originY: 0.5 }}>
            <circle r={L} fill="none" />
            <line x1={0} y1={0} x2={0} y2={-L} stroke={col} strokeWidth={1.4} strokeLinecap="round" />
          </motion.g>
        )}
        <circle r={1.5} fill={C.navy} />
      </g>
      {hora && (
        <T x={x} y={y + r + 10} s={9} w={700} c={rojo ? C.rojo : C.navy} a="middle">
          {hora}
        </T>
      )}
    </g>
  )
}

export function Banco({ x, w }: { x: number; w: number }) {
  return (
    <g>
      <rect x={x + 2} y={108} width={w - 4} height={26} rx={6} fill={C.navy4} />
      <rect x={x} y={133} width={w} height={6} rx={3} fill={C.navy3} />
      <rect x={x + 5} y={139} width={4} height={11} fill={C.navy} />
      <rect x={x + w - 9} y={139} width={4} height={11} fill={C.navy} />
    </g>
  )
}

export function Sofa({ x, w }: { x: number; w: number }) {
  return (
    <g>
      <rect x={x} y={102} width={w} height={34} rx={9} fill={C.navy3} />
      <rect x={x - 6} y={114} width={12} height={36} rx={5} fill={C.navy2} />
      <rect x={x + w - 6} y={114} width={12} height={36} rx={5} fill={C.navy2} />
      <rect x={x + 4} y={133} width={w - 8} height={17} rx={4} fill="#7690c0" />
    </g>
  )
}

export function Silla({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 15} y={106} width={5} height={30} rx={2.5} fill={C.g5} />
      <rect x={x - 13} y={133} width={26} height={5} rx={2} fill={C.g5} />
      <rect x={x - 1} y={138} width={3} height={12} fill={C.g4} />
      <rect x={x - 9} y={148} width={19} height={3} rx={1.5} fill={C.g4} />
    </g>
  )
}

export function Escritorio({ x, w }: { x: number; w: number }) {
  return (
    <g>
      <rect x={x} y={121} width={w} height={5} rx={2} fill="#b7c0d1" />
      <rect x={x + 5} y={126} width={w - 10} height={24} fill={C.g2} />
      <rect x={x + 5} y={126} width={w - 10} height={2} fill={C.g3} />
    </g>
  )
}

/** Barra de la cafetería. (x, w) caja del mostrador; `punto` añade el cartel del punto de recogida. */
export function Barra({ x, w = 120, punto = false }: { x: number; w?: number; punto?: boolean }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x={w - 36} y={88} width={28} height={25} rx={3} fill={C.g5} />
      <rect x={w - 36} y={88} width={28} height={5} rx={2} fill={C.g4} />
      <rect x={w - 26} y={98} width={8} height={9} rx={1} fill={C.g3} />
      <rect x={10} y={102} width={26} height={11} rx={3} fill="#e8c88e" />
      <rect x={0} y={112} width={w} height={6} rx={2} fill={C.g3} />
      <rect x={0} y={118} width={w} height={32} fill={C.navy} />
      <rect x={0} y={118} width={w} height={3} fill={C.yellow} />
      {punto && (
        <g>
          <rect x={6} y={86} width={36} height={22} rx={4} fill={C.yellow} />
          <Ico k="qr" x={24} y={97} s={0.95} />
        </g>
      )}
    </g>
  )
}

/**
 * Contenido de una pantalla (tablet / portátil): lo mide tras el render y, si no cabe en el área útil (w × h),
 * lo reduce proporcionalmente para que ningún texto se salga de la pantalla.
 */
function Ajuste({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children?: ReactNode }) {
  const ref = useRef<SVGGElement>(null)
  const [k, setK] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => {
      const bb = el.getBBox()
      if (!bb.width || !bb.height) return
      const nk = Math.min(1, w / (bb.x + bb.width), h / (bb.y + bb.height))
      setK((v) => (Math.abs(v - nk) < 0.002 ? v : nk))
    }
    // se mide sin escala: la escala previa no afecta al getBBox del propio grupo (va en el padre)
    medir()
    let vivo = true
    document.fonts?.ready.then(() => vivo && medir())
    return () => {
      vivo = false
    }
  }, [w, h, children])
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} data-contenido>
      <g ref={ref}>{children}</g>
    </g>
  )
}

export function Tablet({ x, y, w = 80, h = 58, children }: { x: number; y: number; w?: number; h?: number; children?: ReactNode }) {
  return (
    <Pop d={0.25} ox={0.5} oy={1}>
      <g transform={`translate(${x} ${y})`}>
        <rect width={w} height={h} rx={6} fill={C.navy} />
        <rect data-inner x={4} y={4} width={w - 8} height={h - 8} rx={3} fill="#fff" />
        <Ajuste x={8} y={8} w={w - 16} h={h - 16}>{children}</Ajuste>
      </g>
    </Pop>
  )
}

export function Portatil({ x, y, w = 112, h = 72, children }: { x: number; y: number; w?: number; h?: number; children?: ReactNode }) {
  return (
    <Pop d={0.2} ox={0.5} oy={1}>
      <g transform={`translate(${x} ${y})`}>
        <rect width={w} height={h} rx={5} fill={C.navy} />
        <rect data-inner x={4} y={4} width={w - 8} height={h - 8} rx={2.5} fill="#fff" />
        <Ajuste x={9} y={9} w={w - 18} h={h - 18}>{children}</Ajuste>
        <path d={`M-6 ${h} H${w + 6} L${w + 2} ${h + 6} H2Z`} fill={C.g4} />
      </g>
    </Pop>
  )
}

export function Papeles({ x, y, rot = 0, ferry = false, tono = C.g3 }: { x: number; y: number; rot?: number; ferry?: boolean; tono?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-13} y={-16} width={26} height={32} rx={2} fill="#fff" stroke={tono} strokeWidth={1.2} />
      <path d="M-9 -8 H9 M-9 -3 H9 M-9 2 H5" stroke={tono} strokeWidth={1.2} />
      {ferry && (
        <g transform="translate(-9 5) scale(.15)">
          <FerryShape />
        </g>
      )}
    </g>
  )
}

export function Telefono({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-12} y={-6} width={24} height={8} rx={3} fill={C.g5} />
      <Loop rot={-7} dur={0.35} oy={1}>
        <rect x={-14} y={-12} width={28} height={6} rx={3} fill={C.navy} />
      </Loop>
    </g>
  )
}

export function Interruptor({ x, y, on, d = 1.1 }: { x: number; y: number; on: boolean; d?: number }) {
  const r = useReducido()
  const fin = on ? x + 16 : x + 6
  const ini = on ? x + 6 : x + 16
  return (
    <g>
      <rect x={x} y={y} width={22} height={12} rx={6} fill={on ? C.verde : C.g3} />
      {r || d < 0 ? (
        <circle cx={fin} cy={y + 6} r={4.6} fill="#fff" />
      ) : (
        <motion.circle cy={y + 6} r={4.6} fill="#fff" initial={{ cx: ini }} animate={{ cx: fin }} transition={{ delay: d, type: 'spring', stiffness: 260, damping: 20 }} />
      )}
    </g>
  )
}

export function Bus({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x={0} y={106} width={78} height={38} rx={7} fill={C.yellow} />
      <rect x={6} y={112} width={14} height={13} rx={2} fill={C.navy} />
      <rect x={24} y={112} width={14} height={13} rx={2} fill={C.navy} />
      <rect x={42} y={112} width={14} height={13} rx={2} fill={C.navy} />
      <rect x={60} y={112} width={12} height={26} rx={2} fill={C.navy2} />
      <rect x={0} y={130} width={78} height={3} fill={C.navy} />
      <circle cx={16} cy={146} r={6} fill={C.ink} />
      <circle cx={16} cy={146} r={2.4} fill={C.g3} />
      <circle cx={62} cy={146} r={6} fill={C.ink} />
      <circle cx={62} cy={146} r={2.4} fill={C.g3} />
    </g>
  )
}

/* ───────────── ventana con mar ───────────── */

export function Ventana({ x, y, w, h, ferry = true, noche = false, tono = 'con' }: { x: number; y: number; w: number; h: number; ferry?: boolean; noche?: boolean; tono?: Tono }) {
  const id = useId().replace(/:/g, '')
  const red = useReducido()
  const mar = h * 0.58
  const sc = Math.min(0.42, w / 220)
  const fy = mar - 36 * sc + 3
  const cielo = noche ? '#14264d' : tono === 'hoy' ? '#dbe6f2' : '#cfe3f8'
  const f = (
    <g transform={`translate(0 ${fy}) scale(${sc})`}>
      <FerryShape />
    </g>
  )
  return (
    <g transform={`translate(${x} ${y})`}>
      <clipPath id={id}>
        <rect width={w} height={h} rx={3} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect width={w} height={h} fill={cielo} />
        <circle cx={w * 0.82} cy={h * 0.28} r={noche ? 5 : 6} fill={noche ? '#f4efd0' : C.yellow} />
        <rect y={mar} width={w} height={h - mar} fill={noche ? '#0f1e3d' : C.mar2} />
        <rect y={mar} width={w} height={1.5} fill={noche ? '#2b4378' : '#fff'} opacity={0.7} />
        {[0.15, 0.45, 0.7].map((p, i) => (
          <path key={i} d={`M${w * p} ${mar + 7 + i * 3} h9`} stroke={noche ? '#2b4378' : '#fff'} strokeWidth={1.2} opacity={0.6} />
        ))}
        {ferry &&
          (red ? (
            <g transform={`translate(${w * 0.2} 0)`}>{f}</g>
          ) : (
            <motion.g initial={{ x: -w * 0.5 }} animate={{ x: w * 0.9 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}>
              {f}
            </motion.g>
          ))}
      </g>
      <rect width={w} height={h} rx={3} fill="none" stroke={C.g4} strokeWidth={3} />
      <path d={`M${w / 2} 0 V${h}`} stroke={C.g4} strokeWidth={2} />
    </g>
  )
}

/* ───────────── fondos ───────────── */

export type FondoTipo = 'casa' | 'puerto' | 'salon' | 'oficina' | 'llegada'

export function Fondo({ tipo, tono, ventanas = 2 }: { tipo: FondoTipo; tono: Tono; ventanas?: 1 | 2 }) {
  const hoy = tono === 'hoy'
  let contenido: ReactNode = null
  if (tipo === 'casa') {
    contenido = (
      <>
        <rect width={320} height={180} fill={hoy ? '#e4e7ee' : '#e6eefb'} />
        <rect y={150} width={320} height={30} fill={hoy ? '#c3c9d6' : '#bcc9e0'} />
        <rect y={148} width={320} height={3} fill={C.g3} />
        <Ventana x={232} y={26} w={62} h={64} noche tono={tono} ferry={false} />
        <g>
          <path d="M28 150 V84" stroke={C.g5} strokeWidth={3} />
          <path d="M16 84 L40 84 L34 66 L22 66Z" fill={hoy ? C.g3 : C.yellow} />
          {!hoy && <circle cx={28} cy={88} r={26} fill={C.yellow} opacity={0.18} />}
          <rect x={18} y={148} width={20} height={3} rx={1.5} fill={C.g5} />
        </g>
      </>
    )
  } else if (tipo === 'puerto') {
    contenido = (
      <>
        <rect width={320} height={180} fill={hoy ? '#e1e6ee' : '#d8e8fa'} />
        <rect y={96} width={320} height={34} fill={hoy ? '#b9c7dc' : C.mar2} />
        <g transform="translate(150 54) scale(1.35)">
          <FerryShape />
        </g>
        <rect y={128} width={320} height={52} fill={hoy ? '#c9ceda' : '#cfd5e0'} />
        <rect y={128} width={320} height={3} fill={C.g4} />
        <rect x={0} y={68} width={104} height={62} fill={C.g2} />
        <rect x={0} y={62} width={110} height={8} fill={C.navy} />
        <rect x={0} y={70} width={110} height={2.5} fill={C.yellow} />
        {[10, 40, 70].map((px) => (
          <rect key={px} x={px} y={82} width={24} height={28} fill={hoy ? '#a9b8d0' : C.mar2} stroke={C.g4} strokeWidth={1.5} />
        ))}
        <path d="M130 130 V96" stroke={C.navy} strokeWidth={2.5} />
        <circle cx={130} cy={94} r={4} fill={C.yellow} />
      </>
    )
  } else if (tipo === 'llegada') {
    contenido = (
      <>
        <rect width={320} height={180} fill={hoy ? '#e1e6ee' : '#d8e8fa'} />
        <path d="M120 100 L160 40 L200 62 L240 28 L290 70 L320 56 V100Z" fill={hoy ? '#b3bdce' : '#aebbd3'} />
        <path d="M60 100 L110 58 L150 80 L190 100Z" fill={hoy ? '#c4ccd9' : '#c9d3e6'} />
        <rect y={96} width={320} height={34} fill={hoy ? '#b9c7dc' : C.mar2} />
        <g transform="translate(6 56) scale(1.1)">
          <FerryShape />
        </g>
        <rect y={128} width={320} height={52} fill={hoy ? '#c9ceda' : '#cfd5e0'} />
        <rect y={128} width={320} height={3} fill={C.g4} />
        <path d="M232 130 V98" stroke={C.navy} strokeWidth={2.5} />
        <circle cx={232} cy={96} r={4} fill={C.yellow} />
      </>
    )
  } else if (tipo === 'oficina') {
    contenido = (
      <>
        <rect width={320} height={180} fill={hoy ? '#e6e8ee' : '#eaf0fa'} />
        <rect y={150} width={320} height={30} fill={hoy ? '#c3c9d6' : '#c6d0e4'} />
        <rect y={148} width={320} height={3} fill={C.g3} />
        <Ventana x={14} y={24} w={104} h={62} tono={tono} />
        <rect x={286} y={118} width={22} height={32} rx={3} fill={C.g3} />
        <path d="M297 118 c-6 -10 -6 -16 0 -22 c6 6 6 12 0 22" fill="#8fbf9a" />
      </>
    )
  } else {
    contenido = (
      <>
        <rect width={320} height={180} fill={hoy ? '#e6e8ee' : '#eef2f9'} />
        <rect y={100} width={320} height={50} fill={hoy ? '#dde1ea' : '#e1e8f3'} />
        <rect y={98} width={320} height={3} fill={C.yellow} />
        <rect y={150} width={320} height={30} fill={hoy ? '#b3bccc' : '#b9c4d9'} />
        <rect y={148} width={320} height={3} fill={C.g3} />
        <Ventana x={14} y={22} w={84} h={56} tono={tono} />
        {ventanas === 2 && <Ventana x={110} y={22} w={84} h={56} tono={tono} ferry={false} />}
      </>
    )
  }
  return (
    <g>
      {contenido}
      {hoy && <rect width={320} height={180} fill="#4a5568" opacity={0.07} />}
    </g>
  )
}
