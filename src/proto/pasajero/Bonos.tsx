/** Bonos de consumo en la app del pasajero: tarjeta de bono, canje por código (teclear / escanear), aviso de lo que falta y sugerencias con un toque. */
import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bono, ConsultaBono, LineaPedido, cotizar, eur, producto } from '../store'
import { PI, vibrar } from './ui'
import { ss, useP } from './ctx'

export const contenidoTxt = (b: Pick<Bono, 'contenido'>) => b.contenido.map((c) => `${c.qty}× ${c.etiqueta}`).join(' + ')

/** Texto de error de una consulta de bono rechazada. */
export const msgConsulta = (t: ReturnType<typeof useP>['t'], r: Extract<ConsultaBono, { ok: false }>) => t('b.err.' + (r.motivo === 'desconocido' ? 'formato' : r.motivo))

/** Tarjeta de un bono disponible: nombre, qué incluye, código y acción. */
export function BonoCard({ b, children, destacado, titulo }: { b: Bono; children?: ReactNode; destacado?: boolean; titulo?: string }) {
  const { t } = useP()
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={'pj-bono fob-card' + (destacado ? ' on' : '')}>
      <div className="pj-bono-ic" aria-hidden>
        <PI n="voucher" size={22} />
      </div>
      <div className="pj-bono-tx">
        <b>{titulo ?? b.nombre}</b>
        <span>{t('b.covers', { c: contenidoTxt(b) })}</span>
        <small>
          {b.tipo === 'billete' ? t('b.type.billete') : t('b.type.fisico')} · <code>{b.codigo}</code>
        </small>
      </div>
      {children && <div className="pj-bono-act">{children}</div>}
    </motion.div>
  )
}

/** Campo «Canjear código de bono» con botón de escaneo simulado. */
export function BonoCanje({ onOk }: { onOk?: (b: Bono) => void }) {
  const { s, t, canjearCodigo, bonos } = useP()
  const [cod, setCod] = useState(() => ss.get('pj-bono-pre') ?? '')
  const [err, setErr] = useState('')
  const [okTxt, setOkTxt] = useState('')
  const [escaneando, setEscaneando] = useState(false)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const aplicar = (raw: string) => {
    const r = canjearCodigo(raw)
    if (r.ok) {
      ss.del('pj-bono-pre')
      setCod('')
      setErr('')
      setOkTxt(t('b.added', { n: r.bono.nombre }))
      onOk?.(r.bono)
    } else {
      setOkTxt('')
      setErr(msgConsulta(t, r))
    }
  }
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (cod.trim()) aplicar(cod)
  }
  // escaneo simulado: «lee» el primer código físico de prueba que aún no se ha canjeado
  const escanear = () => {
    if (escaneando) return
    setEscaneando(true)
    setErr('')
    setOkTxt('')
    vibrar(10)
    const libre = s.bonos.find((b) => b.tipo === 'fisico' && b.estado === 'disponible' && !bonos.some((x) => x.codigo === b.codigo))
    timers.current.push(
      window.setTimeout(() => {
        if (!libre) {
          setEscaneando(false)
          setErr(t('b.err.nodemo'))
          return
        }
        setCod(libre.codigo)
        vibrar([20, 30, 20])
        timers.current.push(
          window.setTimeout(() => {
            setEscaneando(false)
            aplicar(libre.codigo)
          }, 350),
        )
      }, 1000),
    )
  }

  return (
    <form className="pj-bono-canje" onSubmit={enviar}>
      <label htmlFor="pj-bono-in" className="pj-label">
        {t('b.redeem')}
      </label>
      <div className="row">
        <input
          id="pj-bono-in"
          className={'pj-input' + (err ? ' bad' : '')}
          value={cod}
          onChange={(e) => {
            setCod(e.target.value.toUpperCase())
            setErr('')
          }}
          placeholder={t('b.ph')}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={14}
          aria-invalid={!!err}
          aria-describedby="pj-bono-msg"
        />
        <button type="submit" className="fob-btn navy" disabled={!cod.trim() || escaneando}>
          {t('b.apply')}
        </button>
      </div>
      <button type="button" className="fob-btn ghost block pj-bono-scan" onClick={escanear} disabled={escaneando}>
        <PI n="qr" size={18} />
        {escaneando ? t('b.scanning') : t('b.scan')}
      </button>
      <div id="pj-bono-msg" aria-live="polite">
        <AnimatePresence initial={false}>
          {err && (
            <motion.p key="e" role="alert" className="pj-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              {err}
            </motion.p>
          )}
          {okTxt && (
            <motion.p key="o" className="pj-bono-ok" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <PI n="check" size={15} sw={2.6} /> {okTxt}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  )
}

/**
 * Bono aplicado al pedido: lo que cubre y, si el carrito aún no lo contiene todo, qué añadir (un toque por producto).
 */
export function BonoAplicadoPanel({ cart, compacto }: { cart: LineaPedido[]; compacto?: boolean }) {
  const { s, t, billete, bono, usarBono, add, caf } = useP()
  if (!bono) return null
  const cot = cotizar(s, billete, cart, bono, caf)
  const plan = cot.plan!
  return (
    <div className={'pj-bono-ap' + (plan.completo ? ' ok' : ' falta')} role="status">
      <div className="h">
        <PI n={plan.completo ? 'check' : 'voucher'} size={18} sw={plan.completo ? 2.6 : 1.9} />
        <div className="t">
          <b>{t('b.applied', { n: bono.nombre })}</b>
          <span>{plan.completo ? (cot.total === 0 ? t('b.free') : t('b.covers', { c: contenidoTxt(bono) })) : t('b.covers', { c: contenidoTxt(bono) })}</span>
        </div>
        {!compacto && (
          <button type="button" className="pj-bono-x" onClick={() => usarBono(null)} aria-label={`${t('b.remove')}: ${bono.nombre}`}>
            {t('b.remove')}
          </button>
        )}
      </div>
      {!plan.completo && (
        <div className="falta-l">
          <p>{t('b.missing')}</p>
          {plan.faltan.map((f) => (
            <div key={f.cobertura.etiqueta} className="grp">
              <small>
                {f.qty}× {f.cobertura.etiqueta}
              </small>
              <div className="chips">
                {f.opciones.map((pid) => {
                  const p = producto(s, pid)
                  return (
                    <button key={pid} type="button" className="pj-fchip" onClick={(e) => add(pid, e.currentTarget)} aria-label={`${t('c.add', { n: p.nombre })}`}>
                      <PI n="plus" size={13} sw={2.6} /> {p.nombre}
                      <em>{eur(p.precio)}</em>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
