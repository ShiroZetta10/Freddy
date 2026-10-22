import { ReactNode, useState } from 'react'
import { motion } from 'framer-motion'
import { CafeteriaId, ProtoState, franjas, horaDe, setAjustes } from '../store'
import { CAFS, CAF_COLOR, Card, PausaCtl, Switch, cuentaAtras, useNow } from './util'

function Regla({ titulo, valor, texto, children }: { titulo: string; valor: string; texto: string; children: ReactNode }) {
  return (
    <div className="mg-regla">
      <div className="mg-regla-h">
        <b>{titulo}</b>
        <output>{valor}</output>
      </div>
      {children}
      <p>{texto}</p>
    </div>
  )
}

function Slider({ value, min, max, step = 1, label, onChange }: { value: number; min: number; max: number; step?: number; label: string; onChange: (n: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      className="mg-range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      style={{ ['--p' as string]: `${pct}%` }}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  )
}

export default function Reglas({ s, ctl }: { s: ProtoState; ctl: PausaCtl }) {
  const a = s.ajustes
  const [caf, setCaf] = useState<CafeteriaId>('proa')
  const now = useNow(1000)
  const fr = franjas(s, caf, 8)
  const cierre = horaDe(s, s.viaje.duracionMin - a.cierreAntesLlegada)
  const ocultos = s.productos.filter((p) => !p.agotado && p.stock <= a.umbralStock).length
  return (
    <div className="mg-sec">
      <div className="mg-grid2 even">
        <div className="mg-col">
          <Card title="Reglas de capacidad" sub="Se aplican a todos los pedidos nuevos, también los de pasajeros conectados ahora">
            <div className="mg-reglas">
              <Regla titulo="Tope por franja" valor={`${a.topePorFranja} pedidos`} texto="Máximo de pedidos que una cafetería acepta por franja de recogida. Evita el pico de gente en barra sin ampliar tripulación.">
                <Slider label="Tope por franja" value={a.topePorFranja} min={2} max={20} onChange={(n) => setAjustes({ topePorFranja: n })} />
              </Regla>
              <Regla titulo="Tamaño de franja" valor={`${a.franjaMin} min`} texto="Ventana en la que el pasajero recoge. Franjas más cortas reparten mejor; más largas dan margen.">
                <div className="fob-seg mg-seg" role="group" aria-label="Tamaño de franja">
                  {[5, 10].map((v) => (
                    <button key={v} className={a.franjaMin === v ? 'on' : ''} aria-pressed={a.franjaMin === v} onClick={() => setAjustes({ franjaMin: v })}>
                      {v} min
                    </button>
                  ))}
                </div>
              </Regla>
              <Regla titulo="Cierre antes de llegar" valor={`${a.cierreAntesLlegada} min`} texto={`Se dejan de aceptar pedidos a esa distancia de Agaete para vaciar la barra antes del desembarque. Hoy se cierra a las ${cierre}.`}>
                <Slider label="Cierre antes de llegar" value={a.cierreAntesLlegada} min={5} max={40} step={5} onChange={(n) => setAjustes({ cierreAntesLlegada: n })} />
              </Regla>
              <Regla titulo="Umbral de stock" valor={`${a.umbralStock} uds.`} texto={`Se oculta un producto al quedar estas unidades o menos, como reserva por si falla un recuento. Ahora ocultos: ${ocultos}.`}>
                <Slider label="Umbral de stock" value={a.umbralStock} min={0} max={10} onChange={(n) => setAjustes({ umbralStock: n })} />
              </Regla>
            </div>
          </Card>
          <Card title="Pausa por cafetería" sub="Frena pedidos nuevos en una barra saturada; los que ya están en curso siguen">
            <div className="mg-pausas">
              {CAFS.map((c) => (
                <div key={c} className="mg-pausa">
                  <div>
                    <b>{s.cafeterias[c].nombre}</b>
                    <span>{a.pausa[c] ? (ctl.hasta[c] ? `En pausa · se reactiva en ${cuentaAtras(ctl.hasta[c], now)}` : 'En pausa') : 'Aceptando pedidos'}</span>
                  </div>
                  <Switch checked={a.pausa[c]} onChange={() => ctl.alternar(c)} label={`Pausar ${s.cafeterias[c].nombre}`} />
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Card title="Así quedan las franjas" sub="Lo que ve ahora el pasajero al elegir recogida">
          <div className="fob-seg mg-seg" role="tablist" aria-label="Cafetería">
            {CAFS.map((c) => (
              <button key={c} role="tab" aria-selected={caf === c} className={caf === c ? 'on' : ''} onClick={() => setCaf(c)}>
                {s.cafeterias[c].nombre.replace('Cafetería ', '')}
              </button>
            ))}
          </div>
          {a.pausa[caf] && <p className="mg-warn">Esta cafetería está en pausa: no se ofrece ninguna franja.</p>}
          <div className={`mg-franjas${a.pausa[caf] ? ' dis' : ''}`}>
            {fr.length === 0 && <p className="mg-empty">No quedan franjas: el cierre de pedidos ya ha pasado.</p>}
            {fr.map((f) => (
              <motion.div layout key={f.idx} className={`mg-fr${f.llena ? ' llena' : ''}`}>
                <b>
                  {f.desde}–{f.hasta}
                </b>
                <div className="mg-fr-bar">
                  <motion.i animate={{ width: `${Math.min(100, (f.ocupados / f.tope) * 100)}%` }} style={{ background: f.llena ? '#b77900' : CAF_COLOR[caf] === '#a9c2ea' ? '#6f97d6' : CAF_COLOR[caf] }} />
                </div>
                <span>{f.llena ? 'Completa' : `${f.ocupados}/${f.tope}`}</span>
              </motion.div>
            ))}
          </div>
          <p className="mg-nota">
            Franjas de {a.franjaMin} min hasta las {cierre}, con tope de {a.topePorFranja} pedidos. Cambiar el tamaño de franja afecta a las franjas nuevas; los pedidos ya hechos conservan la suya.
          </p>
        </Card>
      </div>
    </div>
  )
}
