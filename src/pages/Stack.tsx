import { Link } from 'react-router-dom'
import { STACK } from '../data/faq'
import {
  DISENO_PRINCIPAL,
  ESCENARIOS_AGORA,
  EVOLUCION_ERP,
  FLUJO_DESDE_AGORA,
  FLUJO_HACIA_AGORA,
  FUENTES_AGORA,
  REQUISITOS_AGORA,
  type Confirmado,
} from '../data/stack'
import './stack.css'

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
    <svg viewBox="0 0 900 330" role="img" aria-label="Arquitectura de FredOnBoard: móviles y tablets conectados por el wifi del barco a un servidor a bordo, que se conecta con Ágora TPV por API HTTP/JSON y sincroniza con la nube por Starlink" style={{ width: '100%', height: 'auto' }}>
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
      {box(300, 70, 210, 120, 'Servidor del barco', 'Node.js · SQLite/PostgreSQL', '#0b3478', '#0b3478', '#fff')}
      <text x={405} y={172} textAnchor="middle" fontSize={11} fill="#ffcc00">
        Conector Ágora · funciona sin internet
      </text>
      {[84, 164, 244].map((y) => (
        <line key={y} x1={182} y1={y} x2={296} y2={130} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      ))}
      <text x={250} y={104} textAnchor="middle" fontSize={10.5} fill="#5d6779">
        wifi del barco
      </text>
      {/* Ágora a bordo (diseño principal) */}
      {box(300, 255, 210, 55, 'Ágora TPV', 'Carta · precios · stock · caja', '#fff8dc', '#e3a600')}
      <line x1={405} y1={192} x2={405} y2={252} stroke="#e3a600" strokeWidth={2.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      <text x={416} y={217} fontSize={10.5} fontWeight={700} fill="#8a5a00">
        API HTTP/JSON ·
      </text>
      <text x={416} y={231} fontSize={10.5} fontWeight={700} fill="#8a5a00">
        módulo de integración
      </text>
      {/* enlace */}
      <line x1={512} y1={130} x2={620} y2={130} stroke="#e3a600" strokeWidth={2.5} strokeDasharray="7 5" markerEnd="url(#ar)" markerStart="url(#ar)" />
      <text x={566} y={117} textAnchor="middle" fontSize={11} fontWeight={700} fill="#8a5a00">
        Starlink
      </text>
      <text x={566} y={151} textAnchor="middle" fontSize={10} fill="#5d6779">
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
      {/* Ágora en tierra o nube (alternativa según dónde esté instalado) */}
      <rect x={765} y={215} width={105} height={58} rx={8} fill="#fff8dc" stroke="#e3a600" strokeWidth={1.5} strokeDasharray="5 4" />
      <text x={817.5} y={240} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0b3478">
        Ágora TPV
      </text>
      <text x={817.5} y={257} textAnchor="middle" fontSize={10.5} fill="#5d6779">
        si está en tierra
      </text>
      <text x={757} y={292} textAnchor="middle" fontSize={10.5} fill="#8a5a00" fontWeight={700}>
        API HTTP/JSON · módulo de integración
      </text>
      <text x={757} y={307} textAnchor="middle" fontSize={10} fill="#5d6779">
        (alternativa según dónde esté Ágora)
      </text>
      <line x1={757} y1={113} x2={757} y2={133} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      <line x1={697} y1={193} x2={697} y2={213} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      <line x1={817} y1={193} x2={817} y2={213} stroke="#e3a600" strokeWidth={2} strokeDasharray="5 4" markerEnd="url(#ar)" markerStart="url(#ar)" />
    </svg>
  )
}

const ETIQUETA: Record<Confirmado, { t: string; c: string }> = {
  publico: { t: 'En fuentes públicas', c: 'green' },
  validar: { t: 'A validar con Fred. Olsen / Ágora', c: 'yellow' },
  propio: { t: 'Diseño nuestro', c: '' },
}

function Estado({ e }: { e: Confirmado }) {
  return <span className={`tag ${ETIQUETA[e].c}`}>{ETIQUETA[e].t}</span>
}

