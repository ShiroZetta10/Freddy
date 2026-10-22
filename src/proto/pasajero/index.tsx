/**
 * Vista PASAJERO de FredOnBoard: app móvil (PWA-like) sin cuenta.
 * Centrada a ~480 px en escritorio y a pantalla completa en móvil. Navegación interna con estado.
 */
import './pasajero.css'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ProtoChrome, useToast } from '../shared'
import { EstadoPedido, eur, login, useProtoState } from '../store'
import Welcome from './Welcome'
import Viaje from './Viaje'
import Carta from './Carta'
import Pedidos from './Pedidos'
import Ayuda from './Ayuda'
import Checkout from './Checkout'
import { PJProvider, TABS, Tab, ls, ss, useP } from './ctx'
import { LANGS } from './i18n'
import { PI, Sheet, Skeleton, vibrar } from './ui'

const EMBED = typeof window !== 'undefined' && window.location.hash.includes('embed=1')

function Frame({ big, contrast, children }: { big: boolean; contrast: boolean; children: ReactNode }) {
  return (
    <div className={'fob fob-root pj-root' + (big ? ' pj-big' : '') + (contrast ? ' pj-contrast' : '') + (EMBED ? ' pj-embed' : '')}>
      <ProtoChrome titulo="Pasajero" />
      <div className="pj-stage">
        <div className="pj-phone" id="pj-phone">
          {children}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- avisos push al cambiar el estado de un pedido
function Tracker() {
  const { s, mios, t, billete } = useP()
  const toast = useToast()
  const prev = useRef<Map<number, EstadoPedido> | null>(null)
  const pend = useRef<Set<string>>(new Set())
  const ultimoMsg = useRef<number>(Math.max(0, ...s.mensajes.map((m) => m.id)))

  useEffect(() => {
    const cur = new Map(mios.map((p) => [p.id, p.estado] as const))
    if (prev.current) {
      for (const p of mios) {
        const antes = prev.current.get(p.id)
        const caf = s.cafeterias[p.cafeteria].nombre
        if (antes === undefined) {
          if (pend.current.has(p.clientKey)) toast({ titulo: t('o.sent', { id: p.id }), texto: caf, icono: 'wifi' })
        } else if (antes !== p.estado) {
          if (p.estado === 'preparando') toast({ titulo: t('o.toast.prep', { id: p.id }), texto: t('o.toast.prep.b'), icono: 'food' })
          else if (p.estado === 'listo') {
            toast({ titulo: t('o.toast.ready', { id: p.id }), texto: t('o.toast.ready.b', { caf }), icono: 'qr' })
            vibrar([200, 100, 200, 100, 300])
          } else if (p.estado === 'entregado') toast({ titulo: t('o.toast.done', { id: p.id }), texto: t('o.toast.done.b'), icono: 'check' })
        }
      }
    }
    prev.current = cur
    pend.current = new Set(s.pendientesOffline.filter((x) => x.ticket === billete.ticket).map((x) => x.clientKey))
  }, [mios, s.pendientesOffline, s.cafeterias, billete.ticket, t, toast])

  useEffect(() => {
    const nuevos = s.mensajes.filter((m) => m.id > ultimoMsg.current && m.de === 'manager')
    if (s.mensajes.length) ultimoMsg.current = Math.max(ultimoMsg.current, ...s.mensajes.map((m) => m.id))
    nuevos.forEach((m) => toast({ titulo: t('o.toast.msg'), texto: m.texto, icono: 'megaphone' }))
  }, [s.mensajes, t, toast])

  return null
}

// ---------------------------------------------------------------- fly to cart
function Flyers() {
  const { flyers, endFlyer } = useP()
  return (
    <div className="pj-flyers" aria-hidden>
      {flyers.map((f) => {
        const el = document.getElementById('pj-cart-btn')
        const r = el?.getBoundingClientRect()
        const x1 = r ? r.left + r.width / 2 : f.x
        const y1 = r ? r.top + r.height / 2 : f.y - 200
        return (
          <motion.i
            key={f.id}
            className="pj-fly"
            style={{ background: f.color }}
            initial={{ x: f.x - 9, y: f.y - 9, scale: 1, opacity: 1 }}
            animate={{ x: [f.x - 9, (f.x + x1) / 2 - 9, x1 - 9], y: [f.y - 9, Math.min(f.y, y1) - 60, y1 - 9], scale: [1, 1.1, 0.35], opacity: [1, 1, 0.5] }}
            transition={{ duration: 0.62, ease: 'easeInOut', times: [0, 0.45, 1] }}
            onAnimationComplete={() => endFlyer(f.id)}
          />
        )
      })}
    </div>
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (b: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} className={'pj-switch' + (on ? ' on' : '')} onClick={() => onChange(!on)}>
      <span>{label}</span>
      <i>
        <motion.b layout transition={{ type: 'spring', stiffness: 500, damping: 32 }} />
      </i>
    </button>
  )
}

const TAB_ICON: Record<Tab, string> = { viaje: 'compass', carta: 'cup', pedidos: 'receipt', ayuda: 'chat' }
const VISTAS: Record<Tab, () => JSX.Element> = { viaje: Viaje, carta: Carta, pedidos: Pedidos, ayuda: Ayuda }

function Sesion() {
  const P = useP()
  const { s, t, billete, tab, dir, goTab, loadingTab, cart, cartCount, cartTotal, bump, sheet, openSheet, lang, setLang, big, setBig, contrast, setContrast, logout, mios } = P
  const online = s.ajustes.online
  const cerrarSheet = useCallback(() => openSheet(null), [openSheet])
  const enCurso = mios.filter((p) => ['recibido', 'preparando', 'listo'].includes(p.estado)).length + s.pendientesOffline.filter((p) => p.ticket === billete.ticket).length
  const listos = mios.filter((p) => p.estado === 'listo').length
  const Vista = VISTAS[tab]
  void cart

  return (
    <Frame big={big} contrast={contrast}>
      <Tracker />
      <Flyers />
      <motion.div className="pj-app" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <header className="pj-appbar">
          <div className="who">
            <span className="av" aria-hidden>
              {billete.nombre[0]}
            </span>
            <div>
              <b>{t('hi', { n: billete.nombre })}</b>
              <span>
                {t('seat', { a: billete.asiento })} · {billete.ticket}
              </span>
            </div>
          </div>
          <div className="acts">
            <motion.button id="pj-cart-btn" className="pj-icon-btn" aria-label={`${t('cart')}: ${cartCount}`} onClick={() => openSheet('cart')} key={bump} animate={bump ? { scale: [1, 1.22, 0.95, 1] } : {}} transition={{ duration: 0.45 }}>
              <PI n="bag" size={22} />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span key="b" className="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <motion.span key={cartCount} initial={{ scale: 1.6 }} animate={{ scale: 1 }} style={{ display: 'inline-block' }}>
                      {cartCount}
                    </motion.span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <button className="pj-icon-btn" aria-label={t('settings')} onClick={() => openSheet('ajustes')}>
              <PI n="gear" size={21} />
            </button>
          </div>
        </header>
        <div className="pj-club-strip">
          <span>
            <PI n="anchor" size={12} sw={2.2} />
            <b>FredOnBoard</b> {t('club.seal')}
          </span>
          {billete.tarifaJoven && <em className="pj-joven-tag">{t('j.tag')}</em>}
        </div>

        <AnimatePresence initial={false}>
          {!online && (
            <motion.div key="off" className="pj-offline" role="status" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div>
                <PI n="wifioff" size={17} /> {t('off')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pj-main" role="main">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={tab}
              className="pj-scroll"
              custom={dir}
              variants={{ enter: (d: number) => ({ x: d * 32, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: d * -32, opacity: 0 }) }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {loadingTab === tab ? <Skeleton /> : <Vista />}
              <div className="pj-pad" />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {tab === 'carta' && cartCount > 0 && loadingTab !== 'carta' && (
              <motion.button
                key="cartbar"
                className="pj-cartbar fob-btn primary"
                initial={{ y: 70, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 70, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                onClick={() => openSheet('cart')}
              >
                <span className="l">
                  <PI n="bag" size={20} />
                  <b>{t('c.view')}</b>
                  <small>{cartCount === 1 ? t('c.item') : t('c.items', { n: cartCount })}</small>
                </span>
                <motion.span key={cartTotal} className="r" initial={{ scale: 1.12 }} animate={{ scale: 1 }}>
                  {eur(cartTotal)}
                </motion.span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <nav className="pj-tabbar" aria-label={t('nav.label')}>
          {TABS.map((k) => (
            <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => goTab(k)}>
              {tab === k && <motion.span layoutId="pj-tabind" className="ind" transition={{ type: 'spring', stiffness: 460, damping: 36 }} />}
              <span className="ic">
                <PI n={TAB_ICON[k]} size={22} sw={tab === k ? 2.2 : 1.8} />
                {k === 'pedidos' && enCurso > 0 && (
                  <motion.em className={listos > 0 ? 'ready' : ''} key={enCurso + '-' + listos} initial={{ scale: 1.6 }} animate={{ scale: 1 }} aria-label={`${enCurso}`}>
                    {enCurso}
                  </motion.em>
                )}
              </span>
              <span className="tx">{t('tab.' + k)}</span>
            </button>
          ))}
        </nav>
      </motion.div>

      <Sheet open={sheet === 'cart'} onClose={cerrarSheet} label={t('k.title')} tall>
        <Checkout onClose={cerrarSheet} />
      </Sheet>

      <Sheet open={sheet === 'ajustes'} onClose={cerrarSheet} label={t('x.title')}>
        <div className="pj-sh-head">
          <span style={{ width: 44 }} />
          <h2>{t('x.title')}</h2>
          <button className="pj-icon-btn" onClick={cerrarSheet} aria-label={t('close')}>
            <PI n="close" size={20} />
          </button>
        </div>
        <div className="pj-sh-body">
          <p className="pj-muted pj-who">
            {billete.nombre} · {t('seat', { a: billete.asiento })} · {t('x.ticket', { t: billete.ticket })}
          </p>
          <h3 className="pj-h3">{t('x.lang')}</h3>
          <div className="pj-seg wide" role="group" aria-label={t('x.lang')}>
            {LANGS.map((l) => (
              <button key={l.id} className={lang === l.id ? 'on' : ''} aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>
                {l.nombre}
              </button>
            ))}
          </div>
          <Toggle on={big} onChange={setBig} label={t('x.big')} />
          <Toggle on={contrast} onChange={setContrast} label={t('x.contrast')} />
          <button
            className="fob-btn ghost block"
            onClick={() => {
              cerrarSheet()
              logout()
            }}
          >
            <PI n="logout" size={18} />
            {t('x.out')}
          </button>
        </div>
      </Sheet>
    </Frame>
  )
}

export default function PasajeroApp() {
  useProtoState()
  const [ticket, setTicket] = useState<string | null>(() => {
    const t = ss.get('pj-ticket')
    return t && login(t) ? t : null
  })
  const salir = useCallback(() => setTicket(null), [])

  if (ticket && login(ticket)) {
    return (
      <MotionConfig reducedMotion="user">
        <PJProvider ticket={ticket} onLogout={salir}>
          <Sesion />
        </PJProvider>
      </MotionConfig>
    )
  }
  return (
    <MotionConfig reducedMotion="user">
      <Frame big={ls.get('pj-big') === '1'} contrast={ls.get('pj-hc') === '1'}>
        <Welcome onLogin={setTicket} />
      </Frame>
    </MotionConfig>
  )
}
