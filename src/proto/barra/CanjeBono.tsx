import { FormEvent, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bono, CafeteriaId, Pedido, ProtoState, canjearBonoEnBarra, consultarBono, eur, franjas, horaDe, normalizarCodigoBono } from '../store'
import { Ico } from './util'

const MOTIVO: Record<string, string> = {
  formato: 'Código no válido. Revisa las letras y los guiones (BN-XXXX-X).',
  desconocido: 'No existe ningún bono con ese código.',
  usado: 'Este bono ya se ha canjeado. No se puede usar dos veces.',
  caducado: 'Este bono ha caducado.',
  ajeno: 'Es un bono de billete: el pasajero lo usa desde su móvil con su localizador.',
}

/**
 * Barra: canjear un bono físico para un pasajero sin móvil. Código → qué cubre → elegir producto → pedido en el tablero.
 * Sin pasos extra para la tripulación: el pedido entra como cualquier otro (franja libre más próxima, pagado con el bono).
 */
export default function CanjeBono({ s, caf, onClose }: { s: ProtoState; caf: CafeteriaId; onClose: () => void }) {
  const [codigo, setCodigo] = useState('')
  const [bono, setBono] = useState<Bono | null>(null)
  const [error, setError] = useState('')
  const [sel, setSel] = useState<string[]>([])
  const [nombre, setNombre] = useState('')
  const [hecho, setHecho] = useState<Pedido | null>(null)

  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [onClose])

  // si otro dispositivo canjea este bono mientras tanto, se avisa
  const vivo = bono ? s.bonos.find((b) => b.codigo === bono.codigo) : undefined
  const ocupado = !!bono && !!vivo && vivo.estado !== 'disponible' && !hecho

  const comprobar = (e: FormEvent) => {
    e.preventDefault()
    const r = consultarBono(s, codigo)
    if (!r.ok) {
      setBono(null)
      return setError(MOTIVO[r.motivo])
    }
    if (r.bono.tipo === 'billete') {
      setBono(null)
      return setError(MOTIVO.ajeno)
    }
    setError('')
    setBono(r.bono)
    setSel(r.bono.contenido.map(() => ''))
  }

  const fr = useMemo(() => franjas(s, caf, 6).find((f) => !f.llena), [s, caf])
  const completo = !!bono && sel.every(Boolean)
  const crear = () => {
    if (!bono || !completo) return
    const elecciones = bono.contenido.flatMap((c, i) => Array.from({ length: c.qty }, () => sel[i]))
    const r = canjearBonoEnBarra({ codigo: bono.codigo, nombre, cafeteria: caf, elecciones })
    if (r.ok) setHecho(r.pedido)
    else setError(r.motivo === 'bono-usado' ? MOTIVO.usado : r.motivo === 'sin-stock' ? `Sin stock de ${r.detalle ?? 'un producto'}: elige otro.` : r.motivo === 'cerrado' ? 'Los pedidos están cerrados.' : r.motivo === 'pausa' ? 'Esta cafetería está en pausa.' : r.motivo === 'franja-llena' ? 'No quedan franjas libres en esta cafetería.' : 'No se pudo canjear el bono.')
  }
  const otro = () => {
    setHecho(null)
    setBono(null)
    setCodigo('')
    setNombre('')
    setError('')
  }

  return (
    <motion.div className="br-scan-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="br-scan br-bono-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Canjear bono físico"
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="br-scan-h">
          <h2>Canjear bono · {s.cafeterias[caf].nombre}</h2>
          <button className="br-x" onClick={onClose} aria-label="Cerrar">
            <Ico n="x" size={22} />
          </button>
        </header>
        <div className="br-bono-body">
          <AnimatePresence mode="wait" initial={false}>
            {hecho ? (
              <motion.div key="ok" className="br-bono-ok" role="status" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <Ico n="check" size={56} />
                <strong>Pedido #{hecho.id} creado · pagado con bono</strong>
                <span>
                  {hecho.lineas.map((l) => `${l.qty}× ${s.productos.find((p) => p.id === l.pid)?.nombre ?? l.pid}`).join(' · ')}
                </span>
                <span>
                  Recogida {horaDe(s, hecho.franja * s.ajustes.franjaMin)} · bono {hecho.bono?.codigo} canjeado
                </span>
                <div className="acts">
                  <button className="fob-btn navy" onClick={otro}>
                    Canjear otro bono
                  </button>
                  <button className="fob-btn ghost" onClick={onClose}>
                    Cerrar
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="f" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="br-bono-f">
                <form className="br-code" onSubmit={comprobar}>
                  <label htmlFor="br-bono-in">Código del bono</label>
                  <div>
                    <input
                      id="br-bono-in"
                      value={codigo}
                      onChange={(e) => {
                        setCodigo(e.target.value.toUpperCase())
                        setError('')
                        if (bono) setBono(null)
                      }}
                      placeholder="BN-XXXX-X"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      autoFocus
                    />
                    <button className="fob-btn primary" type="submit" disabled={!normalizarCodigoBono(codigo) && codigo.trim().length < 5}>
                      Comprobar
                    </button>
                  </div>
                </form>
                <AnimatePresence initial={false}>
                  {error && (
                    <motion.p className="br-err br-bono-err" role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                {bono && (
                  <div className="br-bono-card">
                    <h3>
                      <Ico n="voucher" size={20} /> {bono.nombre}
                    </h3>
                    <p className="fob-muted">Bono físico de un solo uso · precio de referencia {eur(bono.precio)}. Elige el producto de cada parte del menú.</p>
                    {ocupado && (
                      <p className="br-err" role="alert">
                        Este bono se acaba de canjear en otro dispositivo.
                      </p>
                    )}
                    {bono.contenido.map((c, i) => (
                      <fieldset key={c.etiqueta} className="br-bono-grp">
                        <legend>
                          {c.qty}× {c.etiqueta}
                        </legend>
                        <div className="opts" role="radiogroup" aria-label={c.etiqueta}>
                          {c.pids.map((pid) => {
                            const p = s.productos.find((x) => x.id === pid)
                            if (!p) return null
                            const agot = p.agotado || p.stock - s.ajustes.umbralStock < c.qty
                            return (
                              <button key={pid} type="button" role="radio" aria-checked={sel[i] === pid} disabled={agot} className={sel[i] === pid ? 'on' : ''} onClick={() => setSel((x) => x.map((v, j) => (j === i ? pid : v)))}>
                                {p.nombre}
                                {agot && <em> · agotado</em>}
                              </button>
                            )
                          })}
                        </div>
                      </fieldset>
                    ))}
                    <label className="br-bono-nombre">
                      <span>Nombre para el pedido (opcional)</span>
                      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Mostrador" maxLength={24} autoComplete="off" />
                    </label>
                    <div className="br-bono-foot">
                      <span className="fob-muted">
                        {fr ? `Recogida ${fr.desde} · ${eur(0)} a cobrar` : 'Sin franjas libres'}
                      </span>
                      <button className="fob-btn primary" onClick={crear} disabled={!completo || !fr || ocupado}>
                        Crear pedido
                      </button>
                    </div>
                  </div>
                )}
                {!bono && !error && <p className="fob-muted br-hint">Para pasajeros sin móvil: introduce el código impreso del bono. El pedido entra en el tablero como cualquier otro, sin cobrar nada.</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
