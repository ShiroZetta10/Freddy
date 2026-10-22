import { useEffect } from 'react'
import { Benchmark, Empresa, SECTOR_LABEL, CRITERIOS } from '../data/benchmarks'

export function ScoreCell({ v, onClick, title }: { v: number; onClick?: () => void; title?: string }) {
  return (
    <button className={`cell s${v}`} onClick={onClick} title={title} aria-label={title}>
      {v === 0 ? '—' : v}
    </button>
  )
}

export function Legend() {
  const items: [string, string][] = [
    ['s1', '1 · No existe / pobre'],
    ['s2', '2 · Básico'],
    ['s3', '3 · Estándar'],
    ['s4', '4 · Destacado'],
    ['s5', '5 · Referente'],
  ]
  return (
    <div className="legend">
      {items.map(([c, l]) => (
        <span key={c}>
          <i className={`cell ${c}`} style={{ display: 'inline-block', width: 18, height: 14, margin: 0 }} />
          {l}
        </span>
      ))}
      <span>
        <i className="cell s0" style={{ display: 'inline-block', width: 18, height: 14, margin: 0 }} />— Sin información verificable (no puntúa)
      </span>
    </div>
  )
}

export function Avatar({ e, lg }: { e: Pick<Empresa, 'logo_texto' | 'id'>; lg?: boolean }) {
  const fo = e.id === 'fred-olsen-express'
  return (
    <span className={`avatar${lg ? ' lg' : ''}`} style={fo ? { background: 'var(--red)', color: '#fff' } : undefined}>
      {e.logo_texto}
    </span>
  )
}

const host = (u: string) => {
  try {
    return new URL(u).hostname.replace('www.', '')
  } catch {
    return u
  }
}

export function SourceLink({ url }: { url?: string }) {
  if (!url || !url.startsWith('http')) return null
  return (
    <a className="tiny" href={url} target="_blank" rel="noreferrer">
      {host(url)} ↗
    </a>
  )
}

const confTag = (c: string) => (c === 'alta' ? 'green' : c === 'media' ? 'yellow' : 'red')

export function CompanyDrawer({ e, b, onClose }: { e: Empresa; b: Benchmark; onClose: () => void }) {
  useEffect(() => {
    const k = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="overlay" onClick={onClose}>
      <aside className="drawer" onClick={(x) => x.stopPropagation()} role="dialog" aria-modal="true" aria-label={e.nombre}>
        <button className="close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
          <Avatar e={e} lg />
          <div>
            <h2 style={{ margin: 0 }}>{e.nombre}</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              <span className="tag">{SECTOR_LABEL[e.sector] ?? e.sector}</span>
              <span className="tag">{e.pais}</span>
              <span className={`tag ${confTag(e.confianza)}`}>Confianza {e.confianza}</span>
            </div>
          </div>
        </div>
        <p>{e.resumen}</p>

        <div className="callout navy" style={{ marginBottom: 18 }}>
          <div className="eyebrow" style={{ color: 'var(--navy-3)' }}>
            Su Click & Collect
          </div>
          {e.click_collect}
        </div>

        {e.datos_clave?.length > 0 && (
          <>
            <h3>Datos clave</h3>
            <div className="grid g2" style={{ marginBottom: 18 }}>
              {e.datos_clave.map((d, i) => (
                <div key={i} className="card flat" style={{ padding: 12 }}>
                  <div className="tiny muted">{d.etiqueta}</div>
                  <div style={{ fontWeight: 800, color: 'var(--navy)' }}>{d.valor}</div>
                  <SourceLink url={d.fuente} />
                </div>
              ))}
            </div>
          </>
        )}

        <h3>Evaluación por vertical</h3>
        {b.verticales.map((v) => {
          const ev = e.evaluacion[v.id]
          const crit = b.mapaCriterios[v.id]
          return (
            <div key={v.id} className="ev">
              <ScoreCell v={ev?.puntuacion ?? 0} />
              <div>
                <div style={{ fontWeight: 700 }}>
                  {v.nombre}{' '}
                  {crit && (
                    <span className="tiny muted">
                      <span className="dot" style={{ background: CRITERIOS[crit].color }} />
                      {CRITERIOS[crit].nombre}
                    </span>
                  )}
                </div>
                <div className="small">{ev?.evidencia || 'Sin información.'}</div>
                <SourceLink url={ev?.fuente} />
              </div>
            </div>
          )
        })}

        {e.buenas_practicas?.length > 0 && (
          <>
            <h3 style={{ marginTop: 18 }}>Buenas prácticas</h3>
            <ul className="clean">
              {e.buenas_practicas.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </>
        )}

        <div className="callout" style={{ marginTop: 18 }}>
          <div className="eyebrow">Cómo lo aplicamos a Fred. Olsen</div>
          {e.aplicacion_fred_olsen}
        </div>
        <div className="callout red" style={{ marginTop: 10 }}>
          <div className="eyebrow">Qué no copiar / límites</div>
          {e.riesgos_o_limites}
        </div>
        <p className="tiny muted" style={{ marginTop: 14 }}>
          [I] = inferencia del equipo. Las puntuaciones son una valoración del equipo Shiro sobre fuentes públicas.
        </p>
      </aside>
    </div>
  )
}
