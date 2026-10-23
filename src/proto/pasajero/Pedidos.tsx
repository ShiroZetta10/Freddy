/** Pestaña Pedidos: seguimiento en vivo con stepper, tarjeta QR cuando está listo y cancelación con confirmación. */
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { EstadoPedido, Pedido, cancelarPedido, crearPedido, eur, horaDe, producto, qrDe } from '../store'
import { useToast } from '../shared'
import { PI, Sheet, vibrar } from './ui'
import { BonoCanje, BonoCard } from './Bonos'
import { useP } from './ctx'

const PASOS: EstadoPedido[] = ['recibido', 'preparando', 'listo', 'entregado']

function Stepper({ estado }: { estado: EstadoPedido }) {
  const { t } = useP()
  const idx = PASOS.indexOf(estado)
  return (
    <ol className="pj-stepper" aria-label={t('o.st.' + estado)}>
      <div className="rail" aria-hidden>
        <motion.i initial={false} animate={{ width: `${(Math.max(idx, 0) / (PASOS.length - 1)) * 100}%` }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} />
      </div>
      {PASOS.map((e, i) => {
        const hecho = i < idx || (i === idx && e === 'entregado')
        const actual = i === idx && e !== 'entregado'
        return (
          <li key={e} className={(hecho ? 'done ' : '') + (actual ? 'now' : '')} aria-current={actual ? 'step' : undefined}>
            <motion.span className="dot" initial={false} animate={{ scale: actual ? [1, 1.18, 1] : 1 }} transition={actual ? { repeat: Infinity, duration: 1.8 } : { duration: 0.2 }}>
              {hecho ? <PI n="check" size={14} sw={3} /> : <b>{i + 1}</b>}
            </motion.span>
            <span className="lbl">{t('o.st.' + e)}</span>
          </li>
        )
      })}
    </ol>
  )
}

function resumen(p: Pedido, s: Parameters<typeof producto>[0]) {
  return p.lineas.map((l) => `${l.qty}× ${producto(s, l.pid).nombre}`).join(' · ')
}