export default function Stack() {
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Stack técnico</div>
        <h1>Stack técnico propuesto</h1>
        <p>
          FredOnBoard funciona primero a bordo: un servidor local en el barco atiende los pedidos por el wifi y sigue funcionando sin internet. Se integra con Ágora, el TPV de
          Fred. Olsen, desde el piloto: Ágora es la fuente de verdad de la carta, los precios, el stock y la caja. Solo el cobro y la copia en la nube necesitan conexión. Todo se construye con
          estándares abiertos (React, TypeScript, Node.js, PostgreSQL, API HTTP/JSON), así que cualquier equipo de IT puede mantenerlo.
        </p>
      </div>

      <section className="section">
        <div className="section-title">
          <h2>Arquitectura</h2>
          <p>
            Los datos de cada travesía viven en el servidor del barco, que habla con Ágora y sirve la web por el wifi. La nube recibe una copia por Starlink con cola de salida y sin pedidos duplicados.
            Dónde corre Ágora (a bordo o en tierra) decide por dónde va la conexión: se muestran las dos.
          </p>
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

      <section className="section" id="agora">
        <div className="section-title">
          <h2>Cómo nos integramos con Ágora</h2>
          <p>
            La decisión del equipo es integrarnos con Ágora desde el piloto. No elegimos si integrar, sino cómo: un diseño principal y alternativas técnicas según dónde esté instalado Ágora y si su módulo de integración está activo.
          </p>
        </div>

        <div className="card st-principal">
          <div className="st-top">
            <h3>Diseño principal · {DISENO_PRINCIPAL.titulo}</h3>
            <span className="tag yellow">Desde el piloto</span>
          </div>
          <p className="small">{DISENO_PRINCIPAL.resumen}</p>
          <ol className="st-pasos">
            {DISENO_PRINCIPAL.pasos.map((p) => (
              <li key={p.n}>
                <span className="st-n" aria-hidden="true">{p.n}</span>
                <div>
                  <strong>{p.titulo}</strong>
                  <p className="small">{p.texto}</p>
                  <Estado e={p.estado} />
                </div>
              </li>
            ))}
          </ol>
        </div>

        <h3 className="st-sub">Alternativas técnicas según dónde esté Ágora</h3>
        <div className="grid g3 st-escenarios">
          {ESCENARIOS_AGORA.map((e) => (
            <div key={e.id} className="card st-esc">
              <div className="st-cuando">Si {e.cuando.charAt(0).toLowerCase() + e.cuando.slice(1)}</div>
              <h4>{e.nombre}</h4>
              <p className="small">{e.resumen}</p>
              <ul className="clean small">
                {e.como.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <b className="small">Límites</b>
              <ul className="clean small">
                {e.limites.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              {e.ruta && <p className="tiny muted st-ruta">{e.ruta}</p>}
            </div>
          ))}
        </div>

        <div className="card st-erp">
          <h4>{EVOLUCION_ERP.nombre}</h4>
          <p className="small">{EVOLUCION_ERP.resumen}</p>
          <p className="small st-ruta">
            <strong>Cuándo:</strong> {EVOLUCION_ERP.cuando}
          </p>
        </div>
      </section>

      <section className="section" id="flujo-agora">
        <div className="section-title">
          <h2>Qué datos viajan entre Ágora y FredOnBoard</h2>
          <p>Ágora manda en lo que se vende y a qué precio; FredOnBoard devuelve lo que se ha vendido y cobrado.</p>
        </div>
        <div className="st-flujo">
          <div className="card">
            <h4>De Ágora a FredOnBoard</h4>
            <ul className="st-flist">
              {FLUJO_DESDE_AGORA.map((f) => (
                <li key={f.dato}>
                  <div>
                    <strong>{f.dato}</strong>
                    <span className="small muted">{f.detalle}</span>
                  </div>
                  <Estado e={f.estado} />
                </li>
              ))}
            </ul>
          </div>
          <div className="st-flecha" aria-hidden="true">
            <span>⇄</span>
            <span className="tiny muted">API HTTP/JSON</span>
          </div>
          <div className="card">
            <h4>De FredOnBoard a Ágora</h4>
            <ul className="st-flist">
              {FLUJO_HACIA_AGORA.map((f) => (
                <li key={f.dato}>
                  <div>
                    <strong>{f.dato}</strong>
                    <span className="small muted">{f.detalle}</span>
                  </div>
                  <Estado e={f.estado} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="requisitos-agora">
        <div className="section-title">
          <h2>Requisitos y supuestos a validar</h2>
          <p>Lo que necesitamos de Fred. Olsen y de Ágora antes del piloto. No damos por hecho nada que las fuentes públicas no confirmen.</p>
        </div>
        <div className="matrix-wrap" style={{ maxHeight: 'none' }}>
          <table className="st-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Qué</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {REQUISITOS_AGORA.map((r) => (
                <tr key={r.texto}>
                  <th>
                    <span className={`tag ${r.tipo === 'Supuesto' ? 'yellow' : ''}`}>{r.tipo === 'Supuesto' ? 'Supuesto a validar' : 'Requisito'}</span>
                  </th>
                  <td>
                    <strong>{r.texto}</strong>
                  </td>
                  <td>{r.detalle}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
