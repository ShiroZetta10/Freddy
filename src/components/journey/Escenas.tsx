import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { PerfilId } from '../../data/journey'
import { C } from './paleta'
import { FerryShape } from './Ferry'
import {
  Banco,
  Barra,
  Burbuja,
  Bus,
  Cola,
  Entra,
  Escritorio,
  Fondo,
  Ico,
  Interruptor,
  Loop,
  MiniCola,
  Papeles,
  Pastilla,
  Persona,
  Pop,
  Portatil,
  Reloj,
  Silla,
  Sofa,
  T,
  Tablet,
  Telefono,
  useReducido,
  type Tono,
} from './Piezas'

// 18 pasos × 2 versiones («Hoy» / «Con FredOnBoard»), compuestos con las piezas de Piezas.tsx.
// Caja de escena 320 × 180. No hay asientos asignados: los bancos del salón son genéricos y sin numerar.

export type Esc = { hoy: () => JSX.Element; con: () => JSX.Element }

/* ───────────── contenedores comunes ───────────── */

function Casa({ t, animo, pant, children }: { t: Tono; animo: 'neutro' | 'feliz' | 'triste'; pant: 'gris' | 'amarillo'; children?: ReactNode }) {
  return (
    <>
      <Fondo tipo="casa" tono={t} />
      <Sofa x={64} w={104} />
      <Persona x={116} sentada brazo="movil" pantalla={pant} animo={animo} />
      <Reloj x={60} y={48} r={12} hora="21:10" />
      {children}
    </>
  )
}

function Oficina({ t, animo, brazo = 'abajo', children }: { t: Tono; animo: 'neutro' | 'feliz' | 'triste'; brazo?: 'abajo' | 'alzado' | 'tiende'; children?: ReactNode }) {
  return (
    <>
      <Fondo tipo="oficina" tono={t} />
      <Silla x={134} />
      <Persona x={134} rol="resp" sentada animo={animo} brazo={brazo} />
      <Escritorio x={148} w={150} />
      {children}
    </>
  )
}

function Deslizador({ x, y, w, de, a }: { x: number; y: number; w: number; de: number; a: number }) {
  const r = useReducido()
  return (
    <g>
      <rect x={x} y={y} width={w} height={3} rx={1.5} fill={C.g3} />
      <rect x={x} y={y} width={a} height={3} rx={1.5} fill={C.navy} />
      {r ? (
        <circle cx={x + a} cy={y + 1.5} r={4.5} fill={C.yellow} stroke={C.navy} strokeWidth={1.2} />
      ) : (
        <motion.circle cy={y + 1.5} r={4.5} fill={C.yellow} stroke={C.navy} strokeWidth={1.2} initial={{ cx: x + de }} animate={{ cx: x + a }} transition={{ delay: 0.9, type: 'spring', stiffness: 120, damping: 16 }} />
      )}
    </g>
  )
}

function Columna({ x, h, fill, val, label, d }: { x: number; h: number; fill: string; val: string; label: string; d: number }) {
  const r = useReducido()
  const base = 40
  return (
    <g>
      {r ? (
        <rect x={x} y={base - h} width={26} height={h} rx={2} fill={fill} />
      ) : (
        <motion.rect x={x} width={26} rx={2} fill={fill} initial={{ height: 0, y: base }} animate={{ height: h, y: base - h }} transition={{ delay: d, duration: 0.7, ease: 'easeOut' }} />
      )}
      <T x={x + 13} y={base - h - 3} s={8} w={800} a="middle">
        {val}
      </T>
      <T x={x + 13} y={base + 9} s={7} a="middle" c={C.g5}>
        {label}
      </T>
    </g>
  )
}

/* ───────────── pasajera (Carmen) ───────────── */