export default function Pedidos() {
  const { s, t, mios, billete, goTab, bonos, bono, usarBono } = useP()
  const toast = useToast()
  const [cancelId, setCancelId] = useState<number | null>(null)
  const [msgs, setMsgs] = useState<Record<string, string>>({})
  const [reint, setReint] = useState<string | null>(null)
  const pendientes = s.pendientesOffline.filter((p) => p.ticket === billete.ticket)

  const orden = useMemo(() => {
    const act = (p: Pedido) => (p.estado === 'listo' ? 0 : p.estado === 'preparando' ? 1 : p.estado === 'recibido' ? 2 : 3)
    return [...mios].sort((a, b) => act(a) - act(b) || b.id - a.id)
  }, [mios])

  const aCancelar = orden.find((p) => p.id === cancelId)

  const confirmarCancelar = () => {
    if (!aCancelar) return
    const ok = cancelarPedido(aCancelar.id)
    setCancelId(null)
    vibrar(ok ? 20 : [40, 40, 40])
    if (!ok) toast({ titulo: t('o.cancel'), texto: t('bot.cancel.late', { id: aCancelar.id, st: t('o.st.' + aCancelar.estado) }), icono: 'bell' })
  }

  const reintentar = (p: Pedido) => {
    setReint(p.clientKey)
    window.setTimeout(() => {
      // mismo clientKey: el store reconoce el pedido y no lo duplica
      const r = crearPedido({ clientKey: p.clientKey, billete, lineas: p.lineas, cafeteria: p.cafeteria, franja: p.franja, pago: p.pago === 'bono' || p.pago === 'incluido' ? 'apple' : p.pago, sinPlastico: p.sinPlastico, bono: p.bono?.codigo, mesa: p.servicio === 'mesa', mesaRef: p.mesaRef })
      setReint(null)
      if (r.ok) setMsgs((m) => ({ ...m, [p.clientKey]: r.offline ? t('y.stilloff') : t('y.dup') }))
      else setMsgs((m) => ({ ...m, [p.clientKey]: t('e.' + (r.motivo === 'franja-llena' ? 'franja.t' : r.motivo === 'sin-stock' ? 'stock.t' : r.motivo === 'pausa' ? 'pausa.t' : 'cerrado.t')) }))
    }, 800)
  }

  const vacio = orden.length === 0 && pendientes.length === 0

  return (
    <div className="pj-tab pj-pedidos">
      <div className="pj-sec-h">
        <h2>{t('o.title')}</h2>
      </div>

      {/* bonos de consumo: los de tu billete, los físicos que canjees por código y el campo para introducirlos */}
      <section className="pj-bonos" aria-label={t('o.bonos')}>
        <h3 className="pj-h3">{t('o.bonos')}</h3>
        <AnimatePresence initial={false}>
          {bonos.map((b) => (
            <BonoCard key={b.codigo} b={b} destacado={bono?.codigo === b.codigo}>
              {bono?.codigo === b.codigo ? (
                <button className="fob-btn ghost" onClick={() => usarBono(null)}>
                  {t('b.remove')}
                </button>
              ) : (
                <button
                  className="fob-btn navy"
                  onClick={() => {
                    usarBono(b.codigo)
                    goTab('carta')
                  }}
                >
                  {t('b.use')}
                </button>
              )}
            </BonoCard>
          ))}
        </AnimatePresence>
        <BonoCanje onOk={() => vibrar(10)} />
      </section>

      {vacio && (
        <div className="pj-empty big">
          <PI n="receipt" size={40} />
          <b>{t('o.empty')}</b>
          <span>{t('o.empty.b')}</span>
          <button className="fob-btn primary" onClick={() => goTab('carta')}>
            {t('o.go')}
          </button>
        </div>
      )}

      <motion.ul className="pj-orders" layout>
        <AnimatePresence initial={false}>
          {pendientes.map((p) => (
            <motion.li key={p.clientKey} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="pj-order pending fob-card">
              <div className="pj-order-h">
                <b className="id">#{p.id}</b>
                <span className="fob-pill amber">
                  <PI n="wifioff" size={12} /> {t('o.pending')}
                </span>
              </div>
              <p className="pj-order-l">{resumen(p, s)}</p>
              <p className="pj-order-m">{t('o.pending.b')}</p>
              {msgs[p.clientKey] && (
                <p className="pj-banner warn" role="status">
                  <PI n="wifioff" size={16} /> {msgs[p.clientKey]}
                </p>
              )}
              <button className="fob-btn ghost" disabled={reint === p.clientKey} onClick={() => reintentar(p)}>
                {reint === p.clientKey ? t('y.retrying') : t('y.retry')}
              </button>
            </motion.li>
          ))}

          {orden.map((p) => {
            const caf = s.cafeterias[p.cafeteria]
            const listo = p.estado === 'listo'
            return (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                className={'pj-order fob-card ' + p.estado}
              >
                {listo ? (
                  <div className="pj-ready">
                    <div className="pj-ready-h">
                      <motion.span className="ring" animate={{ scale: [1, 1.5], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }} aria-hidden />
                      <PI n="bell" size={18} />
                      <b>{t('o.ready.t')}</b>
                    </div>
                    <div className="pj-ready-id" aria-label={`#${p.id}`}>
                      <small>#</small>
                      {p.id}
                    </div>
                    <div className="pj-qr" role="img" aria-label={t('o.qr', { id: p.id })}>
                      <QRCodeSVG value={qrDe(p)} size={188} level="M" marginSize={0} fgColor="#0b3478" />
                    </div>
                    <p className="pj-ready-caf">
                      {t('o.ready.b', { caf: caf.nombre, cub: caf.cubierta })}
                    </p>
                    {p.servicio === 'mesa' && <p className="pj-ready-caf">{t('or.ready.mesa')}</p>}
                  </div>
                ) : (
                  <div className="pj-order-h">
                    <b className="id">#{p.id}</b>
                    <span className="pj-order-caf">{caf.nombre}</span>
                    {p.estado === 'cancelado' ? <span className="fob-pill red">{t('o.st.cancelado')}</span> : p.prepedido ? <span className="fob-pill">{t('o.prepedido')}</span> : null}
                  </div>
                )}

                {p.estado !== 'cancelado' && <Stepper estado={p.estado} />}

                <p className="pj-order-l">{resumen(p, s)}</p>
                {(p.sinPlastico || p.tarifaJoven || p.bono || p.menuOro || p.servicio || p.ventajas?.length) && (
                  <p className="pj-order-tags">
                    {p.bono && (
                      <span className="fob-pill pj-pill-bono">
                        <PI n="voucher" size={12} /> {t('b.tag', { c: p.bono.codigo })}
                        {p.total === 0 ? ` · ${t('b.paid')}` : ''}
                      </span>
                    )}
                    {p.ventajas?.length ? (
                      <span className="fob-pill pj-pill-va">
                        {t('va.order.tag')} −{eur(p.ventajas.reduce((a, v) => a + v.descuento, 0))}
                      </span>
                    ) : null}
                    {p.menuOro && <span className="fob-pill pj-pill-oro">{t('or.tag')} ×{p.menuOro.uds}</span>}
                    {p.servicio === 'mesa' && <span className="fob-pill pj-pill-oro">{t('or.mesa.tag')}{p.mesaRef ? ` · ${p.mesaRef}` : ''}</span>}
                    {p.sinPlastico && <span className="fob-pill green">{t('g.nocut')}</span>}
                    {p.tarifaJoven && <span className="fob-pill">{t('j.tag')}{p.descuentoJoven ? ` −${eur(p.descuentoJoven)}` : ''}</span>}
                  </p>
                )}
                <div className="pj-order-m row">
                  <span>
                    <PI n="clock" size={14} /> {t('o.pickup', { h: horaDe(s, p.franja * s.ajustes.franjaMin) })}
                  </span>
                  <b>{eur(p.total)}</b>
                </div>

                {p.estado === 'entregado' && (
                  <p className="pj-done">
                    <PI n="check" size={16} sw={2.6} /> {t('o.done')}
                  </p>
                )}
                {p.estado === 'recibido' && (
                  <button className="fob-btn ghost pj-cancel" onClick={() => setCancelId(p.id)}>
                    {t('o.cancel')}
                  </button>
                )}
              </motion.li>
            )
          })}
        </AnimatePresence>
      </motion.ul>

      <Sheet open={!!aCancelar} onClose={() => setCancelId(null)} label={t('o.cancel')}>
        <div className="pj-confirm">
          <div className="pj-err-ico">
            <PI n="alert" size={28} />
          </div>
          <h2>{t('o.cancel.q', { id: aCancelar?.id ?? cancelId ?? '' })}</h2>
          <p>{t('o.cancel.b')}</p>
          {aCancelar?.bono && (
            <p className="pj-banner ok" role="note">
              <PI n="voucher" size={16} /> {t('b.cancel.note', { c: aCancelar.bono.codigo })}
            </p>
          )}
          <div className="pj-actions">
            <button className="fob-btn navy block" onClick={() => setCancelId(null)}>
              {t('o.keep')}
            </button>
            <button className="fob-btn ghost block pj-danger" onClick={confirmarCancelar}>
              {t('o.cancel.yes')}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
