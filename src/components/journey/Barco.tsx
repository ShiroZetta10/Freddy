import { useEffect, useId } from 'react'
import { motion, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import type { Fase } from '../../data/journey'
import { FerrySvg } from './Ferry'

export type Hito = { fase: Fase; p: number }

function Olas({ capa }: { capa: 'atras' | 'frente' }) {
  const id = useId().replace(/:/g, '')
  const atras = capa === 'atras'
  const h = atras ? 24 : 14
  return (
    <svg className={`ja-olas ja-olas-${capa}`} width="100%" height={h} aria-hidden focusable="false">
      <defs>
        <pattern id={id} width="40" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 6 Q10 0 20 6 T40 6 V12 H0Z" fill={atras ? '#cfe0f5' : '#a9c6ea'} />
        </pattern>
      </defs>
      <rect x="0" y="11" width="100%" height={h} fill={atras ? '#cfe0f5' : '#a9c6ea'} />
      <g className="ja-olas-g">
        <rect x="-40" y="0" width="3000" height="12" fill={`url(#${id})`} />
      </g>
    </svg>
  )
}

function Muelle({ lado }: { lado: 'izq' | 'der' }) {
  return (
    <svg className={`ja-muelle ja-muelle-${lado}`} width="26" height="30" viewBox="0 0 26 30" aria-hidden focusable="false">
      <rect x="0" y="18" width="26" height="12" fill="#8a95ab" />
      <rect x="0" y="16" width="26" height="3" fill="#aab3c5" />
      <path d="M6 16 V4" stroke="#0b3478" strokeWidth="2" />
      <circle cx="6" cy="3.5" r="2.6" fill="#ffcc00" />
      <rect x="15" y="12" width="5" height="4" rx="1" fill="#4a5568" />
    </svg>
  )
}

/** Barra sticky: un fast ferry navega sobre olas hasta el progreso de la etapa activa. */
export function BarcoRuta({ progreso, fase, hitos, faseActiva }: { progreso: number; fase: Fase; hitos: Hito[]; faseActiva: number }) {
  const reducido = !!useReducedMotion()
  const x = useSpring(progreso, { stiffness: 55, damping: 16, mass: 1 })
  useEffect(() => {
    if (reducido) x.jump(progreso)
    else x.set(progreso)
  }, [progreso, reducido, x])
  const pos = useTransform(x, (v) => `${Math.min(1, Math.max(0, v)) * 100}%`)
  const enMar = progreso > 0 && progreso < 1

  return (
    <div className="ja-ruta" role="img" aria-label={`Ruta de Santa Cruz a Agaete. Fase actual: ${fase}`}>
      <span className="jr-port">Santa Cruz</span>
      <div className="ja-mar" aria-hidden>
        <Olas capa="atras" />
        <Muelle lado="izq" />
        <Muelle lado="der" />
        <div className="ja-carril">
          <div className="ja-linea">
            <motion.div className="ja-linea-fill" style={{ width: pos }} />
          </div>
          {hitos.map((h, i) => (
            <span key={h.fase} className={`ja-hito${i < faseActiva ? ' done' : i === faseActiva ? ' on' : ''}`} style={{ left: `${h.p * 100}%` }} title={h.fase} />
          ))}
          <motion.div className="ja-barco" style={{ left: pos }}>
            <svg className="ja-estela" data-on={enMar} viewBox="0 0 70 12" aria-hidden focusable="false">
              <path className="ja-espuma" d="M70 7 L6 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path className="ja-espuma" d="M70 8 L0 8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path className="ja-espuma" d="M70 9 L8 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
            <motion.div
              style={{ originX: 0.5, originY: 0.9 }}
              animate={reducido ? undefined : { rotate: [-1.6, 1.6, -1.6], y: [0, -1.5, 0] }}
              transition={{ duration: enMar ? 2.4 : 4.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FerrySvg />
            </motion.div>
          </motion.div>
        </div>
        <Olas capa="frente" />
      </div>
      <span className="jr-port">Agaete</span>
    </div>
  )
}
