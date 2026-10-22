import './barra.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import Icon from '../../components/Icon'
import { ProtoChrome } from '../shared'
import { CafeteriaId, fase, horaDe, insumoLimitante, pedidosAbiertos, ProtoState, setPausa, useProtoState } from '../store'
import { CAFS, CAF_CORTO, FASE_LABEL, Ico, useCafSeleccionada, pitar, useNow, usePedidosNuevos, useSilencio } from './util'
import Tablero from './Tablero'
import Escaner from './Escaner'
import Inventario from './Inventario'
import Prevision from './Prevision'
import Cierre from './Cierre'

type Tab = 'pedidos' | 'prevision' | 'inventario' | 'cierre'
const TABS: { id: Tab; l: string }[] = [
  { id: 'pedidos', l: 'Pedidos' },
  { id: 'prevision', l: 'Previsión' },
  { id: 'inventario', l: 'Inventario' },
  { id: 'cierre', l: 'Cierre' },
]

type Aviso = { id: number; titulo: string; sub: string }

/** Avisa cuando un producto pasa a agotarse (porciones <= umbral) por falta de un insumo. */
function useAvisosAgotado(s: ProtoState, silencio: boolean) {
  const prev = useRef<Record<string, boolean> | null>(null)
  const [avisos, setAvisos] = useState<Aviso[]>([])
  useEffect(() => {
    const now: Record<string, boolean> = {}
    for (const p of s.productos) if (s.escandallos[p.id]) now[p.id] = p.stock <= s.ajustes.umbralStock
    const antes = prev.current
    prev.current = now
    if (!antes) return
    const grupos = new Map<string, string[]>()
    for (const p of s.productos) {
      if (now[p.id] && antes[p.id] === false) {
        const lim = insumoLimitante(s, p.id)
        const k = lim?.id ?? ''
        grupos.set(k, [...(grupos.get(k) ?? []), p.nombre])
      }
    }
    if (!grupos.size) return
    const nuevos: Aviso[] = [...grupos.entries()].map(([iid, nombres], n) => {
      const ins = s.insumos.find((i) => i.id === iid)
      const lista = nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}` : nombres[0]
      return {
        id: Date.now() + n + Math.random(),
        titulo: `${nombres.length > 1 ? 'Se han agotado' : 'Se ha agotado'} ${lista}${ins ? `: falta ${ins.nombre}` : ''}`,
        sub: `Oculto a los pasajeros.${ins ? ` Reposición: ${ins.aprovisionamiento}.` : ''}`,
      }
    })
    setAvisos((a) => [...a, ...nuevos].slice(-3))
    if (!silencio) pitar()
    nuevos.forEach((x) => window.setTimeout(() => setAvisos((a) => a.filter((y) => y.id !== x.id)), 8000))
  }, [s, silencio])
  return { avisos, cerrar: (id: number) => setAvisos((a) => a.filter((y) => y.id !== id)) }
}

export default function BarraApp() {
  const s = useProtoState()
  const [caf, setCaf] = useCafSeleccionada()
  const [tab, setTab] = useState<Tab>('pedidos')
  const [scan, setScan] = useState(false)
  const [silencio, toggleSilencio] = useSilencio()
  const now = useNow(1000)
  const { avisos, cerrar } = useAvisosAgotado(s, silencio)

  const pedidos = useMemo(() => s.pedidos.filter((p) => p.cafeteria === caf && p.estado !== 'cancelado'), [s.pedidos, caf])
  const { fresh, anuncio } = usePedidosNuevos(pedidos, caf, silencio)
  const activos = (c: CafeteriaId) => s.pedidos.filter((p) => p.cafeteria === c && (p.estado === 'recibido' || p.estado === 'preparando' || p.estado === 'listo')).length
  const nActivos = activos(caf)
  const sinRecoger = nActivos
  const pausa = s.ajustes.pausa[caf]
  const cerrado = !pedidosAbiertos(s)
  const f = fase(s)
  const nOcultos = s.productos.filter((p) => p.agotado || p.stock <= s.ajustes.umbralStock).length

  return (
    <MotionConfig reducedMotion="user">
      <div className="fob fob-root br-root">
        <ProtoChrome titulo="Barra" />
        <div className="br-sr" role="status" aria-live="polite">
          {anuncio}
        </div>

        <header className="br-head">
          <div className="br-caf" role="radiogroup" aria-label="Cafetería">
            {CAFS.map((c) => (
              <button key={c} role="radio" aria-checked={caf === c} className={caf === c ? 'on' : ''} onClick={() => setCaf(c)}>
                {caf === c && <motion.span layoutId="br-caf-bg" className="bg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className="t">
                  {CAF_CORTO[c]}
                  {s.ajustes.pausa[c] && <i className="pdot" title="En pausa" />}
                  <em>{activos(c)}</em>
                </span>
              </button>
            ))}
          </div>

          <div className="br-time" title="Hora simulada del viaje">
            <Ico n="ship" size={20} />
            <div>
              <b>{horaDe(s, s.viaje.minuto)}</b>
              <span>{FASE_LABEL[f]}</span>
            </div>
          </div>

          <div className={`br-conn ${s.ajustes.online ? 'on' : 'off'}`} role="status" title={s.ajustes.online ? 'En línea' : 'Sin conexión'}>
            <Ico n={s.ajustes.online ? 'wifi' : 'nowifi'} size={18} />
            <span>
              {s.ajustes.online ? 'En línea' : 'Sin conexión'}
              {!s.ajustes.online && s.pendientesOffline.length > 0 && <small> · {s.pendientesOffline.length} por sincronizar</small>}
            </span>
          </div>

          <div className="br-activos" aria-label={`${nActivos} pedidos activos`}>
            <b>{nActivos}</b>
            <span>activos</span>
          </div>

          <div className="br-spacer" />

          <button className="br-snd" onClick={toggleSilencio} aria-pressed={silencio} aria-label={silencio ? 'Activar sonido de pedidos nuevos' : 'Silenciar sonido de pedidos nuevos'} title={silencio ? 'Sonido desactivado' : 'Sonido activado'}>
            <Ico n={silencio ? 'mute' : 'sound'} size={22} />
          </button>

          <button className={`br-pausa ${pausa ? 'on' : ''}`} role="switch" aria-checked={pausa} onClick={() => setPausa(caf, !pausa)}>
            <span className="ic">
              <Ico n={pausa ? 'play' : 'pause'} size={20} />
            </span>
            <span className="tx">
              <b>{pausa ? 'Pedidos en pausa' : 'Pausar pedidos'}</b>
              <small>{pausa ? 'Toca para reanudar' : `${CAF_CORTO[caf]} · acepta pedidos`}</small>
            </span>
            <span className="sw" aria-hidden>
              <i />
            </span>
          </button>
        </header>

        <AnimatePresence initial={false}>
          {pausa && (
            <motion.div className="br-banda" role="alert" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="in">
                <span>
                  <Ico n="pause" size={18} /> PEDIDOS EN PAUSA · {s.cafeterias[caf].nombre}
                </span>
                <small>Los pasajeros no pueden pedir. Los pedidos en curso siguen su camino.</small>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="br-tabs" role="tablist" aria-label="Secciones">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
              {t.l}
              {t.id === 'pedidos' && <i>{nActivos}</i>}
              {t.id === 'inventario' && nOcultos > 0 && <i className="warn">{nOcultos}</i>}
              {t.id === 'cierre' && cerrado && <i className="warn">{sinRecoger}</i>}
              {tab === t.id && <motion.span layoutId="br-tab-ul" className="ul" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            </button>
          ))}
          <div className="br-spacer" />
          <button className="fob-btn primary br-scanbtn" onClick={() => setScan(true)}>
            <Icon name="qr" size={20} />
            Escanear QR
          </button>
        </nav>

        <main className="br-main">
          {cerrado && tab !== 'cierre' && (
            <button className="br-closebar" onClick={() => setTab('cierre')}>
              <Ico n="warn" size={18} />
              <b>Pedidos cerrados: {sinRecoger} sin recoger</b>
              <span>Ver cierre</span>
            </button>
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              className="br-view"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {tab === 'pedidos' && <Tablero s={s} caf={caf} pedidos={pedidos} now={now} fresh={fresh} />}
              {tab === 'prevision' && <Prevision s={s} caf={caf} />}
              {tab === 'inventario' && <Inventario s={s} />}
              {tab === 'cierre' && <Cierre s={s} caf={caf} />}
            </motion.div>
          </AnimatePresence>
        </main>

        <div className="br-toasts" role="alert" aria-live="assertive">
          <AnimatePresence>
            {avisos.map((a) => (
              <motion.div key={a.id} layout className="br-toast" initial={{ opacity: 0, y: -24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }} transition={{ type: 'spring', stiffness: 420, damping: 34 }}>
                <Ico n="warn" size={22} />
                <div>
                  <b>{a.titulo}</b>
                  <span>{a.sub}</span>
                </div>
                <button onClick={() => cerrar(a.id)} aria-label="Cerrar aviso">
                  <Ico n="x" size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>{scan && <Escaner s={s} caf={caf} onClose={() => setScan(false)} />}</AnimatePresence>
      </div>
    </MotionConfig>
  )
}
