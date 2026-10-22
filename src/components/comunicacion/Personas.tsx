import { PERSONAS, PersonaId } from '../../data/comunicacion'
import AvatarSvg from './Avatar'

export function SelectorPersona({ id, onChange }: { id: PersonaId; onChange: (id: PersonaId) => void }) {
  return (
    <div className="chips co-selector" role="tablist" aria-label="Buyer persona">
      {PERSONAS.map((p) => (
        <button key={p.id} role="tab" aria-selected={p.id === id} className={`chip ${p.id === id ? 'on' : ''}`} onClick={() => onChange(p.id)}>
          {p.nombre} · {p.etiqueta}
        </button>
      ))}
    </div>
  )
}

export default function Personas({ id, onChange }: { id: PersonaId; onChange: (id: PersonaId) => void }) {
  const p = PERSONAS.find((x) => x.id === id)!
  return (
    <>
      <div className="callout navy">
        <span className="co-supuesto">Semi-ficticias</span>{' '}
        Los nombres y las ilustraciones son inventados. El contexto de ruta, los públicos y las cifras de venta salen de los datos oficiales del reto
        (informe del Bajamar Express, enero a abril 2026); el comportamiento digital, las motivaciones y los frenos son supuestos a contrastar con
        entrevistas a pasajeros.
      </div>
      <SelectorPersona id={id} onChange={onChange} />
      <div className="card co-persona">
        <div className="co-persona-head">
          <AvatarSvg a={p.avatar} size={104} />
          <div>
            <h3 style={{ fontSize: 22, margin: 0 }}>{p.nombre}, {p.edad} años</h3>
            <span className="tag">{p.etiqueta}</span>
            <p className="small" style={{ margin: '8px 0 0' }}>{p.perfil}</p>
          </div>
        </div>
        <div className="co-persona-grid">
          <div><h4>Contexto de viaje</h4><p className="small">{p.contexto}</p></div>
          <div><h4>Comportamiento digital</h4><p className="small">{p.digital}</p></div>
          <div><h4>Necesidades</h4><ul className="co-list">{p.necesidades.map((n) => <li key={n}>{n}</li>)}</ul></div>
          <div><h4>Motivaciones</h4><ul className="co-list">{p.motivaciones.map((n) => <li key={n}>{n}</li>)}</ul></div>
          <div><h4>Frenos</h4><ul className="co-list">{p.frenos.map((n) => <li key={n}>{n}</li>)}</ul></div>
          <div><h4>Canal principal</h4><p className="small">{p.canal}</p></div>
        </div>
        <div className="co-persona-msg"><span>Mensaje clave</span><strong>{p.mensaje}</strong></div>
        <div className="small muted" style={{ marginTop: 12 }}>
          <b>Construida con:</b>
          <ul className="co-list">{p.base.map((b) => <li key={b}>{b}</li>)}</ul>
        </div>
      </div>
    </>
  )
}
