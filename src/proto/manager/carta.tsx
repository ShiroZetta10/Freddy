import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Categoria, Producto, ProtoState, TIPOS_BONO, disponible, estadisticasBonos, eur, setAgotado, setPrecio, setStock } from '../store'
import { ProductoArt } from '../shared'
import { Card, Ico, NumField, Switch, hhmm } from './util'

const CATS: ('Todas' | Categoria)[] = ['Todas', 'Desayunos', 'Bocadillos', 'Sándwiches', 'Bebidas', 'Snacks', 'Tienda']

function Fila({ p, s, onCambio }: { p: Producto; s: ProtoState; onCambio: () => void }) {
  const disp = disponible(s, p)
  const oculto = !p.agotado && disp === 0
  return (
    <motion.div layout className={`mg-fila${p.agotado ? ' off' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mg-prod">
        <ProductoArt nombre={p.nombre} color={p.color} size={38} />
        <div>
          <b>{p.nombre}</b>
          {p.origen && <small className="mg-origen">Origen: {p.origen}</small>}
          <span>
            {p.cat}
            {p.km0 && <span className="fob-pill green mg-km0">Producto canario · KM0</span>}
            {p.tags?.includes('combo') && <span className="fob-pill">Combo</span>}
          </span>
        </div>
      </div>
      <div className="mg-cell" data-l="Precio">
        <NumField label={`Precio de ${p.nombre}`} value={p.precio} step={0.1} decimals={2} suffix="€" max={99} onCommit={(n) => (setPrecio(p.id, n), onCambio())} />
      </div>
      <div className="mg-cell" data-l="Stock">
        <NumField label={`Stock de ${p.nombre}`} value={p.stock} step={5} max={9999} onCommit={(n) => (setStock(p.id, n), onCambio())} />
      </div>
      <div className="mg-cell mg-disp" data-l="A la venta">
        <b>{disp}</b>
        {oculto && <span className="fob-pill amber">Oculto: umbral</span>}
      </div>
      <div className="mg-cell mg-ago" data-l="Agotado">
        <Switch label={`Marcar ${p.nombre} como agotado`} checked={p.agotado} onChange={(v) => (setAgotado(p.id, v), onCambio())} />
        {p.agotado && <span className="fob-pill red">Agotado</span>}
      </div>
    </motion.div>
  )
}

/** Tipos de bono de consumo (solo lectura): contenido, precio de referencia y uso en esta travesía. */
function BonosTipos({ s }: { s: ProtoState }) {
  const bn = estadisticasBonos(s)
  return (
    <Card title="Tipos de bono de consumo" sub="Menús prepagados con el billete o en físico. Solo lectura en el piloto; precios de referencia por validar con Fred. Olsen">
      <ul className="mg-bono-tipos">
        {TIPOS_BONO.map((t) => {
          const x = bn.porTipo.find((p) => p.tipo.id === t.id)!
          return (
            <li key={t.id}>
              <div>
                <b>{t.nombre}</b>
                <span>{t.desc}</span>
              </div>
              <div className="r">
                <b>{eur(t.precio)}</b>
                <span>
                  {x.canjeados} de {x.emitidos} canjeados
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export default function Carta({ s }: { s: ProtoState }) {
  const [cat, setCat] = useState<'Todas' | Categoria>('Todas')
  const [cambios, setCambios] = useState(0)
  const [pub, setPub] = useState<'idle' | 'sending' | 'done'>('idle')
  const [hora, setHora] = useState('')
  const timers = useRef<number[]>([])
  const lista = useMemo(() => s.productos.filter((p) => cat === 'Todas' || p.cat === cat), [s.productos, cat])
  const publicar = () => {
    if (pub !== 'idle') return
    setPub('sending')
    timers.current.push(
      window.setTimeout(() => {
        setPub('done')
        setHora(hhmm(Date.now()))
        setCambios(0)
      }, 1000),
      window.setTimeout(() => setPub('idle'), 5000),
    )
  }
  return (
    <div className="mg-sec">
      <div className="mg-banner">
        <span className="mg-pulse" />
        <p>
          <b>Cambios en directo.</b> Precio, stock y agotado se aplican al instante en la app de los pasajeros y en la tablet de barra.
        </p>
        <button className={`fob-btn primary mg-publicar ${pub}`} onClick={publicar} disabled={pub === 'sending'}>
          <AnimatePresence mode="wait" initial={false}>
            {pub === 'idle' && (
              <motion.span key="i" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                Publicar en el {s.viaje.buque}
              </motion.span>
            )}
            {pub === 'sending' && (
              <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <i className="mg-spin" /> Sincronizando…
              </motion.span>
            )}
            {pub === 'done' && (
              <motion.span key="d" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }} />
                </svg>
                Publicado a las {hora}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      <div className="mg-filtros" role="tablist" aria-label="Categorías">
        {CATS.map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
        <span className="mg-filtros-r">
          {pub === 'done' ? `Confirmado a bordo del ${s.viaje.buque}` : cambios > 0 ? `${cambios} ${cambios === 1 ? 'cambio' : 'cambios'} desde la última publicación` : `${s.productos.length} productos · ${s.productos.filter((p) => p.km0).length} KM0`}
        </span>
      </div>
      <Card className="mg-tabla">
        <div className="mg-fila mg-th" aria-hidden>
          <span>Producto</span>
          <span>Precio</span>
          <span>Stock (travesía)</span>
          <span>A la venta</span>
          <span>Agotado</span>
        </div>
        {lista.map((p) => (
          <Fila key={p.id} p={p} s={s} onCambio={() => setCambios((n) => n + 1)} />
        ))}
      </Card>
      <BonosTipos s={s} />
      <p className="mg-nota">
        <Ico name="ship" size={14} /> «A la venta» descuenta el umbral de seguridad ({s.ajustes.umbralStock} uds.): el producto se oculta a los pasajeros cuando queda ese stock o menos.
      </p>
    </div>
  )
}
