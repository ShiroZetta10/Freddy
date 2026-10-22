import { Link } from 'react-router-dom'
import { STACK } from '../data/faq'
import { FUENTES_AGORA, OPCIONES_STACK } from '../data/stack'

/** Diagrama de la arquitectura propuesta (SVG en línea, colores de la web). */
function Arquitectura() {
  const box = (x: number, y: number, w: number, h: number, t: string, s: string, fill = '#fff', stroke = '#0b3478', color = '#0b3478') => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + h / 2 - 4} textAnchor="middle" fontSize={13} fontWeight={700} fill={color}>
        {t}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" fontSize={11} fill={color === '#fff' ? '#d6e0f2' : '#5d6779'}>
        {s}
      </text>
    </g>
  )
  return (
    <svg viewBox="0 0 900 330" role="img" aria-label="Arquitectura de FredOnBoard: móviles y tablets conectados por el wifi del barco a un servidor a bordo, que sincroniza con la nube por Starlink" style={{ width: '100%', height: 'auto' }}>
      <defs>
        <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill="#0b3478" />
        </marker>
      </defs>
      {/* barco */}
      <rect x={10} y={10} width={530} height={310} rx={14} fill="#eef3fb" stroke="#c9d7f2" />
      <text x={26} y={34} fontSize={12} fontWeight={800} fill="#0b3478" letterSpacing=".06em">
        A BORDO · BAJAMAR EXPRESS
      </text>
      {box(30, 55, 150, 58, 'Pasajero', 'Web (PWA) · móvil')}
      {box(30, 135, 150, 58, 'Barra', 'Tablet por cafetería')}
      {box(30, 215, 150, 58, 'Portal wifi + QR', 'Puerta de entrada')}
      {box(300, 110, 210, 110, 'Servidor del barco', 'Node.js · SQLite/PostgreSQL', '#0b3478', '#0b3478', '#fff')}
      <text x={405} y={190} textAnchor="middle" fontSize={11} fill="#ffcc00">
        Funciona sin internet
      </text>
      {[84, 164, 244].map((y) => (
        <line key={y} x1={182} y1={y} x2={296} y2={165} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      ))}
      <text x={250} y={104} textAnchor="middle" fontSize={10.5} fill="#5d6779">
        wifi del barco
      </text>
      {/* enlace */}
      <line x1={512} y1={165} x2={620} y2={165} stroke="#e3a600" strokeWidth={2.5} strokeDasharray="7 5" markerEnd="url(#ar)" markerStart="url(#ar)" />
      <text x={566} y={152} textAnchor="middle" fontSize={11} fontWeight={700} fill="#8a5a00">
        Starlink
      </text>
      <text x={566} y={186} textAnchor="middle" fontSize={10} fill="#5d6779">
        cola de salida
      </text>
      {/* tierra */}
      <rect x={625} y={10} width={265} height={310} rx={14} fill="#f4f6f9" stroke="#e2e7ef" />
      <text x={641} y={34} fontSize={12} fontWeight={800} fill="#0b3478" letterSpacing=".06em">
        EN TIERRA · NUBE (UE)
      </text>
      {box(645, 55, 225, 58, 'Panel del manager', 'Carta · reglas · analítica')}
      {box(645, 135, 225, 58, 'Servicio central', 'Node.js · PostgreSQL')}
      {box(645, 215, 105, 58, 'Pasarela', 'Pago tokenizado')}
      {box(765, 215, 105, 58, 'Ágora', 'TPV · reservas')}
      <line x1={757} y1={113} x2={757} y2={133} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      <line x1={697} y1={193} x2={697} y2={213} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      <line x1={817} y1={193} x2={817} y2={213} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
    </svg>
  )
}

export default function Stack() {
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Stack técnico</div>
        <h1>Stack técnico propuesto</h1>
        <p>
          FredOnBoard funciona primero a bordo: un servidor local en el barco atiende los pedidos por el wifi y sigue funcionando sin internet. Solo el cobro y
          la copia en la nube necesitan conexión. Todo se construye con estándares abiertos (React, TypeScript, Node.js, PostgreSQL, API HTTP/JSON), así que
          cualquier equipo de IT puede mantenerlo.
        </p>
      </div>

      <section className="section">
        <div className="section-title">
          <h2>Arquitectura</h2>
          <p>Los datos de cada travesía viven en el servidor del barco; la nube recibe una copia por Starlink con cola de salida y sin pedidos duplicados.</p>
        </div>
        <div className="card faq-diagram">
          <div>
            <Arquitectura />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <h2>Capas: prototipo hoy y producción</h2>
          <p>Qué hay ya construido en el prototipo y qué proponemos para producción.</p>
        </div>
        <div className="matrix-wrap" style={{ maxHeight: 'none' }}>
          <table className="faq-stack">
            <thead>
              <tr>
                <th>Capa</th>
                <th>Prototipo (hoy)</th>
                <th>Producción (propuesta)</th>
              </tr>
            </thead>
            <tbody>
              {STACK.map((s) => (
                <tr key={s.capa}>
                  <th>{s.capa}</th>
                  <td>{s.prototipo}</td>
                  <td>{s.produccion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <h2>Cuatro formas de integrar con Ágora</h2>
          <p>La base a bordo es la misma en todas; cambia cómo se conecta con el TPV Ágora y con los sistemas de Fred. Olsen. Para el piloto recomendamos la B.</p>
        </div>
        <div className="grid g2 pq-opciones">
          {OPCIONES_STACK.map((o) => (
            <div key={o.id} className={`card pq-op${o.recomendada ? ' rec' : ''}`}>
              <div className="pq-op-top">
                <h3>{o.nombre}</h3>
                <span className="pq-tags">
                  {o.recomendada && <span className="tag yellow">Recomendada para el piloto</span>}
                  <span className={`tag ${o.esfuerzo === 'Bajo' ? 'green' : o.esfuerzo === 'Medio' ? 'yellow' : ''}`}>Esfuerzo {o.esfuerzo.toLowerCase()}</span>
                </span>
              </div>
              <p className="small">{o.resumen}</p>
              <ul className="clean small">
                {o.como.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <div className="grid g2 pq-pc small">
                <div>
                  <b>A favor</b>
                  <ul className="clean">
                    {o.pros.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <b>En contra</b>
                  <ul className="clean">
                    {o.contras.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="small pq-cuando">
                <strong>Cuándo:</strong> {o.cuando}
              </p>
            </div>
          ))}
        </div>
      </section>

      <p className="tiny muted section">
        Sobre Ágora, de fuentes públicas:{' '}
        {FUENTES_AGORA.map((f, i) => (
          <span key={f.url}>
            {i > 0 && ' · '}
            <a href={f.url} target="_blank" rel="noreferrer">
              {f.t}
            </a>
          </span>
        ))}
        . Más detalle en el <Link to="/implementacion">plan de implementación</Link>.
      </p>
    </>
  )
}
