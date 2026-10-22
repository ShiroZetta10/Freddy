import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CafeteriaId, entregarPorQR, eur, horaDe, pedidosAbiertos, ProtoState } from '../store'
import { duracionLarga, ESTADO_LABEL, Ico } from './util'

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
    </div>
  )
}