const P0: Esc = {
  hoy: () => (
    <Casa t="hoy" animo="neutro" pant="gris">
      <Burbuja x={96} y={22} w={116} h={40} tono="gris" colaX={36} d={0.5}>
        <Ico k="cafe" x={20} y={15} c={C.g4} />
        <Ico k="bocata" x={42} y={15} c={C.g4} />
        <Ico k="q" x={66} y={16} />
        <T x={58} y={34} s={8.5} a="middle" c={C.g5}>
          ¿Qué habrá a bordo?
        </T>
      </Burbuja>
    </Casa>
  ),
  con: () => (
    <Casa t="con" animo="feliz" pant="amarillo">
      <Burbuja x={96} y={16} w={120} h={46} colaX={36} d={0.5}>
        <rect x={8} y={9} width={18} height={13} rx={2} fill={C.navy} />
        <path d="M8 10 L17 17 L26 10" stroke="#fff" strokeWidth={1.2} fill="none" />
        <T x={32} y={17} s={8.5} w={700} c={C.navy}>
          Tu viaje con
        </T>
        <T x={32} y={27} s={8.5} w={700} c={C.navy}>
          FredOnBoard
        </T>
        <Ico k="tick" x={106} y={16} s={0.8} />
        <T x={8} y={40} s={7.5} c={C.g5}>
          Sin descargar ni registrarte
        </T>
      </Burbuja>
    </Casa>
  ),
}

const P1: Esc = {
  hoy: () => (
    <Casa t="hoy" animo="triste" pant="gris">
      <Burbuja x={96} y={16} w={124} h={46} tono="gris" colaX={36} d={0.5}>
        <MiniCola x={12} y={12} n={8} />
        <Ico k="q" x={98} y={18} />
        <T x={62} y={40} s={8} a="middle" c={C.g5}>
          Al zarpar habrá cola
        </T>
      </Burbuja>
    </Casa>
  ),
  con: () => (
    <Casa t="con" animo="feliz" pant="amarillo">
      <Burbuja x={96} y={14} w={124} h={50} colaX={36} d={0.5}>
        <Ico k="cafe" x={16} y={14} />
        <T x={28} y={17} s={8.5} w={700} c={C.navy}>
          Café + bocadillo
        </T>
        <T x={28} y={29} s={8} c={C.g5}>
          Recogida 08:15
        </T>
        <Ico k="tick" x={108} y={14} s={0.8} />
        <Pastilla x={8} y={35} w={52} txt="Pagado" />
      </Burbuja>
    </Casa>
  ),
}

const P2: Esc = {
  hoy: () => (
    <>
      <Fondo tipo="puerto" tono="hoy" />
      <Persona x={230} rol="a" bolsa s={0.95} d={0.2} />
      <Persona x={266} rol="b" s={0.95} d={0.3} />
      <Persona x={120} bolsa brazo="alzado" animo="triste" />
      <Burbuja x={52} y={20} w={80} h={26} tono="gris" colaX={54} d={0.5}>
        <Ico k="q" x={16} y={13} />
        <Ico k="q" x={40} y={13} />
        <Ico k="q" x={64} y={13} />
      </Burbuja>
    </>
  ),
  con: () => (
    <>
      <Fondo tipo="puerto" tono="con" />
      <Persona x={230} rol="a" bolsa s={0.95} d={0.2} />
      <Persona x={266} rol="b" s={0.95} d={0.3} />
      <Persona x={120} bolsa brazo="movil" pantalla="azul" animo="feliz" />
      <Burbuja x={44} y={14} w={130} h={42} colaX={60} d={0.5}>
        <Ico k="wifi" x={16} y={14} />
        <T x={30} y={17} s={8.5} w={700} c={C.navy}>
          Conectada al wifi
        </T>
        <T x={8} y={33} s={7.5} c={C.g5}>
          Llegada 09:20 · mar en calma
        </T>
      </Burbuja>
    </>
  ),
}

