import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Insumo } from '../store'
import { fmtQty, Ico } from './util'

export type TecladoCfg = {
  titulo: string
  sub?: string
  insumo: Insumo
  accion: string
  motivos?: string[]
  permiteCero?: boolean
  max?: number
  inicial?: string
  ayuda?: string
}

export default function Teclado({ cfg, onClose, onOk }: { cfg: TecladoCfg; onClose: () => void; onOk: (v: number, motivo?: string) => void }) {
  const [txt, setTxt] = useState(cfg.inicial ?? '')
  const [motivo, setMotivo] = useState(cfg.motivos?.[0])
  const i = cfg.insumo
  const bruto = txt === '' ? 0 : Number(txt)
  const v = cfg.max != null ? Math.min(bruto, cfg.max) : bruto
  const excede = cfg.max != null && bruto > cfg.max
  const valido = txt !== '' && (cfg.permiteCero || v > 0)

  const tecla = (d: string) => setTxt((t) => (t.length >= 7 ? t : t === '0' ? d : t + d))
  const borrar = () => setTxt((t) => t.slice(0, -1))
  const ok = () => valido && onOk(v, motivo)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) tecla(e.key)
      else if (e.key === 'Backspace') borrar()
      else if (e.key === 'Escape') onClose()
      else if (e.key === 'Enter') ok()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  const presets = i.envase ? [1, 2, 5].map((n) => n * i.envase!).filter((n) => !cfg.max || n <= cfg.max) : []
  return (
    <motion.div className="br-modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        className="br-kb"
        role="dialog"
        aria-modal="true"
        aria-label={cfg.titulo}
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
      >
        <header className="br-kb-h">
          <div>
            <h2>{cfg.titulo}</h2>
            <span>{cfg.sub ?? i.nombre}</span>
          </div>
          <button className="br-x" onClick={onClose} aria-label="Cerrar">
            <Ico n="x" size={22} />
          </button>
        </header>
        <div className="br-kb-body">
          <div className="br-kb-left">
            <div className="br-kb-disp" aria-live="polite">
              <b>{txt === '' ? '0' : Number(txt).toLocaleString('es-ES')}</b>
              <span>{i.unidad}</span>
              {v >= 1000 && i.unidad !== 'ud' && <em>= {fmtQty(v, i.unidad)}</em>}
            </div>
            <p className="br-kb-info">
              En stock: <b>{fmtQty(i.stock, i.unidad)}</b>
              {cfg.ayuda && <> · {cfg.ayuda}</>}
              {excede && <strong> · Máximo {fmtQty(cfg.max!, i.unidad)}</strong>}
            </p>
            {presets.length > 0 && (
              <div className="br-kb-presets">
                {presets.map((n, k) => (
                  <button key={n} onClick={() => setTxt(String(n))}>
                    {k + 1} envase{k ? 's' : ''} · {fmtQty(n, i.unidad)}
                  </button>
                ))}
              </div>
            )}
            {cfg.motivos && (
              <div className="br-kb-motivos" role="radiogroup" aria-label="Motivo">
                {cfg.motivos.map((m) => (
                  <button key={m} role="radio" aria-checked={motivo === m} className={motivo === m ? 'on' : ''} onClick={() => setMotivo(m)}>
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="br-kb-pad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button key={d} onClick={() => tecla(d)}>
                {d}
              </button>
            ))}
            <button className="alt" onClick={() => setTxt('')} aria-label="Borrar todo">
              C
            </button>
            <button onClick={() => tecla('0')}>0</button>
            <button className="alt" onClick={borrar} aria-label="Borrar un dígito">
              <Ico n="back" size={26} />
            </button>
          </div>
        </div>
        <footer className="br-kb-f">
          <button className="fob-btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="fob-btn primary" disabled={!valido} onClick={ok}>
            {cfg.accion}
          </button>
        </footer>
      </motion.div>
    </motion.div>
  )
}
