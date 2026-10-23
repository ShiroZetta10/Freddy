import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CafeteriaId, horaDe, producto, ProtoState } from '../store'

const sumar = (m: Map<string, number>, pid: string, q: number) => m.set(pid, (m.get(pid) ?? 0) + q)

export default function Prevision({ s, caf }: { s: ProtoState; caf: CafeteriaId }) {
  const f = s.ajustes.franjaMin
  const tope = s.ajustes.topePorFranja
  const datos = useMemo(() => {
    const idxNow = Math.max(1, Math.floor(s.viaje.minuto / f))
    const idxMax = Math.floor((s.viaje.duracionMin - s.ajustes.cierreAntesLlegada) / f)
    const activos = s.pedidos.filter((p) => p.cafeteria === caf && p.estado !== 'cancelado')
    const filas = [] as { idx: number; total: number; pre: number; conV: number; prod: Map<string, number> }[]
    for (let idx = idxNow; idx <= idxMax && filas.length < 10; idx++) {
      const ps = activos.filter((p) => p.franja === idx)
      const prod = new Map<string, number>()
      ps.filter((p) => p.estado === 'recibido' || p.estado === 'preparando').forEach((p) => p.lineas.forEach((l) => sumar(prod, l.pid, l.qty)))
      filas.push({ idx, total: ps.length, pre: ps.filter((p) => p.prepedido).length, conV: ps.filter((p) => p.ventajas?.length).length, prod })
    }
    const ya = new Map<string, number>()
    const luego = new Map<string, number>()
    activos
      .filter((p) => p.estado === 'recibido' || p.estado === 'preparando')
      .forEach((p) => p.lineas.forEach((l) => sumar(p.franja <= idxNow + 1 ? ya : luego, l.pid, l.qty)))
    // pre-pedidos con ventaja por pedir con antelación aún por preparar: lo que conviene tener listo antes de zarpar (y por franja)
    const conVentaja = activos.filter((p) => p.ventajas?.length && (p.estado === 'recibido' || p.estado === 'preparando'))
    const prodV = new Map<string, number>()
    conVentaja.forEach((p) => p.lineas.forEach((l) => sumar(prodV, l.pid, l.qty)))
    return { filas, ya, luego, idxNow, conVentaja: conVentaja.length, prodV, desdeV: conVentaja.map((p) => p.franja).sort((a, b) => a - b)[0] }
  }, [s.pedidos, s.viaje, s.ajustes, caf, f])

  const lista = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])
  const txt = (m: Map<string, number>, n = 3) =>
    lista(m)
      .slice(0, n)
      .map(([pid, q]) => `${q} ${producto(s, pid).nombre.toLowerCase()}`)
      .join(' · ')

  const ya = lista(datos.ya)
  const luego = lista(datos.luego)
  return (
    <div className="br-pane br-prev">
      <section className="br-prep">
        <h2>Prepara ya</h2>
        <p className="fob-muted">Pedidos pendientes con recogida hasta las {horaDe(s, (datos.idxNow + 2) * f)}</p>
        {ya.length === 0 ? (
          <div className="br-empty">Nada urgente por preparar.</div>
        ) : (
          <div className="br-chips">
            {ya.map(([pid, q]) => (
              <motion.span key={pid} layout className="br-chip">
                <b>{q}</b> {producto(s, pid).nombre}
              </motion.span>
            ))}
          </div>
        )}
        {datos.conVentaja > 0 && (
          <div className="br-va-prev">
            <h3>
              Con ventaja pre-pedido <span className="br-va">{datos.conVentaja}</span>
            </h3>
            <p className="fob-muted">
              {datos.conVentaja === 1 ? 'Pre-pedido' : 'Pre-pedidos'} hechos con antelación: ya sabes qué preparar{datos.desdeV ? `, desde las ${horaDe(s, datos.desdeV * f)}` : ''}.
            </p>
            <div className="br-chips soft">
              {lista(datos.prodV).map(([pid, q]) => (
                <span key={pid} className="br-chip">
                  <b>{q}</b> {producto(s, pid).nombre}
                </span>
              ))}
            </div>
          </div>
        )}
        {luego.length > 0 && (
          <>
            <h3>Después</h3>
            <div className="br-chips soft">
              {luego.map(([pid, q]) => (
                <span key={pid} className="br-chip">
                  <b>{q}</b> {producto(s, pid).nombre}
                </span>
              ))}
            </div>
          </>
        )}
      </section>
      <section className="br-franjas">
        <div className="br-pane-h">
          <h2>Ocupación por franja</h2>
          <span className="br-leg">
            <i className="a" /> Pre-pedidos <i className="b" /> Durante el viaje · tope {tope}
          </span>
        </div>
        {datos.filas.length === 0 && <div className="br-empty">No quedan franjas abiertas.</div>}
        <ul>
          {datos.filas.map((r) => {
            const pct = Math.min(1, r.total / tope)
            const lleno = r.total >= tope
            const cerca = !lleno && r.total >= tope * 0.75
            return (
              <li key={r.idx} className={lleno ? 'lleno' : cerca ? 'cerca' : ''}>
                <b className="h">{horaDe(s, r.idx * f)}</b>
                <div className="bar" role="img" aria-label={`${r.total} de ${tope} pedidos`}>
                  <motion.i className="pre" animate={{ width: `${Math.min(r.pre, tope) / tope * 100}%` }} />
                  <motion.i className="dur" animate={{ width: `${Math.max(0, pct - Math.min(r.pre, tope) / tope) * 100}%` }} />
                </div>
                <span className="n">
                  {r.total}/{tope}
                  {lleno && <em>Llena</em>}
                  {r.conV > 0 && <em className="va">Ventaja ×{r.conV}</em>}
                </span>
                <span className="p">{r.prod.size ? txt(r.prod) : r.total ? 'Todo preparado' : '—'}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
