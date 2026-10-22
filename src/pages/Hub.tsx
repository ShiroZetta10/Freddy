import { Link } from 'react-router-dom'
import { ENTREGABLES, ESTADO_LABEL } from '../data/entregables'
import Icon from '../components/Icon'

const tagClass = { listo: 'green', borrador: 'yellow', 'en-preparacion': '' } as const

export default function Hub() {
  return (
    <>
      <section className="band">
        <div className="band-inner">
          <div className="eyebrow light">Zetta10 · Reto Fred. Olsen Express · Equipo Shiro</div>
          <h1>Click &amp; Collect a bordo</h1>
          <p>Pedir y pagar desde el asiento y recoger en barra, sin colas y sin aumentar la tripulación.</p>
        </div>
      </section>

      <div className="wrap">
        <div className="section-title">
          <h2>Entregables</h2>
          <p>Elige un entregable para ver su contenido.</p>
        </div>

        <div className="hub-grid">
          {ENTREGABLES.map((e) => (
            <Link key={e.id} to={e.ruta} className="card hub-card">
              <div className="hub-top">
                <span className="hub-ico">
                  <Icon name={e.icono} />
                </span>
                <span className={`tag ${tagClass[e.estado]}`}>{ESTADO_LABEL[e.estado]}</span>
              </div>
              <div className="hub-num">{e.num}</div>
              <h3>{e.titulo}</h3>
              <p className="small muted">{e.resumen}</p>
              <span className="hub-go">Ver entregable</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
