import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Canal, FASES, PERFILES, Pantalla, Perfil, PerfilId } from '../data/journey'
import Icon from '../components/Icon'

function Screen({ p, perfil }: { p: Pantalla; perfil: Perfil }) {
  return (
    <div className={`screen screen-${perfil.dispositivo}`}>
      <div className="screen-bar">
        <span className="screen-brand">FredOnBoard</span>
        <span>{perfil.dispositivo === 'movil' ? 'Pasajero' : perfil.dispositivo === 'tablet' ? 'Barra' : 'Gestión'}</span>
      </div>
      <div className="screen-body" key={p.titulo}>
        <div className="screen-title">{p.titulo}</div>
        {p.sub && <div className="screen-sub">{p.sub}</div>}
        {p.kpis && (
          <div className="screen-kpis">
            {p.kpis.map((k) => (
              <div key={k.l}>
                <b>{k.v}</b>
                <span>{k.l}</span>
              </div>
            ))}
          </div>
        )}
        {p.items?.map((it) => (
          <div key={it.l} className="screen-row">
            <span>{it.l}</span>
            {it.r && <span className={`pill ${it.estado ?? ''}`}>{it.r}</span>}
          </div>
        ))}
        {p.cta && <div className="screen-cta">{p.cta}</div>}
        {p.nota && <div className="screen-note">{p.nota}</div>}
      </div>
    </div>
  )
}

const CANAL_LABEL: Record<Canal['tipo'], string> = { whatsapp: 'WhatsApp', email: 'Email', push: 'Notificación', wifi: 'Portal wifi' }

function MensajeCanal({ c }: { c: Canal }) {
  return (
    <figure className={`msg msg-${c.tipo}`}>
      <figcaption>
        <span className={`msg-badge msg-badge-${c.tipo}`}>{CANAL_LABEL[c.tipo]}</span>
        <b>{c.de}</b>
        <span className="msg-hora">{c.hora}</span>
      </figcaption>
      {c.asunto && <div className="msg-asunto">{c.asunto}</div>}
      <div className="msg-cuerpo">
        {c.lineas.map((l) =>
          l.startsWith('→ ') ? (
            <span key={l} className="msg-link">
              {l.slice(2)}
            </span>
          ) : (
            <p key={l}>{l}</p>
          ),
        )}
      </div>
      {c.nuevo && <div className="msg-nuevo">Novedad FredOnBoard: {c.nuevo}</div>}
    </figure>
  )
}

export default function Journey() {
  const [perfilId, setPerfilId] = useState<PerfilId>('pasajero')
  const perfil = PERFILES.find((p) => p.id === perfilId)!
  const [activo, setActivo] = useState(0)
  const refs = useRef<(HTMLElement | null)[]>([])

  // Detecta qué etapa está en el centro de la pantalla al hacer scroll
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActivo(Number((e.target as HTMLElement).dataset.i))
        })
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    refs.current.forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [perfilId])

  const paso = perfil.pasos[activo] ?? perfil.pasos[0]
  const faseActiva = FASES.indexOf(paso.fase)

  const cambiarPerfil = (id: PerfilId) => {
    setPerfilId(id)
    setActivo(0)
    document.getElementById('journey-top')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <div className="page-head" id="journey-top">
        <div className="eyebrow">Entregable 04 · User journey</div>
        <h1>Un viaje con FredOnBoard</h1>
        <p>
          FredOnBoard es el compañero de viaje digital de Fred. Olsen: acompaña antes, durante y después de la travesía, con el Click &amp; Collect como
          servicio central. Haz scroll para recorrer el viaje y cambia de perfil para ver qué pasa en la barra y en la gestión.
        </p>
      </div>

      <div className="jr-sticky">
        <div className="tabs jr-tabs" role="tablist">
          {PERFILES.map((p) => (
            <button key={p.id} role="tab" aria-selected={p.id === perfilId} className={p.id === perfilId ? 'on' : ''} onClick={() => cambiarPerfil(p.id)}>
              {p.nombre}
            </button>
          ))}
        </div>
        <div className="jr-route" aria-label={`Fase actual: ${paso.fase}`}>
          <span className="jr-port">Santa Cruz</span>
          <div className="jr-line">
            <div className="jr-fill" style={{ width: `${paso.progreso * 100}%` }} />
            <div className="jr-boat" style={{ left: `${paso.progreso * 100}%` }}>
              <Icon name="anchor" size={14} />
            </div>
          </div>
          <span className="jr-port">Agaete</span>
        </div>
        <div className="jr-phases">
          {FASES.map((f, i) => (
            <span key={f} className={i === faseActiva ? 'on' : i < faseActiva ? 'done' : ''}>
              {f}
            </span>
          ))}
        </div>
      </div>

      <p className="small muted jr-who">
        <strong>{perfil.nombre}:</strong> {perfil.quien}
      </p>

      <div className="jr-grid">
        <div className="jr-steps">
          {perfil.pasos.map((s, i) => (
            <article
              key={perfilId + i}
              data-i={i}
              ref={(el) => {
                refs.current[i] = el
              }}
              className={`jr-step${i === activo ? ' on' : ''}`}
            >
              <div className="jr-meta">
                <span className="tag">{s.fase}</span>
                <span className="tiny muted">{s.hora}</span>
                {s.mvp ? <span className="tag green">MVP del piloto</span> : <span className="tag">Hoja de ruta</span>}
              </div>
              <h2>{s.titulo}</h2>
              <p>{s.hace}</p>
              <div className="jr-pain">
                <div>
                  <h4>Hoy</h4>
                  {s.dolor}
                </div>
                <div className="ours">
                  <h4>Con FredOnBoard</h4>
                  {s.solucion}
                </div>
              </div>
              {s.canales && (
                <div className="jr-canales">
                  <h4>Comunicación con el cliente</h4>
                  {s.canales.map((c) => (
                    <MensajeCanal key={c.tipo + c.hora} c={c} />
                  ))}
                </div>
              )}
              <div className="jr-inline-device">
                <Screen p={s.pantalla} perfil={perfil} />
              </div>
            </article>
          ))}
          <div className="card callout navy">
            <h3>MVP del piloto</h3>
            Sin cuenta para el pasajero (se identifica con su billete), Click &amp; Collect a bordo y pre-pedido antes de embarcar, con la tablet de barra y el
            panel de gestión. Valoración, Plus Points y ofertas quedan en la hoja de ruta. <Link to="/piloto">Ver el piloto</Link>.
          </div>
        </div>
        <div className="jr-device" aria-hidden>
          <Screen p={paso.pantalla} perfil={perfil} />
        </div>
      </div>
    </>
  )
}
