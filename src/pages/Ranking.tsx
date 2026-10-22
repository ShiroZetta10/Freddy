import { useMemo, useState } from 'react'
import { BENCHMARKS, CRITERIOS, Empresa, pesosIguales, pesosJurado, puntuar } from '../data/benchmarks'
import { Avatar, CompanyDrawer } from '../components/ui'
import RadarCompare from '../components/RadarCompare'

export default function Ranking() {
  const [key, setKey] = useState<'A' | 'B'>('B')
  const b = BENCHMARKS[key]
  const [pesos, setPesos] = useState<Record<string, number>>(() => pesosJurado(BENCHMARKS.B))
  const [preset, setPreset] = useState<'jurado' | 'iguales' | 'custom'>('jurado')
  const [minCob, setMinCob] = useState(0.5)
  const [cmp, setCmp] = useState<string[]>([])
  const [sel, setSel] = useState<Empresa | null>(null)
  const [ponderar, setPonderar] = useState(true)
  const [soloTablero, setSoloTablero] = useState(false)

  const cambiar = (k: 'A' | 'B') => {
    setKey(k)
    setPesos(pesosJurado(BENCHMARKS[k]))
    setPreset('jurado')
    setCmp([])
  }

  const ranking = useMemo(
    () =>
      b.empresas
        .filter((e) => !soloTablero || key !== 'A' || e.en_tablero)
        .map((e) => ({ e, ...puntuar(e, pesos, ponderar) }))
        .filter((r) => r.cobertura >= minCob || r.e.id === 'fred-olsen-express')
        .sort((a, z) => z.score - a.score),
    [b, pesos, minCob, ponderar, soloTablero, key],
  )

  const comparar = cmp.length
    ? b.empresas.filter((e) => cmp.includes(e.id))
    : [
        ...(key === 'A' ? b.empresas.filter((e) => e.id === 'fred-olsen-express') : []),
        ...ranking.filter((r) => r.e.id !== 'fred-olsen-express').slice(0, key === 'A' ? 2 : 3).map((r) => r.e),
      ]

  const toggleCmp = (id: string) =>
    setCmp((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 4 ? [...c.slice(1), id] : [...c, id]))

  const totalPeso = Object.values(pesos).reduce((a, z) => a + z, 0)

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Puntuación ponderada</div>
        <h1>Ranking y radar</h1>
        <p>
          Ajusta cuánto pesa cada vertical. Por defecto usamos los criterios del jurado (UX 40 %, innovación 38 %, viabilidad 12 %, escalabilidad
          10 %) repartidos entre las verticales de cada uno. Las verticales sin información no penalizan: se excluyen y se renormaliza.
        </p>
      </div>

      <div className="toolbar">
        <div className="tabs">
          <button className={key === 'A' ? 'on' : ''} onClick={() => cambiar('A')}>
            A · Navieras
          </button>
          <button className={key === 'B' ? 'on' : ''} onClick={() => cambiar('B')}>
            B · Click & Collect
          </button>
        </div>
        <div className="tabs">
          <button
            className={preset === 'jurado' ? 'on' : ''}
            onClick={() => {
              setPesos(pesosJurado(b))
              setPreset('jurado')
            }}
          >
            Pesos del jurado
          </button>
          <button
            className={preset === 'iguales' ? 'on' : ''}
            onClick={() => {
              setPesos(pesosIguales(b))
              setPreset('iguales')
            }}
          >
            Todos iguales
          </button>
        </div>
        {key === 'B' ? (
          <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Retail y plataformas se ponderan por su relevancia para el reto (nota × (0,5 + 0,1 × relevancia))">
            <input type="checkbox" checked={ponderar} onChange={(e) => setPonderar(e.target.checked)} />
            Ponderar referencias secundarias por relevancia
          </label>
        ) : (
          <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={soloTablero} onChange={(e) => setSoloTablero(e.target.checked)} />
            Solo empresas del tablero
          </label>
        )}
        <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Información mínima
          <select className="input" value={minCob} onChange={(e) => setMinCob(+e.target.value)}>
            <option value={0}>cualquiera</option>
            <option value={0.3}>≥ 30 %</option>
            <option value={0.5}>≥ 50 %</option>
            <option value={0.7}>≥ 70 %</option>
          </select>
        </label>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.25fr)', alignItems: 'start' }}>
        <div className="card">
          <h3>Pesos por vertical</h3>
          {b.verticales.map((v) => {
            const c = b.mapaCriterios[v.id]
            return (
              <div key={v.id} className="slider-row">
                <span title={v.descripcion}>
                  <span className="dot" style={{ background: c ? CRITERIOS[c].color : '#ccc' }} />
                  {v.nombre}
                </span>
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={0.5}
                  value={pesos[v.id] ?? 0}
                  onChange={(e) => {
                    setPesos({ ...pesos, [v.id]: +e.target.value })
                    setPreset('custom')
                  }}
                  aria-label={`Peso ${v.nombre}`}
                />
                <strong style={{ textAlign: 'right' }}>{totalPeso ? Math.round(((pesos[v.id] ?? 0) / totalPeso) * 100) : 0}%</strong>
              </div>
            )
          })}
          <div className="legend">
            {Object.entries(CRITERIOS).map(([k, c]) => (
              <span key={k}>
                <span className="dot" style={{ background: c.color }} />
                {c.nombre}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Ranking ({ranking.length})</h3>
          <p className="tiny muted">Marca hasta 4 empresas para el radar ☐.</p>
          {ranking.map((r, i) => (
            <div key={r.e.id} className={`rank-row${r.e.id === 'fred-olsen-express' ? ' fo' : ''}`}>
              <span className="rank-pos">{i + 1}</span>
              <Avatar e={r.e} />
              <div onClick={() => setSel(r.e)}>
                <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span>{r.e.nombre}</span>
                  <span className="tiny muted" style={{ whiteSpace: 'nowrap' }}>
                    {Math.round(r.cobertura * 100)} % info
                  </span>
                </div>
                <div className="bar">
                  <span style={{ width: `${(r.score / 5) * 100}%` }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                <span className="rank-score">{r.score.toFixed(1)}</span>
                <input type="checkbox" checked={cmp.includes(r.e.id)} onChange={() => toggleCmp(r.e.id)} aria-label={`Comparar ${r.e.nombre}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card section">
        <h3>Radar comparativo</h3>
        <p className="small muted">
          {cmp.length ? 'Tu selección.' : key === 'A' ? 'Fred. Olsen frente a las dos navieras mejor puntuadas.' : 'Los 3 referentes mejor puntuados.'} Cambia la selección
          con las casillas del ranking. Las verticales sin información se dibujan en 0.
        </p>
        <RadarCompare b={b} empresas={comparar} />
      </div>
      {sel && <CompanyDrawer e={sel} b={b} onClose={() => setSel(null)} />}
      <style>{`@media (max-width: 900px){ .grid[style*="1.25fr"]{ grid-template-columns: 1fr !important; } }`}</style>
    </>
  )
}
