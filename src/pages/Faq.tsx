import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIAS, Categoria, FAQ, STACK } from '../data/faq'

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
      {box(765, 215, 105, 58, 'Reservas · TPV', 'Integraciones')}
      <line x1={757} y1={113} x2={757} y2={133} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      <line x1={697} y1={193} x2={697} y2={213} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      <line x1={817} y1={193} x2={817} y2={213} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
    </svg>
  )
}

export default function Faq() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<Categoria | 'Todas'>('Todas')
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set())

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    return FAQ.filter((f) => (cat === 'Todas' || f.cat === cat) && (!t || (f.q + f.corto + f.a.join(' ')).toLowerCase().includes(t)))
  }, [q, cat])

  const toggle = (id: string) =>
    setAbiertas((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const todasAbiertas = lista.length > 0 && lista.every((f) => abiertas.has(f.id))

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Preparación de la defensa</div>
        <h1>Preguntas y respuestas</h1>
        <p>
          Las {FAQ.length} preguntas más probables del jurado y del equipo de Fred. Olsen, con una respuesta corta para decir en voz alta y la explicación
          completa. Las respuestas marcadas como «supuesto» dependen de datos que hay que validar con la empresa.
        </p>
      </div>

      <section>
        <div className="section-title">
          <h2>Stack técnico en un vistazo</h2>
          <p>Cómo funcionaría FredOnBoard en producción. La idea clave: todo lo que pasa a bordo funciona aunque no haya internet.</p>
        </div>
        <div className="card faq-diagram">
          <div>
            <Arquitectura />
          </div>
        </div>
        <div className="matrix-wrap section" style={{ maxHeight: 'none' }}>
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
          <h2>Preguntas</h2>
        </div>
        <div className="toolbar">
          <input className="input" placeholder="Buscar: pagos, Starlink, TPV, RGPD…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: '1 1 260px' }} />
          <button className="btn ghost sm" onClick={() => setAbiertas(todasAbiertas ? new Set() : new Set(lista.map((f) => f.id)))}>
            {todasAbiertas ? 'Cerrar todas' : 'Abrir todas'}
          </button>
        </div>
        <div className="chips" style={{ marginBottom: 16 }}>
          {(['Todas', ...CATEGORIAS] as const).map((c) => (
            <button key={c} className={`chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>
              {c}
              <span style={{ opacity: 0.6, marginLeft: 6 }}>{c === 'Todas' ? FAQ.length : FAQ.filter((f) => f.cat === c).length}</span>
            </button>
          ))}
        </div>

        <div className="faq-list">
          {lista.map((f) => {
            const open = abiertas.has(f.id)
            return (
              <article key={f.id} className={`faq-item${open ? ' open' : ''}`} id={f.id}>
                <button className="faq-q" aria-expanded={open} onClick={() => toggle(f.id)}>
                  <span className="faq-cat">{f.cat}</span>
                  <span className="faq-text">{f.q}</span>
                  <span className="faq-chevron" aria-hidden>
                    {open ? '−' : '+'}
                  </span>
                </button>
                <div className="faq-short">
                  <strong>En una frase:</strong> {f.corto}
                  {f.supuesto && <span className="tag yellow" style={{ marginLeft: 8 }}>Supuesto a validar</span>}
                </div>
                {open && (
                  <div className="faq-a">
                    {f.a.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
          {lista.length === 0 && <p className="muted">No hay preguntas con ese filtro.</p>}
        </div>
      </section>

      <div className="card callout navy section">
        <h3>Puntos débiles que el jurado puede atacar (y cómo respondemos)</h3>
        <ul className="clean">
          <li>
            <strong>«El servidor del prototipo es simulado».</strong> Sí: las pantallas y las reglas son reales, y el servidor es el paso siguiente. Ver
            «¿Qué parte existe de verdad?».
          </li>
          <li>
            <strong>«Sin internet no se puede cobrar».</strong> Correcto. Pedir y preparar funciona sin internet, y el cobro espera o se hace en barra.
          </li>
          <li>
            <strong>«Conectividad, TPV y reservas son supuestos».</strong> Lo decimos así, y el piloto empieza con una semana 0 para medirlos.
          </li>
          <li>
            <strong>«Las cifras de mejora son de proveedores».</strong> Por eso no prometemos un número: el piloto mide la venta por pasajero frente a un
            grupo de control.
          </li>
        </ul>
        <p className="small" style={{ marginTop: 10 }}>
          Para ensayar, podéis pedirle al agente «Fred. Olsen» que os haga estas preguntas. Las respuestas se apoyan en el <Link to="/benchmark">benchmark</Link>{' '}
          y en el <Link to="/prototipo">prototipo</Link>.
        </p>
      </div>
    </>
  )
}