const P3: Esc = {
  hoy: () => (
    <>
      <Fondo tipo="salon" tono="hoy" />
      <Banco x={34} w={90} />
      <Persona x={78} sentada animo="triste" />
      <Cola x={134} n={4} paso={16} d={0.2} />
      <Persona x={262} rol="javi" flip animo="neutro" />
      <Barra x={206} w={100} />
      <Reloj x={296} y={50} r={11} hora="10 min" rojo rapido />
      <Burbuja x={34} y={36} w={112} h={34} tono="gris" colaX={36} d={0.6}>
        <Ico k="agua" x={18} y={17} />
        <Ico k="x" x={30} y={11} s={0.7} />
        <T x={44} y={21} s={8.5} c={C.g5}>
          Mejor sin agua
        </T>
      </Burbuja>
    </>
  ),
  con: () => (
    <>
      <Fondo tipo="salon" tono="con" />
      <Banco x={34} w={110} />
      <Persona x={110} rol="b" sentada brazo="movil" pantalla="gris" s={0.95} d={0.2} />
      <Persona x={72} sentada brazo="movil" pantalla="azul" animo="feliz" />
      <Persona x={262} rol="javi" flip animo="feliz" />
      <Barra x={206} w={100} punto />
      <Burbuja x={30} y={30} w={116} h={38} colaX={34} d={0.6}>
        <Ico k="tick" x={16} y={14} s={0.8} />
        <T x={28} y={17} s={8.5} w={700} c={C.navy}>
          Pedido enviado
        </T>
        <T x={8} y={30} s={7.5} c={C.g5}>
          Recogida 08:50–08:55
        </T>
      </Burbuja>
    </>
  ),
}

const P4: Esc = {
  hoy: () => (
    <>
      <Fondo tipo="salon" tono="hoy" />
      <Persona x={262} rol="javi" flip animo="neutro" />
      <Barra x={206} w={100} />
      <Cola x={106} n={5} paso={19} d={0.2} />
      <Persona x={72} animo="triste" brazo="alzado" />
      <Reloj x={296} y={50} r={11} hora="12 min" rojo rapido />
      <Burbuja x={14} y={32} w={96} h={30} tono="gris" colaX={52} d={0.6}>
        <Ico k="q" x={14} y={15} />
        <T x={26} y={19} s={8.5} c={C.g5}>
          ¿Cuándo me toca?
        </T>
      </Burbuja>
    </>
  ),
  con: () => (
    <>
      <Fondo tipo="salon" tono="con" />
      <Persona x={252} rol="javi" flip animo="feliz" brazo="tiende" />
      <Barra x={206} w={100} punto />
      <Ico k="agua" x={222} y={98} s={1.1} />
      <Persona x={168} brazo="tiendeMovil" pantalla="qr" animo="feliz" />
      <Reloj x={296} y={50} r={11} hora="5 s" rapido />
      <Burbuja x={40} y={26} w={140} h={34} tono="navy" colaX={122} d={0.5}>
        <Ico k="campana" x={16} y={17} />
        <T x={30} y={21} s={9} w={700} c="#fff">
          Tu pedido está listo
        </T>
      </Burbuja>
    </>
  ),
}

const P5: Esc = {
  hoy: () => (
    <>
      <Fondo tipo="llegada" tono="hoy" />
      <Persona x={250} rol="a" bolsa s={0.95} d={0.2} />
      <Persona x={170} bolsa animo="triste" />
      <Burbuja x={126} y={34} w={92} h={34} tono="gris" colaX={44} d={0.5}>
        <Ico k="bus" x={16} y={17} />
        <Ico k="q" x={40} y={18} />
        <T x={54} y={21} s={8.5} c={C.g5}>
          ¿Y ahora?
        </T>
      </Burbuja>
    </>
  ),
  con: () => (
    <>
      <Fondo tipo="llegada" tono="con" />
      <Bus x={224} />
      <Persona x={150} brazo="movil" pantalla="amarillo" animo="feliz" />
      <Burbuja x={58} y={18} w={118} h={38} colaX={92} d={0.5}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Ico key={i} k="estrella" x={14 + i * 12} y={13} s={0.6} />
        ))}
        <T x={8} y={31} s={8} w={700} c={C.navy}>
          +9 Plus Points
        </T>
      </Burbuja>
      <Burbuja x={186} y={64} w={112} h={26} tono="navy" colaX={34} d={0.9}>
        <Ico k="bus" x={16} y={13} />
        <T x={28} y={16} s={8.5} w={700} c="#fff">
          Bus gratis 09:30
        </T>
      </Burbuja>
    </>
  ),
}

/* ───────────── barra (Javi) ───────────── */

