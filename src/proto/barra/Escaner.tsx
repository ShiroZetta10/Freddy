import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CafeteriaId, entregarPorQR, getState, Pedido, producto, ProtoState, qrDe } from '../store'
import { buscarPedido, ESTADO_LABEL, Ico } from './util'

type Res = { ok: boolean; titulo: string; detalle?: string; pedido?: Pedido }

const camaraPosible = () => typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia

export default function Escaner({ s, caf, onClose }: { s: ProtoState; caf: CafeteriaId; onClose: () => void }) {
  const [codigo, setCodigo] = useState('')
  const [res, setRes] = useState<Res | null>(null)
  const [cam, setCam] = useState(false)
  const [camError, setCamError] = useState('')
  const video = useRef<HTMLVideoElement>(null)
  const bloqueo = useRef(0)
  const listos = useMemo(() => s.pedidos.filter((p) => p.cafeteria === caf && p.estado === 'listo').sort((a, b) => (a.t.listo ?? 0) - (b.t.listo ?? 0)), [s.pedidos, caf])

  const procesar = useCallback((cod: string) => {
    const st = getState()
    const p = buscarPedido(st, cod)
    if (!p) return setRes({ ok: false, titulo: 'QR no reconocido', detalle: 'Comprueba el número del pedido e inténtalo de nuevo.' })
    if (p.estado === 'recibido' || p.estado === 'preparando')
      return setRes({ ok: false, pedido: p, titulo: `#${p.id} todavía no está listo`, detalle: `Estado actual: ${ESTADO_LABEL[p.estado]}. Márcalo como listo antes de entregar.` })
    if (p.estado === 'listo' && p.cafeteria !== caf)
      return setRes({ ok: false, pedido: p, titulo: `#${p.id} es de ${st.cafeterias[p.cafeteria].nombre}`, detalle: 'Indica al pasajero que recoja en su cafetería.' })
    const r = entregarPorQR(qrDe(p))
    if (r.ok) setRes({ ok: true, pedido: p, titulo: `Entregado #${p.id} · ya pagado`, detalle: `${p.nombre} · asiento ${p.asiento}` })
    else setRes({ ok: false, pedido: r.pedido ?? p, titulo: `#${p.id}: ${r.motivo}`, detalle: r.motivo === 'Ya entregado' ? 'Este QR ya se canjeó. Posible duplicado.' : undefined })
  }, [caf])

  // el resultado se cierra solo
  useEffect(() => {
    if (!res) return
    const id = window.setTimeout(() => setRes(null), res.ok ? 4500 : 7000)
    return () => window.clearTimeout(id)
  }, [res])

  // Esc cierra
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [onClose])

  // cámara real (opcional, BarcodeDetector)
  useEffect(() => {
    if (!cam) return
    let stream: MediaStream | null = null
    let timer = 0
    let cancel = false
    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancel) return stream.getTracks().forEach((t) => t.stop())
        if (video.current) {
          video.current.srcObject = stream
          await video.current.play().catch(() => {})
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const det = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        timer = window.setInterval(async () => {
          if (!video.current || Date.now() < bloqueo.current) return
          try {
            const r = await det.detect(video.current)
            if (r[0]?.rawValue) {
              bloqueo.current = Date.now() + 3500
              procesar(r[0].rawValue)
            }
          } catch {
            /* frame no listo */
          }
        }, 450)
      } catch {
        setCamError('No se pudo abrir la cámara. Usa la lista o escribe el número.')
        setCam(false)
      }
    })()
    return () => {
      cancel = true
      window.clearInterval(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [cam, procesar])

  return (
    <motion.div className="br-scan-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="br-scan"
        role="dialog"
        aria-modal="true"
        aria-label="Entrega por QR"
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="br-scan-h">
          <h2>Entrega por QR</h2>
          <button className="br-x" onClick={onClose} aria-label="Cerrar">
            <Ico n="x" size={22} />
          </button>
        </header>
        <div className="br-scan-body">
          <div className="br-scan-left">
            <div className={`br-vf ${cam ? 'cam' : ''}`}>
              {cam && <video ref={video} muted playsInline />}
              <i className="c tl" />
              <i className="c tr" />
              <i className="c bl" />
              <i className="c br" />
              <span className="br-line" />
              {!cam && <p>Acerca el QR del pasajero</p>}
              <AnimatePresence>
                {res && (
                  <motion.div
                    key={res.titulo + (res.pedido?.id ?? '')}
                    className={`br-res ${res.ok ? 'ok' : 'ko'}`}
                    role="alert"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  >
                    <Ico n={res.ok ? 'check' : 'cross'} size={56} />
                    <strong>{res.titulo}</strong>
                    {res.detalle && <span>{res.detalle}</span>}
                    {res.ok && res.pedido && (
                      <ul>
                        {res.pedido.lineas.map((l) => (
                          <li key={l.pid}>
                            {l.qty}× {producto(getState(), l.pid).nombre}
                          </li>
                        ))}
                        {res.pedido.sinPlastico && <li>Sin cubiertos ni bolsa</li>}
                        {res.pedido.tarifaJoven && <li>Tarifa Joven</li>}
                      </ul>
                    )}
                    <button className="fob-btn ghost" onClick={() => setRes(null)}>
                      Siguiente
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <form
              className="br-code"
              onSubmit={(e) => {
                e.preventDefault()
                if (codigo.trim()) {
                  procesar(codigo)
                  setCodigo('')
                }
              }}
            >
              <label htmlFor="br-code-in">Número o código del pedido</label>
              <div>
                <input id="br-code-in" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="231 o FOB:231:…" inputMode="text" autoComplete="off" />
                <button className="fob-btn primary" type="submit" disabled={!codigo.trim()}>
                  Entregar
                </button>
              </div>
            </form>
            {camaraPosible() && (
              <button className="fob-btn ghost br-cambtn" onClick={() => (setCamError(''), setCam((c) => !c))}>
                <Ico n="camera" size={18} />
                {cam ? 'Parar cámara' : 'Usar cámara'}
              </button>
            )}
            {camError && <p className="br-err">{camError}</p>}
          </div>
          <div className="br-scan-right">
            <h3>Listos para recoger · {s.cafeterias[caf].nombre}</h3>
            <p className="fob-muted br-hint">Demo sin cámara: toca un pedido para simular el escaneo de su QR.</p>
            <ul className="br-listos">
              {listos.length === 0 && <li className="br-empty">No hay pedidos listos ahora mismo.</li>}
              {listos.map((p) => (
                <li key={p.id}>
                  <button onClick={() => procesar(qrDe(p))}>
                    <Ico n="qr" size={22} />
                    <span className="n">#{p.id}</span>
                    <span className="w">
                      {p.nombre} · {p.asiento}
                      {!p.bot && <em> · del móvil</em>}
                    </span>
                    <span className="go">Escanear</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
