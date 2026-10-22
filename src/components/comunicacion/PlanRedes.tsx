import { PLAN_REDES, REDES } from '../../data/comunicacion'

export default function PlanRedes() {
  return (
    <>
      <p className="lead">
        Plan de lanzamiento de FredOnBoard en las cinco redes de Fred. Olsen Express. Los textos son propuestas; las metas son{' '}
        <span className="co-supuesto">supuestos</span> a validar con la medición de la pestaña anterior.
      </p>
      <div className="co-plan">
        {PLAN_REDES.map((p) => {
          const red = REDES.find((r) => r.id === p.id)!
          return (
            <div key={p.id} className="card">
              <div className="co-red-top">
                <h3 style={{ margin: 0 }}>{red.nombre}</h3>
                <a className="small" href={red.url} target="_blank" rel="noreferrer">Abrir perfil</a>
              </div>
              <p className="small"><b>Objetivo:</b> {p.objetivo}</p>
              <p className="small"><b>Formato:</b> {p.formato}</p>
              <div className="co-copys">
                {p.piezas.map((z) => (
                  <div key={z.copy} className="co-script"><b>{z.formato}</b><p>{z.copy}</p></div>
                ))}
              </div>
              <div className="co-cal">
                <div><span>Teaser</span>{p.teaser}</div>
                <div><span>Lanzamiento</span>{p.lanzamiento}</div>
                <div><span>Refuerzo</span>{p.refuerzo}</div>
              </div>
              <p className="small" style={{ margin: '10px 0 0' }}>
                <b>KPI:</b> {p.kpi} <span className="co-supuesto">supuesto</span>
              </p>
            </div>
          )
        })}
      </div>
    </>
  )
}