const Salon1 = ({ t }: { t: Tono }) => <Fondo tipo="salon" tono={t} ventanas={1} />

const B0: Esc = {
  hoy: () => (
    <>
      <Salon1 t="hoy" />
      <Reloj x={56} y={104} r={12} hora="07:00" />
      <Persona x={175} rol="javi" flip animo="neutro" />
      <Barra x={110} w={130} />
      <Burbuja x={110} y={20} w={118} h={40} tono="gris" colaX={58} d={0.5}>
        <MiniCola x={12} y={12} n={7} />
        <Ico k="q" x={98} y={17} />
        <T x={59} y={34} s={8.5} a="middle" c={C.g5}>
          ¿Cuánta gente?
        </T>
      </Burbuja>
    </>
  ),
  con: () => (
    <>
      <Salon1 t="con" />
      <Reloj x={56} y={104} r={12} hora="07:00" />
      <Persona x={175} rol="javi" flip animo="feliz" />
      <Barra x={110} w={130} />
      <Tablet x={196} y={22} w={104} h={62}>
        <T x={0} y={7} s={7.5} w={700} c={C.navy}>
          Salida 08:00
        </T>
        <T x={0} y={32} s={22} w={800} c={C.navy}>
          34
        </T>
        <T x={0} y={41} s={7} c={C.g5}>
          pre-pedidos
        </T>
        <rect x={52} y={26} width={10} height={14} rx={1.5} fill={C.navy4} />
        <rect x={65} y={14} width={10} height={26} rx={1.5} fill={C.yellow} />
        <rect x={78} y={30} width={10} height={10} rx={1.5} fill={C.navy4} />
      </Tablet>
    </>
  ),
}

const B1: Esc = {
  hoy: () => (
    <>
      <Salon1 t="hoy" />
      <Cola x={22} n={5} paso={17} d={0.2} />
      <Persona x={175} rol="javi" flip animo="triste" />
      <Barra x={110} w={130} />
      <Burbuja x={126} y={20} w={112} h={38} tono="gris" colaX={44} d={0.6}>
        <Ico k="papel" x={16} y={14} />
        <Ico k="papel" x={26} y={14} />
        <Ico k="papel" x={36} y={14} />
        <Ico k="cafe" x={58} y={14} />
        <T x={56} y={32} s={8.5} a="middle" c={C.g5}>
          Pedidos mezclados
        </T>
      </Burbuja>
    </>
  ),
  con: () => (
    <>
      <Salon1 t="con" />
      <Cola x={44} n={2} paso={20} d={0.2} />
      <Persona x={175} rol="javi" flip animo="feliz" />
      <Barra x={110} w={130} />
      <Tablet x={190} y={16} w={116} h={68}>
        <T x={0} y={7} s={7.5} w={700} c={C.navy}>
          Pedidos por franja
        </T>
        {[
          ['08:10', 0.8, '8/10', C.verde],
          ['08:15', 1, '10/10', C.ambar],
          ['08:20', 0.6, '6/10', C.verde],
        ].map(([h, f, v, col], i) => (
          <g key={h as string}>
            <T x={0} y={22 + i * 13} s={7.5} c={C.g5}>
              {h as string}
            </T>
            <rect x={26} y={16 + i * 13} width={46} height={6} rx={3} fill={C.g2} />
            <rect x={26} y={16 + i * 13} width={46 * (f as number)} height={6} rx={3} fill={col as string} />
            <T x={78} y={22 + i * 13} s={7.5} w={700}>
              {v as string}
            </T>
          </g>
        ))}
      </Tablet>
    </>
  ),
}

