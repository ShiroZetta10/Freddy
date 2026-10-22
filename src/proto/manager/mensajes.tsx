import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ProtoState, enviarMensaje, horaDe } from '../store'
import { useToast } from '../shared'
import { CAFS, Card, Ico, hhmm } from './util'

const MAX = 240

export default function Mensajes({ s }: { s: ProtoState }) {
  const toast = useToast()
  const [txt, setTxt] = useState('')
  const plantillas = useMemo(() => {
    const act = (c: (typeof CAFS)[number]) => s.pedidos.filter((p) => p.cafeteria === c && (p.estado === 'recibido' || p.estado === 'preparando')).length
    const libres = CAFS.filter((c) => !s.ajustes.pausa[c]).sort((a, b) => act(a) - act(b))
    const mejor = libres[0]
    const km0 = s.productos.filter((p) => p.km0 && !p.agotado && p.stock > s.ajustes.umbralStock).slice(0, 3).map((p) => p.nombre)
    const cierre = horaDe(s, s.viaje.duracionMin - s.ajustes.cierreAntesLlegada)
    return [
      { t: 'Retraso', x: `Retraso estimado de 10 minutos en la llegada a ${s.viaje.destino} por mar de fondo. Tus pedidos siguen en marcha y te avisaremos cuando estén listos.` },
      {
        t: 'Cafetería con menos espera',
        x: mejor ? `Ahora mismo hay menos espera en ${s.cafeterias[mejor].nombre} (${s.cafeterias[mejor].cubierta}). Pide ahí y recoge antes.` : 'Todas las cafeterías tienen espera por encima de lo habitual. Gracias por tu paciencia.',
      },
      { t: 'Oferta KM0', x: km0.length ? `Producto de Canarias a bordo: ${km0.join(', ')}. Pídelo desde tu asiento y recoge sin cola.` : 'Hoy hay producto km0 canario en la carta. Pídelo desde tu asiento.' },
      { t: 'Cierre de pedidos', x: `Los pedidos desde la app se cierran a las ${cierre}, ${s.ajustes.cierreAntesLlegada} minutos antes de llegar. Si quieres algo, pídelo ya.` },
    ]
  }, [s])
  const enviar = () => {
    const t = txt.trim()
    if (!t) return
    enviarMensaje(t)
    toast({ titulo: 'Aviso enviado', texto: 'Los pasajeros a bordo lo verán ahora en su app.', icono: 'megaphone' })
    setTxt('')
  }
  const hist = [...s.mensajes].reverse()
  return (
    <div className="mg-sec">
      <div className="mg-grid2 even">
        <Card title="Nuevo aviso a los pasajeros" sub="Llega como notificación en la app de todos los pasajeros a bordo">
          <p className="mg-lbl">Plantillas</p>
          <div className="mg-tpl">
            {plantillas.map((p) => (
              <button key={p.t} onClick={() => setTxt(p.x)}>
                {p.t}
              </button>
            ))}
          </div>
          <label className="mg-lbl" htmlFor="mg-msg">
            Mensaje
          </label>
          <textarea id="mg-msg" className="mg-ta" rows={4} maxLength={MAX} placeholder="Escribe el aviso o elige una plantilla…" value={txt} onChange={(e) => setTxt(e.target.value)} />
          <div className="mg-ta-f">
            <span className={txt.length > MAX - 20 ? 'warn' : ''}>
              {txt.length}/{MAX}
            </span>
            <button className="fob-btn primary" onClick={enviar} disabled={!txt.trim()}>
              <Ico name="msg" size={17} /> Enviar a pasajeros
            </button>
          </div>
          {txt.trim() && (
            <motion.div className="mg-preview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <span>Vista previa en el móvil del pasajero</span>
              <div className="mg-bubble">
                <b>Fred. Olsen Express</b>
                {txt.trim()}
              </div>
            </motion.div>
          )}
        </Card>
        <Card title="Historial" sub={`${s.mensajes.length} ${s.mensajes.length === 1 ? 'mensaje' : 'mensajes'} enviados en este viaje`}>
          <ul className="mg-hist">
            <AnimatePresence initial={false}>
              {hist.map((m) => (
                <motion.li key={m.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}>
                  <div>
                    <span className={`fob-pill${m.de === 'manager' ? '' : ' amber'}`}>{m.de === 'manager' ? 'Manager' : 'Sistema'}</span>
                    <time>{hhmm(m.t)}</time>
                  </div>
                  <p>{m.texto}</p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Card>
      </div>
    </div>
  )
}
