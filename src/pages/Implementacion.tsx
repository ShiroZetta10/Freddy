import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts'
import Icon from '../components/Icon'
import { eur, num, pct, totales, derivados, franjas } from '../data/bajamar'
import { BARRERAS, EJES_CANARIOS, FO_OFICIAL, TIPOS_TRAVESIA } from '../data/canarias'
import {
  CONSTANTES,
  ESCENARIOS,
  EscenarioId,
  FUENTES,
  Params,
  calcular,
  flota,
  flujoAcumulado,
} from '../data/negocio'
import {
  ANTES,
  BLOQUES,
  CONTINGENCIA_DEFECTO,
  FUENTES_COSTES,
  PARTIDAS,
  TARIFAS,
  TARIFA_SUPUESTOS,
  editsIniciales,
  fraccionesPorBuque,
  importe,
  mult,
  totales as totalesCostes,
  type Edit,
  type Edits,
  type Partida,
  type Periodo,
  type Totales,
} from '../data/costes'
import './implementacion.css'

/* ------------------------------------------------------------------ datos de la página */

const FASES = [
  {
    num: 'Fase 0',
    titulo: 'Preparación y línea base',
    duracion: '≈ 4 semanas (la semana 0 es de medición)',
    entregables: [
      'Semana 0: medición sin servicio (tickets por hora, % que compra, espera en barra) para tener línea base propia.',
      'Ágora: acceso y licencia del módulo de integración, token y URL del TPV y un entorno de pruebas. Confirmar si Ágora corre a bordo o en tierra y si admite crear ventas desde fuera.',
      'Acuerdos con Fred. Olsen: cafetería piloto, franja, espacio de recogida, medio de pago y devoluciones.',
      'Servidor a bordo y tablets instalados; carta, precios y stock leídos desde Ágora en el entorno de pruebas.',
    ],
    quien: 'Equipo Shiro (producto y desarrollo), responsable de restauración y IT de Fred. Olsen y el proveedor de Ágora.',
    criterio: 'Acceso al módulo de integración de Ágora y entorno de pruebas listos (o decidido el modo puente), supuestos críticos validados (conectividad real, espacio de recogida, pagos) y línea base medida.',
  },
  {
    num: 'Fase 1',
    titulo: 'Piloto MVP en el Bajamar Express',
    duracion: '4 semanas con servicio',
    entregables: [
      'Web sin cuenta, con acceso por el billete: Click & Collect y pre-pedido antes de embarcar.',
      'Tablet de barra con cola por franjas, pausa y entrega con QR.',
      'Conector Ágora activo en el Bajamar: lee carta, precios y stock y escribe cada pedido como venta con su método de pago, con cola de reintentos.',
      'Panel de manager con KPIs y conciliación diaria por cierre Z de Ágora. Si el módulo no llega a tiempo: modo puente con exportación diaria.',
    ],
    quien: 'Tripulación de la cafetería piloto, un responsable de producto, el equipo de desarrollo y el proveedor de Ágora.',
    criterio: 'Más pasajeros que compran y más venta por pasajero frente a la línea base, sin más espera en barra y sin ampliar dotación. Umbrales a acordar con Fred. Olsen (ver Piloto).',
  },
  {
    num: 'Fase 2',
    titulo: 'Pagos y Fred. Olsen Plus',
    duracion: '2–3 meses (depende del banco y del sistema Plus)',
    entregables: [
      'Ágora ya integrada desde el piloto: se endurecen devoluciones, stock por cafetería y conciliación automática sin diferencias.',
      'Pasarela de pago tokenizada del banco de Fred. Olsen, con Apple Pay y Google Pay.',
      'Fred. Olsen Plus: identificación opcional y Plus Points en el pedido.',
    ],
    quien: 'Desarrollo, IT, proveedor de Ágora, banco y Fred. Olsen Plus.',
    criterio: 'Conciliación con el cierre Z de Ágora sin diferencias y pagos con devoluciones probados de extremo a extremo.',
  },
  {
    num: 'Fase 3',
    titulo: 'Escalado a la flota y dentro de On Board Club',
    duracion: '6–12 meses, por oleadas de buques',
    entregables: [
      'Segunda oleada: Bañaderos Express y resto de alta velocidad; después, ferry convencional y miniferris con su modo propio.',
      'FredOnBoard dentro de On Board Club y de la app: viaje en tiempo real, valoración, Plus Points.',
      'Panel de flota con datos agregados y carta por buque, con el conector Ágora desplegado en cada buque (a bordo o en tierra, según su instalación).',
      'Si IT lo pide, conexión a su plataforma corporativa (ERP) en lugar de a cada Ágora.',
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
      'Una tablet resistente por cafetería, fijada en la barra (3 en el Bajamar Express), y una de repuesto en tierra.',
      'Red local a bordo: puntos de acceso wifi con portal cautivo y un mini PC industrial que sirve la web sin internet (como el wifi de los aviones), con SAI pequeño; otro mini PC de repuesto en tierra.',
      'Pantalla de aviso de pedidos «listos» en cada cafetería (opcional) y QR en barra y mesas como failsafe.',
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
      'Un responsable de producto (parcial) y un equipo de desarrollo y soporte, fuera de la tripulación. Horas y tarifas, en el desglose de costes.',
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
      'Desde el piloto: Ágora por API HTTP/JSON (módulo de integración), carta, precios, stock, ventas y cierre Z. Listado de pasajeros por salida en solo lectura.',
      'Fase 2: pasarela de pago del banco de Fred. Olsen y Fred. Olsen Plus.',
      'Inventario: se aprovecha el escandallo que ya existe y la función de perecederos aún sin activar.',
    ],
    supuesto: 'Licencia del módulo de integración de Ágora, dónde corre Ágora (barco o tierra) y si admite crear ventas desde fuera: a validar con Fred. Olsen / Ágora. Si el módulo no está disponible o no escribe pedidos, modo puente con exportación diaria.',
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
  { r: 'Módulo de integración de Ágora no disponible o sin capacidad de escribir pedidos', m: 'Modo puente: carta cargada desde Ágora y exportación diaria cruzada con el cierre Z hasta activar el módulo. Se pide acceso y entorno de pruebas en la Fase 0.', f: 'Fase 0' },
  { r: 'Ágora no responde durante la travesía', m: 'Cola de reintentos en el servidor del barco con clave única por pedido, sin duplicar ventas. La barra sigue vendiendo como hoy.', f: 'Fase 1' },
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

function ModeloNegocio({ implantacion, plataforma, fr }: { implantacion: number; plataforma: number; fr: { implantacion: number; plataforma: number } }) {
  const [esc, setEsc] = useState<EscenarioId | 'personalizado'>('base')
  const [pBase, setP] = useState<Params>(ESCENARIOS[1].params)
  // La implantación y la plataforma salen siempre del desglose de costes
  const p = useMemo<Params>(() => ({ ...pBase, implantacion, plataforma }), [pBase, implantacion, plataforma])

  const set = <K extends keyof Params>(k: K) => (v: number) => {
    setP((prev) => ({ ...prev, [k]: v }))
    setEsc('personalizado')
  }
  const elegir = (id: EscenarioId) => {
    setEsc(id)
    setP(ESCENARIOS.find((e) => e.id === id)!.params)
  }

  const r = useMemo(() => calcular(p), [p])
  const f = useMemo(() => flota(p, fr), [p, fr])

  const serie = useMemo(() => {
    const con = (x: Params): Params => ({ ...x, implantacion, plataforma })
    const act = flujoAcumulado(p)
    const pr = flujoAcumulado(con(ESCENARIOS[0].params))
    const ba = flujoAcumulado(con(ESCENARIOS[1].params))
    const op = flujoAcumulado(con(ESCENARIOS[2].params))
    return act.map((v, m) => ({ mes: m, actual: Math.round(v), prudente: Math.round(pr[m]), base: Math.round(ba[m]), optimista: Math.round(op[m]) }))
  }, [p, implantacion, plataforma])

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
        <div className="im-fromcost">
          <div>
            <span className="small muted">Implantación (una vez)</span>
            <strong>{eur(implantacion)}</strong>
          </div>
          <div>
            <span className="small muted">Plataforma mensual</span>
            <strong>{eur(plataforma)}/mes</strong>
          </div>
          <p className="tiny muted" style={{ gridColumn: '1 / -1', margin: 0 }}>
            Son la suma del desglose de costes (piloto, 1 barco): ya no se mueven aquí.{' '}
            <button type="button" className="im-block-link" onClick={() => irA('desglose-de-costes')}>
              Editar en el desglose <span aria-hidden="true">↑</span>
            </button>
          </p>
        </div>

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
            Cada buque extra cuesta el {pct(fr.plataforma)} de plataforma y el {pct(fr.implantacion)} de implantación del Bajamar (cifras que salen de la columna «Al escalar» del desglose de costes), porque el desarrollo, el panel y la
            nube se comparten. No se incluyen miniferris ni buques de carga. Es un orden de magnitud para decidir, no una previsión.
          </p>
        </div>
      </div>
    </div>
  )
}


/* ------------------------------------------------------------------ desglose de costes */

const PERIODO_TXT: Record<Periodo, string> = { unico: 'único', mensual: 'al mes', anual: 'al año', variable: 'variable' }
const escalaTxt = (e: number) => (e === 0 ? 'No escala' : e === 1 ? 'Por barco' : `${num(e * 100)} % por barco extra`)

function NumIn(p: { value: number; set: (n: number) => void; label: string; step?: number; width?: number }) {
  return (
    <input
      type="number"
      className="im-in"
      style={{ width: p.width ?? 72 }}
      value={Number.isFinite(p.value) ? p.value : 0}
      min={0}
      step={p.step ?? 1}
      aria-label={p.label}
      onChange={(e) => p.set(e.target.value === '' ? 0 : Math.max(0, +e.target.value))}
    />
  )
}

function FuenteChips({ x }: { x: Partida }) {
  return (
    <span className="im-chips">
      {x.refs.map((id) => {
        const f = FUENTES_COSTES.find((s) => s.id === id)
        return f ? (
          <a key={id} className="im-chip" href={f.url} target="_blank" rel="noopener noreferrer" title={`${f.titulo}. ${f.fecha}`}>
            {id}
          </a>
        ) : null
      })}
      {x.supuesto && <span className="tag yellow" style={{ fontWeight: 600 }}>{x.refs.length ? 'Cantidad supuesta' : 'Supuesto del equipo'}</span>}
    </span>
  )
}

function TablaBloque(p: {
  bloque: (typeof BLOQUES)[number]
  edits: Edits
  setEdit: (id: string, e: Edit) => void
  barcos: number
  total: Totales
}) {
  const partidas = PARTIDAS.filter((x) => x.bloque === p.bloque.id)
  const unicas = partidas.filter((x) => x.periodo === 'unico')
  const recurrentes = partidas.filter((x) => x.periodo !== 'unico')
  const tb = p.total.bloques[p.bloque.id]

  const fila = (x: Partida) => {
    const e = p.edits[x.id]
    const total = importe(x, e) * mult(x, p.barcos)
    return (
      <tr key={x.id} className={e.activa ? '' : 'off'}>
        <td>
          <input type="checkbox" checked={e.activa} onChange={(ev) => p.setEdit(x.id, { ...e, activa: ev.target.checked })} aria-label={`Incluir ${x.concepto}`} />
        </td>
        <th scope="row">
          {x.concepto}
          {x.avalidar && <span className="tag yellow" style={{ marginLeft: 8, fontWeight: 600 }}>{x.avalidar}</span>}
          <div className="tiny muted" style={{ fontWeight: 400 }}>{x.detalle}</div>
          {x.nota && <div className="tiny muted" style={{ fontWeight: 400 }}>{x.nota}</div>}
        </th>
        <td className="num">
          {x.periodo === 'variable' ? (
            '—'
          ) : (
            <>
              <NumIn value={e.cantidad} set={(n) => p.setEdit(x.id, { ...e, cantidad: n })} label={`Cantidad de ${x.concepto}`} width={64} />
              <span className="tiny muted"> {x.unidad}</span>
            </>
          )}
        </td>
        <td className="num">
          {x.meses !== undefined && x.periodo === 'unico' ? <NumIn value={e.meses} set={(n) => p.setEdit(x.id, { ...e, meses: n })} label={`Meses de ${x.concepto}`} width={52} /> : '—'}
        </td>
        <td className="num">
          {x.periodo === 'variable' ? (
            <span>{x.textoVariable}</span>
          ) : (
            <NumIn value={e.precio} set={(n) => p.setEdit(x.id, { ...e, precio: n })} label={`Precio de ${x.concepto}`} step={0.01} width={84} />
          )}
        </td>
        <td className="num">
          {x.periodo === 'variable' ? (
            <span className="muted">no suma</span>
          ) : (
            <>
              <strong>{eur(total, total % 1 ? 2 : 0)}</strong>
              <div className="tiny muted">{PERIODO_TXT[x.periodo]}</div>
            </>
          )}
        </td>
        <td className="im-esc-col">{escalaTxt(x.escala)}</td>
        <td>
          <FuenteChips x={x} />
        </td>
      </tr>
    )
  }

  const sub = (txt: string, cls = '') => (
    <tr className={`im-cost-sub ${cls}`}>
      <td colSpan={8}>{txt}</td>
    </tr>
  )

  return (
    <div className="card im-cost-block">
      <div className="im-cost-head">
        <div>
          <h3>{p.bloque.nombre}</h3>
          <p className="small muted" style={{ margin: 0 }}>{p.bloque.resumen}</p>
        </div>
        <div className="im-cost-tot">
          <div><b>{eur(tb.unico)}</b><span>único</span></div>
          <div><b>{eur(tb.mensual)}</b><span>al mes</span></div>
          <div><b>{eur(tb.anual)}</b><span>al año</span></div>
        </div>
      </div>
      <div className="im-table-wrap">
        <table className="im-table im-cost-table">
          <thead>
            <tr>
              <th scope="col">Incluir</th>
              <th scope="col">Partida</th>
              <th scope="col" className="num">Cantidad</th>
              <th scope="col" className="num">Meses</th>
              <th scope="col" className="num">Precio (€)</th>
              <th scope="col" className="num">Total{p.barcos > 1 ? ` (${p.barcos} barcos)` : ''}</th>
              <th scope="col">Al escalar</th>
              <th scope="col">Fuente</th>
            </tr>
          </thead>
          <tbody>
            {sub('Coste único: implantación del piloto')}
            {unicas.map(fila)}
            {sub(`Subtotal único: ${eur(tb.unico)}`, 'tot')}
            {sub('Recurrente')}
            {recurrentes.map(fila)}
            {sub(`Subtotal recurrente: ${eur(tb.mensual)} al mes · ${eur(tb.anual)} al año`, 'tot')}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DesgloseCostes(p: {
  edits: Edits
  setEdit: (id: string, e: Edit) => void
  reset: () => void
  contPct: number
  setContPct: (n: number) => void
  vista: 'piloto' | 'escalado'
  setVista: (v: 'piloto' | 'escalado') => void
  barcosEsc: number
  setBarcosEsc: (n: number) => void
  fr: { implantacion: number; plataforma: number }
}) {
  const barcos = p.vista === 'piloto' ? 1 : p.barcosEsc
  const t = useMemo(() => totalesCostes(p.edits, barcos, p.contPct), [p.edits, barcos, p.contPct])
  const piloto = useMemo(() => totalesCostes(p.edits, 1, p.contPct), [p.edits, p.contPct])

  const datos = [
    { n: 'Personas', unico: Math.round(t.bloques.personas.unico), rec: Math.round(t.bloques.personas.anual) },
    { n: 'Herramientas', unico: Math.round(t.bloques.herramientas.unico), rec: Math.round(t.bloques.herramientas.anual) },
    { n: 'Infraestructura', unico: Math.round(t.bloques.infraestructura.unico), rec: Math.round(t.bloques.infraestructura.anual) },
    { n: 'Contingencia', unico: Math.round(t.contingencia), rec: 0 },
  ]

  return (
    <div id="desglose-de-costes">
      <h3 style={{ marginTop: 0 }}>Desglose de costes</h3>
      <p className="small muted" style={{ maxWidth: 820 }}>
        Tres bloques: personas, herramientas de desarrollo e infraestructura. Cada partida se puede editar y lleva su fuente pública (enlace) o la etiqueta de supuesto del equipo. De la suma del piloto salen la implantación y la
        plataforma mensual del modelo de negocio. La tripulación del barco no es un coste nuevo: el reto pide no ampliar la plantilla, y solo se paga su formación.
      </p>

      <div className="toolbar" style={{ margin: '14px 0' }}>
        <div className="im-seg" role="group" aria-label="Alcance del desglose">
          <button type="button" className={p.vista === 'piloto' ? 'on' : ''} aria-pressed={p.vista === 'piloto'} onClick={() => p.setVista('piloto')}>
            Piloto (1 barco)
          </button>
          <button type="button" className={p.vista === 'escalado' ? 'on' : ''} aria-pressed={p.vista === 'escalado'} onClick={() => p.setVista('escalado')}>
            Escalado (p. ej. 5 barcos)
          </button>
        </div>
        {p.vista === 'escalado' && (
          <label className="small im-barcos">
            Barcos <NumIn value={p.barcosEsc} set={(n) => p.setBarcosEsc(Math.min(8, Math.max(2, Math.round(n))))} label="Número de barcos del escalado" width={56} />
          </label>
        )}
        <label className="small im-barcos">
          Contingencia <NumIn value={p.contPct} set={(n) => p.setContPct(Math.min(50, n))} label="Porcentaje de contingencia sobre el coste único" width={56} /> %
        </label>
        <button type="button" className="btn ghost sm" onClick={p.reset}>
          Restablecer partidas
        </button>
      </div>
      {p.vista === 'escalado' && (
        <p className="small muted" style={{ marginTop: -6 }}>
          Con {barcos} barcos se repite lo que escala por barco (tablets, red local, servidor, SAI, pantallas, QR, formación) y casi nada de lo que no (desarrollo, diseño, herramientas, dominio, repuestos compartidos). Los importes que se editan son los de un barco.
        </p>
      )}

      <div className="grid g3" style={{ marginBottom: 16 }}>
        <div className="card stat">
          <div className="label">Coste único{barcos > 1 ? ` · ${barcos} barcos` : ' · implantación'}</div>
          <div className="value">{eur(t.unico)}</div>
          <div className="sub">
            bloques {eur(t.unicoBruto)} + contingencia {eur(t.contingencia)} ({num(p.contPct)} %)
          </div>
        </div>
        <div className="card stat">
          <div className="label">Recurrente{barcos > 1 ? ` · ${barcos} barcos` : ''}</div>
          <div className="value">{eur(t.mensual)}/mes</div>
          <div className="sub">{eur(t.anual)} al año; los pagos anuales, prorrateados</div>
        </div>
        <div className="card stat yellow">
          <div className="label">Primer año completo</div>
          <div className="value">{eur(t.unico + t.anual)}</div>
          <div className="sub">único + 12 meses de recurrente. Sin la comisión de la pasarela, que depende de las ventas</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Reparto por bloque</h3>
        <p className="small muted" style={{ marginBottom: 8 }}>Navy: coste único. Amarillo: recurrente de 12 meses. Gris: contingencia.</p>
        <div style={{ height: 300 }} role="img" aria-label="Costes únicos y recurrentes anuales por bloque: personas, herramientas, infraestructura y contingencia">
          <ResponsiveContainer>
            <BarChart data={datos} layout="vertical" margin={{ left: 4, right: 78, top: 4, bottom: 4 }} barCategoryGap={14}>
              <XAxis type="number" hide domain={[0, 'dataMax']} />
              <YAxis type="category" dataKey="n" width={104} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip formatter={(v: number, name: string) => [eur(v), name]} />
              <Bar dataKey="unico" name="Único" radius={[0, 4, 4, 0]}>
                {datos.map((d) => (
                  <Cell key={d.n} fill={d.n === 'Contingencia' ? '#a9b4c6' : '#0b3478'} />
                ))}
                <LabelList dataKey="unico" position="right" formatter={(v: number) => (v ? eur(v) : '')} style={{ fontWeight: 700, fontSize: 12 }} />
              </Bar>
              <Bar dataKey="rec" name="Recurrente, 12 meses" fill="#ffcc00" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="rec" position="right" formatter={(v: number) => (v ? eur(v) : '')} style={{ fontWeight: 700, fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="im-cost-blocks">
        {BLOQUES.map((b) => (
          <TablaBloque key={b.id} bloque={b} edits={p.edits} setEdit={p.setEdit} barcos={barcos} total={t} />
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Conciliación con el modelo de negocio</h3>
        <div className="im-table-wrap" style={{ marginTop: 8 }}>
          <table className="im-table" style={{ minWidth: 520 }}>
            <thead>
              <tr>
                <th>Supuesto del modelo</th>
                <th className="num">Antes (estimación global)</th>
                <th className="num">Ahora (suma del desglose, piloto)</th>
                <th className="num">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Coste de implantación</th>
                <td className="num">{eur(ANTES.implantacion)}</td>
                <td className="num"><strong>{eur(piloto.unico)}</strong></td>
                <td className="num">{piloto.unico - ANTES.implantacion >= 0 ? '+' : ''}{eur(piloto.unico - ANTES.implantacion)}</td>
              </tr>
              <tr>
                <th scope="row">Plataforma mensual</th>
                <td className="num">{eur(ANTES.plataforma)}/mes</td>
                <td className="num"><strong>{eur(piloto.mensual)}/mes</strong></td>
                <td className="num">{piloto.mensual - ANTES.plataforma >= 0 ? '+' : ''}{eur(piloto.mensual - ANTES.plataforma)}/mes</td>
              </tr>
              <tr>
                <th scope="row">Coste de cada buque extra respecto al Bajamar</th>
                <td className="num">40 % implantación · 25 % plataforma</td>
                <td className="num"><strong>{pct(p.fr.implantacion)} implantación · {pct(p.fr.plataforma)} plataforma</strong></td>
                <td className="num">sale de la columna «Al escalar»</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ margin: '10px 0 0' }}>
          El modelo de negocio usa siempre las cifras del piloto (1 barco), sean cuales sean las partidas que edites arriba. Cambiar el selector a Escalado solo cambia esta vista. La flota del modelo se extrapola con las dos fracciones de la tabla.
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>De dónde salen las tarifas de las personas</h3>
        <p className="small muted" style={{ marginBottom: 8 }}>
          Tarifa por hora = salario bruto medio publicado × {num(TARIFA_SUPUESTOS.seguridadSocial, 2)} (cotización de la empresa, supuesto) ÷ {num(TARIFA_SUPUESTOS.horasAnio)} h productivas al año (supuesto) × {num(TARIFA_SUPUESTOS.gastosMargen, 1)} (gastos generales y margen de un equipo proveedor, supuesto). Son medias nacionales de un portal de empleo: orientativas, no un presupuesto. Las horas de cada rol son estimaciones del equipo.
        </p>
        <div className="im-table-wrap">
          <table className="im-table" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th>Rol</th>
                <th className="num">Salario bruto medio</th>
                <th className="num">Tarifa (€/h)</th>
                <th>Fuente</th>
              </tr>
            </thead>
            <tbody>
              {TARIFAS.map((t2) => {
                const f = FUENTES_COSTES.find((s) => s.id === t2.fuente)!
                return (
                  <tr key={t2.id}>
                    <th scope="row">{t2.rol}</th>
                    <td className="num">{eur(t2.salario)}</td>
                    <td className="num"><strong>{eur(t2.tarifa)}</strong></td>
                    <td>
                      <a href={f.url} target="_blank" rel="noopener noreferrer">{t2.fuente}: Indeed España</a> <span className="tag yellow">Orientativa</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <details className="card im-fuentes" style={{ marginTop: 16 }}>
        <summary>Fuentes públicas del desglose ({FUENTES_COSTES.length})</summary>
        <div className="im-table-wrap" style={{ marginTop: 10 }}>
          <table className="im-table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Id</th>
                <th>Fuente y dato</th>
                <th>Límite del dato</th>
              </tr>
            </thead>
            <tbody>
              {FUENTES_COSTES.map((f) => (
                <tr key={f.id}>
                  <th scope="row">{f.id}</th>
                  <td>
                    <a href={f.url} target="_blank" rel="noopener noreferrer">{f.titulo}</a>
                    <div>{f.dato}</div>
                    <div className="tiny muted">{f.fecha}</div>
                  </td>
                  <td className="muted">{f.limite ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tiny muted" style={{ margin: '8px 0 0' }}>
          Los precios en dólares se tratan como euros 1:1 y sin IVA. La licencia del módulo de integración de Ágora no tiene precio público: figura a 0 € y se marca «a validar con Ágora».
        </p>
      </details>
    </div>
  )
}

/* ------------------------------------------------------------------ lienzo de 6 bloques */

/** Desplaza a una sección de la página sin tocar el hash (la app usa HashRouter). */
function irA(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

type BloqueProps = {
  n: number
  area: string
  titulo: string
  desc: string
  detalle?: { id: string; etiqueta: string }
  /** Segundo enlace opcional */
  extra?: { id: string; etiqueta: string }
  vacio?: boolean
  children?: React.ReactNode
}

function Bloque({ n, area, titulo, desc, detalle, extra, vacio, children }: BloqueProps) {
  return (
    <section className={`im-block im-b${n}${vacio ? ' is-empty' : ''}`} style={{ gridArea: area }} aria-labelledby={`im-b${n}-t`}>
      <header className="im-block-head">
        <span className="im-block-num" aria-hidden="true">{n}</span>
        <div>
          <h3 id={`im-b${n}-t`}>{titulo}</h3>
          <p className="im-block-desc">{desc}</p>
        </div>
      </header>
      <div className="im-block-body">{vacio ? <p className="im-block-empty">Por completar.</p> : children}</div>
      {detalle && (
        <button type="button" className="im-block-link" onClick={() => irA(detalle.id)}>
          Ver detalle: {detalle.etiqueta} <span aria-hidden="true">↓</span>
        </button>
      )}
      {extra && (
        <button type="button" className="im-block-link" onClick={() => irA(extra.id)}>
          Ver también: {extra.etiqueta} <span aria-hidden="true">↓</span>
        </button>
      )}
    </section>
  )
}

function Lienzo() {
  const mañana = franjas[0]
  return (
    <section className="section im-canvas-wrap" aria-labelledby="im-canvas-title">
      <div className="section-title">
        <h2 id="im-canvas-title">Plan de implementación en un vistazo</h2>
        <p>Seis bloques que resumen la propuesta. Cada uno enlaza con su detalle más abajo.</p>
      </div>
      <div className="im-canvas">
        <Bloque n={1} area="b1" titulo="Ideas y oportunidades" desc="Qué frena hoy la compra a bordo y cuánto valor hay en juego." detalle={{ id: 'modelo-de-negocio', etiqueta: 'datos y supuestos' }}>
          <ul className="im-list">
            {BARRERAS.map((b) => (
              <li key={b.id}>
                <strong>{b.titulo}:</strong> {b.suyo}
              </li>
            ))}
          </ul>
          <div className="im-figs">
            <div>
              <b>{pct(derivados.tasaCompra)}</b>
              <span>de los pasajeros compra hoy (derivado)</span>
            </div>
            <div>
              <b>{eur(totales.consumoPorPasajero, 2)}</b>
              <span>de venta por pasajero</span>
            </div>
          </div>
        </Bloque>

        <Bloque n={2} area="b2" titulo="Descripción de la solución" desc="Qué es FredOnBoard y cómo funciona a bordo." detalle={{ id: 'recursos', etiqueta: 'recursos y condiciones' }}>
          <p className="im-lead">
            <strong>FredOnBoard</strong>, dentro de On Board Club: el pasajero pide y paga desde su asiento (o antes de embarcar) y recoge cuando el pedido está listo.
          </p>
          <ul className="im-list">
            <li>Pre-pedido y Click & Collect, con franjas de recogida con tope.</li>
            <li>Aviso «listo» y entrega con QR.</li>
            <li>Tablet de barra para la tripulación y panel de manager con KPIs.</li>
            <li>Conectado a Ágora, el TPV de Fred. Olsen: carta, precios, stock y caja en un solo sitio.</li>
            <li>Funciona sin internet a bordo: servidor local por el wifi del barco.</li>
          </ul>
        </Bloque>

        <Bloque n={3} area="b3" titulo="Propuesta de valor" desc="Qué gana cada parte con el servicio." detalle={{ id: 'modelo-de-negocio', etiqueta: 'modelo de negocio' }}>
          <div className="im-value">
            <div>
              <h4>Pasajero</h4>
              <p>Pide sin levantarse y sin cola; solo se mueve cuando está listo. Sin cuenta ni instalar nada.</p>
            </div>
            <div>
              <h4>Tripulación</h4>
              <p>El pedido llega ya cobrado a la tablet, con franjas y pausa para evitar picos. Sin ampliar dotación.</p>
            </div>
            <div>
              <h4>Fred. Olsen</h4>
              <p>Más pasajeros que compran y más venta por pasajero, con datos propios y una plataforma escalable a la flota.</p>
            </div>
          </div>
        </Bloque>

        <Bloque n={4} area="b4" titulo="Actores clave implicados" desc="Quién interviene y qué papel tiene." detalle={{ id: 'canario', etiqueta: 'acento canario' }}>
          <dl className="im-actors">
            <div>
              <dt>Fred. Olsen</dt>
              <dd>Dirección, restauración (F&B), IT y tripulación de cafetería.</dd>
            </div>
            <div>
              <dt>Pasajeros</dt>
              <dd>Usuarios del servicio, también socios de Fred. Olsen Plus.</dd>
            </div>
            <div>
              <dt>Ágora y proveedores tecnológicos</dt>
              <dd>Ágora (TPV) y su proveedor, para el módulo de integración y el entorno de pruebas; pasarela de pago y conectividad a bordo.</dd>
            </div>
            <div>
              <dt>Proveedores locales canarios</dt>
              <dd>Producto KM0 y «Elaborado en Canarias» en la carta.</dd>
            </div>
            <div>
              <dt>Equipo Shiro / Talento Canario</dt>
              <dd>Producto y desarrollo del piloto y traspaso a un equipo local.</dd>
            </div>
          </dl>
        </Bloque>

        <Bloque n={5} area="b5" titulo="Cómo funcionaría (3 hitos)" desc="Los tres pasos que llevan de la prueba a la flota." detalle={{ id: 'hoja-de-ruta', etiqueta: 'hoja de ruta por fases' }}>
          <ol className="im-hitos">
            <li>
              <span className="im-hito-n">Hito 1</span>
              <strong>Piloto MVP en el Bajamar Express</strong>
              <span>Fases 0 y 1 · acceso a Ágora, semana 0 de medición y 4 semanas con servicio con el conector Ágora activo.</span>
            </li>
            <li>
              <span className="im-hito-n">Hito 2</span>
              <strong>Pagos y Fred. Olsen Plus</strong>
              <span>Fase 2 · 2–3 meses. Pasarela tokenizada, devoluciones y Plus Points sobre la caja única de Ágora.</span>
            </li>
            <li>
              <span className="im-hito-n">Hito 3</span>
              <strong>Escalado a la flota</strong>
              <span>Fase 3 · 6–12 meses, por oleadas de buques y dentro de On Board Club.</span>
            </li>
          </ol>
        </Bloque>

        <Bloque n={6} area="b6" titulo="Primer paso realista" desc="Qué se hace primero y qué hace falta para empezar." detalle={{ id: 'fase-0', etiqueta: 'Fase 0' }} extra={{ id: 'desglose-de-costes', etiqueta: 'desglose de costes' }}>
          <ul className="im-list">
            <li>
              <strong>Semana 0:</strong> medir sin servicio (tickets por hora, % que compra, espera en barra).
            </li>
            <li>
              <strong>Piloto:</strong> Bajamar Express, franja de {mañana.franja.toLowerCase()} ({mañana.horas}), 1 de las {totales.cafeterias} cafeterías.
            </li>
            <li>
              <strong>Hace falta:</strong> acceso al módulo de integración de Ágora y un entorno de pruebas, una tablet y un servidor a bordo, y acuerdo con Fred. Olsen sobre espacio de recogida y medio de pago.
            </li>
          </ul>
        </Bloque>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ página */

export default function Implementacion() {
  const [edits, setEdits] = useState<Edits>(() => editsIniciales())
  const [contPct, setContPct] = useState(CONTINGENCIA_DEFECTO)
  const [vista, setVista] = useState<'piloto' | 'escalado'>('piloto')
  const [barcosEsc, setBarcosEsc] = useState(5)
  const setEdit = (id: string, e: Edit) => setEdits((prev) => ({ ...prev, [id]: e }))
  const pilotoCostes = useMemo(() => totalesCostes(edits, 1, contPct), [edits, contPct])
  const implantacion = Math.round(pilotoCostes.unico)
  const plataforma = Math.round(pilotoCostes.mensual)
  const fr = useMemo(() => fraccionesPorBuque(edits), [edits])

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Entregable 02 · Plan de implementación</div>
        <h1>Cómo implantar FredOnBoard a bordo</h1>
        <p>
          FredOnBoard se integra dentro de On Board Club, el ecosistema digital que Fred. Olsen ya ofrece a bordo. Este plan recoge los pasos, los recursos y las condiciones necesarias, y
          una estimación de costes y beneficios. Es una propuesta viable para pilotar, no un producto terminado: lo que no sabemos se marca como supuesto a validar. La integración con Ágora forma parte del plan desde el piloto.
        </p>
      </div>

      <Lienzo />

      <div className="grid g3" style={{ marginTop: 40 }}>
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
          <div className="value">{eur(implantacion)}</div>
          <div className="sub">y {eur(plataforma)}/mes de plataforma, suma del <a href="#modelo-de-negocio" onClick={(e) => { e.preventDefault(); irA('desglose-de-costes') }}>desglose de costes</a>. No incluye la licencia del módulo de integración de Ágora (a validar)</div>
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
            <div key={f.num} id={f.num === 'Fase 0' ? 'fase-0' : undefined} className="card im-phase">
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
          <Link to="/stack">stack técnico</Link>.
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

        <DesgloseCostes
          edits={edits}
          setEdit={setEdit}
          reset={() => {
            setEdits(editsIniciales())
            setContPct(CONTINGENCIA_DEFECTO)
          }}
          contPct={contPct}
          setContPct={setContPct}
          vista={vista}
          setVista={setVista}
          barcosEsc={barcosEsc}
          setBarcosEsc={setBarcosEsc}
          fr={fr}
        />

        <div className="card" style={{ margin: '28px 0 16px' }}>
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

        <ModeloNegocio implantacion={implantacion} plataforma={plataforma} fr={fr} />

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
            <Link className="btn light" to="/stack">
              Stack técnico
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
