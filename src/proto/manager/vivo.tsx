import { ReactNode, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Alerta, CafeteriaId, Pedido, ProtoState, enviarMensaje, eur, horaDe, kpis, ocupacionFrio, porciones, setAjustes, update } from '../store'
import { useToast } from '../shared'
import Mapa from './mapa'
import { C, CAFS, CAF_COLOR, Card, Counter, Ico, PausaCtl, cuentaAtras, hace, num, useNow } from './util'

function Kpi({ label, children, sub, i }: { label: string; children: ReactNode; sub?: string; i: number }) {
  return (
    <motion.div className="mg-kpi fob-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 30 }}>
      <span className="mg-kpi-l">{label}</span>
      <b className="mg-kpi-v">{children}</b>
      {sub && <span className="mg-kpi-s">{sub}</span>}
    </motion.div>
  )
}

function cafDeAlerta(s: ProtoState, a: Alerta): CafeteriaId | null {
  return CAFS.find((c) => a.texto.startsWith(s.cafeterias[c].nombre)) ?? null
}

const activos = (s: ProtoState, c: CafeteriaId) => s.pedidos.filter((p) => p.cafeteria === c && (p.estado === 'recibido' || p.estado === 'preparando')).length

function Alertas({ s, ctl, now }: { s: ProtoState; ctl: PausaCtl; now: number }) {
  const toast = useToast()
  const lista = s.alertas.filter((a) => now - a.t < 120000).slice().reverse().slice(0, 3)
  const avisar = (c: CafeteriaId | null) => {
    const otras = CAFS.filter((x) => x !== c && !s.ajustes.pausa[x]).sort((a, b) => activos(s, a) - activos(s, b))
    const alt = otras[0]
    const txt = alt
      ? `${c ? s.cafeterias[c].nombre : 'Alguna cafetería'} tiene más espera ahora. Para recoger antes, pide en ${s.cafeterias[alt].nombre} (${s.cafeterias[alt].cubierta}).`
      : 'Hay más espera de la habitual en las cafeterías. Gracias por tu paciencia.'
    enviarMensaje(txt)
    toast({ titulo: 'Aviso enviado a los pasajeros', texto: txt, icono: 'megaphone' })
  }
  const quitar = (id: number) => update((st) => ({ ...st, alertas: st.alertas.filter((a) => a.id !== id) }))
  return (
    <div className="mg-alerts" aria-live="polite">
      <AnimatePresence initial={false}>
        {lista.length === 0 ? (
          <motion.div key="ok" className="mg-alert ok" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <span className="mg-alert-ico">
              <Ico name="ship" size={18} />
            </span>
            <div className="mg-alert-t">
              <b>Sin alertas</b>
              <span>La operación está dentro de los límites de carga de las cafeterías.</span>
            </div>
          </motion.div>
        ) : (
          lista.map((a) => {
            const c = cafDeAlerta(s, a)
            const pausada = c ? s.ajustes.pausa[c] : false
            return (
              <motion.div key={a.id} className="mg-alert" layout initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}>
                <span className="mg-alert-ico">
                  <Ico name="alert" size={18} />
                </span>
                <div className="mg-alert-t">
                  <b>{a.texto}</b>
                  <span>{hace(now - a.t)} · decide en un clic</span>
                </div>
                <div className="mg-alert-a">
                  {c && (
                    <button className="mg-btn" onClick={() => (pausada ? ctl.reanudar(c) : ctl.pausar(c, 5))}>
                      {pausada ? `Reanudar ${cuentaAtras(ctl.hasta[c], now)}` : 'Pausar 5 min'}
                    </button>
                  )}
                  <button className="mg-btn" onClick={() => setAjustes({ topePorFranja: s.ajustes.topePorFranja + 2 })}>
                    Subir tope de franja (+2)
                  </button>
                  <button className="mg-btn solid" onClick={() => avisar(c)}>
                    Avisar a pasajeros
                  </button>
                  <button className="mg-x" aria-label="Descartar alerta" onClick={() => quitar(a.id)}>
                    ×
                  </button>
                </div>
              </motion.div>
            )
          })
        )}
      </AnimatePresence>
    </div>
  )
}

