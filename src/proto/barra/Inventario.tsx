import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  contarInsumo,
  eur,
  Insumo,
  insumoLimitante,
  movimientoInventario,
  ocupacionFrio,
  porciones,
  Producto,
  ProtoState,
  recibirCatering,
  recibirCompraSemanal,
  setAgotado,
  setStock,
} from '../store'
import { ProductoArt } from '../shared'
import { fmtQty, horaReal, Ico, nivelInsumo, NIVEL_LABEL, TIPO_MOV_LABEL } from './util'
import Teclado, { TecladoCfg } from './Teclado'

type Vista = 'productos' | 'insumos' | 'movimientos'
const spring = { type: 'spring' as const, stiffness: 400, damping: 36 }

// ---------------------------------------------------------------- recepción
function Recepcion({ s }: { s: ProtoState }) {
  const [conf, setConf] = useState<'catering' | 'semanal' | null>(null)
  const [hecho, setHecho] = useState<{ t: string; n: number } | null>(null)
  const timer = useRef<number>()
  const defs = [
    { k: 'catering' as const, titulo: 'Recibir catering diario', ap: 'catering diario' as const, ultima: s.aprovisionamiento.ultimaRecepcionCatering, txt: 'Perecederos: pan, fiambres, lácteos, tortilla y fruta.', fn: recibirCatering, ico: 'snow', ok: 'Catering diario recibido' },
    { k: 'semanal' as const, titulo: 'Recibir compra semanal', ap: 'compra semanal' as const, ultima: s.aprovisionamiento.ultimaCompraSemanal, txt: 'No perecederos: aguas, refrescos, café y snacks.', fn: recibirCompraSemanal, ico: 'box', ok: 'Compra semanal recibida' },
  ]
  const confirmar = (d: (typeof defs)[number]) => {
    const n = s.insumos.filter((i) => i.aprovisionamiento === d.ap && i.inicial - i.stock > 0).length
    d.fn()
    setConf(null)
    setHecho({ t: d.ok, n })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setHecho(null), 2600)
  }
  return (
    <section className="br-recep" aria-label="Recepción de mercancía">
      {defs.map((d) => {
        const pendientes = s.insumos.filter((i) => i.aprovisionamiento === d.ap && i.inicial - i.stock > 0).length
        const abierto = conf === d.k
        return (
          <motion.div key={d.k} layout transition={spring} className={`br-rc ${abierto ? 'abierto' : ''}`}>
            <div className="top">
              <span className="ic">
                <Ico n={d.ico} size={24} />
              </span>
              <div className="tx">
                <b>{d.titulo}</b>
                <small>{d.txt}</small>
                <small className="ult">
                  Última recepción: <strong>{d.ultima}</strong>
                </small>
              </div>
            </div>
            <AnimatePresence initial={false} mode="wait">
              {abierto ? (
                <motion.div key="c" className="conf" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <p>
                    Se repondrán <b>{pendientes}</b> insumo{pendientes === 1 ? '' : 's'} hasta su cantidad de referencia y quedará registrado como entrada.
                  </p>
                  <div>
                    <button className="fob-btn ghost" onClick={() => setConf(null)}>
                      Cancelar
                    </button>
                    <button className="fob-btn primary" onClick={() => confirmar(d)}>
                      Confirmar recepción
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button key="b" className="fob-btn navy br-rbtn" onClick={() => setConf(d.k)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} whileTap={{ scale: 0.98 }}>
                  <Ico n="truck" size={22} />
                  {d.titulo}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
      <AnimatePresence>
        {hecho && (
          <motion.div className="br-recep-ok" role="status" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={spring}>
            <motion.svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <motion.circle cx="12" cy="12" r="9" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45 }} />
              <motion.path d="M8 12.5l2.5 2.5L16 9.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.3 }} />
            </motion.svg>
            <b>{hecho.t}</b>
            <span>{hecho.n} insumo{hecho.n === 1 ? '' : 's'} repuesto{hecho.n === 1 ? '' : 's'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

// ---------------------------------------------------------------- productos
function Producto_({ s, p }: { s: ProtoState; p: Producto }) {
  const [abierto, setAbierto] = useState(false)
  const umbral = s.ajustes.umbralStock
  const lim = insumoLimitante(s, p.id)
  const rec = s.escandallos[p.id] ?? []
  const ref = useMemo(() => {
    const r = porciones({ insumos: s.insumos.map((i) => ({ ...i, stock: i.inicial })), escandallos: s.escandallos }, p.id)
    return Number.isFinite(r) && r > 0 ? r : Math.max(p.stock, 1)
  }, [s.insumos, s.escandallos, p.id, p.stock])
  const bajoUmbral = p.stock <= umbral
  const oculto = p.agotado || bajoUmbral
  const pocas = !oculto && p.stock <= umbral + 5
  const pct = Math.min(100, Math.round((p.stock / ref) * 100))
  const color = oculto ? 'red' : pocas ? 'amber' : 'green'
  const insumo = (iid: string) => s.insumos.find((i) => i.id === iid)
  return (
    <motion.li layout transition={spring} className={`br-pr ${oculto ? 'oculto' : ''}`}>
      <div className="row">
        <ProductoArt nombre={p.nombre} color={p.color} size={52} />
        <div className="info">
          <b>{p.nombre}</b>
          <span className="fob-muted">
            {p.cat} · {eur(p.precio)}
          </span>
        </div>
        <div className="num" aria-label={`${p.stock} porciones`}>
          <motion.b key={p.stock} initial={{ scale: 1.25, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={spring}>
            {p.stock}
          </motion.b>
          <span>porciones</span>
        </div>
      </div>
      <div className="lv" role="meter" aria-valuemin={0} aria-valuemax={ref} aria-valuenow={p.stock} aria-label={`Nivel de ${p.nombre}`}>
        <motion.i className={color} initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} />
      </div>
      <div className="meta">
        {lim && (
          <span className="lim">
            limita: <b>{lim.nombre}</b>
          </span>
        )}
        {oculto && (
          <span className="fob-pill amber br-hide-tag">
            <Ico n="warn" size={13} />
            {p.agotado ? 'Agotado' : 'Stock bajo'} · se oculta a los pasajeros
          </span>
        )}
        {pocas && <span className="fob-pill">Quedan pocas</span>}
      </div>
      <div className="acts">
        <button className="br-link" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)}>
          Escandallo
          <motion.span animate={{ rotate: abierto ? 180 : 0 }} style={{ display: 'inline-flex' }}>
            <Ico n="chevron" size={18} />
          </motion.span>
        </button>
        <label className={`br-sw ${p.agotado ? 'on' : ''}`}>
          <input type="checkbox" role="switch" checked={p.agotado} onChange={(e) => setAgotado(p.id, e.target.checked)} aria-label={`Agotado: ${p.nombre}`} />
          <span className="track" aria-hidden>
            <i />
          </span>
          Agotado
        </label>
      </div>
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div className="esc" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
            <div className="esc-in">
              <h4>Por cada unidad vendida se descuenta</h4>
              <ul>
                {rec.map((l) => {
                  const i = insumo(l.iid)
                  if (!i) return null
                  const n = Math.floor(i.stock / l.qty)
                  return (
                    <li key={l.iid} className={lim?.id === l.iid ? 'cuello' : ''}>
                      <span>{i.nombre}</span>
                      <b>× {fmtQty(l.qty, i.unidad)}</b>
                      <small>
                        en stock {fmtQty(i.stock, i.unidad)} · {n} porc.
                      </small>
                    </li>
                  )
                })}
              </ul>
              <div className="ajuste">
                <div className="qty" role="group" aria-label={`Ajustar porciones de ${p.nombre}`}>
                  <button onClick={() => setStock(p.id, p.stock - 1)} disabled={p.stock <= 0} aria-label="Quitar una porción">
                    <Ico n="minus" size={20} />
                  </button>
                  <output aria-live="polite">{p.stock}</output>
                  <button onClick={() => setStock(p.id, p.stock + 1)} aria-label="Añadir una porción">
                    <Ico n="plus" size={20} />
                  </button>
                </div>
                <small className="fob-muted">
                  Ajustar porciones modifica el insumo limitante{lim ? ` (${lim.nombre})` : ''} y se registra como ajuste. Para mermas o recuentos, usa la vista Insumos.
                </small>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

function Productos({ s }: { s: ProtoState }) {
  const [solo, setSolo] = useState(false)
  const lista = s.productos.filter((p) => !solo || p.agotado || p.stock <= s.ajustes.umbralStock + 5)
  return (
    <>
      <div className="br-subbar">
        <p className="fob-muted">
          Las porciones se calculan con los insumos de cada escandallo: manda el más escaso. Se oculta a los pasajeros con {s.ajustes.umbralStock} o menos, o si lo marcas como agotado.
        </p>
        <button className={`br-fil ${solo ? 'on' : ''}`} aria-pressed={solo} onClick={() => setSolo((v) => !v)}>
          Solo los que se agotan
        </button>
      </div>
      <motion.ul layout className="br-prlist">
        <AnimatePresence initial={false}>
          {lista.map((p) => (
            <Producto_ key={p.id} s={s} p={p} />
          ))}
        </AnimatePresence>
      </motion.ul>
      {lista.length === 0 && <div className="br-empty">Ningún producto cerca de agotarse.</div>}
    </>
  )
}

// ---------------------------------------------------------------- insumos
type Accion = { tipo: 'merma' | 'recuento' | 'entrada'; i: Insumo } | null

function FilaInsumo({ i, onAccion }: { i: Insumo; onAccion: (t: 'merma' | 'recuento' | 'entrada') => void }) {
  const nv = nivelInsumo(i)
  const ref = Math.max(i.inicial, i.minimo * 2, i.stock, 1)
  const pct = Math.min(100, (i.stock / ref) * 100)
  const pmin = Math.min(100, (i.minimo / ref) * 100)
  const color = nv === 'ok' ? 'green' : nv === 'bajo' ? 'amber' : 'red'
  return (
    <motion.li layout transition={spring} className={`br-in n-${nv}`}>
      <div className="head">
        <span className="tipo" title={i.conservacion === 'frio' ? 'Frío' : 'Seco'}>
          <Ico n={i.conservacion === 'frio' ? 'snow' : 'box'} size={18} />
          <span className="br-sr">{i.conservacion === 'frio' ? 'Frío' : 'Seco'}</span>
        </span>
        <b className="nom">{i.nombre}</b>
        <span className={`fob-pill ${nv === 'ok' ? 'green' : nv === 'bajo' ? 'amber' : 'red'}`}>{NIVEL_LABEL[nv]}</span>
      </div>
      <div className="cant">
        <motion.b key={i.stock} initial={{ opacity: 0.4, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {fmtQty(i.stock, i.unidad)}
        </motion.b>
        <small>mínimo {fmtQty(i.minimo, i.unidad)}</small>
      </div>
      <div className="lv" role="meter" aria-valuemin={0} aria-valuemax={Math.round(ref)} aria-valuenow={Math.round(i.stock)} aria-label={`Nivel de ${i.nombre}`}>
        <motion.i className={color} initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} />
        <u style={{ left: `${pmin}%` }} aria-hidden />
      </div>
      <div className="btns">
        <button onClick={() => onAccion('merma')} aria-label={`Merma de ${i.nombre}`}>
          <Ico n="down" size={18} />
          Merma
        </button>
        <button onClick={() => onAccion('recuento')} aria-label={`Recuento de ${i.nombre}`}>
          <Ico n="edit" size={18} />
          Recuento
        </button>
        <button onClick={() => onAccion('entrada')} aria-label={`Entrada de ${i.nombre}`}>
          <Ico n="plus" size={18} />
          Entrada
        </button>
      </div>
    </motion.li>
  )
}

function Insumos({ s }: { s: ProtoState }) {
  const [accion, setAccion] = useState<Accion>(null)
  const frio = ocupacionFrio(s)
  const grupos = [
    { ap: 'catering diario' as const, titulo: 'Catering diario · perecederos' },
    { ap: 'compra semanal' as const, titulo: 'Compra semanal · no perecederos' },
  ]
  const cfg = (a: NonNullable<Accion>): TecladoCfg => {
    const i = s.insumos.find((x) => x.id === a.i.id) ?? a.i
    if (a.tipo === 'merma') return { titulo: 'Registrar merma', insumo: i, accion: 'Registrar merma', motivos: ['Caducado', 'Roto o derramado', 'Devolución'], max: Math.floor(i.stock), ayuda: `cantidad perdida en ${i.unidad}` }
    if (a.tipo === 'recuento') return { titulo: 'Recuento físico', insumo: i, accion: 'Fijar recuento', permiteCero: true, ayuda: `cantidad contada en ${i.unidad}; la diferencia queda como ajuste` }
    return { titulo: 'Entrada manual', insumo: i, accion: 'Registrar entrada', ayuda: `cantidad recibida en ${i.unidad}` }
  }
  const ok = (a: NonNullable<Accion>, v: number, motivo?: string) => {
    if (a.tipo === 'merma') movimientoInventario(a.i.id, -v, 'merma', motivo)
    else if (a.tipo === 'recuento') contarInsumo(a.i.id, v)
    else movimientoInventario(a.i.id, v, 'entrada', 'Entrada manual')
    setAccion(null)
  }
  return (
    <>
      <div className="br-frio">
        <Ico n="snow" size={20} />
        <div>
          <b>
            Cámara de frío: {frio.toLocaleString('es-ES')} de {s.almacen.frioLitros} litros
          </b>
          <span className="fob-muted">El frío es el recurso limitado a bordo: cuanto cabe condiciona el catering diario.</span>
        </div>
        <div className="lv sm" aria-hidden>
          <motion.i className={frio / s.almacen.frioLitros > 0.9 ? 'red' : frio / s.almacen.frioLitros > 0.75 ? 'amber' : 'green'} initial={false} animate={{ width: `${Math.min(100, (frio / s.almacen.frioLitros) * 100)}%` }} />
        </div>
      </div>
      {grupos.map((g) => {
        const lista = s.insumos.filter((i) => i.aprovisionamiento === g.ap)
        const bajos = lista.filter((i) => nivelInsumo(i) !== 'ok').length
        return (
          <section key={g.ap} className="br-grp">
            <h3>
              {g.titulo}
              <span className={`fob-pill ${bajos ? 'amber' : 'green'}`}>{bajos ? `${bajos} bajo${bajos > 1 ? 's' : ''}` : 'Todo correcto'}</span>
            </h3>
            <ul className="br-inlist">
              {lista.map((i) => (
                <FilaInsumo key={i.id} i={i} onAccion={(t) => setAccion({ tipo: t, i })} />
              ))}
            </ul>
          </section>
        )
      })}
      <AnimatePresence>{accion && <Teclado key={accion.tipo + accion.i.id} cfg={cfg(accion)} onClose={() => setAccion(null)} onOk={(v, m) => ok(accion, v, m)} />}</AnimatePresence>
    </>
  )
}

// ---------------------------------------------------------------- movimientos
const FILTROS: { k: 'todos' | 'venta' | 'merma' | 'entrada'; l: string }[] = [
  { k: 'todos', l: 'Todos' },
  { k: 'venta', l: 'Ventas' },
  { k: 'merma', l: 'Mermas' },
  { k: 'entrada', l: 'Entradas' },
]
function Movimientos({ s }: { s: ProtoState }) {
  const [f, setF] = useState<(typeof FILTROS)[number]['k']>('todos')
  const lista = useMemo(() => {
    const l = [...s.movimientos].reverse().filter((m) => f === 'todos' || m.tipo === f || (f === 'venta' && m.tipo === 'cancelacion'))
    return l.slice(0, 40)
  }, [s.movimientos, f])
  const nom = (iid: string) => s.insumos.find((i) => i.id === iid)
  return (
    <>
      <div className="br-subbar">
        <p className="fob-muted">Cada venta, cancelación, recepción, merma o ajuste queda registrado. Lo más reciente, arriba.</p>
        <div className="br-chipsrow" role="group" aria-label="Filtrar movimientos">
          {FILTROS.map((x) => (
            <button key={x.k} className={`br-fil ${f === x.k ? 'on' : ''}`} aria-pressed={f === x.k} onClick={() => setF(x.k)}>
              {x.l}
            </button>
          ))}
        </div>
      </div>
      <ul className="br-mov">
        <AnimatePresence initial={false}>
          {lista.map((m) => {
            const i = nom(m.iid)
            return (
              <motion.li key={m.id} layout="position" initial={{ opacity: 0, x: -24, backgroundColor: '#fff6cc' }} animate={{ opacity: 1, x: 0, backgroundColor: '#ffffff' }} exit={{ opacity: 0 }} transition={{ ...spring, backgroundColor: { duration: 1.6 } }}>
                <time>{horaReal(m.t)}</time>
                <span className={`tp t-${m.tipo}`}>{TIPO_MOV_LABEL[m.tipo]}</span>
                <span className="ins">{i?.nombre ?? m.iid}</span>
                <b className={m.delta < 0 ? 'neg' : 'pos'}>
                  {m.delta > 0 ? '+' : '−'}
                  {fmtQty(Math.abs(m.delta), i?.unidad ?? 'ud')}
                </b>
                <small className="ref">{m.ref ?? ''}</small>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
      {lista.length === 0 && <div className="br-empty">Aún no hay movimientos de este tipo.</div>}
    </>
  )
}

// ---------------------------------------------------------------- pestaña
export default function Inventario({ s }: { s: ProtoState }) {
  const [vista, setVista] = useState<Vista>('productos')
  const ocultos = s.productos.filter((p) => p.agotado || p.stock <= s.ajustes.umbralStock).length
  const bajos = s.insumos.filter((i) => nivelInsumo(i) === 'critico').length
  const V: { k: Vista; l: string; n?: number }[] = [
    { k: 'productos', l: 'Productos', n: ocultos },
    { k: 'insumos', l: 'Insumos', n: bajos },
    { k: 'movimientos', l: 'Movimientos' },
  ]
  return (
    <div className="br-pane br-inv">
      <div className="br-pane-h">
        <div>
          <h2>Inventario de la travesía</h2>
          <p className="fob-muted">Catering fresco a diario y compra semanal de no perecederos. Al vender, el sistema descuenta los insumos del escandallo.</p>
        </div>
        <span className={`fob-pill ${ocultos ? 'amber' : 'green'}`}>{ocultos ? `${ocultos} oculto${ocultos > 1 ? 's' : ''} a pasajeros` : 'Todo a la venta'}</span>
      </div>
      <Recepcion s={s} />
      <div className="br-seg" role="tablist" aria-label="Vista de inventario">
        {V.map((v) => (
          <button key={v.k} role="tab" aria-selected={vista === v.k} className={vista === v.k ? 'on' : ''} onClick={() => setVista(v.k)}>
            {vista === v.k && <motion.span layoutId="br-seg-bg" className="bg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="t">
              {v.l}
              {!!v.n && <i>{v.n}</i>}
            </span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={vista} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="br-invbody">
          {vista === 'productos' && <Productos s={s} />}
          {vista === 'insumos' && <Insumos s={s} />}
          {vista === 'movimientos' && <Movimientos s={s} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
