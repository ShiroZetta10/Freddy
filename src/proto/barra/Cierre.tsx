import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CafeteriaId, entregarPorQR, eur, horaDe, pedidosAbiertos, ProtoState } from '../store'
import { duracionLarga, ESTADO_LABEL, fmtQty, Ico, nivelInsumo } from './util'

export default function Cierre({ s, caf }: { s: ProtoState; caf: CafeteriaId }) {
  const cerrado = !pedidosAbiertos(s)
  const d = useMemo(() => {
    const todos = s.pedidos.filter((p) => p.cafeteria === caf && p.estado !== 'cancelado')
    const sinRecoger = todos.filter((p) => p.estado !== 'entregado')
    const entregados = todos.filter((p) => p.estado === 'entregado')
    const medidos = entregados.filter((p) => p.t.listo && p.t.entregado)
    const media = medidos.length ? medidos.reduce((a, p) => a + (p.t.entregado! - p.t.listo!), 0) / medidos.length / 1000 : 0
    return {
      sinRecoger,
      pedidos: todos.length,
      entregados: entregados.length,
      cancelados: s.pedidos.filter((p) => p.cafeteria === caf && p.estado === 'cancelado').length,
      importe: Math.round(todos.reduce((a, p) => a + p.total, 0) * 100) / 100,
      media,
      pre: todos.filter((p) => p.prepedido).length,
    }
  }, [s.pedidos, caf])
  const cierraA = horaDe(s, s.viaje.duracionMin - s.ajustes.cierreAntesLlegada)

  return (
    <div className="br-pane br-cierre">
      <motion.div layout className={`br-cbanner ${cerrado ? 'cerrado' : ''}`} role="status">
        <Ico n={cerrado ? 'warn' : 'clock'} size={26} />
        <div>
          {cerrado ? (
            <>
              <b>Pedidos cerrados: {d.sinRecoger.length} sin recoger</b>
              <span>Ya no se aceptan pedidos nuevos en {s.cafeterias[caf].nombre}.</span>
            </>
          ) : (
            <>
              <b>Los pedidos se cierran a las {cierraA}</b>
              <span>
                {s.ajustes.cierreAntesLlegada} min antes de llegar. Ahora hay {d.sinRecoger.length} pedido{d.sinRecoger.length === 1 ? '' : 's'} sin recoger.
              </span>
            </>
          )}
        </div>
      </motion.div>

      <div className="br-cgrid">
        <section className="br-resumen">
          <h2>Resumen de la travesía · {s.cafeterias[caf].nombre}</h2>
          <dl>
            <div>
              <dt>Pedidos</dt>
              <dd>{d.pedidos}</dd>
            </div>
            <div>
              <dt>Importe</dt>
              <dd>{eur(d.importe)}</dd>
            </div>
            <div>
              <dt>Tiempo medio listo → entregado</dt>
              <dd>{duracionLarga(d.media)}</dd>
            </div>
            <div>
              <dt>Entregados</dt>
              <dd>
                {d.entregados}
                <small> de {d.pedidos}</small>
              </dd>
            </div>
            <div>
              <dt>Pre-pedidos</dt>
              <dd>{d.pre}</dd>
            </div>
            <div>
              <dt>Cancelados</dt>
              <dd>{d.cancelados}</dd>
            </div>
          </dl>
          <div className={`br-tpv ${cerrado ? 'ok' : ''}`}>
            <Ico n={cerrado ? 'check' : 'clock'} size={22} />
            <div>
              <b>{cerrado ? 'Conciliación con TPV: correcta' : 'Conciliación con TPV: disponible al cierre'}</b>
              <span>{cerrado ? `${d.pedidos} pedidos · ${eur(d.importe)} cobrados en app = ${eur(d.importe)} en TPV` : 'Se calcula cuando se cierran los pedidos.'}</span>
            </div>
          </div>
        </section>

        <section className="br-sinrec">
          <h2>Sin recoger ({d.sinRecoger.length})</h2>
          {d.sinRecoger.length === 0 && <div className="br-empty">No queda ningún pedido pendiente.</div>}
          <ul>
            <AnimatePresence initial={false}>
              {d.sinRecoger.map((p) => (
                <motion.li key={p.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }} className={p.bot ? '' : 'real'}>
                  <b className="n">#{p.id}</b>
                  <span className="w">
                    {p.nombre} · {p.asiento}
                    <small>{eur(p.total)}</small>
                  </span>
                  <span className={`fob-pill ${p.estado === 'listo' ? 'green' : ''}`}>{ESTADO_LABEL[p.estado]}</span>
                  <button className="fob-btn ghost" onClick={() => entregarPorQR(String(p.id))}>
                    Dar por entregado
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      </div>

      <InventarioCierre s={s} />
    </div>
  )
}

function InventarioCierre({ s }: { s: ProtoState }) {
  const d = useMemo(() => {
    const cons: Record<string, number> = {}
    const mermas: Record<string, { total: number; motivos: Record<string, number> }> = {}
    for (const m of s.movimientos) {
      if (m.tipo === 'venta' || m.tipo === 'cancelacion') cons[m.iid] = (cons[m.iid] ?? 0) - m.delta
      if (m.tipo === 'merma') {
        const x = (mermas[m.iid] ??= { total: 0, motivos: {} })
        x.total -= m.delta
        const mo = m.ref ?? 'Sin motivo'
        x.motivos[mo] = (x.motivos[mo] ?? 0) - m.delta
      }
    }
    const nom = (iid: string) => s.insumos.find((i) => i.id === iid)
    const consumo = Object.entries(cons)
      .filter(([, q]) => q > 0)
      .map(([iid, q]) => ({ i: nom(iid)!, q }))
      .filter((x) => x.i)
      .sort((a, b) => b.q / Math.max(b.i.inicial, 1) - a.q / Math.max(a.i.inicial, 1))
    const merma = Object.entries(mermas)
      .map(([iid, x]) => ({ i: nom(iid)!, ...x }))
      .filter((x) => x.i && x.total > 0)
    const pedir = s.insumos
      .filter((i) => nivelInsumo(i) !== 'ok')
      .map((i) => {
        const env = i.envase ?? 1
        return { i, cant: Math.ceil(Math.max(i.inicial - i.stock, env) / env) * env }
      })
    return { consumo, merma, pedir, truncado: s.movimientos.length >= 400 }
  }, [s.movimientos, s.insumos])
  const maxC = Math.max(1, ...d.consumo.map((x) => x.q / Math.max(x.i.inicial, 1)))
  return (
    <section className="br-invc" aria-label="Inventario de la travesía">
      <h2>Inventario de la travesía</h2>
      <p className="fob-muted">Datos de todo el buque (el inventario es compartido entre cafeterías){d.truncado ? '; solo los últimos 400 movimientos' : ''}.</p>
      <div className="br-invc-grid">
        <div className="bloque">
          <h3>Consumo por insumo</h3>
          {d.consumo.length === 0 && <div className="br-empty">Todavía no se ha consumido nada.</div>}
          <ul className="cons">
            {d.consumo.slice(0, 12).map((x) => (
              <li key={x.i.id}>
                <span>{x.i.nombre}</span>
                <b>{fmtQty(x.q, x.i.unidad)}</b>
                <div className="lv sm" aria-hidden>
                  <motion.i className="navy" initial={{ width: 0 }} animate={{ width: `${(x.q / Math.max(x.i.inicial, 1) / maxC) * 100}%` }} transition={{ duration: 0.5 }} />
                </div>
              </li>
            ))}
          </ul>
          {d.consumo.length > 12 && <small className="fob-muted">y {d.consumo.length - 12} insumos más</small>}
        </div>
        <div className="bloque">
          <h3>Mermas registradas</h3>
          {d.merma.length === 0 && <div className="br-empty">Sin mermas registradas.</div>}
          <ul className="cons">
            {d.merma.map((x) => (
              <li key={x.i.id} className="merma">
                <span>
                  {x.i.nombre}
                  <small>{Object.entries(x.motivos).map(([m, q]) => `${m}: ${fmtQty(q, x.i.unidad)}`).join(' · ')}</small>
                </span>
                <b>{fmtQty(x.total, x.i.unidad)}</b>
              </li>
            ))}
          </ul>
        </div>
        <div className="bloque">
          <h3>Para pedir en la próxima recepción</h3>
          {d.pedir.length === 0 && <div className="br-empty">Ningún insumo bajo mínimo.</div>}
          <ul className="cons">
            {d.pedir.map(({ i, cant }) => (
              <li key={i.id} className="pedir">
                <span>
                  {i.nombre}
                  <small>
                    quedan {fmtQty(i.stock, i.unidad)} · mínimo {fmtQty(i.minimo, i.unidad)} · {i.aprovisionamiento}
                  </small>
                </span>
                <b>{fmtQty(cant, i.unidad)}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
