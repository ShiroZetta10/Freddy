import { Link } from 'react-router-dom'
import { ENTREGABLES, ESTADO_LABEL } from '../data/entregables'

/** Página de un entregable en preparación: qué responde del reto y qué incluirá. */
export default function EntregablePage({ id }: { id: string }) {
  const e = ENTREGABLES.find((x) => x.id === id)!
  const i = ENTREGABLES.indexOf(e)
  const prev = ENTREGABLES[i - 1]
  const next = ENTREGABLES[i + 1]
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">
          Entregable {e.num} · {ESTADO_LABEL[e.estado]}
        </div>
        <h1>
          {e.icono} {e.titulo}
        </h1>
        <p>{e.resumen}</p>
      </div>

      <div className="grid g2">
        <div className="card callout navy">
          <div className="eyebrow" style={{ color: 'var(--navy-3)' }}>
            Qué responde del reto
          </div>
          {e.respondeA}
        </div>
        <div className="card callout">
          <div className="eyebrow">Estado</div>
          Este entregable está en preparación. Abajo tenéis el contenido previsto, apoyado en las conclusiones del <Link to="/benchmark">benchmark</Link>.
        </div>
      </div>

      <div className="card section">
        <h3>Qué incluirá</h3>
        <ul className="clean">
          {e.incluira.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>

      <div className="toolbar section" style={{ justifyContent: 'space-between' }}>
        {prev ? (
          <Link className="btn light" to={prev.ruta}>
            ← {prev.titulo}
          </Link>
        ) : (
          <span />
        )}
        <Link className="btn light" to="/">
          Todos los entregables
        </Link>
        {next ? (
          <Link className="btn light" to={next.ruta}>
            {next.titulo} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </>
  )
}