const B2: Esc = {
  hoy: () => (
    <>
      <Salon1 t="hoy" />
      <Persona x={70} rol="a" brazo="alzado" />
      <Persona x={175} rol="javi" flip animo="triste" brazo="alzado" />
      <Barra x={110} w={130} />
      <Burbuja x={30} y={26} w={74} h={26} colaX={34} d={0.4}>
        <Ico k="croissant" x={14} y={13} />
        <T x={26} y={16} s={8.5} w={700}>
          ¿Croissant?
        </T>
      </Burbuja>
      <Burbuja x={128} y={22} w={90} h={28} tono="gris" colaX={40} d={1.1}>
        <Ico k="x" x={14} y={14} s={0.8} />
        <T x={26} y={17} s={8.5} w={700} c={C.g5}>
          No queda
        </T>
      </Burbuja>
    </>
  ),
  con: () => (
    <>
      <Salon1 t="con" />
      <Persona x={70} rol="a" brazo="movil" pantalla="gris" animo="feliz" />
      <Persona x={175} rol="javi" flip animo="feliz" />
      <Barra x={110} w={130} />
      <Tablet x={196} y={18} w={100} h={66}>
        <T x={0} y={7} s={7.5} w={700} c={C.navy}>
          Stock de hoy
        </T>
        <T x={0} y={24} s={8}>
          Croissant
        </T>
        <T x={0} y={33} s={6.5} w={700} c={C.rojo}>
          Agotado
        </T>
        <Interruptor x={62} y={14} on={false} />
        <T x={0} y={48} s={8}>
          Agua 1/2
        </T>
        <Interruptor x={62} y={40} on d={-1} />
      </Tablet>
      <Burbuja x={26} y={24} w={86} h={30} colaX={34} d={1.5}>
        <Ico k="croissant" x={14} y={15} c={C.g3} />
        <Pastilla x={28} y={9} w={50} txt="Agotado" tono="off" />
        <T x={28} y={27} s={7} c={C.g5}>
          lo ve antes de pedir
        </T>
      </Burbuja>
    </>
  ),
}

const B3: Esc = {
  hoy: () => (
    <>
      <Salon1 t="hoy" />
      <Cola x={22} n={5} paso={17} d={0.2} />
      <Persona x={175} rol="javi" flip animo="triste" />
      <Barra x={110} w={130} />
      <Burbuja x={124} y={22} w={110} h={36} tono="gris" colaX={46} d={0.6}>
        <Ico k="moneda" x={16} y={14} s={0.9} />
        <Ico k="cafe" x={38} y={14} />
        <Ico k="papel" x={60} y={14} />
        <T x={55} y={31} s={8} a="middle" c={C.g5}>
          Todo a la vez
        </T>
      </Burbuja>
    </>
  ),
  con: () => (
    <>
      <Salon1 t="con" />
      <Cola x={60} n={1} d={0.2} />
      <Persona x={175} rol="javi" flip animo="feliz" />
      <Barra x={110} w={130} />
      <Tablet x={190} y={12} w={120} h={72}>
        <T x={0} y={7} s={7.5} w={700} c={C.navy}>
          Cola de pedidos
        </T>
        {[
          ['#229 · 2 cafés', 'Preparando', 'warn'],
          ['#230 · Bocata', 'Recibido', 'info'],
          ['#231 · Agua', 'Listo', 'ok'],
        ].map(([l, r, tn], i) => (
          <Entra key={l} d={0.5 + i * 0.25} y={4}>
            <T x={0} y={22 + i * 14} s={7.5} c={C.g5}>
              {l}
            </T>
            <Pastilla x={58} y={14 + i * 14} w={46} txt={r} tono={tn as 'ok' | 'warn' | 'info'} />
          </Entra>
        ))}
      </Tablet>
    </>
  ),
}

const B4: Esc = {
  hoy: () => (
    <>
      <Salon1 t="hoy" />
      <Reloj x={270} y={50} r={12} hora="40 s" rojo rapido />
      <Persona x={70} rol="a" brazo="tiende" />
      <Persona x={175} rol="javi" flip animo="triste" brazo="tiende" />
      <Barra x={110} w={130} />
      <Burbuja x={96} y={22} w={116} h={36} tono="gris" colaX={60} d={0.6}>
        <Ico k="moneda" x={16} y={14} s={0.9} />
        <Ico k="papel" x={38} y={14} />
        <T x={58} y={31} s={8} a="middle" c={C.g5}>
          Cobrar y dar cambio
        </T>
      </Burbuja>
    </>
  ),
  con: () => (
    <>
      <Salon1 t="con" />
      <Reloj x={270} y={50} r={12} hora="5 s" rapido />
      <Persona x={170} rol="javi" flip animo="feliz" brazo="tiende" />
      <Barra x={110} w={130} punto />
      <Persona x={62} rol="carmen" brazo="tiendeMovil" pantalla="qr" animo="feliz" />
      <Pop d={0.9} ox={0.5} oy={0.5}>
        <Ico k="tick" x={116} y={88} s={1.5} />
      </Pop>
      <Burbuja x={120} y={20} w={118} h={26} tono="navy" colaX={50} d={0.5}>
        <T x={59} y={17} s={8.5} w={700} c="#fff" a="middle">
          QR escaneado · #231
        </T>
      </Burbuja>
    </>
  ),
}

