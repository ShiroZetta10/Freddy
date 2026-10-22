import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartesianGrid, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Icon from '../components/Icon'
import { totales, franjas, derivados, eur, num, pct } from '../data/bajamar'
import { BARRERAS, EJES_CANARIOS, FO_OFICIAL, HIPOTESIS_OFICIALES, TIPOS_TRAVESIA } from '../data/canarias'
import './piloto.css'

const pesoManana = franjas[0].facturacion / totales.facturacion
const tasaBase = derivados.tasaCompra * 100

/* ------------------------------------------------------------------ hipótesis */
type Hipotesis = {
  id: string
  titulo: string
  kpi: string
  formula: string
  base: string
  exito: string
  parada: string
  fuente: string[]
}

const HIPOTESIS: Hipotesis[] = [
  {
    id: 'H1',
    titulo: 'Adopción del móvil',
    kpi: 'Pasajeros que piden por móvil',
    formula: '% adopción = pasajeros con al menos 1 pedido móvil ÷ pasajeros embarcados en la salida',
    base: `Canal nuevo: 0 %. Contexto: hoy compra ≈ ${pct(derivados.tasaCompra)} de los pasajeros (todos en barra).`,
    exito: '≥ 5 % de los pasajeros en las semanas 5–6 (≈ 1 de cada 5 compradores actuales) y tendencia creciente semana a semana.',
    parada: 'Menos de 2 % en la semana 4, ya con comunicación y QR en las mesas: el canal no se usa. Se ajusta o se detiene.',
    fuente: ['Servidor FredOnBoard', 'Billetes validados'],
  },
  {
    id: 'H2',
    titulo: 'Recogida sin nuevas colas',
    kpi: 'Espera en barra y cola máxima',
    formula: 'Espera = hora de atención − hora de llegada a la cola (muestra cronometrada). Recogida = hora «entregado» − hora «listo»',
    base: 'Se mide en la semana 0 en el Bajamar y en el Bañaderos (observación cronometrada, 2 salidas por buque).',
    exito: 'Espera presencial y cola máxima no empeoran más de un 10 % frente a la línea base, y la mediana de recogida es ≤ 2 min desde «listo».',
    parada: 'La espera presencial empeora más de un 20 % dos semanas seguidas, o se cobra dos veces un mismo pedido.',
    fuente: ['Observación', 'Marcas de tiempo del servidor'],
  },
  {
    id: 'H3',
    titulo: 'Más compras y ticket medio',
    kpi: 'Venta por pasajero, ticket medio y % que compra',
    formula: 'Venta por pasajero = facturación de la cafetería ÷ pasajeros embarcados. Ticket medio = facturación ÷ tickets. Se compara con el control (diferencia en diferencias)',
    base: `Bajamar ene–abr 2026: ${eur(totales.consumoPorPasajero, 2)} por pasajero, ticket medio ${eur(totales.ticketMedio, 2)} (franja de mañana ${eur(franjas[0].ticketMedio, 2)}) y ≈ ${pct(derivados.tasaCompra)} compra. La cifra de la mañana en la cafetería piloto se confirma en la semana 0.`,
    exito: `Venta por pasajero +5 % o más sobre el control en las semanas 5–6 (objetivo +10 %: ${eur(totales.consumoPorPasajero * 1.1, 2)}), sin bajar el ticket medio.`,
    parada: 'Venta por pasajero por debajo del control dos semanas seguidas con el servicio ya ajustado.',
    fuente: ['TPV', 'Servidor FredOnBoard', 'Billetes validados'],
  },
  {
    id: 'H4',
    titulo: 'Operativa sin ampliar dotación',
    kpi: 'Pedidos por tripulante y hora, carga percibida y horas extra',
    formula: 'Pedidos/tripulante/hora = pedidos servidos ÷ (tripulantes en barra × horas de servicio). Carga: encuesta semanal 1 (muy baja) a 5 (muy alta)',
    base: 'Se mide en la semana 0: encuesta a la tripulación, horas trabajadas y pedidos por hora en barra.',
    exito: 'Carga percibida ≤ 3,0 y sin subir más de 0,5 puntos sobre la semana 0; 0 horas extra atribuibles; ningún tripulante añadido.',
    parada: 'Carga percibida ≥ 4 en dos encuestas seguidas, cualquier hora extra atribuible o petición razonada de la tripulación.',
    fuente: ['Encuesta a la tripulación', 'TPV', 'Servidor FredOnBoard', 'Cuadrantes'],
  },
]

