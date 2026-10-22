import { Link } from 'react-router-dom'
import { totales, derivados, eur, num, pct } from '../data/bajamar'
import { benchmarkA, benchmarkB } from '../data/benchmarks'
import { RETOS } from '../data/retos'
import Icon from '../components/Icon'

export default function BenchmarkHome() {
  const navierasConMovil = benchmarkA.empresas.filter((e) => (e.evaluacion.pedido_movil?.puntuacion ?? 0) >= 4).length
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Entregable 01 · Benchmark</div>
        <h1>Pedir sin levantarse y recoger sin colas</h1>
        <p>
          {benchmarkA.empresas.length} navieras y {benchmarkB.empresas.length} referentes de Click &amp; Collect (trenes, aviones, cruceros, comida rápida,
          estadios y retail) analizados para diseñar el servicio del Bajamar Express (Tenerife – Agaete, {totales.duracionMin} min).
        </p>
        <div className="hero-actions">
          <Link className="btn primary" to="/retos">
            Del benchmark a la solución
          </Link>
          <Link className="btn ghost" to="/benchmark/B">
            Explorar la matriz
          </Link>
          <Link className="btn ghost" to="/simulador">
            Simular el impacto
          </Link>
        </div>
      </div>

      <div className="card pillars">
        <div className="pillar">
          <div className="ico">
            <Icon name="clock" />
          </div>
          <strong>Rápido</strong>
          <div className="small muted">Pedido en 3 toques sin levantarse y recogida en segundos con QR.</div>
        </div>
        <div className="pillar">
          <div className="ico">
            <Icon name="shield" />
          </div>
          <strong>Fiable</strong>
          <div className="small muted">Funciona aunque falle la conexión, sin pedidos ni cobros duplicados.</div>
        </div>
        <div className="pillar">
          <div className="ico">
            <Icon name="check" />
          </div>
          <strong>Cómodo</strong>
          <div className="small muted">Sin colas nuevas ni más tripulación. La barra sigue igual para quien no use el móvil.</div>
        </div>
      </div>

      <div className="grid g4 section">
        <div className="card stat accent">
          <div className="label">Pasajeros que compran</div>
          <div className="value">≈ {pct(derivados.tasaCompra)}</div>
          <div className="sub">1,37 € por pasajero ÷ 5,90 € de ticket medio. ~3 de cada 4 no compran nada.</div>
        </div>
        <div className="card stat accent">
          <div className="label">Navieras con pedido móvil a bordo</div>
          <div className="value">0 / {benchmarkA.empresas.length}</div>
          <div className="sub">
            Ninguna lo verifica. Solo {navierasConMovil} ofrece algo cercano: el pre-pedido en la app de Molslinjen, en un trayecto de 80-90 min.
          </div>
        </div>
        <div className="card stat">
          <div className="label">Mejor uplift publicado</div>
          <div className="value">+42 %</div>
          <div className="sub">Ticket medio con pedido desde el asiento (Iberia Express + Immfly, a 4 meses; dato del proveedor).</div>
        </div>
        <div className="card stat">
          <div className="label">Ventana competitiva</div>
          <div className="value">45 M€</div>
          <div className="sub">Inversión prevista de Baleària Canarias en flota, digitalización y confort en 3 años.</div>
        </div>
      </div>

      <section className="section">
        <h2>El punto de partida: Bajamar Express</h2>
        <p className="lead">Datos oficiales de enero a abril de 2026 facilitados en el reto.</p>
        <div className="grid g4">
          <div className="card stat">
            <div className="label">Facturación</div>
            <div className="value">{eur(totales.facturacion)}</div>
          </div>
          <div className="card stat">
            <div className="label">Tickets</div>
            <div className="value">{num(totales.tickets)}</div>
          </div>
          <div className="card stat">
            <div className="label">Ticket medio</div>
            <div className="value">{eur(totales.ticketMedio, 2)}</div>
          </div>
          <div className="card stat">
            <div className="label">Pasajeros estimados</div>
            <div className="value">≈ {num(derivados.pasajerosEstimados)}</div>
            <div className="sub">Cálculo propio: facturación ÷ 1,37 €</div>
          </div>
        </div>
        <p style={{ marginTop: 12 }}>
          <Link to="/datos">Ver franjas, familias y productos →</Link>
        </p>
      </section>

      <section className="section">
        <h2>Las 8 preguntas del reto, resueltas con evidencia</h2>
        <p className="lead">Cada cuestión abierta de Fred. Olsen, unida a lo que ya funciona fuera y a nuestra propuesta.</p>
        <div className="grid g4">
          {RETOS.map((r) => (
            <Link key={r.id} to={`/retos#${r.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="reto-icon sm">
                <Icon name={r.icono} />
              </div>
              <h3 style={{ marginTop: 6 }}>{r.pregunta}</h3>
              <div className="tiny muted">{r.referentes.map((x) => x.nombre).join(' · ')}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Dos benchmarks complementarios</h2>
        <div className="grid g2">
          <Link to="/benchmark/A" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="eyebrow">Benchmark A · Competitivo</div>
            <h3>{benchmarkA.titulo}</h3>
            <p className="muted">{benchmarkA.subtitulo}</p>
            <div className="chips">
              {benchmarkA.verticales.map((v) => (
                <span key={v.id} className="tag">
                  {v.nombre}
                </span>
              ))}
            </div>
          </Link>
          <Link to="/benchmark/B" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="eyebrow">Benchmark B · Funcional</div>
            <h3>{benchmarkB.titulo}</h3>
            <p className="muted">{benchmarkB.subtitulo}</p>
            <div className="chips">
              {benchmarkB.verticales.map((v) => (
                <span key={v.id} className="tag">
                  {v.nombre}
                </span>
              ))}
            </div>
          </Link>
        </div>
      </section>
    </>
  )
}