const B5: Esc = {
  hoy: () => (
    <>
      <Salon1 t="hoy" />
      <Reloj x={56} y={104} r={12} hora="09:00" />
      <Persona x={175} rol="javi" flip animo="triste" />
      <Barra x={110} w={130} />
      <Papeles x={124} y={102} rot={-8} />
      <Papeles x={146} y={104} rot={7} />
      <Burbuja x={122} y={22} w={104} h={38} tono="gris" colaX={50} d={0.6}>
        <Ico k="papel" x={16} y={14} />
        <Ico k="papel" x={27} y={14} />
        <Ico k="papel" x={38} y={14} />
        <T x={52} y={32} s={8.5} a="middle" c={C.g5}>
          Cuadrar a mano
        </T>
      </Burbuja>
    </>
  ),
  con: () => (
    <>
      <Salon1 t="con" />
      <Persona x={175} rol="javi" flip animo="feliz" />
      <Barra x={110} w={130} />
      <Tablet x={188} y={16} w={120} h={68}>
        <T x={0} y={7} s={7.5} w={700} c={C.navy}>
          Cierre de travesía
        </T>
        <T x={0} y={22} s={8}>
          Pedidos
        </T>
        <T x={104} y={22} s={9} w={800} a="end" c={C.navy}>
          58
        </T>
        <T x={0} y={35} s={8}>
          Sin recoger
        </T>
        <T x={104} y={35} s={9} w={800} a="end" c={C.navy}>
          1
        </T>
        <Ico k="tick" x={6} y={46} s={0.7} />
        <T x={16} y={49} s={8} w={700} c={C.verde}>
          Conciliación TPV correcta
        </T>
      </Tablet>
    </>
  ),
}

/* ───────────── manager (responsable) ───────────── */

const M0: Esc = {
  hoy: () => (
    <Oficina t="hoy" animo="triste">
      <Papeles x={176} y={105} rot={-6} ferry tono={C.g4} />
      <Papeles x={204} y={106} rot={4} ferry tono={C.navy3} />
      <Papeles x={232} y={105} rot={-3} ferry tono={C.ambar} />
      <Burbuja x={80} y={28} w={136} h={32} tono="gris" colaX={54} d={0.5}>
        <Ico k="q" x={14} y={16} />
        <T x={28} y={20} s={8.5} c={C.g5}>
          Cada buque, su carta
        </T>
      </Burbuja>
    </Oficina>
  ),
  con: () => (
    <Oficina t="con" animo="feliz" brazo="tiende">
      {[0, 1, 2].map((i) => (
        <Entra key={i} d={0.9 + i * 0.25} y={-6}>
          <g transform={`translate(${150 + i * 48} 8) scale(.38)`}>
            <FerryShape />
          </g>
          <Pop d={1.2 + i * 0.25} ox={0.5} oy={0.5}>
            <Ico k="tick" x={172 + i * 48} y={38} s={0.6} />
          </Pop>
        </Entra>
      ))}
      <Portatil x={168} y={43} w={112} h={72}>
        <T x={0} y={7} s={8} w={700} c={C.navy}>
          Carta · Mañana
        </T>
        <T x={0} y={19} s={7.5} c={C.g5}>
          Bollería + café
        </T>
        <T x={94} y={19} s={7.5} w={700} a="end">
          4,20 €
        </T>
        <T x={0} y={30} s={7.5} c={C.g5}>
          Bocadillo pollo
        </T>
        <T x={94} y={30} s={7.5} w={700} a="end">
          5,72 €
        </T>
        <T x={0} y={41} s={7.5} c={C.g5}>
          Combo KM0
        </T>
        <Pastilla x={64} y={33} w={30} txt="Nuevo" tono="info" />
        <rect x={0} y={45} width={94} height={11} rx={3} fill={C.yellow} />
        <T x={47} y={53} s={7} w={800} c={C.navy} a="middle">
          Publicar en la flota
        </T>
      </Portatil>
    </Oficina>
  ),
}