/* ------------------------------------------------------------------ simulación */
type Escenario = 'prudente' | 'base' | 'ambicioso'
type MetricaId = 'venta' | 'compra' | 'ticket' | 'espera'

const SEMANAS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']
const RAMPA = [0, 0, 0.4, 0.75, 0.95, 1]
const RUIDO_PILOTO = [-0.004, 0.006, 0.002, -0.005, 0.004, -0.002]
const RUIDO_CONTROL = [0.006, -0.008, 0.004, -0.004, 0.01, 0.003]

const ESCENARIOS: Record<Escenario, { label: string; texto: string }> = {
  prudente: { label: 'Prudente', texto: 'El servicio apenas mueve la venta: se usa poco y la mejora es pequeña. Sería un caso de «ajustar y repetir».' },
  base: { label: 'Base', texto: 'Adopción moderada y un ticket algo mayor en el canal móvil. Sería un caso de «escalar» si se confirma con datos reales.' },
  ambicioso: { label: 'Ambicioso', texto: 'Adopción alta y combos que elevan el ticket. Es el techo razonable; no es una previsión.' },
}

const METRICAS: Record<
  MetricaId,
  { label: string; base: number; objetivo: Record<Escenario, number>; fmt: (v: number) => string; fmtDif: (v: number) => string; nota: string }
> = {
  venta: {
    label: 'Venta por pasajero',
    base: totales.consumoPorPasajero,
    objetivo: { prudente: 1.42, base: 1.52, ambicioso: 1.68 },
    fmt: (v) => eur(v, 2),
    fmtDif: (v) => `${v >= 0 ? '+' : ''}${eur(v, 2)}`,
    nota: 'Línea base real: 1,37 € por pasajero (ene–abr 2026).',
  },
  compra: {
    label: '% de pasajeros que compra',
    base: tasaBase,
    objetivo: { prudente: 24, base: 26, ambicioso: 29 },
    fmt: (v) => `${num(v, 1)} %`,
    fmtDif: (v) => `${v >= 0 ? '+' : ''}${num(v, 1)} pp`,
    nota: 'Línea base derivada: 1,37 € ÷ 5,90 € ≈ 23 %.',
  },
  ticket: {
    label: 'Ticket medio',
    base: totales.ticketMedio,
    objetivo: { prudente: 5.95, base: 6.1, ambicioso: 6.3 },
    fmt: (v) => eur(v, 2),
    fmtDif: (v) => `${v >= 0 ? '+' : ''}${eur(v, 2)}`,
    nota: 'Línea base real: 5,90 € (ene–abr 2026).',
  },
  espera: {
    label: 'Espera en barra (índice)',
    base: 100,
    objetivo: { prudente: 102, base: 92, ambicioso: 85 },
    fmt: (v) => num(v, 0),
    fmtDif: (v) => `${v >= 0 ? '+' : ''}${num(v, 1)} pts`,
    nota: 'Índice: línea base de la semana 0 = 100. Menos es mejor.',
  },
}

const media = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length

/* ------------------------------------------------------------------ otros datos */
const SEMANAS_PLAN = [
  { w: 'Semana 0', t: 'Preparación', p: 'Instalación, formación, observación cronometrada y encuesta de partida en ambos buques.', tipo: 'prep' },
  { w: 'Semana 1', t: 'Línea base', p: 'Sin servicio. Se registran ventas, pasajeros, esperas y carga en Bajamar y Bañaderos.', tipo: 'base' },
  { w: 'Semana 2', t: 'Línea base', p: 'Segunda semana sin servicio: confirma que la variación normal es pequeña.', tipo: 'base' },
  { w: 'Semana 3', t: 'Despliegue', p: 'Se activa FredOnBoard en la mañana del Bajamar. QR en las mesas y aviso en el portal wifi.', tipo: 'serv' },
  { w: 'Semana 4', t: 'Ajuste', p: 'Se corrigen carta, franjas y cartelería con lo observado. Revisión del criterio de parada.', tipo: 'serv' },
  { w: 'Semana 5', t: 'Servicio estable', p: 'Sin cambios. Es la primera semana «limpia» para comparar.', tipo: 'serv' },
  { w: 'Semana 6', t: 'Decisión', p: 'Última medición, encuesta final y reunión de decisión con Fred. Olsen.', tipo: 'serv' },
]

