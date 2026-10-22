import { Link } from 'react-router-dom'
import { ENTREGABLES, ESTADO_LABEL } from '../data/entregables'
import Icon from '../components/Icon'
import { BARRERAS, EJES_CANARIOS } from '../data/canarias'

const tagClass = { listo: 'green', borrador: 'yellow', 'en-preparacion': '' } as const

export default function Hub() {
  return (
    <>
      <section className="band">
        <div className="band-inner">
          <div className="band-logos">
            <span className="band-logo-chip">
              <img src="logos/fred-olsen-express.png" alt="Fred. Olsen Express" />
            </span>
            <span className="band-x">×</span>
            <img className="band-logo-tc" src="logos/talento-canario-blanco.png" alt="Talento Canario" />
          </div>
          <div className="eyebrow light">Zetta10 · Hackathon Talento Canario · Equipo Shiro</div>
          <h1>FredOnBoard</h1>
          <p>
            El compañero de viaje digital de Fred. Olsen Express, dentro de On Board Club. Acompaña al pasajero antes, durante y después de la travesía,
            con un Click &amp; Collect que permite pedir desde el asiento y recoger en barra sin colas y sin aumentar la tripulación. Con producto canario,
            cero papel y hecho por talento canario.
          </p>
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
        <div className="section">
          <div className="section-title">
            <h2>Las 4 barreras que frenan la compra</h2>
            <p>Las identifica Fred. Olsen en el reto. Así responde FredOnBoard a cada una.</p>
          </div>
          <div className="grid g4 hub-barreras">
            {BARRERAS.map((b, i) => (
              <div key={b.id} className="card">
                <div className="hub-num">0{i + 1}</div>
                <h3>{b.titulo}</h3>
                <p className="small muted">{b.suyo}</p>
                <p className="small">
                  <strong>FredOnBoard:</strong> {b.nuestro}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-title">
            <h2>Conexión canaria</h2>
            <p>Lo canario recorre toda la propuesta: la carta, la tienda, los planes y los indicadores del piloto.</p>
          </div>
          <div className="grid g4 hub-barreras">
            {EJES_CANARIOS.map((e) => (
              <div key={e.id} className="card">
                <span className="hub-ico">
                  <Icon name={e.icono} />
                </span>
                <h3 style={{ marginTop: 10 }}>{e.titulo}</h3>
                <p className="small muted">{e.suyo}</p>
                <p className="small">
                  <strong>FredOnBoard:</strong> {e.nuestro}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Link to="/faq" className="card faq-banner section">
          <div>
            <h3>Preguntas y respuestas</h3>
            <p className="small muted">Las preguntas más probables del jurado, con el stack técnico explicado y una respuesta corta para cada una.</p>
          </div>
          <span className="hub-go">Ver preguntas</span>
        </Link>
      </div>
    </>
  )
}
