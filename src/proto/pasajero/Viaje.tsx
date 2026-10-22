/** Pestaña Viaje: tarjeta de la travesía, mensajes contextuales por fase, avisos, llegada y valoración. */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion } from 'framer-motion'
import Icon from '../../components/Icon'
import { fase, horaDe, pedidosAbiertos, progreso } from '../store'
import { useToast } from '../shared'
import { BarcoSVG, Olas, PI, Stars, vibrar } from './ui'
import { ss, useP } from './ctx'

function Contador({ valor }: { valor: number }) {
  const [v, setV] = useState(valor)
  const prev = useRef(valor)
  useEffect(() => {
    const c = animate(prev.current, valor, { duration: 0.9, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) })
    prev.current = valor
    return () => c.stop()
  }, [valor])
  return <>{v.toLocaleString('es-ES')}</>
}

function Hoja({ children }: { children?: React.ReactNode }) {
  const { t } = useP()
  return <span className="pj-roadmap">{children ?? t('roadmap')}</span>
}

const ESTADOS_ACTIVOS = ['recibido', 'preparando', 'listo']

export default function Viaje() {
  const { s, t, goTab, mios, billete, plusGanados } = useP()
  const toast = useToast()
  const f = fase(s)
  const p = progreso(s)
  const restante = Math.max(0, Math.round(s.viaje.duracionMin - s.viaje.minuto))
  const hastaZarpar = Math.max(0, Math.round(-s.viaje.minuto))
  const llegada = horaDe(s, s.viaje.duracionMin)
  const abiertos = pedidosAbiertos(s)
  const activos = mios.filter((x) => ESTADOS_ACTIVOS.includes(x.estado))
  const pendientes = s.pendientesOffline.filter((x) => x.ticket === billete.ticket)
  const avisos = [...s.mensajes].slice(-3).reverse()
  const llegada_fase = f === 'llegando' || f === 'llegado'

  // valoración
  const claveRate = `pj-rate-${billete.ticket}`
  const [stars, setStars] = useState(() => Number((() => { try { return JSON.parse(ss.get(claveRate) || '{}').n } catch { return 0 } })() || 0))
  const [coment, setComent] = useState('')
  const [enviada, setEnviada] = useState(() => ss.get(claveRate + '-ok') === '1')
  const [vuelta, setVuelta] = useState(() => ss.get('pj-vuelta-' + billete.ticket) === '1')

  const enviarRate = () => {
    ss.set(claveRate, JSON.stringify({ n: stars, c: coment }))
    ss.set(claveRate + '-ok', '1')
    setEnviada(true)
    vibrar([15, 30, 15])
  }

  const cta = () => goTab('carta')
  const hero =
    f === 'antes'
      ? { t: t('v.antes.t'), b: t('v.antes.b'), cta: t('v.cta.pre'), extra: t('v.leaves', { min: hastaZarpar }) }
      : f === 'embarque'
        ? { t: t('v.emb.t'), b: t('v.emb.b'), cta: t('v.cta.pre'), extra: t('v.leaves', { min: hastaZarpar }) }
        : f === 'navegando'
          ? { t: t('v.nav.t'), b: t('v.nav.b'), cta: t('v.cta.carta'), extra: t('v.left', { min: restante }) }
          : f === 'llegando'
            ? { t: t('v.lleg.t', { min: restante }), b: t('v.lleg.b'), cta: '', extra: '' }
            : { t: t('v.done.t'), b: t('v.done.b'), cta: '', extra: '' }

  return (
    <div className="pj-tab pj-viaje">
      {/* tarjeta del viaje */}
      <section className="pj-trip" aria-label={`${s.viaje.buque}: ${s.viaje.origen} - ${s.viaje.destino}`}>
        <Olas className="pj-trip-waves" />
        <div className="pj-trip-top">
          <span className="pj-trip-ship">{s.viaje.buque}</span>
          <span className={'pj-phase ' + f}>
            <i />
            {t('f.' + f)}
          </span>
        </div>
        <div className="pj-trip-route">
          <div>
            <b>{s.viaje.salida}</b>
            <span>{s.viaje.origen.replace(' de Tenerife', '')}</span>
          </div>
          <div className="r">
            <b>{llegada}</b>
            <span>{s.viaje.destino}</span>
          </div>
        </div>
        <div className="pj-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)} aria-label={t('f.' + f)}>
          <div className="line">
            <motion.div className="fill" initial={false} animate={{ width: `${p * 100}%` }} transition={{ duration: 0.9, ease: 'linear' }} />
          </div>
          <i className="dot a" />
          <i className="dot b" />
          <motion.div className="boat" initial={false} animate={{ left: `${p * 100}%` }} transition={{ duration: 0.9, ease: 'linear' }}>
            <motion.div animate={{ y: [0, -2, 0], rotate: [-2, 2, -2] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>
              <BarcoSVG size={36} />
            </motion.div>
          </motion.div>
        </div>
        <div className="pj-trip-foot">
          <span>
            <Icon name="clock" size={14} /> {t('v.clock')} <b>{horaDe(s, s.viaje.minuto)}</b>
          </span>
          <span>{f === 'llegado' ? t('v.docked') : f === 'antes' || f === 'embarque' ? t('v.leaves', { min: hastaZarpar }) : t('v.left', { min: restante })}</span>
        </div>
      </section>

      {/* mensaje contextual */}
      <AnimatePresence mode="wait">
        <motion.section
          key={f}
          className={'pj-ctx fob-card ' + f}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          aria-live="polite"
        >
          <div className="pj-ctx-ico">
            <PI n={llegada_fase ? 'flag' : f === 'navegando' ? 'cup' : 'bag'} size={22} />
          </div>
          <div className="pj-ctx-body">
            <h2>{hero.t}</h2>
            <p>{hero.b}</p>
            {hero.cta && abiertos && (
              <button className="fob-btn primary" onClick={cta}>
                {hero.cta}
                <PI n="chevR" size={16} sw={2.4} />
              </button>
            )}
            {hero.cta && !abiertos && <p className="pj-note">{t('v.closed', { n: s.ajustes.cierreAntesLlegada })}</p>}
          </div>
        </motion.section>
      </AnimatePresence>

      {/* pedidos en curso */}
      {(activos.length > 0 || pendientes.length > 0) && (
        <section className="pj-block">
          <h3>{t('v.activos')}</h3>
          {pendientes.map((x) => (
            <button key={x.clientKey} className="pj-mini fob-card" onClick={() => goTab('pedidos')}>
              <span className="pj-mini-id">#{x.id}</span>
              <span className="pj-mini-t">{t('o.pending')}</span>
              <span className="fob-pill amber">{t('v.verpedidos')}</span>
            </button>
          ))}
          {activos.map((x) => (
            <button key={x.id} className="pj-mini fob-card" onClick={() => goTab('pedidos')}>
              <span className="pj-mini-id">#{x.id}</span>
              <span className="pj-mini-t">{s.cafeterias[x.cafeteria].nombre}</span>
              <span className={'fob-pill ' + (x.estado === 'listo' ? 'green' : '')}>{t('o.st.' + x.estado)}</span>
            </button>
          ))}
        </section>
      )}

      {/* avisos del manager / sistema */}
      <section className="pj-block">
        <h3>{t('avisos')}</h3>
        <ul className="pj-avisos">
          <AnimatePresence initial={false}>
            {avisos.map((m) => (
              <motion.li key={m.id} layout initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className={m.de === 'manager' ? 'mg' : ''}>
                <PI n={m.de === 'manager' ? 'bell' : 'ship'} size={16} />
                <div>
                  <b>{t('aviso.' + m.de)}</b>
                  <span>{m.texto}</span>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </section>

      {/* llegada y después */}
      {llegada_fase && (
        <>
          <motion.section className="pj-block" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="pj-info fob-card">
              <div className="ico">
                <PI n="flag" size={20} />
              </div>
              <div>
                <b>{t('d.t')}</b>
                <p>{t('d.b')}</p>
              </div>
            </div>
            <div className="pj-info fob-card">
              <div className="ico">
                <PI n="bus" size={20} />
              </div>
              <div>
                <b>{t('bus.t')}</b>
                <p>{t('bus.b')}</p>
              </div>
            </div>
          </motion.section>

          <motion.section className="pj-block" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div className="pj-rate fob-card">
              <div className="pj-rate-h">
                <h3>{t('r.t')}</h3>
                <Hoja />
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {enviada ? (
                  <motion.div key="ok" className="pj-rate-ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="pj-stars static" aria-label={t('r.star', { n: stars })}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={n <= stars ? 'on' : ''}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill={n <= stars ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
                            <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8L12 3.5z" />
                          </svg>
                        </span>
                      ))}
                    </div>
                    <p>{t('r.thanks')}</p>
                  </motion.div>
                ) : (
                  <motion.div key="form" exit={{ opacity: 0 }}>
                    <Stars valor={stars} onChange={setStars} etiqueta={(n) => t('r.star', { n })} />
                    <textarea className="pj-input area" rows={2} value={coment} onChange={(e) => setComent(e.target.value)} placeholder={t('r.ph')} aria-label={t('r.ph')} />
                    <button className="fob-btn navy block" disabled={stars === 0} onClick={enviarRate}>
                      {t('r.send')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pj-plus fob-card">
              <div className="pj-rate-h">
                <h3>{t('p.t')}</h3>
                <Hoja />
              </div>
              <div className="pj-plus-n">
                <b>
                  <Contador valor={billete.plus + plusGanados} />
                </b>
                <span>pts</span>
              </div>
              <p>{t('p.b', { n: plusGanados })}</p>
            </div>

            <div className="pj-back fob-card">
              <div className="pj-rate-h">
                <h3>{t('back.t')}</h3>
                <Hoja />
              </div>
              <p>{t('back.b')}</p>
              <button
                className="fob-btn ghost block"
                disabled={vuelta}
                onClick={() => {
                  setVuelta(true)
                  ss.set('pj-vuelta-' + billete.ticket, '1')
                  vibrar(20)
                  toast({ titulo: t('back.t'), texto: t('back.toast'), icono: 'clock' })
                }}
              >
                <PI n={vuelta ? 'check' : 'ship'} size={18} />
                {t('back.t')}
              </button>
            </div>
          </motion.section>
        </>
      )}
    </div>
  )
}