const CANARIOS = [
  {
    kpi: 'Producto canario y KM0 sobre la venta',
    como: 'Venta de referencias marcadas «canario / KM0» ÷ venta total del canal móvil, y la misma ratio en barra.',
    base: 'Se mide en la semana 0 (clasificación de la carta con Fred. Olsen).',
    meta: 'Que el canal móvil iguale o supere a la barra.',
  },
  {
    kpi: 'Tickets en papel evitados',
    como: 'Pedidos con ticket y recibo digitales (1 ticket de papel menos por pedido).',
    base: '0 en el canal móvil; hoy todo el ticket es presencial.',
    meta: 'Número total evitado en las 4 semanas con servicio.',
  },
  {
    kpi: 'Pedidos «sin cubiertos ni bolsa»',
    como: 'Pedidos con la opción marcada ÷ pedidos móviles.',
    base: 'Opción nueva, sin línea base.',
    meta: 'A fijar tras la semana 4; se observa si la opción se usa.',
  },
  {
    kpi: 'Merma y desperdicio vs plan de aprovisionamiento',
    como: 'Unidades mermadas ÷ unidades aprovisionadas (escandallo y movimientos de inventario) frente al plan semanal y el catering diario.',
    base: 'Fred. Olsen no cuantifica hoy las roturas ni la merma: se registra en la semana 0.',
    meta: 'Merma igual o menor que en el control.',
  },
  {
    kpi: 'Uso por Tarifa Joven',
    como: 'Pedidos de billetes con Tarifa Joven (12–25 años) ÷ billetes con Tarifa Joven.',
    base: 'No hay datos de edad de los pasajeros; se infiere por el tipo de billete (supuesto a validar).',
    meta: 'Uso igual o superior a la media del resto de billetes.',
  },
  {
    kpi: 'Satisfacción',
    como: 'Valoración 1–5 tras recoger y pregunta de recomendación (NPS) a una muestra de pedidos.',
    base: `Oficial de la empresa: ${num(FO_OFICIAL.satisfaccion, 2)}/10 y NPS ${num(FO_OFICIAL.nps, 1)} %. Son medidas globales: se comparan con cautela.`,
    meta: 'Valoración del servicio ≥ 4 de 5 y sin bajar la satisfacción del buque.',
  },
]

const OLAS = [
  'Ola 2: solo pre-pedido y recogida al embarcar, con carta corta.',
  'Ola 2: salidas de fast ferry corto, con cierre temprano de pedidos.',
  'Ola 1: Bañaderos Express (pasa de control a servicio) y el resto de fast ferries medios. Es el modelo completo.',
  'Ola 3: travesías largas, con dos servicios y tienda a bordo, una vez estable el modelo medio.',
  'Ola 4: ferry convencional, al final; necesita carta de comidas y reserva de mesa.',
]
// El orden de TIPOS_TRAVESIA es: miniferri, corto, medio, largo, convencional.
const ORDEN_OLA = ['Ola 2', 'Ola 2', 'Ola 1', 'Ola 3', 'Ola 4']

