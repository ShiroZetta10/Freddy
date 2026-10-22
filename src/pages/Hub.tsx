import { Link } from 'react-router-dom'
import { ENTREGABLES, ESTADO_LABEL } from '../data/entregables'
import Icon from '../components/Icon'
import { BARRERAS, EJES_CANARIOS } from '../data/canarias'
import { EQUIPO, REPO } from '../data/equipo'

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
            con un Click &amp; Collect que permite pedir sin levantarse y recoger en barra sin colas y sin aumentar la tripulación. Con producto canario,
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

        <section className="section" id="equipo" aria-labelledby="equipo-titulo">
          <div className="section-title">
            <h2 id="equipo-titulo">Conoce al equipo</h2>
            <p>
              Somos Shiro, talento canario en Zetta10. El código de esta web y del prototipo está en{' '}
              <a href={REPO} target="_blank" rel="noreferrer">
                GitHub
              </a>
              .
            </p>
          </div>
          <div className="grid g4 eq-grid">
            {EQUIPO.map((m) => {
              const iniciales = m.nombre
                .split(' ')
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
              return (
                <article key={m.nombre} className="card eq-card">
                  <div className="eq-foto" aria-hidden>
                    <span>{iniciales}</span>
                    {m.github && (
                      <img
                        src={`https://github.com/${m.github}.png?size=160`}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                  </div>
                  <h3>{m.nombre}</h3>
                  <div className="eq-rol">{m.rol}</div>
                  <p className="small muted">{m.detalle}</p>
                  <div className="eq-links">
                    {m.github && (
                      <a href={`https://github.com/${m.github}`} target="_blank" rel="noreferrer" aria-label={`GitHub de ${m.nombre}`}>
                        GitHub
                      </a>
                    )}
                    {m.linkedin && (
                      <a href={m.linkedin} target="_blank" rel="noreferrer" aria-label={`LinkedIn de ${m.nombre}`}>
                        LinkedIn
                      </a>
                    )}
                    {m.web && (
                      <a href={m.web} target="_blank" rel="noreferrer" aria-label={`Web de ${m.nombre}`}>
                        Web
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <Link to="/stack" className="card faq-banner section">
          <div>
            <h3>Stack técnico propuesto</h3>
            <p className="small muted">Arquitectura local-first que funciona sin internet, capas del prototipo y producción, y cuatro formas de integrar con Ágora.</p>
          </div>
          <span className="hub-go">Ver stack</span>
        </Link>
      </div>
    </>
  )
}
