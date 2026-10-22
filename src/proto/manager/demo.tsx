import { useState } from 'react'
import { Fase, ProtoState, fase, horaDe, irAFase, resetDemo, setAjustes, setOnline, setViaje } from '../store'
import { Card, Switch } from './util'

const FASES: { id: Fase; l: string; d: string }[] = [
  { id: 'antes', l: 'Antes', d: 'Pre-pedido desde casa' },
  { id: 'embarque', l: 'Embarque', d: 'Pasajeros subiendo' },
  { id: 'navegando', l: 'Navegando', d: 'Pico de pedidos' },
  { id: 'llegando', l: 'Llegando', d: 'Pedidos cerrados' },
  { id: 'llegado', l: 'Llegado', d: 'Fin de la travesía' },
]

export default function Demo({ s }: { s: ProtoState }) {
  const [conf, setConf] = useState(false)
  const f = fase(s)
  return (
    <div className="mg-sec">
      <div className="mg-grid2 even">
        <Card title="Escenario de demo" sub="Controles para presentar ante el jurado; actúan sobre las tres vistas a la vez">
          <p className="mg-lbl">Fase del viaje</p>
          <div className="mg-fases" role="group" aria-label="Fase del viaje">
            {FASES.map((x) => (
              <button key={x.id} className={f === x.id ? 'on' : ''} aria-pressed={f === x.id} onClick={() => irAFase(x.id)}>
                <b>{x.l}</b>
                <span>{x.d}</span>
              </button>
            ))}
          </div>
          <p className="mg-lbl">
            Minuto del viaje · <b>{Math.round(s.viaje.minuto)}</b> de {s.viaje.duracionMin} · {horaDe(s, s.viaje.minuto)}
          </p>
          <input type="range" className="mg-range" aria-label="Minuto del viaje" min={-25} max={s.viaje.duracionMin + 10} value={Math.round(s.viaje.minuto)} style={{ ['--p' as string]: `${((s.viaje.minuto + 25) / (s.viaje.duracionMin + 35)) * 100}%` }} onChange={(e) => setViaje({ minuto: Number(e.target.value) })} />
          <p className="mg-lbl">Velocidad del reloj</p>
          <div className="fob-seg mg-seg" role="group" aria-label="Velocidad">
            {[0, 0.5, 2, 6].map((v) => (
              <button key={v} className={s.viaje.velocidad === v ? 'on' : ''} aria-pressed={s.viaje.velocidad === v} onClick={() => setViaje({ velocidad: v })}>
                {v === 0 ? 'Pausa' : `×${v} min/s`}
              </button>
            ))}
          </div>
        </Card>
        <Card title="Condiciones" sub="Para enseñar cómo responde el sistema">
          <div className="mg-pausas">
            <div className="mg-pausa">
              <div>
                <b>Conexión del barco (Starlink)</b>
                <span>{s.ajustes.online ? 'En línea: los pedidos entran al momento' : 'Sin conexión: los pedidos esperan en el móvil y se sincronizan sin duplicar'}</span>
              </div>
              <Switch checked={s.ajustes.online} onChange={setOnline} label="Conexión del barco" />
            </div>
            <div className="mg-pausa">
              <div>
                <b>Otros pasajeros pidiendo (bot)</b>
                <span>{s.ajustes.bot ? 'Generando pedidos de otros pasajeros' : 'Detenido: solo entran pedidos reales'}</span>
              </div>
              <Switch checked={s.ajustes.bot} onChange={(v) => setAjustes({ bot: v })} label="Bot de pedidos" />
            </div>
            <div className="mg-pausa">
              <div>
                <b>Reiniciar demo</b>
                <span>Borra pedidos, mensajes y alertas y vuelve a las reglas iniciales</span>
              </div>
              {conf ? (
                <div className="mg-conf">
                  <button className="mg-btn solid" onClick={() => (resetDemo(), setConf(false))}>
                    Confirmar
                  </button>
                  <button className="mg-btn" onClick={() => setConf(false)}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <button className="mg-btn" onClick={() => setConf(true)}>
                  Reiniciar
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