const SUPUESTOS = [
  {
    area: 'TPV',
    supuesto: 'Podemos recibir los tickets por línea de producto, o registrar el pedido móvil como un canal propio en el TPV.',
    validar: 'Si el TPV tiene API o exportación diaria, y cómo se identifica un pedido móvil.',
    si: 'Sin API: la tablet de barra registra el pedido y se concilia cada día con el TPV.',
  },
  {
    area: 'Conectividad',
    supuesto: 'El wifi a bordo (Starlink) soporta las visitas a la web en la franja de mañana, y el servidor local sirve la web sin internet.',
    validar: 'Capacidad real del wifi con el buque lleno y dónde se instala el mini PC y su SAI.',
    si: 'Si falla, la barra sigue vendiendo como hoy; el piloto registra las incidencias.',
  },
  {
    area: 'Espacio de recogida',
    supuesto: 'Hay un hueco en la barra de la cafetería piloto para entregar pedidos sin cruzarse con la cola.',
    validar: 'Qué cafetería, qué punto físico y dónde se coloca el aviso con los números listos.',
    si: 'Si no hay hueco, se limita el tope de pedidos por franja hasta resolverlo.',
  },
  {
    area: 'Pagos y devoluciones',
    supuesto: 'El pago se hace con pasarela en la web y las devoluciones se tramitan por la vía habitual de la empresa.',
    validar: 'Pasarela o pago en barra al recoger, quién autoriza reembolsos y cómo se concilian.',
    si: 'Si no hay pasarela a tiempo, el piloto arranca con pago al recoger.',
  },
  {
    area: 'Tripulación',
    supuesto: 'El equipo de la cafetería acepta usar la tablet y participar en la encuesta, sin horas extra ni nuevas contrataciones.',
    validar: 'Acuerdo con operaciones y con la tripulación, tiempo de formación y quién puede pausar el servicio.',
    si: 'Sin aceptación del equipo, no se arranca: es una condición de entrada.',
  },
  {
    area: 'Datos de pasajeros',
    supuesto: 'Podemos conocer los pasajeros embarcados por salida para calcular la venta por pasajero, y tratar los datos mínimos del pedido.',
    validar: 'Fuente de pasajeros por salida y revisión del área legal (RGPD).',
    si: 'Sin ese dato, se usa la facturación y el número de tickets como medida aproximada.',
  },
]

