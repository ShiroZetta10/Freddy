import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts'
import Icon from '../components/Icon'
import { eur, num, pct, totales, derivados } from '../data/bajamar'
import { EJES_CANARIOS, FO_OFICIAL, TIPOS_TRAVESIA } from '../data/canarias'
import {
  CONSTANTES,
  ESCENARIOS,
  EscenarioId,
  FUENTES,
  Params,
  REPARTO_IMPLANTACION,
  calcular,
  flota,
  flujoAcumulado,
} from '../data/negocio'
import './implementacion.css'

/* ------------------------------------------------------------------ datos de la página */

const FASES = [
  {
    num: 'Fase 0',
    titulo: 'Preparación y línea base',
    duracion: '≈ 4 semanas (la semana 0 es de medición)',
    entregables: [
      'Semana 0: medición sin servicio (tickets por hora, % que compra, espera en barra) para tener línea base propia.',
      'Acuerdos con Fred. Olsen: cafetería piloto, franja, espacio de recogida, medio de pago y devoluciones.',
      'Carta, precios y escandallos cargados; servidor a bordo y tablets instalados.',
    ],
    quien: 'Equipo Shiro (producto y desarrollo), responsable de restauración y IT de Fred. Olsen.',
    criterio: 'Supuestos críticos validados (TPV, conectividad real, espacio de recogida, pagos) y línea base medida.',
  },
  {
    num: 'Fase 1',
    titulo: 'Piloto MVP en el Bajamar Express',
    duracion: '4 semanas con servicio',
    entregables: [
      'Web sin cuenta, con acceso por el billete: Click & Collect y pre-pedido antes de embarcar.',
      'Tablet de barra con cola por franjas, pausa y entrega con QR.',
      'Panel de manager con KPIs y conciliación diaria (sin integración con el TPV).',
    ],
    quien: 'Tripulación de la cafetería piloto, un responsable de producto y el equipo de desarrollo.',
    criterio: 'Más pasajeros que compran y más venta por pasajero frente a la línea base, sin más espera en barra y sin ampliar dotación. Umbrales a acordar con Fred. Olsen (ver Piloto).',
  },
  {
    num: 'Fase 2',
    titulo: 'Integraciones',
    duracion: '2–3 meses (depende del proveedor del TPV)',
    entregables: [
      'Integración por API con el TPV: ventas y stock en una sola caja.',
      'Pasarela de pago tokenizada del banco de Fred. Olsen, con Apple Pay y Google Pay.',
      'Fred. Olsen Plus: identificación opcional y Plus Points en el pedido.',
    ],
    quien: 'Desarrollo, IT y proveedor de TPV y pasarela de Fred. Olsen.',
    criterio: 'Conciliación automática sin diferencias y pagos con devoluciones probados de extremo a extremo.',
  },
  {
    num: 'Fase 3',
    titulo: 'Escalado a la flota y dentro de On Board Club',
    duracion: '6–12 meses, por oleadas de buques',
    entregables: [
      'Segunda oleada: Bañaderos Express y resto de alta velocidad; después, ferry convencional y miniferris con su modo propio.',
      'FredOnBoard dentro de On Board Club y de la app: viaje en tiempo real, valoración, Plus Points.',
      'Panel de flota con datos agregados y carta por buque.',
    ],
    quien: 'Producto y desarrollo de Fred. Olsen o proveedor local, con la formación a cada tripulación.',
    criterio: 'Resultado estable por buque durante 3 meses y plataforma que se mantiene sin el equipo original.',
  },
]

type Recurso = { icono: string; titulo: string; puntos: string[]; supuesto?: string }

