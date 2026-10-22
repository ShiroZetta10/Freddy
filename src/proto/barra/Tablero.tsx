import { forwardRef, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { avanzarPedido, CafeteriaId, EstadoPedido, horaDe, Pedido, producto, ProtoState } from '../store'
import { Ico, mmss } from './util'

type Col = { k: 'recibido' | 'preparando' | 'listo'; titulo: string; btn: string; objetivoMin: number | null; vacio: string }
export const COLS: Col[] = [
  { k: 'recibido', titulo: 'Recibido', btn: 'Empezar', objetivoMin: 3, vacio: 'Sin pedidos nuevos' },
  { k: 'preparando', titulo: 'Preparando', btn: 'Listo', objetivoMin: 5, vacio: 'Nada en preparación' },
  { k: 'listo', titulo: 'Listo', btn: 'Entregar', objetivoMin: 3, vacio: 'Nada esperando recogida' },
]

const ordenar = (a: Pedido, b: Pedido) => a.franja - b.franja || (a.t.creado ?? 0) - (b.t.creado ?? 0)

function nivel(p: Pedido, now: number, objetivoMin: number | null): 'ok' | 'amber' | 'red' {
  if (objetivoMin == null) return 'ok'
  const base = p.estado === 'listo' ? p.t.listo ?? p.t.creado ?? now : p.t.creado ?? now
  const min = (now - base) / 60000
  if (min > objetivoMin + 2) return 'red'
  if (min > objetivoMin) return 'amber'
  return 'ok'
}

const Tarjeta = forwardRef<HTMLElement, { s: ProtoState; p: Pedido; col: Col; now: number; fresh: boolean }>(function Tarjeta({ s, p, col, now, fresh }, ref) {
  const base = p.estado === 'listo' ? p.t.listo ?? p.t.creado ?? now : p.t.creado ?? now
  const lvl = nivel(p, now, col.objetivoMin)
  const minFranja = p.franja * s.ajustes.franjaMin
  const urgente = p.estado !== 'listo' && minFranja <= s.viaje.minuto + s.ajustes.franjaMin
  return (
    <motion.article
      ref={ref}
      layout
      layoutId={`br-ped-${p.id}`}
      className={`br-card ${p.bot ? '' : 'real'} ${fresh ? 'fresh' : ''}`}
      initial={fresh ? { opacity: 0, x: -56, scale: 0.97 } : false}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.9 }}
      aria-label={`Pedido ${p.id}, ${p.nombre}, localizador ${p.ticket}`}
    >
      <div className="br-card-top">
        <span className="br-num">#{p.id}</span>
        <div className="br-who">
          <b>{p.nombre}</b>
          <span>Localizador {p.ticket}</span>
        </div>
        <span className={`br-timer ${lvl}`} title={p.estado === 'listo' ? 'Esperando recogida' : 'Desde que se recibió'}>
          <Ico n="clock" size={14} />
          {mmss(now - base)}
        </span>
      </div>
      <ul className="br-lines">
        {p.lineas.map((l) => (
          <li key={l.pid}>
            <b>{l.qty}×</b> {producto(s, l.pid).nombre}
            {producto(s, l.pid).cat === 'Tienda' && <em className="br-shop-tag">Tienda</em>}
          </li>
        ))}
      </ul>
      <div className="br-card-meta">
        <span className={`br-franja ${urgente ? 'urgente' : ''}`}>
          <Ico n="clock" size={13} />
          Recogida {horaDe(s, minFranja)}
        </span>
        {p.prepedido && <span className="fob-pill">Pre-pedido</span>}
        {p.sinPlastico && (
          <span className="br-eco" title="Sin cubiertos ni bolsa">
            <Ico n="leaf" size={13} />
            Sin cubiertos
          </span>
        )}
        {p.tarifaJoven && (
          <span className="br-joven" title="Billete Tarifa Joven (ventaja propuesta)">
            Tarifa Joven{p.descuentoJoven ? ` −${p.descuentoJoven.toFixed(2).replace('.', ',')} €` : ''}
          </span>
        )}
        {!p.bot && (
          <span className="br-real-tag">
            <Ico n="user" size={12} />
            Del móvil
          </span>
        )}
      </div>
      <button className={`fob-btn br-adv ${p.estado === 'listo' ? 'navy' : 'primary'}`} onClick={() => avanzarPedido(p.id)} aria-label={`${col.btn} pedido ${p.id}`}>
        {col.btn}
        <Ico n="arrow" size={18} />
      </button>
    </motion.article>
  )
})

export default function Tablero({ s, caf, pedidos, now, fresh }: { s: ProtoState; caf: CafeteriaId; pedidos: Pedido[]; now: number; fresh: Set<number> }) {
  const [colMovil, setColMovil] = useState<Col['k']>('recibido')
  const [verEntregados, setVerEntregados] = useState(false)
  const porEstado = useMemo(() => {
    const m: Record<string, Pedido[]> = { recibido: [], preparando: [], listo: [] }
    pedidos.forEach((p) => m[p.estado]?.push(p))
    Object.values(m).forEach((l) => l.sort(ordenar))
    return m
  }, [pedidos])
  const entregados = useMemo(
    () =>
      pedidos
        .filter((p) => p.estado === ('entregado' as EstadoPedido))
        .sort((a, b) => (b.t.entregado ?? 0) - (a.t.entregado ?? 0))
        .slice(0, 12),
    [pedidos],
  )

  return (
    <div className="br-tablero" key={caf}>
      <div className="br-colswitch" role="tablist" aria-label="Columna visible">
        {COLS.map((c) => (
          <button key={c.k} role="tab" aria-selected={colMovil === c.k} className={colMovil === c.k ? 'on' : ''} onClick={() => setColMovil(c.k)}>
            {c.titulo}
            <i>{porEstado[c.k].length}</i>
          </button>
        ))}
      </div>
      <div className="br-board">
        {COLS.map((c) => (
          <section key={c.k} className={`br-col k-${c.k} ${colMovil === c.k ? 'act' : ''}`} aria-label={c.titulo}>
            <header className="br-col-h">
              <h2>{c.titulo}</h2>
              <span className="br-count">{porEstado[c.k].length}</span>
              {c.objetivoMin && <small>objetivo {c.objetivoMin} min</small>}
            </header>
            <div className="br-col-list">
              <AnimatePresence initial={false} mode="popLayout">
                {porEstado[c.k].map((p) => (
                  <Tarjeta key={p.id} s={s} p={p} col={c} now={now} fresh={fresh.has(p.id)} />
                ))}
              </AnimatePresence>
              {!porEstado[c.k].length && <div className="br-empty">{c.vacio}</div>}
            </div>
          </section>
        ))}
      </div>
      <section className="br-entregados">
        <button className="br-entregados-h" aria-expanded={verEntregados} onClick={() => setVerEntregados((v) => !v)}>
          <span>
            Entregados recientes <i>{entregados.length}</i>
          </span>
          <motion.span animate={{ rotate: verEntregados ? 180 : 0 }} style={{ display: 'inline-flex' }}>
            <Ico n="chevron" size={18} />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {verEntregados && (
            <motion.div className="br-entregados-list" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
              <div className="br-entregados-in">
                {entregados.length === 0 && <span className="fob-muted">Todavía no se ha entregado ningún pedido.</span>}
                {entregados.map((p) => (
                  <span key={p.id} className="br-done">
                    <b>#{p.id}</b> {p.nombre} · {p.ticket}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}