/* ------------------------------------------------------------------ componente */
export default function Piloto() {
  const [esc, setEsc] = useState<Escenario>('base')
  const [met, setMet] = useState<MetricaId>('venta')
  const m = METRICAS[met]

  const { datos, difPct, difAbs, finPiloto, finControl } = useMemo(() => {
    const obj = m.objetivo[esc]
    const piloto = SEMANAS.map((_, i) => m.base * (1 + RUIDO_PILOTO[i]) + (obj - m.base) * RAMPA[i])
    const control = SEMANAS.map((_, i) => m.base * (1 + RUIDO_CONTROL[i]))
    const datos = SEMANAS.map((s, i) => ({
      s,
      Piloto: +piloto[i].toFixed(3),
      Control: +control[i].toFixed(3),
      'Línea base': +m.base.toFixed(3),
    }))
    const did = media(piloto.slice(2)) - media(piloto.slice(0, 2)) - (media(control.slice(2)) - media(control.slice(0, 2)))
    return { datos, difAbs: did, difPct: (did / m.base) * 100, finPiloto: piloto[5], finControl: control[5] }
  }, [esc, met, m])

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Entregable 06 · Piloto (PoC)</div>
        <h1>Cómo lo probaríamos en el barco</h1>
        <p>
          Seis semanas en el Bajamar Express, una cafetería y la franja de mañana, con el Bañaderos Express como control. Antes de empezar fijamos
          qué medimos, con qué umbrales y qué haremos según el resultado. Las hipótesis no son resultados: se contrastan con datos, y si no se
          cumplen, lo contamos.
        </p>
      </div>

      {/* 2. Ficha */}
      <section className="section" style={{ marginTop: 0 }}>
        <div className="section-title">
          <h2>El piloto en un vistazo</h2>
        </div>
        <div className="grid g4">
          <div className="card stat yellow">
            <div className="label">Buque</div>
            <div className="value">Bajamar Express</div>
            <div className="sub">Trimarán de alta velocidad, {num(totales.capacidadPax)} plazas</div>
          </div>
          <div className="card stat">
            <div className="label">Ruta</div>
            <div className="value">Santa Cruz – Agaete</div>
            <div className="sub">{totales.duracionMin} minutos de travesía</div>
          </div>
          <div className="card stat">
            <div className="label">Duración</div>
            <div className="value">6 semanas</div>
            <div className="sub">2 de línea base + 4 con servicio, más una semana 0 de preparación</div>
          </div>
          <div className="card stat">
            <div className="label">Franja</div>
            <div className="value">Mañana</div>
            <div className="sub">
              {franjas[0].horas}: el {pct(pesoManana)} de la facturación
            </div>
          </div>
          <div className="card stat">
            <div className="label">Cafetería</div>
            <div className="value">1 de {totales.cafeterias}</div>
            <div className="sub">Proa, Popa o Clase Oro; la elige Fred. Olsen</div>
          </div>
          <div className="card stat">
            <div className="label">Grupo de control</div>
            <div className="value">Bañaderos Express</div>
            <div className="sub">Mismo tipo de buque y ruta, sin servicio</div>
          </div>
          <div className="card stat">
            <div className="label">Recursos</div>
            <div className="value">2 tablets</div>
            <div className="sub">Una de barra y una de repuesto, más un mini PC a bordo. 0 personas añadidas a la dotación</div>
          </div>
          <div className="card stat">
            <div className="label">Coste del piloto</div>
            <div className="value">Ver plan</div>
            <div className="sub">
              <Link to="/implementacion">Costes y recursos en el modelo de negocio</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Hipótesis */}
      <section className="section">
        <div className="section-title">
          <h2>Las cuatro hipótesis y cómo se contrastan</h2>
          <p>
            Son las hipótesis oficiales del reto. Para cada una fijamos el KPI, la línea base, el umbral de éxito y el de parada antes de empezar. Los
            umbrales son nuestra propuesta y se acuerdan con Fred. Olsen.
          </p>
        </div>
        <div className="pi-hyp">
          {HIPOTESIS.map((h, i) => (
            <article className="card" key={h.id}>
              <div className="pi-hyp-head">
                <div className="pi-hyp-num">{h.id}</div>
                <div>
                  <h3>{h.titulo}</h3>
                  <div className="small muted">{HIPOTESIS_OFICIALES[i]}</div>
                </div>
              </div>
              <div className="pi-def">
                <div className="full">
                  <div className="k">
                    <Icon name="search" size={14} /> Cómo se mide
                  </div>
                  <strong>{h.kpi}</strong>
                  <div className="pi-formula">{h.formula}</div>
                </div>
                <div>
                  <div className="k">
                    <Icon name="receipt" size={14} /> Línea base
                  </div>
                  <span className="small">{h.base}</span>
                </div>
                <div className="ok">
                  <div className="k">
                    <Icon name="check" size={14} /> Umbral de éxito
                  </div>
                  <span className="small">{h.exito}</span>
                </div>
                <div className="stop">
                  <div className="k">
                    <Icon name="shield" size={14} /> Umbral de parada
                  </div>
                  <span className="small">{h.parada}</span>
                </div>
                <div className="full">
                  <div className="k">
                    <Icon name="box" size={14} /> Fuente del dato
                  </div>
                  <div className="chips">
                    {h.fuente.map((f) => (
                      <span className="tag" key={f}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="callout navy" style={{ marginTop: 16 }}>
          <strong>Las cuatro barreras de compra que identifica Fred. Olsen</strong> ({BARRERAS.map((b) => b.titulo.toLowerCase()).join(', ')}) son
          las que el piloto intenta reducir. Si la espera o el desplazamiento no cambian en los datos, el diseño no funciona, por muy buena que sea
          la idea.
        </div>
      </section>

      {/* 4. Diseño experimental */}
      <section className="section">
        <div className="section-title">
          <h2>Diseño experimental</h2>
          <p>Siete pasos, de la preparación a la decisión. Las dos primeras semanas miden el barco tal como es hoy.</p>
        </div>
        <div className="pi-weeks">
          {SEMANAS_PLAN.map((s) => (
            <div className={`pi-week ${s.tipo === 'base' ? 'base' : s.tipo === 'serv' ? 'serv' : ''}`} key={s.w}>
              <div className="w">{s.w}</div>
              <div className="t">{s.t}</div>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
        <div className="grid g2" style={{ marginTop: 16 }}>
          <div className="card">
            <h3>Grupo de control</h3>
            <p className="small">
              El Bañaderos Express es un buque gemelo en la misma ruta Santa Cruz – Agaete. Se mide igual que el Bajamar durante las seis semanas, pero
              sin FredOnBoard. Así separamos el efecto del servicio del de la estacionalidad, las fiestas o el tiempo.
            </p>
          </div>
          <div className="card">
            <h3>Cómo se compara</h3>
            <p className="small">
              Usamos la <strong>diferencia en diferencias</strong>: restamos a lo que cambia en el Bajamar (antes y con servicio) lo que cambia en el
              Bañaderos en esas mismas semanas, y lo que queda es el efecto atribuible al servicio.
            </p>
            <p className="small muted" style={{ marginBottom: 0 }}>
              Límite: dos buques no son una muestra grande. Es una prueba de concepto para decidir, no una demostración estadística definitiva.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Panel simulado */}
      <section className="section">
        <div className="section-title">
          <h2>Panel de KPIs del piloto</h2>
          <p>Así se vería la evolución semanal frente al control y la línea base. Elige un escenario y un indicador.</p>
        </div>
        <div className="card pi-sim">
          <div style={{ marginBottom: 12 }}>
            <span className="pi-simtag">
              <Icon name="flask" size={14} /> Datos simulados para ilustrar el panel. No son resultados.
            </span>
          </div>
          <div className="toolbar">
            <div className="tabs" role="tablist" aria-label="Escenario simulado">
              {(Object.keys(ESCENARIOS) as Escenario[]).map((k) => (
                <button key={k} className={esc === k ? 'on' : ''} onClick={() => setEsc(k)} role="tab" aria-selected={esc === k}>
                  {ESCENARIOS[k].label}
                </button>
              ))}
            </div>
            <div className="chips" role="tablist" aria-label="Indicador">
              {(Object.keys(METRICAS) as MetricaId[]).map((k) => (
                <button key={k} className={`chip ${met === k ? 'on' : ''}`} onClick={() => setMet(k)} role="tab" aria-selected={met === k}>
                  {METRICAS[k].label}
                </button>
              ))}
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 0 }}>
            {ESCENARIOS[esc].texto} {m.nota}
          </p>
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={datos} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#eef2f9" vertical={false} />
                <ReferenceArea x1="S1" x2="S2" fill="#e8ecf2" fillOpacity={0.7} label={{ value: 'Sin servicio', fontSize: 11, fill: '#5d6779', position: 'insideTop' }} />
                <XAxis dataKey="s" tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} tickFormatter={(v: number) => m.fmt(v)} tickLine={false} axisLine={false} width={64} />
                <Tooltip formatter={(v: number) => m.fmt(v)} />
                <Legend />
                <Line dataKey="Línea base" stroke="#e3a600" strokeWidth={2} strokeDasharray="6 4" dot={false} />
                <Line dataKey="Control" name="Control (Bañaderos)" stroke="#8a94a6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line dataKey="Piloto" name="Piloto (Bajamar)" stroke="#0b3478" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="pi-kpis">
            <div>
              <div className="l">Piloto, semana 6</div>
              <div className="v">{m.fmt(finPiloto)}</div>
            </div>
            <div>
              <div className="l">Control, semana 6</div>
              <div className="v">{m.fmt(finControl)}</div>
            </div>
            <div>
              <div className="l">Diferencia en diferencias</div>
              <div className="v">{m.fmtDif(difAbs)}</div>
              <div className="small muted">
                {difPct >= 0 ? '+' : ''}
                {num(difPct, 1)} % sobre la línea base
              </div>
            </div>
          </div>
          <p className="tiny muted" style={{ marginBottom: 0, marginTop: 12 }}>
            Las líneas parten de la línea base real (1,37 €, 5,90 €, ≈ 23 %) con una variación semanal inventada y una subida gradual a partir de la
            semana 3. Con datos reales, este mismo panel se alimentaría del TPV y del servidor FredOnBoard.
          </p>
        </div>
      </section>

      {/* 6. Hilo canario */}
      <section className="section">
        <div className="section-title">
          <h2>KPIs canarios y de sostenibilidad</h2>
          <p>
            Fred. Olsen se presenta con identidad local, sostenibilidad («En Armonía con el Mar»), talento canario y público joven. El piloto mide lo
            que tiene que ver con {EJES_CANARIOS[0].titulo.toLowerCase()}, {EJES_CANARIOS[1].titulo.toLowerCase()} y {EJES_CANARIOS[3].titulo.toLowerCase()}.
          </p>
        </div>
        <div className="matrix-wrap">
          <table className="pi-table">
            <thead>
              <tr>
                <th>KPI</th>
                <th>Cómo se mide</th>
                <th>Línea base</th>
                <th>Qué buscamos</th>
              </tr>
            </thead>
            <tbody>
              {CANARIOS.map((c) => (
                <tr key={c.kpi}>
                  <td className="pi-min">{c.kpi}</td>
                  <td>{c.como}</td>
                  <td>{c.base}</td>
                  <td>{c.meta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Decisión y escalado */}
      <section className="section">
        <div className="section-title">
          <h2>Criterios de decisión</h2>
          <p>Se aplican en la semana 6. Se decide con las cuatro hipótesis a la vez, no con un solo indicador.</p>
        </div>
        <div className="grid g3">
          <div className="card pi-dec go">
            <span className="tag green">Escalar</span>
            <h3 style={{ marginTop: 8 }}>Se cumplen los umbrales de éxito</h3>
            <ul className="clean small">
              <li>H3 alcanza el umbral sobre el control.</li>
              <li>H1 llega al 5 % de adopción.</li>
              <li>H2 y H4 cumplen y no se activó ningún criterio de parada.</li>
              <li>0 pedidos duplicados cobrados y 0 horas extra.</li>
            </ul>
          </div>
          <div className="card pi-dec adj">
            <span className="tag yellow">Ajustar y repetir</span>
            <h3 style={{ marginTop: 8 }}>Mejora, pero no llega</h3>
            <ul className="clean small">
              <li>Ningún criterio de parada, pero H1 o H3 no alcanzan el umbral y la tendencia sube.</li>
              <li>Se cambia una sola variable (carta, franjas, comunicación) y se repite 2–4 semanas.</li>
              <li>Solo se repite una vez.</li>
            </ul>
          </div>
          <div className="card pi-dec">
            <span className="tag">Parar</span>
            <h3 style={{ marginTop: 8 }}>Se activa un umbral de parada</h3>
            <ul className="clean small">
              <li>La espera presencial empeora más de un 20 % dos semanas seguidas.</li>
              <li>Hay un pedido duplicado cobrado o horas extra atribuibles.</li>
              <li>H3 sigue por debajo del control en la semana 6, sin tendencia.</li>
            </ul>
          </div>
        </div>
        <p className="small muted" style={{ marginTop: 12 }}>
          Los criterios de parada pueden activarse en cualquier semana: el piloto se pausa y se revisa con Fred. Olsen antes de seguir.
        </p>

        <div className="section-title" style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 17 }}>Plan de escalado</h3>
          <p>Si el resultado es «escalar», el orden sigue la duración y el tipo de travesía, de la más parecida al piloto a la más distinta.</p>
        </div>
        <div className="matrix-wrap">
          <table className="pi-table">
            <thead>
              <tr>
                <th>Tipo de travesía</th>
                <th>Ejemplo</th>
                <th>Modo de servicio</th>
                <th>Orden</th>
              </tr>
            </thead>
            <tbody>
              {TIPOS_TRAVESIA.map((t, i) => (
                <tr key={t.tipo}>
                  <td className="pi-min">{t.tipo}</td>
                  <td>{t.ejemplo}</td>
                  <td>{t.modo}</td>
                  <td>
                    <span className={`tag ${ORDEN_OLA[i] === 'Ola 1' ? 'green' : ''}`}>{ORDEN_OLA[i]}</span>
                    <div className="small muted" style={{ marginTop: 4 }}>
                      {OLAS[i]}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          La flota tiene {FO_OFICIAL.buques} buques y {FO_OFICIAL.rutas} rutas. Cada ola repite una versión corta de la medición, y el coste y los
          plazos están en el <Link to="/implementacion">plan de implementación y modelo de negocio</Link>.
        </p>
      </section>

      {/* 8. Supuestos */}
      <section className="section">
        <div className="section-title">
          <h2>Supuestos a validar con Fred. Olsen</h2>
          <p>Antes de la semana 0 necesitamos confirmar estos puntos. Son supuestos nuestros, no datos.</p>
        </div>
        <div className="matrix-wrap">
          <table className="pi-table">
            <thead>
              <tr>
                <th>Área</th>
                <th>Qué suponemos</th>
                <th>Qué hay que validar</th>
                <th>Si no se cumple</th>
              </tr>
            </thead>
            <tbody>
              {SUPUESTOS.map((s) => (
                <tr key={s.area}>
                  <td>{s.area}</td>
                  <td>{s.supuesto}</td>
                  <td>{s.validar}</td>
                  <td>{s.si}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 9. Navegación */}
      <nav className="pi-end" aria-label="Navegación entre entregables">
        <Link className="btn ghost" to="/prototipo">
          ← Prototipo
        </Link>
        <Link className="btn ghost" to="/">
          Todos los entregables
        </Link>
        <Link className="btn ghost" to="/faq">
          Preguntas frecuentes →
        </Link>
      </nav>
    </>
  )
}
