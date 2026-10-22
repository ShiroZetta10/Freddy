/** Hoja inferior: carrito → franja de recogida → pago simulado → confirmación (o pedido guardado offline / error). */
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CafeteriaId, LineaPedido, MotivoError, Pedido, ResultadoPedido, cotizar, crearPedido, eur, franjas, getState, horaDe, pedidosAbiertos, producto, soloBebidas, uid } from '../store'
import { ProductoArt } from '../shared'
import { CheckDraw, PI, vibrar } from './ui'
import { SelectorCafeteria } from './Carta'
import { BonoAplicadoPanel, BonoCanje } from './Bonos'
import { useP } from './ctx'

type Paso = 'carrito' | 'pago' | 'proceso' | 'ok' | 'offline' | 'error'
type Metodo = Exclude<Pedido['pago'], 'bono' | 'incluido'>
type Err = { motivo: MotivoError; detalle?: string; franjaNueva?: string | null }
type Intento = { clientKey: string; billete: ReturnType<typeof useP>['billete']; lineas: LineaPedido[]; cafeteria: CafeteriaId; franja: number; pago: Metodo; sinPlastico: boolean; bono?: string; mesa?: boolean; mesaRef?: string }

const slide = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 },
  transition: { duration: 0.22 },
}

export default function Checkout({ onClose }: { onClose: () => void }) {
  const { s, t, billete, cart, caf, setCaf, esOro, add, dec, removeLinea, clearCart, franjaSel, setFranjaSel, goTab, bono, bonos, usarBono } = useP()
  const [paso, setPaso] = useState<Paso>('carrito')
  const [metodo, setMetodo] = useState<Metodo>('apple')
  const [err, setErr] = useState<Err | null>(null)
  const [res, setRes] = useState<Extract<ResultadoPedido, { ok: true }> | null>(null)
  const [dup, setDup] = useState(false)
  const [spManual, setSpManual] = useState<boolean | null>(null) // null = por defecto (activado si solo hay bebidas)
  const [mesaSel, setMesaSel] = useState(true) // Clase Oro: servicio en mesa por defecto
  const [mesaRef, setMesaRef] = useState('')
  const [reintentando, setReintentando] = useState(false)
  const [sigueOffline, setSigueOffline] = useState(false)
  const key = useRef(uid())
  const intento = useRef<Intento | null>(null)
  const timer = useRef<number>()
  useEffect(() => () => window.clearTimeout(timer.current), [])

  // una clientKey nueva por cada intento distinto (cambia el contenido del pedido); los reintentos la reutilizan
  const firma = JSON.stringify({ cart, caf, franjaSel, bono: bono?.codigo })
  useEffect(() => {
    if (paso === 'carrito') key.current = uid()
  }, [firma, paso])

  const frs = useMemo(() => franjas(s, caf, 6), [s, caf])
  const libres = frs.filter((f) => !f.llena)
  const sel = frs.find((f) => f.idx === franjaSel && !f.llena) ?? libres[0] ?? null
  // el bono se aplica primero; la ventaja joven solo recae en unidades que el bono no cubre (sin doble descuento)
  const cot = cotizar(s, billete, cart, bono, caf)
  const { subtotal, total, valorBono, dtoJoven: dto, oro } = cot
  const oroMesa = esOro && caf === 'oro'
  const mesaOn = oroMesa && mesaSel
  const cubOro = new Map(oro.cubiertas.map((c) => [c.pid, c.qty]))
  const bonoActivo = cot.plan?.completo ? bono : null
  const cubiertas = new Map(cot.cubiertas.map((c) => [c.pid, c.qty]))
  const gratis = total === 0 && (!!bonoActivo || oro.uds > 0)
  const sinPlastico = spManual ?? soloBebidas(s, cart)
  const abiertos = pedidosAbiertos(s)
  const pausa = s.ajustes.pausa[caf]
  const prepedido = s.viaje.minuto < 0
  const alternativas = (['proa', 'popa', 'oro'] as CafeteriaId[]).filter((c) => c !== caf && !s.ajustes.pausa[c] && (c !== 'oro' || esOro))

  const hayCafe = cart.some((l) => l.pid === 'cortado' || l.pid === 'solo')
  const hayBolleria = cart.some((l) => l.pid === 'croissant' || l.pid === 'oferta-bolleria')
  const combo = s.productos.find((p) => p.id === 'oferta-bolleria')
  const upsell = hayCafe && !hayBolleria && combo && combo.stock - s.ajustes.umbralStock > 0 && !combo.agotado && abiertos

  // si el carrito se vacía (p. ej. producto agotado desde la barra) mientras se elige el pago, volvemos al carrito
  useEffect(() => {
    if (paso === 'pago' && cart.length === 0) setPaso('carrito')
  }, [paso, cart.length])

  const resolver = (r: ResultadoPedido, enReintento = false) => {
    if (r.ok) {
      vibrar([30, 40, 60])
      setRes(r)
      clearCart()
      if (r.duplicado && !r.offline) {
        setDup(true)
        setPaso('ok')
      } else if (r.offline) {
        setSigueOffline(enReintento)
        setPaso('offline')
      } else {
        setDup(false)
        setPaso('ok')
      }
      return
    }
    vibrar([60, 40, 60])
    const e: Err = { motivo: r.motivo, detalle: r.detalle }
    if (r.motivo === 'franja-llena') {
      const intentada = intento.current?.franja ?? 0
      const lista = franjas(getState(), intento.current?.cafeteria ?? caf, 8).filter((f) => !f.llena)
      const sig = lista.find((f) => f.idx > intentada) ?? lista[0]
      e.franjaNueva = sig ? sig.desde : null
      setFranjaSel(sig ? sig.idx : null)
    }
    setErr(e)
    setPaso('error')
  }

  const pagar = () => {
    if (!sel || cart.length === 0) return
    intento.current = { clientKey: key.current, billete, lineas: cart.map((l) => ({ ...l })), cafeteria: caf, franja: sel.idx, pago: metodo, sinPlastico, bono: bonoActivo?.codigo, mesa: mesaOn, mesaRef: mesaOn ? mesaRef : undefined }
    setPaso('proceso')
    vibrar(15)
    timer.current = window.setTimeout(() => resolver(crearPedido(intento.current!)), 1400)
  }

  const reintentar = () => {
    if (!intento.current || reintentando) return
    setReintentando(true)
    setSigueOffline(false)
    timer.current = window.setTimeout(() => {
      setReintentando(false)
      // MISMO clientKey: si el pedido ya existe, el store lo devuelve sin duplicarlo
      resolver(crearPedido(intento.current!), true)
    }, 900)
  }

  const volverACarrito = () => {
    setErr(null)
    setPaso('carrito')
  }

  const pedido = res?.pedido
  const sincronizado = !!pedido && s.pedidos.some((p) => p.clientKey === pedido.clientKey)
  const cafPedido = pedido ? s.cafeterias[pedido.cafeteria] : null
  const horaPedido = pedido ? horaDe(s, pedido.franja * s.ajustes.franjaMin) : ''

  const cabecera = (titulo: string, atras?: () => void) => (
    <div className="pj-sh-head">
      {atras ? (
        <button className="pj-icon-btn" onClick={atras} aria-label={t('back')}>
          <span style={{ display: 'inline-flex', transform: 'scaleX(-1)' }}>
            <PI n="chevR" size={20} />
          </span>
        </button>
      ) : (
        <span style={{ width: 44 }} />
      )}
      <h2>{titulo}</h2>
      <button className="pj-icon-btn" onClick={onClose} aria-label={t('close')}>
        <PI n="close" size={20} />
      </button>
    </div>
  )

  let contenido: ReactNode

  if (paso === 'carrito') {
    contenido = (
      <motion.div key="carrito" className="pj-sh-col" {...slide}>
        {cabecera(t('k.title'))}
        <div className="pj-sh-body">
          {cart.length === 0 ? (
            <div className="pj-empty">
              <PI n="bag" size={34} />
              <b>{t('k.empty')}</b>
              <span>{t('k.empty.b')}</span>
            </div>
          ) : (
            <>
              <ul className="pj-lines">
                <AnimatePresence initial={false}>
                  {cart.map((l) => {
                    const p = producto(s, l.pid)
                    return (
                      <motion.li key={l.pid} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <ProductoArt nombre={p.nombre} color={p.color} size={42} />
                        <div className="tx">
                          <b>{p.nombre}</b>
                          <span>{eur(p.precio)}</span>
                        </div>
                        <div className="pj-qty" role="group" aria-label={p.nombre}>
                          <button aria-label={t('k.less', { n: p.nombre })} onClick={() => dec(l.pid)}>
                            <PI n="minus" size={16} sw={2.6} />
                          </button>
                          <motion.b key={l.qty} initial={{ scale: 1.35 }} animate={{ scale: 1 }}>
                            {l.qty}
                          </motion.b>
                          <button aria-label={t('k.more', { n: p.nombre })} disabled={p.stock - s.ajustes.umbralStock <= l.qty || p.agotado} onClick={() => add(l.pid)}>
                            <PI n="plus" size={16} sw={2.6} />
                          </button>
                        </div>
                        <span className="sub">
                          {eur(p.precio * (l.qty - (cubiertas.get(l.pid) ?? 0) - (cubOro.get(l.pid) ?? 0)))}
                          {(cubOro.get(l.pid) ?? 0) > 0 && <em className="pj-bono-line">{t('or.incl')} ×{cubOro.get(l.pid)}</em>}
                          {(cubiertas.get(l.pid) ?? 0) > 0 && <em className="pj-bono-line">{t('b.covered')} ×{cubiertas.get(l.pid)}</em>}
                        </span>
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>

              {upsell && combo && (
                <div className="pj-upsell small">
                  <ProductoArt nombre={combo.nombre} color={combo.color} size={36} />
                  <div className="tx">
                    <b>{t('u.t')}</b>
                    <span>
                      {t('u.b')} · {eur(combo.precio)}
                    </span>
                  </div>
                  <button className="fob-btn navy" onClick={(e) => add(combo.id, e.currentTarget)}>
                    {t('u.add')}
                  </button>
                </div>
              )}

              <h3 className="pj-h3">{t('b.title')}</h3>
              {bono ? (
                <BonoAplicadoPanel cart={cart} />
              ) : (
                <>
                  {bonos.length > 0 && (
                    <div className="pj-bono-pick">
                      {bonos.map((b) => (
                        <button key={b.codigo} type="button" className="fob-btn ghost" onClick={() => usarBono(b.codigo)}>
                          <PI n="voucher" size={17} /> {b.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                  {bonos.length === 0 && <p className="pj-note">{t('b.none')}</p>}
                  <BonoCanje />
                </>
              )}

              <h3 className="pj-h3">{t('k.from')}</h3>
              <SelectorCafeteria compacto />
              {pausa && (
                <div className="pj-banner warn" role="alert">
                  <PI n="alert" size={18} />
                  <div>
                    {t('e.pausa', { n: s.cafeterias[caf].nombre })}
                    <div className="pj-alt">
                      {alternativas.map((c) => (
                        <button key={c} className="fob-btn ghost" onClick={() => setCaf(c)}>
                          {t('k.otherCaf', { n: s.cafeterias[c].nombre })}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {!abiertos && (
                <div className="pj-banner bad" role="alert">
                  <PI n="clock" size={18} /> {t('e.cerrado', { n: s.ajustes.cierreAntesLlegada })}
                </div>
              )}

              {oroMesa && (
                <div className="pj-mesa">
                  <button role="switch" aria-checked={mesaSel} className={'pj-eco-sw' + (mesaSel ? ' on' : '')} onClick={() => setMesaSel(!mesaSel)}>
                    <span className="ic" aria-hidden>
                      <PI n="star" size={20} />
                    </span>
                    <span className="tx">
                      <b>{t('or.mesa.t')}</b>
                      <small>{t('or.mesa.b')}</small>
                    </span>
                    <i aria-hidden>
                      <motion.b layout transition={{ type: 'spring', stiffness: 500, damping: 32 }} />
                    </i>
                  </button>
                  {mesaSel && <input className="pj-input" value={mesaRef} maxLength={24} onChange={(e) => setMesaRef(e.target.value)} placeholder={t('or.mesa.ph')} aria-label={t('or.mesa.ph')} />}
                </div>
              )}

              <h3 className="pj-h3">{t('k.franja')}</h3>
              {frs.length === 0 || !sel ? (
                <p className="pj-note">{t('k.nofree')}</p>
              ) : (
                <div className="pj-slots" role="radiogroup" aria-label={t('k.franja')}>
                  {frs.map((f) => {
                    const on = sel.idx === f.idx
                    const primera = libres[0]?.idx === f.idx
                    const ratio = Math.min(1, f.ocupados / f.tope)
                    return (
                      <button key={f.idx} role="radio" aria-checked={on} disabled={f.llena} className={'pj-slot' + (on ? ' on' : '') + (f.llena ? ' full' : '')} onClick={() => setFranjaSel(f.idx)} aria-label={`${f.desde} a ${f.hasta}, ${t('k.slots', { a: f.ocupados, b: f.tope })}${f.llena ? ', ' + t('k.full') : ''}`}>
                        <span className="h">
                          {f.desde}
                          <small> – {f.hasta}</small>
                        </span>
                        <span className="bar">
                          <motion.i initial={false} animate={{ width: `${ratio * 100}%` }} className={ratio >= 1 ? 'full' : ratio >= 0.7 ? 'warn' : ''} />
                        </span>
                        <span className="c">
                          {f.llena ? t('k.full') : t('k.slots', { a: f.ocupados, b: f.tope })}
                          {primera && !f.llena && <em>{t('k.free')}</em>}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
              {prepedido && <p className="pj-note">{t('k.pre')}</p>}

              <div className="pj-eco">
                <button role="switch" aria-checked={sinPlastico} className={'pj-eco-sw' + (sinPlastico ? ' on' : '')} onClick={() => setSpManual(!sinPlastico)}>
                  <span className="ic" aria-hidden>
                    <PI n="leaf" size={20} />
                  </span>
                  <span className="tx">
                    <b>{t('g.nocut')}</b>
                    <small>{t('g.nocut.b')}</small>
                  </span>
                  <i aria-hidden>
                    <motion.b layout transition={{ type: 'spring', stiffness: 500, damping: 32 }} />
                  </i>
                </button>
                <p className="pj-eco-note">
                  <PI n="receipt" size={14} /> {t('g.ticket')} · {t('g.title')}
                </p>
              </div>
            </>
          )}
        </div>
        {cart.length > 0 && (
          <div className="pj-sh-foot">
            {(dto > 0 || valorBono > 0 || oro.valor > 0) && (
              <div className="pj-total-sub">
                <span>{t('k.subtotal')}</span>
                <span>{eur(subtotal)}</span>
              </div>
            )}
            {oro.valor > 0 && (
              <div className="pj-total-sub dto">
                <span>{t('or.line')}</span>
                <span>−{eur(oro.valor)}</span>
              </div>
            )}
            {valorBono > 0 && bonoActivo && (
              <div className="pj-total-sub dto">
                <span>
                  {t('b.line')} · {bonoActivo.nombre}
                </span>
                <span>−{eur(valorBono)}</span>
              </div>
            )}
            {dto > 0 && (
              <div className="pj-total-sub dto">
                <span>
                  {t('j.line')} <em>{t('j.proposal')}</em>
                </span>
                <span>−{eur(dto)}</span>
              </div>
            )}
            <div className="pj-total">
              <span>{t('k.total')}</span>
              <motion.b key={total} initial={{ scale: 1.12 }} animate={{ scale: 1 }}>
                {eur(total)}
              </motion.b>
            </div>
            {/* con el pedido cubierto por el bono no hay nada que cobrar: se salta el paso de pago */}
            <button className="fob-btn primary block" disabled={!sel || !abiertos || pausa} onClick={() => (gratis ? pagar() : setPaso('pago'))}>
              {gratis ? (bonoActivo ? t('b.cta.free') : t('or.cta.free')) : t('k.pay')}
              <PI n={gratis ? 'check' : 'chevR'} size={16} sw={2.4} />
            </button>
          </div>
        )}
      </motion.div>
    )
  } else if (paso === 'pago') {
    const metodos: { id: Metodo; l: string; sub?: string }[] = [
      { id: 'apple', l: t('y.apple') },
      { id: 'google', l: t('y.google') },
      { id: 'tarjeta', l: t('y.card'), sub: t('y.cardsub') },
    ]
    contenido = (
      <motion.div key="pago" className="pj-sh-col" {...slide}>
        {cabecera(t('y.title'), () => setPaso('carrito'))}
        <div className="pj-sh-body">
          <div className="pj-paytotal">
            <span>{t('k.total')}</span>
            <b>{eur(total)}</b>
            <small>
              {s.cafeterias[caf].nombre} · {sel?.desde}
            </small>
            {oro.valor > 0 && (
              <small className="pj-paydto">
                {t('or.line')}: −{eur(oro.valor)}
              </small>
            )}
            {valorBono > 0 && bonoActivo && (
              <small className="pj-paydto">
                {t('b.line')} · {bonoActivo.nombre}: −{eur(valorBono)}
              </small>
            )}
            {dto > 0 && (
              <small className="pj-paydto">
                {t('j.line')}: −{eur(dto)}
              </small>
            )}
          </div>
          <div className="pj-methods" role="radiogroup" aria-label={t('y.title')}>
            {metodos.map((m) => (
              <button key={m.id} role="radio" aria-checked={metodo === m.id} className={'pj-method ' + m.id + (metodo === m.id ? ' on' : '')} onClick={() => setMetodo(m.id)}>
                <span className="logo">{m.id === 'tarjeta' ? <PI n="card" size={20} /> : m.l}</span>
                <span className="lbl">
                  {m.id === 'tarjeta' ? m.l : ''}
                  {m.sub && <small>{m.sub}</small>}
                </span>
                <span className="radio" aria-hidden />
              </button>
            ))}
          </div>
          <p className="pj-note center">
            <PI n="lock" size={14} /> {t('y.sub')}
          </p>
        </div>
        <div className="pj-sh-foot">
          <button className="fob-btn primary block" onClick={pagar}>
            {t('y.pay', { n: eur(total) })}
          </button>
        </div>
      </motion.div>
    )
  } else if (paso === 'proceso') {
    contenido = (
      <motion.div key="proceso" className="pj-sh-col center" {...slide} aria-live="polite">
        <div className="pj-spinner" aria-hidden>
          <svg viewBox="0 0 50 50" width="64" height="64">
            <circle cx="25" cy="25" r="21" fill="none" stroke="var(--fob-line)" strokeWidth="4" />
            <motion.circle cx="25" cy="25" r="21" fill="none" stroke="var(--fob-navy)" strokeWidth="4" strokeLinecap="round" strokeDasharray="40 100" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }} style={{ originX: '25px', originY: '25px' }} />
          </svg>
        </div>
        <b className="pj-big-t">{gratis ? (bonoActivo ? t('b.checking') : t('or.line')) : t('y.auth')}</b>
        <span className="pj-muted">{gratis ? bonoActivo?.codigo ?? '' : eur(total)}</span>
      </motion.div>
    )
  } else if (paso === 'ok' && pedido && cafPedido) {
    contenido = (
      <motion.div key="ok" className="pj-sh-col center" {...slide}>
        <CheckDraw />
        <motion.h2 className="pj-big-t" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          {t('y.ok', { id: pedido.id })}
        </motion.h2>
        <motion.p className="pj-ok-b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>
          {t('y.okb', { caf: cafPedido.nombre, h: horaPedido })}
        </motion.p>
        {dup && (
          <motion.div className="pj-banner ok" role="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <PI n="check" size={18} /> {t('y.dup')}
          </motion.div>
        )}
        {pedido.servicio === 'mesa' && (
          <motion.div className="pj-banner ok" role="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.92 }}>
            <PI n="star" size={18} />
            <div>
              {t('or.ready.mesa')}
              {pedido.mesaRef && (
                <>
                  <br />
                  <small>{pedido.mesaRef}</small>
                </>
              )}
            </div>
          </motion.div>
        )}
        {pedido.menuOro && (
          <motion.div className="pj-banner ok" role="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.93 }}>
            <PI n="check" size={18} sw={2.6} /> {t('or.tag')} ×{pedido.menuOro.uds}
          </motion.div>
        )}
        {pedido.bono && (
          <motion.div className="pj-banner ok" role="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 }}>
            <PI n="voucher" size={18} />
            <div>
              {pedido.total === 0 ? t('b.paid') : t('b.rest', { n: eur(pedido.total) })} · {pedido.bono.nombre}
              <br />
              <small>{pedido.bono.codigo}</small>
            </div>
          </motion.div>
        )}
        <div className="pj-sum">
          <span>{cafPedido.cubierta}</span>
          <span>{eur(pedido.total)}</span>
        </div>
        <p className="pj-ok-eco">
          <PI n="leaf" size={14} /> {t('g.ticket')}
          {pedido.sinPlastico ? ` · ${t('g.nocut')}` : ''}
        </p>
        <div className="pj-actions">
          <button
            className="fob-btn primary block"
            onClick={() => {
              onClose()
              goTab('pedidos')
            }}
          >
            {t('y.view')}
          </button>
          <button className="fob-btn ghost block" onClick={onClose}>
            {t('y.more')}
          </button>
        </div>
      </motion.div>
    )
  } else if (paso === 'offline' && pedido && cafPedido) {
    contenido = (
      <motion.div key="offline" className="pj-sh-col center" {...slide}>
        <div className="pj-off-ico">
          <PI n="wifioff" size={34} />
        </div>
        <h2 className="pj-big-t">{t('y.off.t')} · #{pedido.id}</h2>
        <p className="pj-ok-b">{sincronizado ? t('o.sent', { id: pedido.id }) : t('y.off.b')}</p>
        {sigueOffline && !sincronizado && (
          <div className="pj-banner warn" role="status">
            <PI n="wifioff" size={18} /> {t('y.stilloff')}
          </div>
        )}
        <div className="pj-sum">
          <span>
            {cafPedido.nombre} · {horaPedido}
          </span>
          <span>{eur(pedido.total)}</span>
        </div>
        <div className="pj-actions">
          <button className="fob-btn primary block" onClick={reintentar} disabled={reintentando}>
            {reintentando ? t('y.retrying') : t('y.retry')}
          </button>
          <button
            className="fob-btn ghost block"
            onClick={() => {
              onClose()
              goTab('pedidos')
            }}
          >
            {t('y.view')}
          </button>
        </div>
      </motion.div>
    )
  } else if (paso === 'error' && err) {
    const prod = err.detalle ? s.productos.find((p) => p.nombre === err.detalle) : undefined
    const esBono = err.motivo.startsWith('bono-')
    const titulo = esBono ? t('e.bono.t') : err.motivo === 'solo-oro' ? t('e.oro.t') : t(err.motivo === 'franja-llena' ? 'e.franja.t' : err.motivo === 'sin-stock' ? 'e.stock.t' : err.motivo === 'pausa' ? 'e.pausa.t' : 'e.cerrado.t')
    const msg = esBono
      ? err.motivo === 'bono-incompleto'
        ? t('e.bono-incompleto', { n: err.detalle ?? '' })
        : t('b.err.' + err.motivo.slice(5).replace('invalido', 'formato'))
      : err.motivo === 'solo-oro'
        ? t('e.oro', { n: err.detalle ?? '' })
        : err.motivo === 'franja-llena'
        ? err.franjaNueva
          ? t('e.franja', { h: err.franjaNueva })
          : t('e.franjaNone')
        : err.motivo === 'sin-stock'
          ? t('e.stock', { n: err.detalle ?? '' })
          : err.motivo === 'pausa'
            ? t('e.pausa', { n: s.cafeterias[caf].nombre })
            : t('e.cerrado', { n: s.ajustes.cierreAntesLlegada })
    contenido = (
      <motion.div key="error" className="pj-sh-col center" {...slide} role="alert">
        <div className="pj-err-ico">
          <PI n="alert" size={32} />
        </div>
        <h2 className="pj-big-t">{titulo}</h2>
        <p className="pj-ok-b">{msg}</p>
        <div className="pj-actions">
          {err.motivo === 'pausa' &&
            alternativas.map((c) => (
              <button
                key={c}
                className="fob-btn primary block"
                onClick={() => {
                  setCaf(c)
                  volverACarrito()
                }}
              >
                {t('k.otherCaf', { n: s.cafeterias[c].nombre })}
              </button>
            ))}
          {err.motivo === 'sin-stock' && prod && (
            <button
              className="fob-btn primary block"
              onClick={() => {
                removeLinea(prod.id)
                volverACarrito()
              }}
            >
              {t('e.remove', { n: prod.nombre })}
            </button>
          )}
          {esBono && err.motivo !== 'bono-incompleto' && (
            <button
              className="fob-btn primary block"
              onClick={() => {
                usarBono(null)
                volverACarrito()
              }}
            >
              {t('e.bono.drop')}
            </button>
          )}
          {err.motivo === 'cerrado' ? (
            <button className="fob-btn ghost block" onClick={onClose}>
              {t('close')}
            </button>
          ) : (
            <button className={'fob-btn block ' + (err.motivo === 'franja-llena' || err.motivo === 'bono-incompleto' ? 'primary' : 'ghost')} onClick={volverACarrito}>
              {t('e.fix')}
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="pj-sh-root">
      <AnimatePresence mode="wait" initial={false}>
        {contenido}
      </AnimatePresence>
    </div>
  )
}
