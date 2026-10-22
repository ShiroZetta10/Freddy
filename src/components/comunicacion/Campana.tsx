import { useState } from 'react'
import { FASES_CAMPANA, GRUPOS_CAMPANA, GrupoCampana, HOJA_ESTILO, PIEZAS_CAMPANA, PiezaCampana } from '../../data/campana'

function Pieza({ p }: { p: PiezaCampana }) {
  const [v, setV] = useState(0)
  const variante = p.variantes[v]
  const fase = FASES_CAMPANA.find((f) => f.id === p.fase)!
  return (
    <article className="card co-cmp-pieza">
      <header className="co-cmp-head">
        <div>
          <span className="co-cmp-id">{p.id}</span>
          <h3>{p.titulo}</h3>
        </div>
        <span className={`tag ${p.fase === 'teaser' ? 'yellow' : p.fase === 'refuerzo' ? 'green' : ''}`}>{fase.nombre} · {p.semana}</span>
      </header>
      {p.variantes.length > 1 && (
        <div className="tabs co-cmp-var" role="tablist" aria-label={`Variantes de ${p.titulo}`}>
          {p.variantes.map((x, i) => (
            <button key={x.nombre} role="tab" aria-selected={i === v} className={i === v ? 'on' : ''} onClick={() => setV(i)}>{x.nombre}</button>
          ))}
        </div>
      )}
      <div className={`co-cmp-strip ${variante.imgs.length > 1 ? 'multi' : ''}`}>
        {variante.imgs.map((src, i) => (
          <a key={src} href={src} target="_blank" rel="noreferrer" title="Abrir a tamaño completo">
            <img src={src} alt={`${p.titulo} · ${variante.nombre}${variante.imgs.length > 1 ? ` · ${i + 1} de ${variante.imgs.length}` : ''}`} loading="lazy" />
          </a>
        ))}
      </div>
      <p className="co-cmp-copy">«{p.copy}»</p>
      <dl className="co-cmp-meta">
        <div><dt>Formato</dt><dd>{p.formato}</dd></div>
        <div><dt>Dónde va</dt><dd>{p.donde}</dd></div>
      </dl>
    </article>
  )
}

export default function Campana() {
  const [grupo, setGrupo] = useState<GrupoCampana | 'todo'>('todo')
  const piezas = PIEZAS_CAMPANA.filter((p) => grupo === 'todo' || p.grupo === grupo)
  return (
    <>
      <p className="lead">
        Las piezas de la campaña de lanzamiento de FredOnBoard en el Bajamar Express, listas para producir. Cada pieza tiene dos variantes: <b>Luz</b>{' '}
        (blanco y marino) y <b>Mar</b> (marino dominante). Los QR son reales y abren el prototipo del pasajero. Pulsa una imagen para verla a tamaño completo.
      </p>

      <div className="grid g2 co-cmp-intro">
        <a className="card co-cmp-guia" href={HOJA_ESTILO} target="_blank" rel="noreferrer">
          <img src={HOJA_ESTILO} alt="Hoja de estilo de la campaña: colores, tipografía Open Sans, iconos de los 3 pasos, uso del QR y del logo" loading="lazy" />
          <span className="small muted">Hoja de estilo: colores, Open Sans, iconos de los 3 pasos, QR y logo.</span>
        </a>
        <div className="card">
          <h3>Calendario de la campaña</h3>
          <div className="co-cmp-cal">
            {FASES_CAMPANA.map((f) => (
              <div key={f.id}>
                <span>{f.cuando}</span>
                <b>{f.nombre}</b>
                <ul>{PIEZAS_CAMPANA.filter((p) => p.fase === f.id).map((p) => <li key={p.id}>{p.id} · {p.titulo}</li>)}</ul>
              </div>
            ))}
          </div>
          <ul className="co-list" style={{ marginTop: 12 }}>
            <li>Nunca «desde tu asiento»: en el barco no hay asiento asignado.</li>
            <li>La barra sigue atendiendo igual; el móvil es una opción más.</li>
            <li>Sin precios ni descuentos. Tarifa Joven aparece como <span className="co-supuesto">Próximamente</span>.</li>
            <li>Impresos con 3 mm de sangrado y sin emojis.</li>
          </ul>
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: 20 }}>
        <div className="tabs" role="tablist" aria-label="Filtrar piezas por grupo">
          <button role="tab" aria-selected={grupo === 'todo'} className={grupo === 'todo' ? 'on' : ''} onClick={() => setGrupo('todo')}>Todas</button>
          {GRUPOS_CAMPANA.map((g) => (
            <button key={g.id} role="tab" aria-selected={grupo === g.id} className={grupo === g.id ? 'on' : ''} onClick={() => setGrupo(g.id)}>{g.id} · {g.nombre}</button>
          ))}
        </div>
      </div>

      <div className="co-cmp-grid">
        {piezas.map((p) => <Pieza key={p.id} p={p} />)}
      </div>
    </>
  )
}
