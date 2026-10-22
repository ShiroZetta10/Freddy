// Espacio reservado para el prototipo de la app (PWA) de Click & Collect.
// Vivirá en este mismo repo y bajo la misma web: /#/app (pasajero) y /#/app/barra (tripulación).
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'

const PASOS = [
  ['qr', 'Escanear QR del asiento', 'Abre la web sin instalar nada, por el wifi del barco.'],
  ['food', 'Elegir y pagar', 'Menú corto con lo más vendido, combos KM0, Apple/Google Pay.'],
  ['clock', 'Franja de recogida', 'La web asigna la siguiente franja libre según la capacidad de la barra.'],
  ['bell', 'Aviso «listo»', 'Estado en vivo y push; el pasajero solo se levanta cuando toca.'],
  ['check', 'Recoger con QR', 'Punto «Pedidos móvil», 5 segundos, sin cobro en barra.'],
]

export default function AppPrototipo() {
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Próxima fase</div>
        <h1>Prototipo de la app</h1>
        <p>
          Esta sección alojará el prototipo navegable: la vista del pasajero y la tablet de barra. Comparte el repositorio, el diseño y los datos con el
          benchmark, así que lo aprendido aquí se convierte directamente en producto.
        </p>
      </div>
      <div className="grid" style={{ gridTemplateColumns: '300px minmax(0,1fr)', alignItems: 'center' }}>
        <div className="phone">
          <div className="phone-screen">
            <div style={{ background: 'var(--navy)', color: '#fff', padding: '18px 16px 14px' }}>
              <div className="tiny" style={{ opacity: 0.7 }}>Bajamar Express · Asiento 42C</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>¿Qué te apetece?</div>
            </div>
            <div style={{ padding: 12, display: 'grid', gap: 8 }}>
              {[
                ['Bocadillo pollo gourmet', '5,72 €'],
                ['Café cortado', '1,90 €'],
                ['Bollería + bebida caliente', '4,20 €'],
                ['Agua sin gas 1/2', '1,75 €'],
              ].map(([n, p]) => (
                <div key={n} className="card flat" style={{ padding: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>{n}</span>
                  <strong>{p}</strong>
                </div>
              ))}
              <div className="tiny muted">Precios ilustrativos (≈ € por unidad del informe).</div>
            </div>
            <div style={{ marginTop: 'auto', padding: 12 }}>
              <div className="btn primary" style={{ width: '100%', justifyContent: 'center' }}>
                Recoger 10:05–10:10 · Pagar
              </div>
            </div>
          </div>
        </div>
        <div className="grid">
          {PASOS.map(([i, t, d], k) => (
            <div key={t} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="reto-icon sm">
                <Icon name={i} />
              </div>
              <div>
                <div className="tiny muted">Paso {k + 1}</div>
                <strong>{t}</strong>
                <div className="small muted">{d}</div>
              </div>
            </div>
          ))}
          <p className="small">
            Decisiones de diseño justificadas en <Link to="/retos">Del benchmark a la solución</Link>.
          </p>
        </div>
      </div>
      <style>{`@media (max-width: 760px){ .grid[style*="300px"]{ grid-template-columns: 1fr !important; } }`}</style>
    </>
  )
}