const RECURSOS: Recurso[] = [
  {
    icono: 'box',
    titulo: 'Hardware',
    puntos: [
      'Una tablet resistente por cafetería, fijada en la barra (3 en el Bajamar Express).',
      'Un mini PC industrial como servidor a bordo, con SAI pequeño; otro de repuesto en tierra.',
      'Sin impresora: el pedido y el recibo son digitales (papel cero).',
    ],
    supuesto: 'Espacio de recogida: dónde se entrega sin crear una cola nueva. Se valida en la semana 0.',
  },
  {
    icono: 'users',
    titulo: 'Personas, sin aumentar la dotación',
    puntos: [
      'Tripulación existente: el pedido llega ya cobrado a la tablet. El trabajo cambia de sitio (menos cobrar en cola, más preparar con antelación); no se suma.',
      'Las franjas con tope y la pausa de pedidos evitan los picos que la barra no pueda absorber.',
      'Un responsable de producto (parcial) y un equipo de desarrollo y soporte, fuera de la tripulación.',
    ],
    supuesto: 'Quién ejerce de responsable de producto (Fred. Olsen o proveedor) y cuánta carga real supone en barra: se mide en el piloto.',
  },
  {
    icono: 'wifi',
    titulo: 'Conectividad',
    puntos: [
      'Servidor a bordo local-first: pedidos, stock y tablets funcionan por el wifi del barco aunque no haya internet.',
      'Starlink solo sincroniza con la nube, con cola de salida y pedidos sin duplicados.',
      'Si cae el servicio, la barra sigue vendiendo como hoy.',
    ],
    supuesto: 'Calidad real del wifi a bordo con el barco lleno y ancho de banda disponible: lo confirma el equipo técnico de Fred. Olsen.',
  },
  {
    icono: 'plug',
    titulo: 'Integraciones',
    puntos: [
      'Fase 1: ninguna obligatoria. Listado de pasajeros por salida en solo lectura y conciliación diaria con el TPV.',
      'Fase 2: TPV por API, pasarela de pago y Fred. Olsen Plus.',
      'Inventario: se aprovecha el escandallo que ya existe y la función de perecederos aún sin activar.',
    ],
    supuesto: 'Modelo de TPV y si ofrece API: no lo conocemos. Si no la hay, la conciliación diaria sigue siendo válida.',
  },
  {
    icono: 'wrench',
    titulo: 'Formación',
    puntos: [
      'Una sesión corta (≈ 30 min) y una guía de una página junto a la tablet.',
      'Acompañamiento de producto durante los primeros viajes del piloto.',
      'La tablet muestra pocos estados: recibido, en preparación, listo y entregado.',
    ],
  },
  {
    icono: 'shield',
    titulo: 'Legales y seguridad',
    puntos: [
      'RGPD: solo el localizador del billete, sin cuenta; datos en la UE; consentimiento expreso para avisos por WhatsApp.',
      'Pagos: la pasarela es tokenizada. Ningún dato de tarjeta pasa por nuestros servidores (cumplimiento PCI a cargo de la pasarela).',
      'Alérgenos: siempre la ficha oficial del producto; el chat no responde con texto libre.',
    ],
    supuesto: 'Medios de pago admitidos, devoluciones y política de datos: se acuerdan con Fred. Olsen y su delegado de protección de datos.',
  },
]

const ESCALA: Record<string, string> = {
  'Miniferri / costera': 'Carta corta y pre-pedido; recogida al embarcar. Sin servidor propio si no hay cafetería: solo la web. Hardware mínimo.',
  'Fast ferry corto': 'Cierre de pedidos antes del puerto de llegada. Una tablet por cafetería; las franjas son pocas y cortas.',
  'Fast ferry medio': 'Modelo del piloto: franjas con tope, aviso «listo», QR y servidor a bordo. Es la plantilla del resto de la flota.',
  'Fast ferry largo': 'Dos oleadas de pedidos (ida y llegada), más tienda a bordo. Más margen para el upselling.',
  'Ferry convencional': 'Pedidos por comidas y reserva de mesa; más pasajeros que pasan la noche a bordo. Carta de restaurante, más ocupación de frío.',
}