const M1: Esc = {
  hoy: () => (
    <Oficina t="hoy" animo="triste" brazo="alzado">
      <Papeles x={200} y={105} rot={5} />
      <Burbuja x={78} y={26} w={140} h={32} tono="gris" colaX={56} d={0.5}>
        <Ico k="q" x={14} y={16} />
        <Ico k="q" x={28} y={16} />
        <T x={42} y={20} s={8.5} c={C.g5}>
          ¿Cuánta capacidad?
        </T>
      </Burbuja>
    </Oficina>
  ),
  con: () => (
    <Oficina t="con" animo="feliz" brazo="tiende">
      <Portatil x={168} y={43} w={112} h={72}>
        <T x={0} y={7} s={8} w={700} c={C.navy}>
          Reglas de capacidad
        </T>
        <T x={0} y={19} s={7.5} c={C.g5}>
          Tope por franja
        </T>
        <T x={94} y={19} s={8} w={800} a="end">
          10
        </T>
        <Deslizador x={0} y={24} w={94} de={20} a={66} />
        <T x={0} y={44} s={7.5} c={C.g5}>
          Abrir al comprar
        </T>
        <Interruptor x={70} y={35} on d={-1} />
        <T x={0} y={54} s={7.5} c={C.g5}>
          Cerrar 20 min antes
        </T>
      </Portatil>
    </Oficina>
  ),
}

const M2: Esc = {
  hoy: () => (
    <Oficina t="hoy" animo="triste" brazo="alzado">
      <Burbuja x={74} y={26} w={148} h={32} tono="gris" colaX={60} d={0.5}>
        <Ico k="q" x={14} y={16} />
        <T x={28} y={20} s={8.5} c={C.g5}>
          ¿Dónde va cada barco?
        </T>
      </Burbuja>
    </Oficina>
  ),
  con: () => (
    <Oficina t="con" animo="feliz" brazo="tiende">
      <Portatil x={168} y={43} w={112} h={72}>
        <T x={0} y={7} s={8} w={700} c={C.navy}>
          Panel en vivo
        </T>
        <Loop scale={1.6} dur={1.6}>
          <circle cx={88} cy={4} r={3} fill={C.verde} />
        </Loop>
        {[
          ['4', 'buques', 0],
          ['612', 'pasajeros', 33],
          ['118', 'pre-pedidos', 66],
        ].map(([v, l, x]) => (
          <Entra key={l as string} d={0.5 + (x as number) / 60} y={4}>
            <T x={x as number} y={27} s={15} w={800} c={C.navy}>
              {v as string}
            </T>
            <T x={x as number} y={36} s={6} c={C.g5}>
              {l as string}
            </T>
          </Entra>
        ))}
        <path d="M2 48 H92" stroke={C.g3} strokeWidth={2} strokeLinecap="round" />
        {[10, 34, 58, 80].map((cx, i) => (
          <Loop key={cx} x={4} dur={2.4 + i * 0.4}>
            <circle cx={cx} cy={48} r={3.2} fill={C.yellow} stroke={C.navy} strokeWidth={1} />
          </Loop>
        ))}
      </Portatil>
    </Oficina>
  ),
}

