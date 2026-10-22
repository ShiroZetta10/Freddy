import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BENCHMARKS, Empresa, pesosIguales, puntuar, SECTOR_LABEL, CRITERIOS, CATEGORIAS, agruparVerticales } from '../data/benchmarks'
import './benchmark-grupos.css'
import { Avatar, CompanyDrawer, Legend, ScoreCell, SourceLink } from '../components/ui'

type Orden = 'score' | 'nombre' | string

export default function BenchmarkPage() {
  const { key } = useParams()
  const b = BENCHMARKS[(key === 'B' ? 'B' : 'A') as 'A' | 'B']
  const [q, setQ] = useState('')
  const [sector, setSector] = useState<string>('todos')
  const [grupo, setGrupo] = useState<string>('todos')
  const [verts, setVerts] = useState<string[]>(b.verticales.map((v) => v.id))
  const [orden, setOrden] = useState<Orden>('score')
  const [sel, setSel] = useState<Empresa | null>(null)
  const [vista, setVista] = useState<'matriz' | 'fichas'>('matriz')
  const [soloTablero, setSoloTablero] = useState(true)
  const hayTablero = b.empresas.some((e) => e.en_tablero)

  // reset al cambiar de benchmark
  const [lastKey, setLastKey] = useState(b.key)
  if (lastKey !== b.key) {
    setLastKey(b.key)
    setVerts(b.verticales.map((v) => v.id))
    setSector('todos')
    setGrupo('todos')
    setOrden('score')
  }

  // Las cabeceras de la tabla se fijan respecto a la ventana, justo debajo de la cabecera fija de la web (barra + subnavegación)
  const wrapRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const ajustar = () => {
      const h = document.querySelector('.topbar')?.getBoundingClientRect().height
      if (h && wrapRef.current) wrapRef.current.style.setProperty('--bg-top', `${Math.floor(h) - 2}px`)
    }
    ajustar()
    window.addEventListener('resize', ajustar)
    return () => window.removeEventListener('resize', ajustar)
  }, [vista])

  const sectores = useMemo(() => Array.from(new Set(b.empresas.map((e) => e.sector))), [b])
  const pesos = useMemo(() => {
    const p = pesosIguales(b)
    Object.keys(p).forEach((k) => !verts.includes(k) && (p[k] = 0))
    return p
  }, [b, verts])

  const rows = useMemo(() => {
    let r = b.empresas.filter(
      (e) =>
        (!hayTablero || !soloTablero || e.en_tablero) &&
        (sector === 'todos' || e.sector === sector) &&
        (grupo === 'todos' || e.grupo === grupo) &&
        (q === '' || (e.nombre + e.resumen + e.click_collect).toLowerCase().includes(q.toLowerCase())),
    )
    const sc = (e: Empresa) => puntuar(e, pesos).score
    r = [...r].sort((a, z) => {
      if (orden === 'nombre') return a.nombre.localeCompare(z.nombre)
      if (orden === 'score') return sc(z) - sc(a)
      return (z.evaluacion[orden]?.puntuacion ?? 0) - (a.evaluacion[orden]?.puntuacion ?? 0)
    })
    return r
  }, [b, sector, grupo, q, orden, pesos, soloTablero, hayTablero])

  // columnas ordenadas para que las de una misma categoría queden contiguas
  const grupos = useMemo(() => agruparVerticales(b, b.verticales.filter((v) => verts.includes(v.id))), [b, verts])
  const visibles = grupos.flatMap((g) => g.columnas)
  const todasOrdenadas = agruparVerticales(b, b.verticales).flatMap((g) => g.columnas)
  const inicioGrupo = new Set(grupos.map((g) => g.columnas[0].id))
  const catDe: Record<string, string> = {}
  grupos.forEach((g) => g.columnas.forEach((v) => (catDe[v.id] = g.id)))
  const toggleVert = (id: string) => setVerts((vs) => (vs.includes(id) ? (vs.length > 1 ? vs.filter((x) => x !== id) : vs) : [...vs, id]))

  // mejor de cada vertical
  const best = useMemo(() => {
    const out: Record<string, number> = {}
    b.verticales.forEach((v) => (out[v.id] = Math.max(...b.empresas.map((e) => e.evaluacion[v.id]?.puntuacion ?? 0))))
    return out
  }, [b])

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Benchmark {b.key}</div>
        <h1>{b.titulo}</h1>
        <p>{b.subtitulo}</p>
      </div>

      <div className="toolbar">
        <input className="input" placeholder="Buscar empresa o práctica…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: '1 1 220px' }} />
        {hayTablero && (
          <div className="tabs">
            <button className={soloTablero ? 'on' : ''} onClick={() => setSoloTablero(true)}>
              Tablero del equipo ({b.empresas.filter((e) => e.en_tablero).length})
            </button>
            <button className={!soloTablero ? 'on' : ''} onClick={() => setSoloTablero(false)}>
              Todas ({b.empresas.length})
            </button>
          </div>
        )}
        {b.grupos.length > 1 && (
          <select className="input" value={grupo} onChange={(e) => setGrupo(e.target.value)}>
            <option value="todos">Todos los bloques</option>
            {b.grupos.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        )}
        <select className="input" value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="todos">Todos los sectores</option>
          {sectores.map((s) => (
            <option key={s} value={s}>
              {SECTOR_LABEL[s] ?? s}
            </option>
          ))}
        </select>
        <select className="input" value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="score">Ordenar: media</option>
          <option value="nombre">Ordenar: nombre</option>
          {b.verticales.map((v) => (
            <option key={v.id} value={v.id}>
              Ordenar: {v.nombre}
            </option>
          ))}
        </select>
        <div className="tabs">
          <button className={vista === 'matriz' ? 'on' : ''} onClick={() => setVista('matriz')}>
            Matriz
          </button>
          <button className={vista === 'fichas' ? 'on' : ''} onClick={() => setVista('fichas')}>
            Fichas
          </button>
        </div>
      </div>
      <div className="chips" style={{ marginBottom: 14 }}>
        <span className="small muted" style={{ alignSelf: 'center', marginRight: 4 }}>
          Verticales:
        </span>
        {todasOrdenadas.map((v) => (
          <button key={v.id} className={`chip${verts.includes(v.id) ? ' on' : ''}`} onClick={() => toggleVert(v.id)} title={v.descripcion}>
            {v.nombre}
          </button>
        ))}
      </div>

      {vista === 'matriz' ? (
        <>
          <div className="bg-leyenda" aria-label="Categorías de la tabla">
            {grupos.map((g) => (
              <span key={g.id} className={`bg-leyenda-item bg-cat-${g.id}`}>
                <span className="bg-swatch" aria-hidden="true" />
                <strong>{CATEGORIAS[g.id].nombre}:</strong> {CATEGORIAS[g.id].descripcion}
              </span>
            ))}
          </div>
          <div className="matrix-wrap bg-wrap" ref={wrapRef}>
            <table className="matrix bg-matrix">
              <thead>
                <tr className="bg-row1">
                  <th rowSpan={2} className="bg-corner">
                    {rows.length} empresas <span style={{ opacity: 0.6, fontWeight: 500 }}>· clic para ficha</span>
                  </th>
                  {grupos.map((g) => (
                    <th key={g.id} colSpan={g.columnas.length} scope="colgroup" className={`bg-cat bg-cat-${g.id} bg-gstart`}>
                      {CATEGORIAS[g.id].nombre}
                    </th>
                  ))}
                  <th rowSpan={2} className="bg-total bg-gstart">
                    Media
                  </th>
                </tr>
                <tr className="bg-row2">
                  {visibles.map((v) => (
                    <th key={v.id} scope="col" title={v.descripcion} className={`bg-col bg-cat-${catDe[v.id]}${inicioGrupo.has(v.id) ? ' bg-gstart' : ''}`}>
                      {v.nombre}
                      {b.mapaCriterios[v.id] && (
                        <div style={{ marginTop: 4 }}>
                          <span className="dot" style={{ background: CRITERIOS[b.mapaCriterios[v.id]].color, border: '1px solid #fff' }} />
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const { score, cobertura } = puntuar(e, pesos)
                  return (
                    <tr key={e.id} className={e.id === 'fred-olsen-express' ? 'highlight' : ''}>
                      <th>
                        <div className="co" onClick={() => setSel(e)}>
                          <Avatar e={e} />
                          <div className="co-name">
                            {e.nombre}
                            <small>
                              {b.grupos.length > 1 ? e.grupo : SECTOR_LABEL[e.sector] ?? e.sector} · {e.pais}
                            </small>
                            {e.relevancia && (
                              <span className={`tag ${e.relevancia >= 4 ? 'green' : e.relevancia === 3 ? 'yellow' : 'red'}`} title={e.motivo_relevancia}>
                                Ref. secundaria · relevancia {e.relevancia}/5
                              </span>
                            )}
                          </div>
                        </div>
                      </th>
                      {visibles.map((v) => {
                        const ev = e.evaluacion[v.id]
                        const s = ev?.puntuacion ?? 0
                        return (
                          <td key={v.id} className={inicioGrupo.has(v.id) ? 'bg-gstart' : ''} style={{ position: 'relative' }}>
                            <ScoreCell v={s} onClick={() => setSel(e)} title={`${e.nombre} · ${v.nombre}: ${ev?.evidencia ?? 'Sin información'}`} />
                            {s > 0 && s === best[v.id] && (
                              <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 11 }} title="Mejor puntuación de la vertical">
                                ★
                              </span>
                            )}
                          </td>
                        )
                      })}
                      <td className="total bg-gstart" title={`Cobertura de información: ${Math.round(cobertura * 100)} %`}>
                        {score ? score.toFixed(1) : '—'}
                        <div className="tiny muted" style={{ fontWeight: 500 }}>
                          {Math.round(cobertura * 100)} % info
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Legend />
          <div className="legend">
            {Object.entries(CRITERIOS).map(([k, c]) => (
              <span key={k}>
                <span className="dot" style={{ background: c.color }} />
                {c.nombre} ({c.peso} %)
              </span>
            ))}
            <span>★ mejor de la vertical</span>
            <Link to="/ranking">Ajustar pesos y ver ranking →</Link>
          </div>
        </>
      ) : (
        <div className="grid g3">
          {rows.map((e) => (
            <div key={e.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSel(e)}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <Avatar e={e} />
                <div className="co-name" style={{ fontWeight: 700 }}>
                  {e.nombre}
                  <small>{SECTOR_LABEL[e.sector] ?? e.sector}</small>
                </div>
              </div>
              <p className="small">{e.click_collect}</p>
              <div style={{ display: 'flex', gap: 4 }}>
                {visibles.map((v) => (
                  <div key={v.id} title={v.nombre} className={`cell s${e.evaluacion[v.id]?.puntuacion ?? 0}`} style={{ height: 22, fontSize: 11, margin: 0, cursor: 'inherit' }}>
                    {e.evaluacion[v.id]?.puntuacion || '—'}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="section">
        <h2>Insights accionables</h2>
        <p className="lead">Qué aprendemos y qué haremos en la solución.</p>
        <div className="grid g2">
          {b.insights.map((i, k) => (
            <div key={k} className="card insight">
              {b.grupos.length > 1 && <span className="tag">{i.grupo}</span>}
              <h3 style={{ marginTop: 6 }}>{i.titulo}</h3>
              <p className="small">{i.descripcion}</p>
              <div className="action">
                <strong>→ En nuestra solución:</strong> {i.accion_para_solucion}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Tendencias</h2>
        <div className="grid g3">
          {b.tendencias.map((t, k) => (
            <div key={k} className="card trend">
              <h3>{t.titulo}</h3>
              <p className="small">{t.descripcion}</p>
              <SourceLink url={t.fuente} />
            </div>
          ))}
        </div>
      </section>

      {sel && <CompanyDrawer e={sel} b={b} onClose={() => setSel(null)} />}
    </>
  )
}
