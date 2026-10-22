import { motion } from 'framer-motion'
import { disponible, eur, ProtoState, setAgotado, setStock, Producto } from '../store'
import { ProductoArt } from '../shared'
import { Ico } from './util'

function Fila({ s, p }: { s: ProtoState; p: Producto }) {
  const umbral = s.ajustes.umbralStock
  const oculto = p.agotado || p.stock <= umbral
  const bajo = !oculto && p.stock <= umbral + 5
  return (
    <motion.li layout className={`br-stk ${oculto ? 'oculto' : ''}`} transition={{ type: 'spring', stiffness: 400, damping: 36 }}>
      <ProductoArt nombre={p.nombre} color={p.color} size={48} />
      <div className="info">
        <b>{p.nombre}</b>
        <span className="fob-muted">
          {p.cat} · {eur(p.precio)} · a la venta: <b>{disponible(s, p)}</b>
        </span>
        {oculto ? (
          <span className="fob-pill amber br-hide-tag">
            <Ico n="warn" size={13} />
            {p.agotado ? 'Agotado' : 'Stock bajo'} · se oculta a los pasajeros
          </span>
        ) : (
          bajo && <span className="fob-pill">Quedan pocas unidades</span>
        )}
      </div>
      <div className="ctl">
        <div className="qty" role="group" aria-label={`Stock de ${p.nombre}`}>
          <button onClick={() => setStock(p.id, p.stock - 1)} aria-label={`Quitar una unidad de ${p.nombre}`} disabled={p.stock <= 0}>
            <Ico n="minus" size={20} />
          </button>
          <output aria-live="polite">{p.stock}</output>
          <button onClick={() => setStock(p.id, p.stock + 1)} aria-label={`Añadir una unidad de ${p.nombre}`}>
            <Ico n="plus" size={20} />
          </button>
          <button className="mas" onClick={() => setStock(p.id, p.stock + 10)} aria-label={`Añadir diez unidades de ${p.nombre}`}>
            +10
          </button>
        </div>
        <label className={`br-sw ${p.agotado ? 'on' : ''}`}>
          <input type="checkbox" role="switch" checked={p.agotado} onChange={(e) => setAgotado(p.id, e.target.checked)} />
          <span className="track" aria-hidden>
            <i />
          </span>
          Agotado
        </label>
      </div>
    </motion.li>
  )
}

export default function Stock({ s }: { s: ProtoState }) {
  const ocultos = s.productos.filter((p) => p.agotado || p.stock <= s.ajustes.umbralStock).length
  return (
    <div className="br-pane">
      <div className="br-pane-h">
        <div>
          <h2>Stock de la travesía</h2>
          <p className="fob-muted">
            Se oculta a los pasajeros cuando quedan {s.ajustes.umbralStock} o menos, o si lo marcas como agotado. El stock es compartido entre cafeterías.
          </p>
        </div>
        <span className={`fob-pill ${ocultos ? 'amber' : 'green'}`}>{ocultos ? `${ocultos} oculto${ocultos > 1 ? 's' : ''} a pasajeros` : 'Todo a la venta'}</span>
      </div>
      <ul className="br-stklist">
        {s.productos.map((p) => (
          <Fila key={p.id} s={s} p={p} />
        ))}
      </ul>
    </div>
  )
}