const M3: Esc = {
  hoy: () => (
    <Oficina t="hoy" animo="triste" brazo="alzado">
      <Telefono x={210} y={119} />
      <Burbuja x={150} y={26} w={64} h={26} tono="gris" colaX={30} d={0.5}>
        <Ico k="x" x={14} y={13} s={0.8} />
        <T x={26} y={16} s={8.5} w={700} c={C.g5}>
          ¡Cola!
        </T>
      </Burbuja>
      <Burbuja x={226} y={50} w={74} h={26} tono="gris" colaX={30} d={0.9}>
        <Ico k="x" x={14} y={13} s={0.8} />
        <T x={26} y={16} s={8.5} w={700} c={C.g5}>
          ¡Tarde!
        </T>
      </Burbuja>
    </Oficina>
  ),
  con: () => (
    <Oficina t="con" animo="feliz" brazo="tiende">
      <Portatil x={168} y={43} w={112} h={72}>
        <T x={0} y={7} s={8} w={700} c={C.navy}>
          Alertas
        </T>
        <T x={0} y={21} s={7.5} c={C.g5}>
          Proa · espera
        </T>
        <Pastilla x={60} y={13} w={34} txt="7 min" tono="warn" />
        <T x={0} y={34} s={7.5} c={C.g5}>
          Popa · espera
        </T>
        <Pastilla x={60} y={26} w={34} txt="2 min" tono="ok" />
        <Loop scale={1.04} dur={1.4} ox={0.5} oy={0.5}>
          <rect x={0} y={41} width={94} height={13} rx={3} fill={C.yellow} />
          <T x={47} y={50} s={7.5} w={800} c={C.navy} a="middle">
            Sugerir Cafetería Popa
          </T>
        </Loop>
      </Portatil>
    </Oficina>
  ),
}

const M4: Esc = {
  hoy: () => (
    <Oficina t="hoy" animo="triste">
      <Papeles x={196} y={105} rot={4} />
      <Ico k="q" x={196} y={96} s={1.2} />
      <Burbuja x={84} y={28} w={104} h={30} tono="gris" colaX={50} d={0.5}>
        <Ico k="papel" x={14} y={15} />
        <T x={26} y={19} s={8.5} c={C.g5}>
          Sin registro
        </T>
      </Burbuja>
    </Oficina>
  ),
  con: () => (
    <Oficina t="con" animo="feliz" brazo="tiende">
      <Portatil x={168} y={43} w={112} h={72}>
        <T x={0} y={7} s={8} w={700} c={C.navy}>
          Recogida e incidencias
        </T>
        <T x={0} y={28} s={15} w={800} c={C.navy}>
          1:40
        </T>
        <T x={0} y={37} s={6} c={C.g5}>
          listo → recogido
        </T>
        <T x={62} y={28} s={15} w={800} c={C.ambar}>
          2
        </T>
        <T x={62} y={37} s={6} c={C.g5}>
          incidencias
        </T>
        <Ico k="tick" x={6} y={48} s={0.6} />
        <T x={15} y={51} s={7} c={C.g5}>
          Pago duplicado evitado
        </T>
      </Portatil>
    </Oficina>
  ),
}

const M5: Esc = {
  hoy: () => (
    <Oficina t="hoy" animo="triste" brazo="alzado">
      <Papeles x={196} y={105} rot={-5} />
      <Burbuja x={84} y={28} w={118} h={30} tono="gris" colaX={48} d={0.5}>
        <Ico k="q" x={14} y={15} />
        <T x={28} y={19} s={8.5} c={C.g5}>
          ¿Ha funcionado?
        </T>
      </Burbuja>
    </Oficina>
  ),
  con: () => (
    <Oficina t="con" animo="feliz" brazo="tiende">
      <Portatil x={168} y={43} w={112} h={72}>
        <T x={0} y={7} s={8} w={700} c={C.navy}>
          Venta por pasajero
        </T>
        <Columna x={0} h={17} fill={C.g3} val="1,37 €" label="Base" d={0.6} />
        <Columna x={32} h={20} fill={C.navy} val="1,61 €" label="Piloto" d={0.9} />
        <Pop d={1.5} ox={0.5} oy={0.5}>
          <T x={94} y={24} s={10} w={800} c={C.verde} a="end">
            +17 %
          </T>
        </Pop>
      </Portatil>
    </Oficina>
  ),
}

export const ESC: Record<PerfilId, Esc[]> = {
  pasajero: [P0, P1, P2, P3, P4, P5],
  barra: [B0, B1, B2, B3, B4, B5],
  manager: [M0, M1, M2, M3, M4, M5],
}
