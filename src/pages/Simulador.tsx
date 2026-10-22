import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, LabelList } from 'recharts'
import { totales, derivados, eur, num, pct } from '../data/bajamar'
import {
  COSTES_MENSUALES,
  COSTES_UNICOS,
  FUENTES_SIM,
  MANTENIMIENTO,
  MARGEN_DEFECTO,
  PASARELA,
  SUPUESTOS_SIM,
  WIFI,
  type LineaCoste,
} from '../data/fuentes_simulador'

/* ---------- referencias [n] que llevan a la sección «Fuentes» ---------- */
const ancla = (id: string) => `sim-f-${id}`

function irA(id: string) {
  const el = document.getElementById(ancla(id))
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.add('sim-hl')
  window.setTimeout(() => el.classList.remove('sim-hl'), 2200)
}

function Ref({ ids }: { ids: string[] }) {
  return (
    <>
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          className={`sim-ref${id.startsWith('S') ? ' sup' : ''}`}
          onClick={() => irA(id)}
          aria-label={id.startsWith('S') ? `Ver supuesto ${id}` : `Ver fuente ${id}`}
          title={id.startsWith('S') ? 'Supuesto del equipo' : 'Ver fuente'}
        >
          [{id}]
        </button>
      ))}
    </>
  )
}

function Range(p: { label: string; value: number; set: (n: number) => void; min: number; max: number; step?: number; fmt: (n: number) => string; help: ReactNode }) {
  return (
    <div className="range-row">
      <label>
        <span>{p.label}</span>
        <span style={{ color: 'var(--navy)' }}>{p.fmt(p.value)}</span>
      </label>
      <input type="range" min={p.min} max={p.max} step={p.step ?? 1} value={p.value} onChange={(e) => p.set(+e.target.value)} aria-label={p.label} />
      <div className="tiny muted">{p.help}</div>
    </div>
  )
}

function Num(p: { value: number; set: (n: number) => void; label: string; step?: number; min?: number; width?: number }) {
  return (
    <input
      type="number"
      className="sim-input"
      style={p.width ? { width: p.width } : undefined}
      value={Number.isFinite(p.value) ? p.value : 0}
      min={p.min ?? 0}
      step={p.step ?? 1}
      aria-label={p.label}
      onChange={(e) => p.set(e.target.value === '' ? 0 : +e.target.value)}
    />
  )
}

type Edit = { cantidad: number; precio: number; activa: boolean }
type Edits = Record<string, Edit>
const iniciales = (l: LineaCoste[]): Edits => Object.fromEntries(l.map((x) => [x.id, { cantidad: x.cantidad, precio: x.precio, activa: x.activa }]))
const importe = (e: Edit) => (e.activa ? e.cantidad * e.precio : 0)

