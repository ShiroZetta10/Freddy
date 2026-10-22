import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { ESCENAS, type PerfilId } from '../../data/journey'
import { ESC } from './Escenas'
import { ReducidoCtx } from './Piezas'

type Vista = 'hoy' | 'con' | 'ambas'
const NOMBRE = { hoy: 'Hoy', con: 'Con FredOnBoard' }

function Celda({ perfil, idx, t }: { perfil: PerfilId; idx: number; t: 'hoy' | 'con' }) {
  const ref = useRef<HTMLDivElement>(null)
  // Solo se monta la ilustración (y sus animaciones) cuando está cerca de la pantalla
  const visible = useInView(ref, { margin: '300px 0px' })
  const Comp = ESC[perfil][idx][t]
  return (
    <div className={`ja-celda ja-celda-${t}`} ref={ref}>
      <svg viewBox="0 0 320 180" role="img" aria-label={`${NOMBRE[t]}: ${ESCENAS[perfil][idx][t]}`} focusable="false">
        {visible && <Comp />}
      </svg>
      <span className={`ja-chip ja-chip-${t}`} aria-hidden>
        {NOMBRE[t]}
      </span>
    </div>
  )
}

/** Escena ilustrada del paso (Hoy / Con FredOnBoard) junto a los dos textos de contraste. */
export default function EscenaPaso({ perfil, idx, activo, dolor, solucion }: { perfil: PerfilId; idx: number; activo: boolean; dolor: string; solucion: string }) {
  const reducido = !!useReducedMotion()
  const [vista, setVista] = useState<Vista>('hoy')
  const tocado = useRef(false)
  const txt = ESCENAS[perfil][idx]

  // Al activarse la etapa: primero «Hoy» y, tras un momento, pasa sola a «Con FredOnBoard» (si el usuario no ha tocado nada)
  useEffect(() => {
    if (!activo || reducido || tocado.current) return
    setVista('hoy')
    const id = window.setTimeout(() => {
      if (!tocado.current) setVista('con') // si el usuario ya eligió (p. ej. «Comparar»), no se la cambiamos
    }, 3400)
    return () => window.clearTimeout(id)
  }, [activo, reducido])

  const elegir = (v: Vista) => {
    tocado.current = true
    setVista(v)
  }

  const dur = reducido ? 0 : 0.35
  return (
    <ReducidoCtx.Provider value={reducido}>
      <div className="ja-escena">
        <div className="ja-conmuta" role="group" aria-label="Versión de la experiencia">
          <button type="button" aria-pressed={vista === 'hoy'} onClick={() => elegir('hoy')}>
            Hoy
          </button>
          <button type="button" className="con" aria-pressed={vista === 'con'} onClick={() => elegir('con')}>
            Con FredOnBoard
          </button>
          <button type="button" className="ambas" aria-pressed={vista === 'ambas'} onClick={() => elegir('ambas')}>
            Comparar
          </button>
        </div>
        <div className={`ja-marco ja-v-${vista}`}>
          {vista === 'ambas' ? (
            <>
              <Celda perfil={perfil} idx={idx} t="hoy" />
              <Celda perfil={perfil} idx={idx} t="con" />
            </>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={vista}
                initial={{ opacity: 0, x: vista === 'con' ? 28 : -28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: vista === 'con' ? -28 : 28 }}
                transition={{ duration: dur, ease: 'easeOut' }}
              >
                <Celda perfil={perfil} idx={idx} t={vista} />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        <p className="ja-pie" aria-hidden>
          {vista === 'ambas' ? 'Misma situación, antes y después de FredOnBoard.' : txt[vista]}
        </p>
      </div>

      <div className="jr-pain ja-pain">
        <div className={vista === 'con' ? 'ja-dim' : ''} onClick={() => elegir('hoy')}>
          <h4>Hoy</h4>
          {dolor}
        </div>
        <div className={`ours${vista === 'hoy' ? ' ja-dim' : ''}`} onClick={() => elegir('con')}>
          <h4>Con FredOnBoard</h4>
          {solucion}
        </div>
      </div>
    </ReducidoCtx.Provider>
  )
}