const IMPACTO_CANARIO: Record<string, string> = {
  identidad: 'Etiqueta «Elaborado en Canarias» en la carta, filtro KM0 y nombre del proveedor local en el producto. Los proveedores canarios ganan visibilidad en cada pedido.',
  sostenibilidad: 'Papel cero, opción «sin cubiertos ni bolsa» y previsión por escandallo: se pide con más antelación y se compra y prepara mejor, con menos desperdicio.',
  talento: 'Pila tecnológica estándar que un equipo local puede mantener. El traspaso incluye código, documentación y formación; el empleo técnico se queda en las islas.',
  joven: 'Se vive dentro de On Board Club, sin instalar nada, y puede ofrecer ventajas a billetes de Tarifa Joven (12–25 años). Las ventajas concretas las decide Fred. Olsen.',
}

const RIESGOS = [
  { r: 'Wifi inestable a bordo', m: 'Servidor local-first, pedido idempotente y cola de salida. Si cae, la barra vende como hoy.', f: 'Fase 0' },
  { r: 'La recogida crea una cola nueva', m: 'Franjas con tope, aviso «listo» con QR y espacio de entrega acordado. Se mide el tiempo de espera en el piloto.', f: 'Fase 1' },
  { r: 'Sobrecarga de la tripulación en picos', m: 'Tope por franja y pausa de pedidos desde la tablet. Se mide la carga y se para si crece.', f: 'Fase 1' },
  { r: 'Pasajeros sin móvil o poco digitales', m: 'La barra tradicional no cambia. El servicio suma un canal, no sustituye ninguno.', f: 'Todas' },
  { r: 'Productos agotados después de pagar', m: 'Stock por escandallo, umbral de seguridad y reembolso solo de la línea afectada.', f: 'Fase 1' },
  { r: 'Pagos y devoluciones sin definir', m: 'Pasarela tokenizada; el medio de pago y el circuito de devolución se cierran en la Fase 0.', f: 'Fase 0' },
  { r: 'Integración con el TPV se retrasa', m: 'El MVP no la necesita: conciliación diaria. La integración se hace en la Fase 2.', f: 'Fase 2' },
  { r: 'Adopción menor de la esperada', m: 'QR en las mesas, portal wifi y pre-pedido (ver plan de comunicación). El modelo se revisa con el dato real del piloto.', f: 'Fase 1' },
  { r: 'Beneficio inferior al coste', m: 'Escenarios con supuestos explícitos y criterio de parada tras el piloto. La inversión inicial es pequeña.', f: 'Fase 1' },
]

/* ------------------------------------------------------------------ utilidades */

const fmtK = (n: number) => (Math.abs(n) >= 1000 ? `${num(n / 1000, 0)} k€` : `${num(n, 0)} €`)
const fmtPayback = (m: number | null) => (m === null ? 'No se recupera' : m > 60 ? 'Más de 60 meses' : `${num(m, 1)} meses`)

type RangeProps = {
  label: string
  value: number
  set: (n: number) => void
  min: number
  max: number
  step?: number
  fmt: (n: number) => string
  help: string
  tag: 'supuesto' | 'derivado'
}

