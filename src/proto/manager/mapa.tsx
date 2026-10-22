import { ProtoState, progreso } from '../store'
import { C, num } from './util'

type Pt = { x: number; y: number }
type Lane = [Pt, Pt, Pt]

const MAIN: Lane = [
  { x: 192, y: 84 },
  { x: 276, y: 50 },
  { x: 356, y: 96 },
]
const LANE_B: Lane = [
  { x: 198, y: 68 },
  { x: 280, y: 16 },
  { x: 372, y: 66 },
]
const LANE_C: Lane = [
  { x: 132, y: 168 },
  { x: 262, y: 218 },
  { x: 374, y: 166 },
]

const d = (l: Lane) => `M${l[0].x} ${l[0].y} Q${l[1].x} ${l[1].y} ${l[2].x} ${l[2].y}`
function en(l: Lane, t: number) {
  const a = (1 - t) ** 2
  const b = 2 * (1 - t) * t
  const c = t * t
  const x = a * l[0].x + b * l[1].x + c * l[2].x
  const y = a * l[0].y + b * l[1].y + c * l[2].y
  const dx = 2 * (1 - t) * (l[1].x - l[0].x) + 2 * t * (l[2].x - l[1].x)
  const dy = 2 * (1 - t) * (l[1].y - l[0].y) + 2 * t * (l[2].y - l[1].y)
  return { x, y, ang: (Math.atan2(dy, dx) * 180) / Math.PI }
}
/** Onda triangular 0..1..0 con dirección. */
function vaiven(x: number) {
  const f = ((x % 2) + 2) % 2
  return f < 1 ? { p: f, dir: 1 } : { p: 2 - f, dir: -1 }
}

function Barco({ lane, t, dir = 1, main, name }: { lane: Lane; t: number; dir?: 1 | -1; main?: boolean; name: string }) {
  const { x, y, ang } = en(lane, t)
  const rot = ang + (dir === -1 ? 180 : 0)
  const fill = main ? C.navy : '#7f95b8'
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transition: 'transform 1s linear' }} aria-label={name}>
      {main && <circle r="17" fill={C.navy} opacity=".1" />}
      <g style={{ transform: `rotate(${rot}deg)`, transition: 'transform 1s linear' }}>
        <path d="M-10 -5 L8 -5 L13 0 L8 5 L-10 5 Z" fill={fill} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="-5" y="-2.5" width="8" height="5" rx="1" fill="#fff" opacity=".9" />
      </g>
    </g>
  )
}

export default function Mapa({ s }: { s: ProtoState }) {
  const p = progreso(s)
  const m = s.viaje.minuto
  const b = vaiven((m + 30) / s.viaje.duracionMin)
  const c = vaiven((m + 12) / (s.viaje.duracionMin * 1.25) + 0.4)
  const flota = [
    { n: s.viaje.buque, r: `${s.viaje.origen.replace(' de Tenerife', '')} → ${s.viaje.destino}`, p, main: true },
    { n: 'Bañaderos Express', r: b.dir === 1 ? 'Santa Cruz → Agaete' : 'Agaete → Santa Cruz', p: b.p, main: false },
    { n: 'Benchijigua Express', r: c.dir === 1 ? 'Los Cristianos → San Sebastián de La Gomera' : 'San Sebastián de La Gomera → Los Cristianos', p: c.p, main: false },
  ]
  return (
    <div className="mg-map">
      <svg viewBox="0 0 520 236" role="img" aria-label={`Mapa de la ruta: ${s.viaje.buque} al ${num(p * 100)} % de la travesía`}>
        <rect width="520" height="236" rx="10" fill="#f1f5fb" />
        {/* olas muy sutiles */}
        <g stroke="#dbe5f4" strokeWidth="1.2" fill="none" strokeLinecap="round">
          <path d="M40 30q8-5 16 0t16 0" />
          <path d="M440 26q8-5 16 0t16 0" />
          <path d="M270 200q8-5 16 0t16 0" />
          <path d="M60 205q8-5 16 0t16 0" />
          <path d="M456 214q8-5 16 0t16 0" />
        </g>
        {/* islas */}
        <path d="M24 150 L62 124 L108 98 L152 66 L190 72 L198 96 L174 124 L130 146 L88 166 L44 166 Z" fill="#dfe8f6" stroke={C.sky} strokeWidth="2" strokeLinejoin="round" />
        <path d="M118 112 l12 -22 l12 22z" fill="#c7d6ee" />
        <ellipse cx="420" cy="122" rx="70" ry="62" fill="#dfe8f6" stroke={C.sky} strokeWidth="2" />
        <ellipse cx="420" cy="124" rx="26" ry="22" fill="#c7d6ee" />
        <text x="62" y="190" className="mg-map-t">Tenerife</text>
        <text x="388" y="208" className="mg-map-t">Gran Canaria</text>

        {/* rutas de la flota */}
        <path d={d(LANE_B)} fill="none" stroke={C.sky} strokeWidth="1.5" strokeDasharray="3 6" strokeLinecap="round" />
        <path d={d(LANE_C)} fill="none" stroke={C.sky} strokeWidth="1.5" strokeDasharray="3 6" strokeLinecap="round" />
        <path d={d(MAIN)} fill="none" stroke={C.sky} strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" />
        <path d={d(MAIN)} pathLength={1} fill="none" stroke={C.navy} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${p} 1`} style={{ transition: 'stroke-dasharray 1s linear' }} />

        {/* puertos */}
        <g>
          <circle cx={MAIN[0].x} cy={MAIN[0].y} r="5.5" fill="#fff" stroke={C.navy} strokeWidth="2.5" />
          <circle cx={MAIN[2].x} cy={MAIN[2].y} r="5.5" fill="#fff" stroke={C.navy} strokeWidth="2.5" />
          <text x={MAIN[0].x - 6} y={MAIN[0].y + 24} textAnchor="end" className="mg-map-p">Santa Cruz</text>
          <text x={MAIN[2].x + 4} y={MAIN[2].y + 24} className="mg-map-p">Agaete</text>
        </g>

        <Barco lane={LANE_B} t={b.p} dir={b.dir as 1 | -1} name="Bañaderos Express" />
        <Barco lane={LANE_C} t={c.p} dir={c.dir as 1 | -1} name="Benchijigua Express" />
        <Barco lane={MAIN} t={p} main name={s.viaje.buque} />
      </svg>
      <ul className="mg-fleet">
        {flota.map((f) => (
          <li key={f.n}>
            <span className={`mg-ship-dot${f.main ? ' main' : ''}`} />
            <b>{f.n}</b>
            <span className="fob-muted">{f.r}</span>
            <em>{num(f.p * 100)} %</em>
          </li>
        ))}
      </ul>
    </div>
  )
}
