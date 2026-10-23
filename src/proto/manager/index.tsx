import './manager.css'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ProtoChrome } from '../shared'
import { fase, horaDe, setViaje, useProtoState } from '../store'
import { Ico, usePausaCtl } from './util'
import Vivo from './vivo'
import Carta from './carta'
import Reglas from './reglas'
import Clases from './clases'
import Ventajas from './ventajas'
import Mensajes from './mensajes'
import Inventario from './inventario'
import Analitica from './analitica'
import Demo from './demo'

type Sec = 'vivo' | 'carta' | 'inventario' | 'reglas' | 'ventajas' | 'clases' | 'mensajes' | 'analitica' | 'demo'
const NAV: { id: Sec; full: string; short: string; ico: Parameters<typeof Ico>[0]['name'] }[] = [
  { id: 'vivo', full: 'En vivo', short: 'En vivo', ico: 'live' },
  { id: 'carta', full: 'Carta y stock', short: 'Carta', ico: 'carta' },
  { id: 'inventario', full: 'Inventario y aprovisionamiento', short: 'Inventario', ico: 'caja' },
  { id: 'reglas', full: 'Capacidad y reglas', short: 'Reglas', ico: 'sliders' },
  { id: 'ventajas', full: 'Ventajas del pre-pedido', short: 'Ventajas', ico: 'star' },
  { id: 'clases', full: 'Clase Estándar y Clase Oro', short: 'Clases', ico: 'star' },
  { id: 'mensajes', full: 'Mensajes', short: 'Avisos', ico: 'msg' },
  { id: 'analitica', full: 'Analítica del piloto', short: 'Piloto', ico: 'chart' },
  { id: 'demo', full: 'Escenario de demo', short: 'Demo', ico: 'demo' },
]
const FASE_L = { antes: 'Antes de embarcar', embarque: 'Embarque', navegando: 'Navegando', llegando: 'Llegando', llegado: 'Llegado' }

export default function ManagerApp() {
  const s = useProtoState()
  const [sec, setSec] = useState<Sec>('vivo')
  const ctl = usePausaCtl()
  const pausado = s.viaje.velocidad === 0
  const titulo = NAV.find((n) => n.id === sec)!.full
  return (
    <div className="fob fob-root mg-app">
      <ProtoChrome titulo="Manager" />
      <div className="mg-body">
        <nav className="mg-side" aria-label="Secciones">
          <div className="mg-brand">
            <small>Responsable de restauración</small>
            <b>{s.viaje.buque}</b>
          </div>
          <div className="mg-nav">
            {NAV.map((n) => (
              <button key={n.id} className={sec === n.id ? 'on' : ''} aria-current={sec === n.id ? 'page' : undefined} onClick={() => setSec(n.id)}>
                {sec === n.id && <motion.i layoutId="mg-ind" className="mg-ind" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <Ico name={n.ico} size={19} />
                <span className="full">{n.full}</span>
                <span className="short">{n.short}</span>
              </button>
            ))}
          </div>
          <p className="mg-sidefoot">Piloto Click &amp; Collect · datos simulados</p>
        </nav>
        <main className="mg-main">
          <div className="mg-top">
            <div>
              <h1>{titulo}</h1>
              <p>
                {s.viaje.origen} → {s.viaje.destino}
              </p>
            </div>
            <div className="mg-status">
              <span className="mg-clock">{horaDe(s, s.viaje.minuto)}</span>
              <span className="fob-pill">{FASE_L[fase(s)]}</span>
              <span className={`fob-pill ${s.ajustes.online ? 'green' : 'amber'}`}>{s.ajustes.online ? 'En línea' : 'Sin conexión'}</span>
              <button className="mg-btn sm" onClick={() => setViaje({ velocidad: pausado ? 0.5 : 0 })} aria-label={pausado ? 'Reanudar reloj' : 'Pausar reloj'}>
                <Ico name={pausado ? 'play' : 'pause'} size={14} />
                <span className="mg-hide-sm">{pausado ? 'Reanudar' : 'Pausar'}</span>
              </button>
            </div>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={sec} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
              {sec === 'vivo' && <Vivo s={s} ctl={ctl} onInventario={() => setSec('inventario')} />}
              {sec === 'carta' && <Carta s={s} />}
              {sec === 'inventario' && <Inventario s={s} />}
              {sec === 'reglas' && <Reglas s={s} ctl={ctl} />}
              {sec === 'ventajas' && <Ventajas s={s} />}
              {sec === 'clases' && <Clases s={s} />}
              {sec === 'mensajes' && <Mensajes s={s} />}
              {sec === 'analitica' && <Analitica s={s} />}
              {sec === 'demo' && <Demo s={s} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
