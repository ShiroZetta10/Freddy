import { useState } from 'react'
import { CONCLUSIONES, CONSULTA, DATOS_VERIFICADOS, METODOLOGIA, NO_ENCONTRADO, REDES } from '../../data/comunicacion'

type Fila = { seguidores: string; pubs: string; inter: string }

function tasa(f: Fila): string {
  const s = Number(f.seguidores)
  const p = Number(f.pubs)
  const i = Number(f.inter)
  if (!(s > 0) || !(p > 0) || !(i >= 0) || f.inter === '') return '—'
  return `${((i / p / s) * 100).toLocaleString('es-ES', { maximumFractionDigits: 2 })} %`
}

export default function AnalisisRedes() {
  const [filas, setFilas] = useState<Record<string, Fila>>(() =>
    Object.fromEntries(REDES.map((r) => [r.id, { seguidores: '', pubs: '', inter: '' }])),
  )
  const set = (id: string, k: keyof Fila, v: string) => setFilas((p) => ({ ...p, [id]: { ...p[id], [k]: v } }))

  return (
    <>
      <p className="lead">
        Qué redes usa Fred. Olsen Express, para qué público sirve cada una y qué se sabe hoy de su engagement. Fecha de consulta: {CONSULTA}.
      </p>

      <div className="callout navy">
        <span className="co-supuesto">Pendiente de medir</span>{' '}
        Instagram, Facebook, TikTok y LinkedIn bloquean la lectura automática y YouTube no muestra cifras sin sesión. No se ha inventado ninguna
        cifra por red: se deja la tabla de medición manual para que el equipo la complete.
      </div>

      <h3 style={{ marginTop: 20 }}>Las cinco redes</h3>
      <div className="co-redes">
        {REDES.map((r) => (
          <div key={r.id} className="card co-red">
            <div className="co-red-top">
              <b>{r.nombre}</b>
              <span className="co-supuesto">Pendiente de medir</span>
            </div>
            <a href={r.url} target="_blank" rel="noreferrer" className="small co-url">{r.url.replace('https://www.', '')}</a>
            <p className="small" style={{ marginTop: 8 }}><b>Público:</b> {r.publico}.</p>
            <p className="small"><b>Papel en el plan:</b> {r.uso}</p>
            <p className="small muted" style={{ marginBottom: 0 }}>Acceso: {r.acceso}</p>
            {r.verificado && <p className="small co-verif">{r.verificado}</p>}
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 24 }}>Datos verificados</h3>
      <div className="matrix-wrap" style={{ maxHeight: 'none' }}>
        <table className="co-table co-table-min">
          <thead><tr><th>Dato</th><th>Valor</th><th>Fuente y fecha</th></tr></thead>
          <tbody>
            {DATOS_VERIFICADOS.map((d) => (
              <tr key={d.dato}>
                <td>{d.dato}</td>
                <td style={{ fontWeight: 400 }}>{d.valor}</td>
                <td style={{ fontWeight: 400 }}>
                  {d.url ? <a href={d.url} target="_blank" rel="noreferrer">{d.fuente}</a> : d.fuente}
                  <div className="small muted">{d.fecha}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted" style={{ marginTop: 8 }}>{NO_ENCONTRADO}</p>

      <h3 style={{ marginTop: 24 }}>Qué se dice y qué se concluye</h3>
      <div className="grid g3">
        {CONCLUSIONES.map((c) => (
          <div key={c.t} className="card insight"><h3>{c.t}</h3><p className="small" style={{ marginBottom: 0 }}>{c.d}</p></div>
        ))}
      </div>

      <h3 style={{ marginTop: 24 }}>Metodología para completar la medición (periodo de 90 días)</h3>
      <div className="matrix-wrap" style={{ maxHeight: 'none' }}>
        <table className="co-table co-table-min">
          <thead><tr><th>Qué medir</th><th>Dónde mirar</th><th>Cómo</th></tr></thead>
          <tbody>
            {METODOLOGIA.map((m) => (
              <tr key={m.que}><td>{m.que}</td><td style={{ fontWeight: 400 }}>{m.donde}</td><td style={{ fontWeight: 400 }}>{m.como}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: 24 }}>Calculadora de engagement</h3>
      <p className="small muted">
        Tasa media por publicación = interacciones totales del periodo / número de publicaciones / seguidores. Los campos están vacíos a propósito
        y no se guardan: el equipo apunta aquí las cifras medidas y copia el resultado a su hoja.
      </p>
      <div className="matrix-wrap" style={{ maxHeight: 'none' }}>
        <table className="co-table co-table-min">
          <thead><tr><th>Red</th><th>Seguidores</th><th>Publicaciones (90 d)</th><th>Interacciones (90 d)</th><th>Tasa media</th></tr></thead>
          <tbody>
            {REDES.map((r) => (
              <tr key={r.id}>
                <td>{r.nombre}</td>
                {(['seguidores', 'pubs', 'inter'] as const).map((k) => (
                  <td key={k}>
                    <input
                      className="input co-num"
                      inputMode="numeric"
                      aria-label={`${r.nombre}: ${k}`}
                      value={filas[r.id][k]}
                      onChange={(e) => set(r.id, k, e.target.value.replace(/[^0-9]/g, ''))}
                    />
                  </td>
                ))}
                <td style={{ fontWeight: 700 }}>{tasa(filas[r.id])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
