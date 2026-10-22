import { useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { RETOS } from '../data/retos'
import { CRITERIOS } from '../data/benchmarks'
import Icon from '../components/Icon'

export default function Retos() {
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Insights → solución</div>
        <h1>Del benchmark a nuestra propuesta</h1>
        <p>
          Las 8 cuestiones que Fred. Olsen plantea en el reto. En cada una: lo que pide la empresa, lo que ya funciona en otros sectores y la decisión de
          diseño que proponemos para el Bajamar Express, con su KPI para el piloto.
        </p>
      </div>

      <div className="grid">
        {RETOS.map((r, i) => (
          <article key={r.id} id={r.id} className="card reto" style={{ scrollMarginTop: 80 }}>
            <div className="reto-icon">
              <Icon name={r.icono} size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="tag">Reto {String(i + 1).padStart(2, '0')}</span>
                <span className="tag">
                  <span className="dot" style={{ background: CRITERIOS[r.criterio].color }} />
                  {CRITERIOS[r.criterio].nombre} · {CRITERIOS[r.criterio].peso} %
                </span>
              </div>
              <h2 style={{ fontSize: 22, color: 'var(--navy)', marginTop: 8 }}>{r.pregunta}</h2>
              <div className="flow">
                <div>
                  <h4>Qué pide Fred. Olsen</h4>
                  {r.queDiceFredOlsen}
                </div>
                <div>
                  <h4>Qué hacen los referentes</h4>
                  <ul className="clean" style={{ paddingLeft: 16 }}>
                    {r.referentes.map((x) => (
                      <li key={x.id}>
                        <strong>{x.nombre}:</strong> {x.aprendizaje}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="ours">
                  <h4>Nuestra propuesta</h4>
                  <ul className="clean" style={{ paddingLeft: 16 }}>
                    {r.propuesta.map((p, k) => (
                      <li key={k}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="small" style={{ marginTop: 12 }}>
                <strong>KPI del piloto:</strong> {r.kpi}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="card section callout navy">
        <h3>Supuestos que hay que validar con Fred. Olsen</h3>
        <ul className="clean">
          <li>Ancho de banda y estabilidad reales del wifi/Starlink en la ruta, y si se puede instalar un servidor local a bordo.</li>
          <li>Ágora (TPV): licencia del módulo de integración, dónde corre (barco o tierra), si admite crear ventas desde fuera y si gestiona el stock por cafetería.</li>
          <li>Tripulación por cafetería y capacidad de preparación por franja (pedidos cada 5 min).</li>
          <li>Espacio físico para un punto de recogida en cada cafetería.</li>
          <li>Medios de pago aceptados, política de devoluciones e integración con Tarjeta Plus / Plus Points.</li>
        </ul>
        <p className="small" style={{ marginTop: 10 }}>
          Ver el impacto potencial en el <Link to="/simulador">simulador</Link>.
        </p>
      </div>
    </>
  )
}