function Carga({ s, ctl, now }: { s: ProtoState; ctl: PausaCtl; now: number }) {
  const max = Math.max(10, s.ajustes.topePorFranja)
  return (
    <Card title="Carga por cafetería" sub="Pedidos en curso ahora">
      <div className="mg-carga">
        {CAFS.map((c) => {
          const rec = s.pedidos.filter((p) => p.cafeteria === c && p.estado === 'recibido').length
          const pre = s.pedidos.filter((p) => p.cafeteria === c && p.estado === 'preparando').length
          const lis = s.pedidos.filter((p) => p.cafeteria === c && p.estado === 'listo').length
          const pausa = s.ajustes.pausa[c]
          const w = (n: number) => `${Math.min(100, (n / max) * 100)}%`
          return (
            <div key={c} className="mg-carga-r">
              <div className="mg-carga-h">
                <b>{s.cafeterias[c].nombre}</b>
                {pausa ? <span className="fob-pill amber">En pausa {cuentaAtras(ctl.hasta[c], now)}</span> : <span className="fob-pill green">Abierta</span>}
                <button className="mg-btn sm" onClick={() => ctl.alternar(c)} aria-label={`${pausa ? 'Reanudar' : 'Pausar'} ${s.cafeterias[c].nombre}`}>
                  <Ico name={pausa ? 'play' : 'pause'} size={14} />
                  {pausa ? 'Reanudar' : 'Pausar'}
                </button>
              </div>
              <div className="mg-bar" role="img" aria-label={`${rec} recibidos, ${pre} preparando, ${lis} listos`}>
                <motion.i style={{ background: C.sky }} animate={{ width: w(rec) }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} />
                <motion.i style={{ background: C.navy }} animate={{ width: w(pre) }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} />
                <motion.i style={{ background: C.teal }} animate={{ width: w(lis) }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} />
              </div>
              <div className="mg-carga-n">
                <span>
                  <i style={{ background: C.sky }} />
                  Recibido <b>{rec}</b>
                </span>
                <span>
                  <i style={{ background: C.navy }} />
                  Preparando <b>{pre}</b>
                </span>
                <span>
                  <i style={{ background: C.teal }} />
                  Listo <b>{lis}</b>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

type Ev = { key: string; t: number; tipo: 'nuevo' | 'listo' | 'entregado' | 'cancelado'; p: Pedido }
const EV_TXT: Record<Ev['tipo'], string> = { nuevo: 'Nuevo pedido', listo: 'Listo para recoger', entregado: 'Entregado', cancelado: 'Cancelado' }
const EV_COL: Record<Ev['tipo'], string> = { nuevo: C.navy, listo: C.teal, entregado: C.sky, cancelado: C.gold }

function Feed({ s, now }: { s: ProtoState; now: number }) {
  const evs = useMemo(() => {
    const out: Ev[] = []
    for (const p of s.pedidos) {
      if (p.t.creado) out.push({ key: `${p.id}n`, t: p.t.creado, tipo: 'nuevo', p })
      if (p.t.listo) out.push({ key: `${p.id}l`, t: p.t.listo, tipo: 'listo', p })
      if (p.t.entregado) out.push({ key: `${p.id}e`, t: p.t.entregado, tipo: 'entregado', p })
      if (p.t.cancelado) out.push({ key: `${p.id}c`, t: p.t.cancelado, tipo: 'cancelado', p })
    }
    return out.sort((a, b) => b.t - a.t).slice(0, 12)
  }, [s.pedidos])
  return (
    <Card title="Actividad en tiempo real" sub="Pedidos, entregas y cancelaciones" className="mg-feed-card">
      {evs.length === 0 && <p className="mg-empty">Aún no hay actividad. Cuando entren pedidos aparecerán aquí al instante.</p>}
      <ul className="mg-feed">
        <AnimatePresence initial={false}>
          {evs.map((e) => (
            <motion.li key={e.key} layout initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}>
              <span className="mg-feed-dot" style={{ background: EV_COL[e.tipo] }} />
              <div>
                <b>
                  {EV_TXT[e.tipo]} #{e.p.id}
                </b>
                <span>
                  {e.p.nombre} · {s.cafeterias[e.p.cafeteria].nombre.replace('Cafetería ', '')} · {eur(e.p.total)}
                  {e.p.prepedido && e.tipo === 'nuevo' ? ' · pre-pedido' : ''}
                  {e.p.sinPlastico && e.tipo === 'nuevo' ? ' · sin cubiertos' : ''}
                  {e.p.tarifaJoven && e.tipo === 'nuevo' ? ' · Tarifa Joven' : ''}
                </span>
              </div>
              <time>{hace(now - e.t)}</time>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Card>
  )
}

function MiniInventario({ s, onOpen }: { s: ProtoState; onOpen: () => void }) {
  const valor = s.insumos.reduce((a, i) => a + i.stock * i.coste, 0)
  const bajos = s.insumos.filter((i) => i.stock <= i.minimo).length
  const frio = ocupacionFrio(s)
  const pctFrio = s.almacen.frioLitros > 0 ? (frio / s.almacen.frioLitros) * 100 : 0
  const riesgo = s.productos.filter((p) => porciones(s, p.id) <= s.ajustes.umbralStock * 2).length
  return (
    <Card title="Inventario" sub="Stock por escandallo" right={<button className="mg-btn sm" onClick={onOpen}>Abrir sección</button>}>
      <div className="mg-iv-mini">
        <div>
          <span>Valor</span>
          <b>{eur(valor)}</b>
        </div>
        <div>
          <span>Bajo mínimo</span>
          <b style={bajos ? { color: '#9b1015' } : undefined}>{bajos}</b>
        </div>
        <div>
          <span>Frío ocupado</span>
          <b>{num(pctFrio)} %</b>
        </div>
        <div>
          <span>En riesgo</span>
          <b style={riesgo ? { color: '#8a5f00' } : undefined}>{riesgo}</b>
        </div>
      </div>
    </Card>
  )
}

function Franjas({ s }: { s: ProtoState }) {
  const f = s.ajustes.franjaMin
  const data = useMemo(() => {
    const cur = Math.max(1, Math.ceil((s.viaje.minuto + 5) / f))
    const desde = Math.max(1, cur - 2)
    const rows = []
    for (let idx = desde; idx < desde + 9; idx++) {
      const row: Record<string, number | string> = { h: horaDe(s, idx * f) }
      for (const c of CAFS) row[c] = s.pedidos.filter((p) => p.cafeteria === c && p.franja === idx && p.estado !== 'cancelado').length
      rows.push(row)
    }
    return rows
  }, [s, f])
  const tope = s.ajustes.topePorFranja
  return (
    <Card title="Pedidos por franja de recogida" sub={`Franjas de ${f} min por cafetería · línea = tope (${tope})`}>
      <div className="mg-chart" style={{ height: 230 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="#e8edf5" />
            <XAxis dataKey="h" tick={{ fontSize: 11, fill: '#5d6779' }} tickLine={false} axisLine={{ stroke: '#d5dce8' }} />
            <YAxis allowDecimals={false} domain={[0, (m: number) => Math.max(m, tope) + 1]} tick={{ fontSize: 11, fill: '#5d6779' }} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: '#eef3fb' }} contentStyle={{ borderRadius: 10, border: '1px solid #e2e7ef', fontSize: 12 }} />
            <ReferenceLine y={tope} stroke={C.gold} strokeDasharray="5 4" />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            {CAFS.map((c) => (
              <Bar key={c} dataKey={c} name={s.cafeterias[c].nombre.replace('Cafetería ', '')} fill={CAF_COLOR[c]} radius={[3, 3, 0, 0]} animationDuration={500} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default function Vivo({ s, ctl, onInventario }: { s: ProtoState; ctl: PausaCtl; onInventario?: () => void }) {
  const now = useNow(1000)
  const k = kpis(s)
  const recog = k.recogidaMediaSeg
  return (
    <div className="mg-sec">
      <Alertas s={s} ctl={ctl} now={now} />
      <div className="mg-kpis">
        <Kpi i={0} label="Pedidos">
          <Counter value={k.pedidos} />
        </Kpi>
        <Kpi i={1} label="Ventas">
          <Counter value={k.ventas} decimals={2} suffix=" €" />
        </Kpi>
        <Kpi i={2} label="Ticket medio" sub={`Base real ${num(s.base.ticketMedio, 2)} €`}>
          <Counter value={k.ticketMedio} decimals={2} suffix=" €" />
        </Kpi>
        <Kpi i={3} label="Adopción" sub={`${k.compradores} de ${s.base.pasajeros} pasajeros`}>
          <Counter value={k.adopcion * 100} decimals={1} suffix=" %" />
        </Kpi>
        <Kpi i={4} label="Pre-pedidos" sub={k.pedidos ? `${num((k.prepedidos / k.pedidos) * 100)} % del total` : 'antes de zarpar'}>
          <Counter value={k.prepedidos} />
        </Kpi>
        <Kpi i={5} label="En cola" sub="recibido + preparando">
          <Counter value={k.enCola} />
        </Kpi>
        <Kpi i={6} label="Listos" sub="esperando recogida">
          <Counter value={k.listos} />
        </Kpi>
        <Kpi i={7} label="Listo → recogida" sub="tiempo medio">
          {recog > 0 ? <Counter value={recog} suffix=" s" /> : <span className="mg-nd">—</span>}
        </Kpi>
      </div>
      <div className="mg-grid2">
        <div className="mg-col">
          <Card title="Flota y ruta" sub={`${s.viaje.origen} → ${s.viaje.destino} · ${horaDe(s, s.viaje.minuto)}`}>
            <Mapa s={s} />
          </Card>
          <Franjas s={s} />
        </div>
        <div className="mg-col">
          <Carga s={s} ctl={ctl} now={now} />
          {onInventario && <MiniInventario s={s} onOpen={onInventario} />}
          <Feed s={s} now={now} />
        </div>
      </div>
    </div>
  )
}