function TablaCostes(p: { lineas: LineaCoste[]; edits: Edits; set: (id: string, e: Edit) => void; columnaImporte: string; unidadPrecio: string }) {
  return (
    <div className="matrix-wrap" style={{ maxHeight: 'none' }}>
      <table className="sim-table">
        <thead>
          <tr>
            <th scope="col">Incluir</th>
            <th scope="col">Concepto</th>
            <th scope="col" className="num">Cantidad</th>
            <th scope="col" className="num">{p.unidadPrecio}</th>
            <th scope="col" className="num">{p.columnaImporte}</th>
            <th scope="col">Origen</th>
          </tr>
        </thead>
        <tbody>
          {p.lineas.map((l) => {
            const e = p.edits[l.id]
            return (
              <tr key={l.id} className={e.activa ? '' : 'off'}>
                <td>
                  <input type="checkbox" checked={e.activa} onChange={(ev) => p.set(l.id, { ...e, activa: ev.target.checked })} aria-label={`Incluir ${l.concepto}`} />
                </td>
                <th scope="row">
                  {l.concepto}
                  {l.avalidar && <span className="tag yellow" style={{ marginLeft: 8, fontWeight: 600 }}>{l.avalidar}</span>}
                  <div className="tiny muted" style={{ fontWeight: 400 }}>{l.detalle}</div>
                </th>
                <td className="num">
                  <Num value={e.cantidad} set={(n) => p.set(l.id, { ...e, cantidad: n })} label={`Cantidad de ${l.concepto}`} width={64} />
                  <span className="tiny muted"> {l.unidad}</span>
                </td>
                <td className="num">
                  <Num value={e.precio} set={(n) => p.set(l.id, { ...e, precio: n })} label={`Precio de ${l.concepto}`} step={0.01} width={92} />
                </td>
                <td className="num">
                  <strong>{eur(importe(e))}</strong>
                </td>
                <td>
                  <Ref ids={l.refs} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Simulador() {
  const pax = derivados.pasajerosEstimados
  const base = derivados.tasaCompra
  const [nuevos, setNuevos] = useState(3) // puntos porcentuales
  const [movil, setMovil] = useState(25) // % de compras vía móvil
  const [uplift, setUplift] = useState(10) // % uplift ticket en canal móvil
  const [anual, setAnual] = useState(false)

  // costes anticipables
  const [margen, setMargen] = useState(MARGEN_DEFECTO)
  const [mantPct, setMantPct] = useState(MANTENIMIENTO.pct)
  const [unicos, setUnicos] = useState<Edits>(() => iniciales(COSTES_UNICOS))
  const [mensuales, setMensuales] = useState<Edits>(() => iniciales(COSTES_MENSUALES))
  const [modoPasarela, setModoPasarela] = useState<'stripe' | 'plan'>('stripe')
  const [pasarelaPct, setPasarelaPct] = useState(PASARELA.pct)
  const [pasarelaFija, setPasarelaFija] = useState(PASARELA.fija)
  const [kb, setKb] = useState(WIFI.kbPorPedido)
  const [eurGb, setEurGb] = useState(WIFI.eurPorGb)
  const [conectados, setConectados] = useState(WIFI.conectadosPct)
  const [mbPax, setMbPax] = useState(WIFI.mbPorPasajero)

  // ---- impacto en ventas ----
  const tasa = base + nuevos / 100
  const ticketMix = totales.ticketMedio * (1 + (movil / 100) * (uplift / 100))
  const factor = anual ? 3 : 1
  const meses = anual ? 12 : 4
  const facturacionBase = totales.facturacion * factor
  const facturacionNueva = pax * tasa * ticketMix * factor
  const delta = facturacionNueva - facturacionBase
  const ventaPax = tasa * ticketMix
  const pedidosMovil = pax * tasa * (movil / 100) * factor
  const ventaDigital = pedidosMovil * totales.ticketMedio * (1 + uplift / 100)

  const dotsBase = Math.round(base * 100)
  const dotsNew = Math.round(nuevos)

  const chart = [
    { n: 'Actual', v: facturacionBase },
    { n: 'Con Click & Collect', v: facturacionNueva },
  ]

  // ---- costes ----
  const setUnico = (id: string, e: Edit) => setUnicos((s) => ({ ...s, [id]: e }))
  const setMensual = (id: string, e: Edit) => setMensuales((s) => ({ ...s, [id]: e }))
  const costeUnico = COSTES_UNICOS.reduce((a, l) => a + importe(unicos[l.id]), 0)
  const costeHardware = COSTES_UNICOS.filter((l) => ['tablet', 'soporte', 'minipc', 'sai', 'pantallas', 'qr'].includes(l.id)).reduce((a, l) => a + importe(unicos[l.id]), 0)
  const costeHardwareSinPantallas = costeHardware - importe(unicos.pantallas)
  const desarrollo = importe(unicos.dev)

  const mantAnual = (desarrollo * mantPct) / 100
  const fijosAnual = COSTES_MENSUALES.reduce((a, l) => a + importe(mensuales[l.id]), 0)

  const gbPedidos = (pedidosMovil * kb) / 1_000_000 // KB -> GB (periodo)
  const gbTotal = (pax * factor * (conectados / 100) * mbPax) / 1000
  const wifiPeriodo = gbPedidos * eurGb
  const wifiPct = gbTotal > 0 ? gbPedidos / gbTotal : 0
  const gbAnio = (pax * 3 * (movil / 100) * tasa * kb) / 1_000_000

  const pctEfectivo = modoPasarela === 'stripe' ? pasarelaPct : PASARELA.pctPlan
  const fijaEfectiva = modoPasarela === 'stripe' ? pasarelaFija : 0
  const comision = (ventaDigital * pctEfectivo) / 100 + pedidosMovil * fijaEfectiva
  const comisionPlan = (ventaDigital * PASARELA.pctPlan) / 100
  const comisionPorPedido = pedidosMovil > 0 ? comision / pedidosMovil : 0

  const mantPeriodo = (mantAnual * meses) / 12
  const fijosPeriodo = (fijosAnual * meses) / 12
  const margenBruto = (delta * margen) / 100
  const costeRecurrente = mantPeriodo + fijosPeriodo + wifiPeriodo + comision
  const operativo = margenBruto - costeRecurrente
  const neto = operativo - costeUnico
  const operativoMes = operativo / meses
  const payback = operativoMes > 0 ? costeUnico / operativoMes : null
  const recurrenteAnual = (costeRecurrente * 12) / meses

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">What-if · Supuestos explícitos</div>
        <h1>Simulador de impacto</h1>
        <p>
          Parte de los datos reales del Bajamar Express (ene–abr 2026) y mueve los supuestos. Cada cifra lleva una referencia [n] a su fuente o [S] a un supuesto del equipo. Resta
          los costes anticipables para ver el resultado neto. Es una estimación para el piloto, no una previsión.
        </p>
      </div>

      <div className="grid sim-cols">
        <div className="card">
          <Range
            label="Nuevos compradores"
            value={nuevos}
            set={setNuevos}
            min={0}
            max={15}
            step={0.5}
            fmt={(n) => `+${num(n, 1)} pp`}
            help={
              <>
                Pasajeros que hoy no compran (por la cola o la pereza de levantarse) y pasarían a hacerlo. Hoy compra ≈ {pct(base)} <Ref ids={['1']} />. Contexto: más del 40 % de los
                aficionados de estadios abandonó una cola sin comprar <Ref ids={['2']} />. El valor por defecto es un supuesto del equipo <Ref ids={['S1']} />.
              </>
            }
          />
          <Range
            label="Compras hechas por el móvil"
            value={movil}
            set={setMovil}
            min={0}
            max={60}
            fmt={(n) => `${n} %`}
            help={
              <>
                Referencias de cadenas con app madura: Starbucks, 31 % de las transacciones por la app <Ref ids={['3']} />; Chipotle, 36,7 % de ventas digitales <Ref ids={['4']} />. El valor por
                defecto es un supuesto del equipo <Ref ids={['S2']} />.
              </>
            }
          />
          <Range
            label="Subida del ticket en el canal móvil"
            value={uplift}
            set={setUplift}
            min={0}
            max={45}
            fmt={(n) => `+${n} %`}
            help={
              <>
                Referencias (datos de proveedor): +5,6 % de ticket medio en Tampa Bay Rays <Ref ids={['6']} />; +42 % de valor medio del pedido en Iberia Express/Immfly frente al carrito{' '}
                <Ref ids={['5']} />. Por defecto +10 %, supuesto del equipo <Ref ids={['S3']} />. Palanca: combos y sugerencias (upselling).
              </>
            }
          />
          <div className="tabs">
            <button className={!anual ? 'on' : ''} onClick={() => setAnual(false)}>
              Ene–abr (4 meses)
            </button>
            <button className={anual ? 'on' : ''} onClick={() => setAnual(true)}>
              Anualizado ×3
            </button>
          </div>
          <p className="tiny muted" style={{ marginTop: 10 }}>
            Modelo: pasajeros × % que compra × ticket medio × (1 + % móvil × subida del ticket). Pasajeros estimados = {eur(totales.facturacion)} ÷ {num(totales.consumoPorPasajero, 2)} € ≈ {num(pax)}{' '}
            (ene–abr) <Ref ids={['1']} />. El anualizado es una simple ×3 y no incluye la estacionalidad del verano <Ref ids={['S4']} />.
          </p>
          <p className="tiny muted">
            Estos tres valores por defecto son los del escenario base del <Link to="/implementacion">plan de implementación</Link>.
          </p>
        </div>

        <div className="grid">
          <div className="card" style={{ background: 'var(--navy)', color: '#fff', border: 0 }}>
            <div className="eyebrow" style={{ color: 'var(--yellow)' }}>
              Facturación incremental {anual ? 'anual' : '(4 meses)'}
            </div>
            <div className="big-number" style={{ color: '#fff' }}>
              {delta >= 0 ? '+' : ''}
              {eur(delta)}
            </div>
            <div style={{ opacity: 0.85 }}>
              {pct(delta / facturacionBase, 1)} sobre la base · venta por pasajero {eur(totales.consumoPorPasajero, 2)} → <strong>{eur(ventaPax, 2)}</strong>
            </div>
          </div>
          <div className="grid g2">
            <div className="card stat">
              <div className="label">Pasajeros que compran</div>
              <div className="value">{pct(tasa)}</div>
              <div className="sub">antes {pct(base)}</div>
            </div>
            <div className="card stat">
              <div className="label">Pedidos móvil {anual ? '/ año' : '/ 4 meses'}</div>
              <div className="value">{num(pedidosMovil)}</div>
              <div className="sub">que dejan de pasar por la cola tradicional</div>
            </div>
          </div>
          <div className="card">
            <h3>De cada 100 pasajeros</h3>
            <div className="people" aria-label={`${dotsBase} compran hoy, ${dotsNew} nuevos`}>
              {Array.from({ length: 100 }).map((_, i) => (
                <span key={i} className={`person${i < dotsBase ? ' base' : i < dotsBase + dotsNew ? ' new' : ''}`} />
              ))}
            </div>
            <div className="legend">
              <span>
                <span className="dot" style={{ background: 'var(--navy)' }} />
                compran hoy ({dotsBase})
              </span>
              <span>
                <span className="dot" style={{ background: 'var(--yellow)' }} />
                nuevos con Click & Collect ({dotsNew})
              </span>
              <span>
                <span className="dot" style={{ background: 'var(--s0)' }} />
                no compran
              </span>
            </div>
          </div>
          <div className="card">
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={chart} layout="vertical" margin={{ left: 20, right: 70 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="n" width={140} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => eur(v)} />
                  <Bar dataKey="v" radius={[0, 4, 4, 0]}>
                    {chart.map((c, i) => (
                      <Cell key={i} fill={i ? '#0b3478' : '#a9c2ea'} />
                    ))}
                    <LabelList dataKey="v" position="right" formatter={(v: number) => eur(v)} style={{ fontWeight: 700, fontSize: 12 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- COSTES */}
      <section className="section" id="costes">
        <div className="section-title">
          <h2>Costes anticipables</h2>
          <p>
            Piloto de 1 buque (Bajamar Express) con 3 cafeterías. Los importes son editables. Los precios de equipo son de tienda, con IVA y sin descuento por volumen. Sin presupuestos de
            proveedor, los costes de desarrollo y soporte son supuestos.
          </p>
        </div>

        <div className="grid g3" style={{ marginBottom: 16 }}>
          <div className="card stat">
            <div className="label">Costes únicos del piloto</div>
            <div className="value">{eur(costeUnico)}</div>
            <div className="sub">{eur(costeUnico / totales.cafeterias)} por cafetería · 1 buque</div>
          </div>
          <div className="card stat">
            <div className="label">Costes recurrentes al año</div>
            <div className="value">{eur(recurrenteAnual)}</div>
            <div className="sub">mantenimiento, nube, soporte, wifi y comisión</div>
          </div>
          <div className="card stat yellow">
            <div className="label">Resultado neto {anual ? 'anual' : '(4 meses)'}</div>
            <div className="value" style={{ color: neto >= 0 ? 'var(--navy)' : 'var(--red)' }}>
              {neto >= 0 ? '+' : ''}
              {eur(neto)}
            </div>
            <div className="sub">tras costes únicos y recurrentes</div>
          </div>
        </div>

        <div className="grid sim-cols" style={{ alignItems: 'start' }}>
          <div className="grid">
            <div className="card">
              <h3>Costes únicos (inversión)</h3>
              <p className="tiny muted">
                Equipo e implantación del piloto. Equipo: {eur(costeHardware)} en total, de los que {eur(importe(unicos.pantallas))} son las pantallas de pedidos «listos». Sin pantallas, {eur(costeHardwareSinPantallas)}.
              </p>
              <TablaCostes lineas={COSTES_UNICOS} edits={unicos} set={setUnico} columnaImporte="Importe" unidadPrecio="Precio unit. (€)" />
              <div style={{ textAlign: 'right', marginTop: 10, fontWeight: 800, color: 'var(--navy)' }}>Total único: {eur(costeUnico)}</div>
            </div>

            <div className="card">
              <h3>Costes recurrentes fijos</h3>
              <p className="tiny muted">Importes mensuales; la columna de importe es el total anual.</p>
              <TablaCostes lineas={COSTES_MENSUALES} edits={mensuales} set={setMensual} columnaImporte="Importe / año" unidadPrecio="Precio (€/mes)" />
              <div className="range-row" style={{ marginTop: 16, marginBottom: 0 }}>
                <label>
                  <span>
                    Mantenimiento de la app y la plataforma <Ref ids={MANTENIMIENTO.refs} />
                  </span>
                  <span style={{ color: 'var(--navy)' }}>{mantPct} % · {eur(mantAnual)} / año</span>
                </label>
                <input type="range" min={0} max={40} value={mantPct} onChange={(e) => setMantPct(+e.target.value)} aria-label="Mantenimiento anual en porcentaje del coste de desarrollo" />
                <div className="tiny muted">
                  % anual del coste de desarrollo ({eur(desarrollo)}). Regla publicada: entre el {MANTENIMIENTO.min} % y el {MANTENIMIENTO.max} % <Ref ids={['12']} />. Por defecto, {MANTENIMIENTO.pct} %.
                </div>
              </div>
            </div>
          </div>

          <div className="grid">
            <div className="card">
              <h3>Comisión de la pasarela de pago</h3>
              <div className="tabs" role="tablist" aria-label="Tarifa de la pasarela">
                <button className={modoPasarela === 'stripe' ? 'on' : ''} onClick={() => setModoPasarela('stripe')}>
                  Tarifa pública Stripe
                </button>
                <button className={modoPasarela === 'plan' ? 'on' : ''} onClick={() => setModoPasarela('plan')}>
                  Tarifa del plan
                </button>
              </div>
              {modoPasarela === 'stripe' ? (
                <div className="sim-fields">
                  <label>
                    % por operación <Num value={pasarelaPct} set={setPasarelaPct} label="Porcentaje de comisión" step={0.1} width={80} />
                  </label>
                  <label>
                    Cuota fija (€) <Num value={pasarelaFija} set={setPasarelaFija} label="Cuota fija por operación en euros" step={0.01} width={80} />
                  </label>
                </div>
              ) : (
                <p className="small" style={{ marginTop: 12 }}>
                  1,5 % sin cuota fija, como en el plan de implementación.
                </p>
              )}
              <p className="small" style={{ marginBottom: 6 }}>
                Comisión del periodo: <strong>{eur(comision)}</strong> sobre {eur(ventaDigital)} de venta digital (≈ {eur(comisionPorPedido, 2)} por pedido) <Ref ids={['7']} />.
              </p>
              <p className="tiny muted">
                Stripe España cobra 1,5 % + 0,25 € por tarjeta estándar del EEE <Ref ids={['7']} />. En un ticket de ≈ {eur(totales.ticketMedio, 2)}, la cuota fija pesa más que el porcentaje. Con la
                tarifa del plan (1,5 % sin cuota fija) serían {eur(comisionPlan)}. Un acuerdo con el banco de Fred. Olsen (Redsys) sin cuota fija se parecería más al plan; es una cifra a validar con finanzas.
              </p>
            </div>

            <div className="card">
              <h3>Impacto en el wifi y la conectividad</h3>
              <div className="sim-fields">
                <label>
                  KB por pedido <Num value={kb} set={setKb} label="Kilobytes por sesión de pedido" step={50} width={80} /> <Ref ids={['S13']} />
                </label>
                <label>
                  € por GB por satélite <Num value={eurGb} set={setEurGb} label="Euros por gigabyte" step={0.1} width={80} /> <Ref ids={['11']} />
                </label>
                <label>
                  Pasajeros conectados (%) <Num value={conectados} set={setConectados} label="Porcentaje de pasajeros conectados" width={80} /> <Ref ids={['S14']} />
                </label>
                <label>
                  MB por pasajero <Num value={mbPax} set={setMbPax} label="Megabytes por pasajero conectado" width={80} /> <Ref ids={['S14']} />
                </label>
              </div>
              <ul className="clean small" style={{ marginTop: 12 }}>
                <li>
                  Tráfico de los pedidos: <strong>{num(gbPedidos, 1)} GB</strong> en el periodo ({num(gbAnio, 1)} GB al año).
                </li>
                <li>
                  Uso total estimado de la red: {num(gbTotal)} GB. Los pedidos son el <strong>{pct(wifiPct, 2)}</strong>.
                </li>
                <li>
                  Coste incremental si todo saliera por satélite: <strong>{eur(wifiPeriodo)}</strong>. Es el techo: el pedido va del móvil al servidor del barco por la red local.
                </li>
                <li>
                  Referencia: un bloque de 50 GB de Starlink Global Priority cuesta ≈ 2 USD/GB <Ref ids={['11']} />. Los pedidos de todo un año caben en un bloque.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3>Del impacto al resultado neto {anual ? '(anual)' : '(4 meses)'}</h3>
          <p className="tiny muted">
            El impacto es facturación. Para restar costes se aplica antes el margen bruto de la barra, que es un supuesto <Ref ids={['S5']} />.
          </p>
          <div className="sim-fields" style={{ marginBottom: 10 }}>
            <label>
              Margen bruto (%) <Num value={margen} set={setMargen} label="Margen bruto sobre la venta incremental" width={80} /> <Ref ids={['S5']} />
            </label>
          </div>
          <div className="matrix-wrap" style={{ maxHeight: 'none' }}>
            <table className="sim-table sim-resumen">
              <tbody>
                <tr>
                  <th scope="row">Facturación incremental</th>
                  <td className="num">{eur(delta)}</td>
                </tr>
                <tr>
                  <th scope="row">Margen bruto sobre la venta incremental ({margen} %)</th>
                  <td className="num">{eur(margenBruto)}</td>
                </tr>
                <tr>
                  <th scope="row">− Mantenimiento de la app ({mantPct} % del desarrollo)</th>
                  <td className="num">−{eur(mantPeriodo)}</td>
                </tr>
                <tr>
                  <th scope="row">− Nube, IA y soporte</th>
                  <td className="num">−{eur(fijosPeriodo)}</td>
                </tr>
                <tr>
                  <th scope="row">− Wifi y conectividad</th>
                  <td className="num">−{eur(wifiPeriodo)}</td>
                </tr>
                <tr>
                  <th scope="row">− Comisión de la pasarela</th>
                  <td className="num">−{eur(comision)}</td>
                </tr>
                <tr className="tot">
                  <th scope="row">= Resultado operativo</th>
                  <td className="num">{eur(operativo)}</td>
                </tr>
                <tr>
                  <th scope="row">− Costes únicos (equipo e implantación)</th>
                  <td className="num">−{eur(costeUnico)}</td>
                </tr>
                <tr className="tot">
                  <th scope="row">= Resultado neto del periodo</th>
                  <td className="num" style={{ color: neto >= 0 ? 'var(--navy)' : 'var(--red)' }}>{eur(neto)}</td>
                </tr>
                <tr>
                  <th scope="row">Payback de los costes únicos</th>
                  <td className="num">{payback === null ? 'No se recupera' : `${num(payback, 1)} meses`}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="tiny muted" style={{ marginTop: 10 }}>
            En el periodo de 4 meses, los costes recurrentes anuales se prorratean (4/12). El payback es el coste único dividido entre el resultado operativo mensual y no depende del periodo elegido.
            Sin rampa de adopción ni estacionalidad.
          </p>
        </div>

        <div className="callout" style={{ marginTop: 16 }}>
          <strong>Coherencia con el plan de implementación.</strong>
          <ul className="clean small">
            <li>
              Mismo escenario base que el <Link to="/implementacion">plan de implementación</Link>: +3 pp de compradores, 25 % por el móvil, +10 % de ticket y margen del 55 %. Antes el simulador usaba +15 % de ticket; no tenía fuente y se ha bajado al +10 % del plan.
            </li>
            <li>
              El plan reserva 30.000 € de implantación y 1.800 €/mes de plataforma (21.600 €/año). Aquí el detalle suma {eur(costeUnico)} de coste único y {eur(mantAnual + fijosAnual)} al año de mantenimiento, nube, IA y soporte, fuera de wifi y comisión. La licencia del módulo de integración de Ágora está a 0 € porque no tiene precio confirmado: es un coste anticipable a validar con Ágora, no un coste cero.
            </li>
            <li>
              La diferencia del coste único viene del equipo: el plan reserva 4.500 € (15 %) y aquí el detalle con precios públicos es de {eur(costeHardwareSinPantallas)}, más {eur(importe(unicos.pantallas))} de pantallas que el plan no incluye.
            </li>
            <li>
              El plan usa una comisión del 1,5 % sin cuota fija. Con la tarifa pública de Stripe, la comisión efectiva es mayor; por eso aquí se puede elegir entre las dos.
            </li>
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- FUENTES */}
      <section className="section" id="fuentes">
        <div className="section-title">
          <h2>Fuentes</h2>
          <p>
            Cada cifra del simulador es un dato real de Fred. Olsen, un dato de una fuente pública con enlace, o un supuesto del equipo. Los casos de otros sectores son datos de proveedor y
            no son extrapolables sin piloto. Enlaces comprobados el 22 de octubre de 2026.
          </p>
        </div>
        <div className="matrix-wrap" style={{ maxHeight: 'none' }}>
          <table className="sim-table sim-fuentes">
            <thead>
              <tr>
                <th scope="col">Ref.</th>
                <th scope="col">Fuente</th>
                <th scope="col">Publica</th>
                <th scope="col">Fecha</th>
                <th scope="col">Dato que tomamos</th>
                <th scope="col">Enlace</th>
              </tr>
            </thead>
            <tbody>
              {FUENTES_SIM.map((f) => (
                <tr key={f.id} id={ancla(String(f.id))}>
                  <td>
                    <strong>[{f.id}]</strong>
                    <div>
                      <span className={`tag ${f.origen === 'real' ? 'green' : ''}`}>{f.origen === 'real' ? 'Dato real' : 'Publicada'}</span>
                    </div>
                  </td>
                  <th scope="row">{f.titulo}</th>
                  <td>{f.publica}</td>
                  <td>{f.fecha ?? 'Sin fecha en la página'}</td>
                  <td>
                    {f.dato}
                    {f.limite && <div className="tiny muted" style={{ marginTop: 4 }}>{f.limite}</div>}
                  </td>
                  <td>
                    {f.url ? (
                      <a href={f.url} target="_blank" rel="noreferrer" className="src">
                        {f.url}
                      </a>
                    ) : (
                      <span className="tiny muted">Sin URL pública (facilitado por Fred. Olsen)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ marginTop: 28 }}>Supuestos del equipo</h3>
        <p className="small muted">Sin fuente pública y sin enlace. Se miden en el piloto o los sustituye Fred. Olsen con sus datos.</p>
        <div className="matrix-wrap" style={{ maxHeight: 'none' }}>
          <table className="sim-table">
            <thead>
              <tr>
                <th scope="col">Ref.</th>
                <th scope="col">Supuesto</th>
                <th scope="col">Valor</th>
                <th scope="col">Por qué</th>
              </tr>
            </thead>
            <tbody>
              {SUPUESTOS_SIM.map((s) => (
                <tr key={s.id} id={ancla(s.id)}>
                  <td>
                    <strong>[{s.id}]</strong>
                    <div>
                      <span className="tag yellow">Supuesto</span>
                    </div>
                  </td>
                  <th scope="row">{s.nombre}</th>
                  <td>{s.valor}</td>
                  <td>{s.nota}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
