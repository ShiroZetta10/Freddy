import { Link } from 'react-router-dom'
import { ENTREGABLES, ESTADO_LABEL } from '../data/entregables'

const Mountains = () => (
  <svg className="mountains" viewBox="0 0 1440 170" preserveAspectRatio="none" aria-hidden>
    <path d="M0 170 V120 L120 95 L210 110 L330 70 L420 92 L520 60 L600 30 L640 18 L680 30 L760 64 L860 84 L960 72 L1060 98 L1180 80 L1300 104 L1440 90 V170 Z" fill="#2a140b" />
    <path d="M0 170 V140 C120 128 220 146 360 136 S600 126 760 140 S1080 130 1240 142 S1380 134 1440 138 V170 Z" fill="#f5f6f8" opacity=".92" />
  </svg>
)

const tagClass = { listo: 'green', borrador: 'yellow', 'en-preparacion': '' } as const

export default function Hub() {
  return (
    <>
      <section className="hero hub-hero">
        <Mountains />
        <div className="eyebrow">Zetta10 · Hackathon Talento Canario · Equipo Shiro</div>
        <h1>
          Click & Collect <em>a bordo</em>
        </h1>
        <p>
          Nuestra propuesta para Fred. Olsen Express: pedir y pagar desde el asiento y recoger en barra sin colas y sin aumentar la tripulación. Elige un
          entregable.
        </p>
      </section>

      <div className="hero-panel">
        <div className="hub-grid">
          {ENTREGABLES.map((e) => (
            <Link key={e.id} to={e.ruta} className={`card hub-card${e.estado === 'listo' ? ' ready' : ''}`}>
              <div className="hub-top">
                <span className="hub-num">{e.num}</span>
                <span className={`tag ${tagClass[e.estado]}`}>{ESTADO_LABEL[e.estado]}</span>
              </div>
              <div className="hub-ico">{e.icono}</div>
              <h2>{e.titulo}</h2>
              <p className="small muted">{e.resumen}</p>
              <span className="hub-go">Abrir →</span>
            </Link>
          ))}
        </div>
      </div>

      <section className="section center-head">
        <h2>Cómo encajan</h2>
        <p className="lead">
          El benchmark justifica las decisiones. El user journey y el prototipo muestran el servicio. El piloto demuestra el impacto. Los planes de
          implementación y comunicación explican cómo llevarlo a la flota.
        </p>
        <div className="hub-flow">
          {ENTREGABLES.map((e, i) => (
            <span key={e.id}>
              <Link to={e.ruta}>{e.titulo}</Link>
              {i < ENTREGABLES.length - 1 && <b>→</b>}
            </span>
          ))}
        </div>
      </section>
    </>
  )
}