function Range(p: RangeProps) {
  return (
    <div className="range-row">
      <label>
        <span>{p.label}</span>
        <span style={{ color: 'var(--navy)' }}>{p.fmt(p.value)}</span>
      </label>
      <input type="range" min={p.min} max={p.max} step={p.step ?? 1} value={p.value} onChange={(e) => p.set(+e.target.value)} aria-label={p.label} />
      <div className="tiny muted">
        <span className={`tag ${p.tag === 'supuesto' ? 'yellow' : 'green'}`} style={{ marginRight: 6 }}>
          {p.tag === 'supuesto' ? 'Supuesto' : 'Dato real'}
        </span>
        {p.help}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ modelo de negocio interactivo */

function ModeloNegocio() {
  const [esc, setEsc] = useState<EscenarioId | 'personalizado'>('base')
  const [p, setP] = useState<Params>(ESCENARIOS[1].params)

  const set = <K extends keyof Params>(k: K) => (v: number) => {
    setP((prev) => ({ ...prev, [k]: v }))
    setEsc('personalizado')
  }
  const elegir = (id: EscenarioId) => {
    setEsc(id)
    setP(ESCENARIOS.find((e) => e.id === id)!.params)
  }

  const r = useMemo(() => calcular(p), [p])
  const f = useMemo(() => flota(p), [p])

  const serie = useMemo(() => {
    const act = flujoAcumulado(p)
    const pr = flujoAcumulado(ESCENARIOS[0].params)
    const ba = flujoAcumulado(ESCENARIOS[1].params)
    const op = flujoAcumulado(ESCENARIOS[2].params)
    return act.map((v, m) => ({ mes: m, actual: Math.round(v), prudente: Math.round(pr[m]), base: Math.round(ba[m]), optimista: Math.round(op[m]) }))
  }, [p])

  const barras = [
    { n: 'Ventas actuales', v: r.ventaBase },
    { n: 'Con FredOnBoard', v: r.ventaNueva },
  ]

  const escActual = ESCENARIOS.find((e) => e.id === esc)

  return (
    <div className="im-sim">
      <div className="card im-sim-controls">
        <div className="eyebrow">Escenario</div>
        <div className="im-esc" role="group" aria-label="Escenarios prefijados">
          {ESCENARIOS.map((e) => (
            <button key={e.id} className={esc === e.id ? 'on' : ''} onClick={() => elegir(e.id)} aria-pressed={esc === e.id}>
              <strong>{e.nombre}</strong>
              <span className="tiny muted" style={{ fontWeight: 400 }}>
                {pct(e.params.adopcion / 100)} adopción · +{num(e.params.subidaCompra, 1)} pp · +{e.params.subidaTicket} % ticket
              </span>
            </button>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: -6 }}>
          {escActual ? escActual.resumen : 'Escenario personalizado: has movido algún supuesto.'}
        </p>

        <div className="im-group">Ventas</div>
        <Range
          label="Adopción del canal"
          value={p.adopcion}
          set={set('adopcion')}
          min={0}
          max={60}
          fmt={(n) => `${n} %`}
          tag="supuesto"
          help="Parte de las compras que pasa por FredOnBoard. Hoy es 0 %: no hay pedido móvil."
        />
        <Range
          label="Aumento del % que compra"
          value={p.subidaCompra}
          set={set('subidaCompra')}
          min={0}
          max={10}
          step={0.5}
          fmt={(n) => `+${num(n, 1)} pp`}
          tag="supuesto"
          help={`Hoy compra ≈ ${pct(derivados.tasaCompra)} de los pasajeros (dato derivado). La subida es hipótesis del reto.`}
        />
        <Range
          label="Aumento del ticket por upselling"
          value={p.subidaTicket}
          set={set('subidaTicket')}
          min={0}
          max={30}
          fmt={(n) => `+${n} %`}
          tag="supuesto"
          help={`Sobre un ticket medio real de ${eur(totales.ticketMedio, 2)}, solo en el canal digital.`}
        />
        <Range
          label="Margen bruto sobre la venta incremental"
          value={p.margen}
          set={set('margen')}
          min={30}
          max={80}
          fmt={(n) => `${n} %`}
          tag="supuesto"
          help="No conocemos el margen real de la barra. Editable."
        />

        <div className="im-group">Costes</div>
        <Range
          label="Comisión de la pasarela"
          value={p.comision}
          set={set('comision')}
          min={0.5}
          max={3}
          step={0.1}
          fmt={(n) => `${num(n, 1)} %`}
          tag="supuesto"
          help="Sobre toda la venta digital, no solo la incremental."
        />
        <Range
          label="Coste mensual de plataforma"
          value={p.plataforma}
          set={set('plataforma')}
          min={500}
          max={5000}
          step={100}
          fmt={(n) => `${eur(n)}/mes`}
          tag="supuesto"
          help="Nube, mantenimiento, soporte y producto a tiempo parcial."
        />
        <Range
          label="Coste de implantación"
          value={p.implantacion}
          set={set('implantacion')}
          min={10000}
          max={80000}
          step={1000}
          fmt={(n) => eur(n)}
          tag="supuesto"
          help="Una sola vez: desarrollo, hardware, piloto y formación."
        />

        <div className="im-group">Extrapolación a la flota</div>
        <Range
          label="Buques adicionales con el servicio"
          value={p.buques}
          set={set('buques')}
          min={0}
          max={CONSTANTES.buquesMax}
          fmt={(n) => `${n}`}
          tag="supuesto"
          help={`Solo alta velocidad con cafetería: ${FO_OFICIAL.flota.split(',')[0]} en la flota, menos el Bajamar.`}
        />
        <Range
          label="Ventas del buque respecto al Bajamar"
          value={p.equivalencia}
          set={set('equivalencia')}
          min={20}
          max={100}
          step={10}
          fmt={(n) => `${n} %`}
          tag="supuesto"
          help="No hay datos de ventas de otros buques."
        />
        <button className="btn ghost sm" onClick={() => elegir('base')}>
          Volver al escenario Base
        </button>
      </div>

      <div className="grid">
        <div className="card im-hero">
          <div className="eyebrow">Ventas incrementales al año · Bajamar Express</div>
          <div className="big">
            {r.incremental >= 0 ? '+' : ''}
            {eur(r.incremental)}
          </div>
          <div className="sub">
            {pct(r.incrementalPct, 1)} sobre unas ventas anuales estimadas de {eur(r.ventaBase)} · venta por pasajero {eur(totales.consumoPorPasajero, 2)} →{' '}
            <strong>{eur(r.ventaPorPasajero, 2)}</strong>
          </div>
        </div>

        <div className="grid g2">
          <div className="card stat">
            <div className="label">Margen bruto incremental</div>
            <div className="value">{eur(r.margenBruto)}</div>
            <div className="sub">al {p.margen} % de margen supuesto</div>
          </div>
          <div className="card stat">
            <div className="label">Coste total, primer año</div>
            <div className="value">{eur(r.costeTotal)}</div>
            <div className="sub">
              implantación {fmtK(r.implantacion)} + plataforma {fmtK(r.plataformaTotal)} + comisión {fmtK(r.comisionTotal)}
            </div>
          </div>
          <div className="card stat yellow">
            <div className="label">Payback</div>
            <div className="value">{fmtPayback(r.paybackMeses)}</div>
            <div className="sub">en recuperar la implantación, sin rampa de adopción</div>
          </div>
          <div className="card stat">
            <div className="label">Resultado neto, primer año</div>
            <div className="value">{eur(r.resultadoNeto)}</div>
            <div className="sub">margen − comisión − plataforma − implantación</div>
          </div>
        </div>

        <div className="card">
          <h3>Flujo acumulado, 36 meses</h3>
          <p className="small muted" style={{ marginBottom: 8 }}>
            Cuando la línea navy cruza el cero, la implantación está recuperada. Las líneas grises son los tres escenarios.
          </p>
          <div style={{ height: 260 }} role="img" aria-label="Flujo acumulado de caja mensual durante 36 meses, escenario elegido frente a los tres escenarios prefijados">
            <ResponsiveContainer>
              <LineChart data={serie} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="#e2e7ef" vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} ticks={[0, 6, 12, 18, 24, 30, 36]} tickFormatter={(m) => `${m} m`} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={56} tickFormatter={(v) => fmtK(v)} />
                <Tooltip formatter={(v: number) => eur(v)} labelFormatter={(m) => `Mes ${m}`} />
                <ReferenceLine y={0} stroke="#5d6779" />
                <Line type="monotone" dataKey="prudente" name="Prudente" stroke="#a9b4c6" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                <Line type="monotone" dataKey="base" name="Base" stroke="#7b879b" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                <Line type="monotone" dataKey="optimista" name="Optimista" stroke="#c4cddb" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                <Line type="monotone" dataKey="actual" name="Tu escenario" stroke="#0b3478" strokeWidth={3} dot={false} />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Ventas anuales del Bajamar</h3>
          <div style={{ height: 150 }} role="img" aria-label="Ventas anuales actuales y con FredOnBoard">
            <ResponsiveContainer>
              <BarChart data={barras} layout="vertical" margin={{ left: 10, right: 90 }}>
                <XAxis type="number" hide domain={[0, 'dataMax']} />
                <YAxis type="category" dataKey="n" width={120} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip formatter={(v: number) => eur(v)} />
                <Bar dataKey="v" radius={[0, 4, 4, 0]}>
                  {barras.map((b, i) => (
                    <Cell key={b.n} fill={i ? '#0b3478' : '#a9b4c6'} />
                  ))}
                  <LabelList dataKey="v" position="right" formatter={(v: number) => eur(v)} style={{ fontWeight: 700, fontSize: 12 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="eyebrow">Extrapolación prudente a la flota · supuesto</div>
          <div className="grid g2" style={{ marginTop: 8 }}>
            <div>
              <div className="small muted">Ventas incrementales adicionales / año</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>{eur(f.ventaIncremental)}</div>
              <div className="tiny muted">{f.buques} buques adicionales · {p.equivalencia} % de las ventas del Bajamar</div>
            </div>
            <div>
              <div className="small muted">Resultado neto del primer año, flota</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>{eur(f.resultadoNetoAnio1)}</div>
              <div className="tiny muted">Payback: {fmtPayback(f.paybackMeses)}</div>
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            Cada buque extra cuesta el {pct(CONSTANTES.plataformaPorBuqueExtra)} de plataforma y el {pct(CONSTANTES.implantacionPorBuqueExtra)} de implantación del Bajamar, porque el desarrollo, el panel y la
            nube se comparten. No se incluyen miniferris ni buques de carga. Es un orden de magnitud para decidir, no una previsión.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ página */

export default function Implementacion() {
  const [verDesglose, setVerDesglose] = useState(false)
  const base = ESCENARIOS[1].params

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Entregable 02 · Plan de implementación</div>
        <h1>Cómo implantar FredOnBoard a bordo</h1>
        <p>
          FredOnBoard se integra dentro de On Board Club, el ecosistema digital que Fred. Olsen ya ofrece a bordo. Este plan recoge los pasos, los recursos y las condiciones necesarias, y
          una estimación de costes y beneficios. Es una propuesta viable para pilotar, no un producto terminado: lo que no sabemos se marca como supuesto a validar.
        </p>
      </div>

      <div className="grid g3">
        <div className="card stat">
          <div className="label">Buque piloto</div>
          <div className="value">Bajamar Express</div>
          <div className="sub">Santa Cruz ↔ Agaete · {totales.duracionMin} min · {totales.cafeterias} cafeterías</div>
        </div>
        <div className="card stat">
          <div className="label">Línea base real</div>
          <div className="value">{eur(totales.facturacion)}</div>
          <div className="sub">ene–abr 2026 · {num(totales.tickets)} tickets · ticket medio {eur(totales.ticketMedio, 2)}</div>
        </div>
        <div className="card stat yellow">
          <div className="label">Inversión estimada</div>
          <div className="value">{eur(base.implantacion)}</div>
          <div className="sub">y {eur(base.plataforma)}/mes de plataforma (supuestos)</div>
        </div>
      </div>

      {/* 1. Hoja de ruta */}
      <section className="section" id="hoja-de-ruta">
        <div className="section-title">
          <h2>Hoja de ruta por fases</h2>
          <p>Cada fase termina con una decisión: seguir, ajustar o parar. No se pasa a la siguiente sin cumplir el criterio.</p>
        </div>
        <div className="im-phases">
          {FASES.map((f) => (
            <div key={f.num} className="card im-phase">
              <div className="im-phase-head">
                <div className="im-phase-num">{f.num}</div>
                <h3>{f.titulo}</h3>
                <div className="im-phase-dur">{f.duracion}</div>
              </div>
              <div className="im-phase-body">
                <div>
                  <h4>Entregables</h4>
                  <ul>
                    {f.entregables.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Quién</h4>
                  <p className="small" style={{ margin: 0 }}>
                    {f.quien}
                  </p>
                </div>
                <div className="im-gate">
                  <strong>Para pasar a la siguiente fase:</strong> {f.criterio}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          Las duraciones son estimaciones del equipo y dependen de la agenda y de los proveedores de Fred. Olsen. El diseño del piloto (6 semanas: 2 de línea base y 4 con servicio) se detalla en el entregable de Piloto.
        </p>
      </section>

      {/* 2. Recursos */}
      <section className="section" id="recursos">
        <div className="section-title">
          <h2>Recursos y condiciones</h2>
          <p>
            Lo que hace falta para implantar el servicio. Las franjas amarillas son <strong>supuestos a validar con Fred. Olsen</strong>: no los damos por resueltos.
          </p>
        </div>
        <div className="im-res">
          {RECURSOS.map((r) => (
            <div key={r.titulo} className="card">
              <h3>
                <span className="im-ico">
                  <Icon name={r.icono} size={18} />
                </span>
                {r.titulo}
              </h3>
              <ul>
                {r.puntos.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              {r.supuesto && (
                <div className="im-flag">
                  <span className="tag yellow">Supuesto a validar</span>
                  <span>{r.supuesto}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="callout navy" style={{ marginTop: 16 }}>
          <strong>Hipótesis oficial del reto:</strong> «La operativa podrá integrarse sin ampliar inicialmente la dotación». El piloto la comprueba midiendo la carga del equipo en barra. La arquitectura y el stack están en las{' '}
          <Link to="/faq">preguntas técnicas</Link>.
        </div>
      </section>

      {/* 3. Modelo de negocio */}
      <section className="section" id="modelo-de-negocio">
        <div className="section-title">
          <h2>Modelo de negocio</h2>
          <p>
            Estimación de costes, beneficios y potencial de ventas. Parte de las ventas reales del Bajamar Express y mueve los supuestos para ver cuándo sale a cuenta. Los resultados son una estimación, no una previsión.
          </p>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="eyebrow">Cómo se calcula</div>
          <div className="im-formula">
            incremental = pasajeros × (23 % + subida) × ticket × (1 + adopción × subida del ticket) − ventas actuales
            <br />
            resultado = incremental × margen − comisión × venta digital − plataforma × meses
            <br />
            payback = implantación ÷ resultado mensual
          </div>
          <p className="small muted" style={{ margin: '10px 0 0' }}>
            Pasajeros estimados = {eur(totales.facturacion)} ÷ {eur(totales.consumoPorPasajero, 2)} ≈ {num(derivados.pasajerosEstimados)} en cuatro meses; el año se obtiene multiplicando por {CONSTANTES.factorAnual}, sin estacionalidad del verano.
          </p>
        </div>

        <ModeloNegocio />

        <div className="callout" style={{ marginTop: 16 }}>
          <strong>Qué dice el modelo.</strong> Con un solo buque, el servicio se paga en cerca de un año en el escenario Base y tarda más de dos años en el Prudente: los costes de plataforma son casi fijos. El valor aparece al compartir la plataforma entre buques. Por eso el plan empieza pequeño y escala solo si el piloto lo confirma.
        </div>

        <h3 style={{ marginTop: 28 }}>Qué es dato real y qué es supuesto</h3>
        <div className="im-table-wrap">
          <table className="im-table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Valor</th>
                <th>Tipo</th>
                <th>Fuente y nota</th>
              </tr>
            </thead>
            <tbody>
              {FUENTES.map((s) => (
                <tr key={s.nombre}>
                  <th scope="row">{s.nombre}</th>
                  <td>{s.valor}</td>
                  <td>
                    <span className={`tag ${s.fuente === 'supuesto' ? 'yellow' : 'green'}`}>{s.fuente === 'real' ? 'Dato real' : s.fuente === 'derivado' ? 'Derivado' : 'Supuesto'}</span>
                  </td>
                  <td className="muted">{s.nota}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="toolbar" style={{ marginTop: 16 }}>
          <button className="btn light sm" onClick={() => setVerDesglose((v) => !v)} aria-expanded={verDesglose}>
            {verDesglose ? 'Ocultar' : 'Ver'} en qué se gasta la implantación
          </button>
          <span className="small muted">Reparto orientativo del escenario Base ({eur(base.implantacion)}).</span>
        </div>
        {verDesglose && (
          <div className="im-table-wrap">
            <table className="im-table" style={{ minWidth: 480 }}>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th className="num">%</th>
                  <th className="num">Importe</th>
                </tr>
              </thead>
              <tbody>
                {REPARTO_IMPLANTACION.map((x) => (
                  <tr key={x.concepto}>
                    <th scope="row">{x.concepto}</th>
                    <td className="num">{pct(x.pct)}</td>
                    <td className="num">{eur(base.implantacion * x.pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. Escalabilidad */}
      <section className="section" id="escalabilidad">
        <div className="section-title">
          <h2>Escalabilidad por tipo de travesía</h2>
          <p>
            La flota oficial tiene {FO_OFICIAL.buques} buques y {FO_OFICIAL.rutas} rutas. El Bajamar Express es la plantilla; el resto se adapta cambiando la carta, los tiempos y el hardware, no el producto.
          </p>
        </div>
        <div className="im-table-wrap">
          <table className="im-table">
            <thead>
              <tr>
                <th>Tipo de travesía</th>
                <th>Ejemplo</th>
                <th>Modo de servicio</th>
                <th>Cómo se adapta el plan</th>
              </tr>
            </thead>
            <tbody>
              {TIPOS_TRAVESIA.map((t) => (
                <tr key={t.tipo}>
                  <th scope="row">{t.tipo}</th>
                  <td className="muted">{t.ejemplo}</td>
                  <td>{t.modo}</td>
                  <td>{ESCALA[t.tipo] ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          Dentro de la app y de On Board Club, el servicio llega a los {num(FO_OFICIAL.sociosPlus)} socios de Fred. Olsen Plus sin instalar nada nuevo. Es un potencial de alcance, no una previsión de uso.
        </p>
      </section>

      {/* 5. Hilo canario */}
      <section className="section" id="canario">
        <div className="section-title">
          <h2>Un plan con acento canario</h2>
          <p>Los ejes con los que Fred. Olsen se presenta son parte del plan de implantación, no un añadido.</p>
        </div>
        <div className="im-canario">
          {EJES_CANARIOS.map((e) => (
            <div key={e.id} className="card">
              <div className="head">
                <span className="im-ico">
                  <Icon name={e.icono} size={18} />
                </span>
                <h3>{e.titulo}</h3>
              </div>
              <div className="suyo">Fred. Olsen: {e.suyo}</div>
              <div className="small">{e.nuestro}</div>
              <div className="plan">
                <strong>En la implantación:</strong> {IMPACTO_CANARIO[e.id]}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Riesgos */}
      <section className="section" id="riesgos">
        <div className="section-title">
          <h2>Riesgos y mitigaciones</h2>
        </div>
        <div className="im-table-wrap">
          <table className="im-table">
            <thead>
              <tr>
                <th>Riesgo</th>
                <th>Mitigación</th>
                <th>Dónde se controla</th>
              </tr>
            </thead>
            <tbody>
              {RIESGOS.map((x) => (
                <tr key={x.r}>
                  <th scope="row">{x.r}</th>
                  <td>{x.m}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{x.f}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Navegación */}
      <section className="section">
        <div className="card im-nav">
          <div className="group">
            <Link className="btn ghost" to="/benchmark">
              ← Anterior: Benchmark
            </Link>
            <Link className="btn ghost" to="/">
              Todos los entregables
            </Link>
          </div>
          <div className="group">
            <Link className="btn light" to="/faq">
              Preguntas técnicas
            </Link>
            <Link className="btn light" to="/prototipo">
              Ver prototipo
            </Link>
            <Link className="btn primary" to="/comunicacion">
              Siguiente: Comunicación →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
