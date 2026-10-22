import { ReactNode, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  CONSUMO_POR_PASAJERO,
  Insumo,
  LineaEscandallo,
  ProtoState,
  TipoMovimiento,
  costeProducto,
  eur,
  insumoLimitante,
  movimientoInventario,
  ocupacionFrio,
  planAprovisionamiento,
  porciones,
  recibirCatering,
  recibirCompraSemanal,
  setEscandallo,
  setMinimoInsumo,
} from '../store'
import { useToast } from '../shared'
import { C, Card, Counter, Ico, NumField, hhmm, num } from './util'

// ---------------------------------------------------------------- utilidades
type Tab = 'resumen' | 'escandallos' | 'insumos' | 'plan' | 'movimientos'
const TABS: { id: Tab; l: string }[] = [
  { id: 'resumen', l: 'Resumen' },
  { id: 'escandallos', l: 'Escandallos' },
  { id: 'insumos', l: 'Insumos' },
  { id: 'plan', l: 'Aprovisionamiento' },
  { id: 'movimientos', l: 'Movimientos' },
]

/** Cantidad legible: g → kg y ml → l a partir de 1.000. */
export function fmtQ(q: number, u: Insumo['unidad']) {
  if (u === 'g') return q >= 1000 ? `${num(q / 1000, 2)} kg` : `${num(q)} g`
  if (u === 'ml') return q >= 1000 ? `${num(q / 1000, 2)} l` : `${num(q)} ml`
  return `${num(q)} ud`
}
const fmtCoste = (i: Insumo) => (i.unidad === 'ud' ? `${num(i.coste, 2)} €/ud` : `${num(i.coste * 1000, 2)} €/${i.unidad === 'g' ? 'kg' : 'l'}`)
const stepDe = (i: Insumo) => (i.unidad === 'ud' ? ((i.envase ?? 1) >= 20 ? 5 : 1) : 50)
const valorInsumo = (i: Insumo) => i.stock * i.coste
const nivel = (i: Insumo): 'ko' | 'warn' | 'ok' => (i.stock <= i.minimo ? 'ko' : i.stock <= i.minimo * 1.5 ? 'warn' : 'ok')
const PILL = { ko: 'red', warn: 'amber', ok: 'green' } as const

function Kpi({ label, children, sub, i, tono }: { label: string; children: ReactNode; sub?: string; i: number; tono?: 'ko' | 'warn' }) {
  return (
    <motion.div className="mg-kpi fob-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 30 }}>
      <span className="mg-kpi-l">{label}</span>
      <b className="mg-kpi-v" style={tono ? { color: tono === 'ko' ? '#9b1015' : '#8a5f00' } : undefined}>
        {children}
      </b>
      {sub && <span className="mg-kpi-s">{sub}</span>}
    </motion.div>
  )
}

function Gauge({ valor, max }: { valor: number; max: number }) {
  const pct = max > 0 ? valor / max : 0
  const col = pct > 1 ? '#d7141a' : pct > 0.85 ? '#e3a600' : C.navy
  return (
    <div className="mg-gauge" role="img" aria-label={`Cámara de frío ocupada al ${Math.round(pct * 100)} por ciento`}>
      <svg viewBox="0 0 200 118">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#eef2f8" strokeWidth="16" strokeLinecap="round" />
        <motion.path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={col} strokeWidth="16" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: Math.min(1, pct) }} transition={{ type: 'spring', stiffness: 90, damping: 20 }} />
      </svg>
      <div className="mg-gauge-t">
        <b>
          <Counter value={pct * 100} suffix=" %" />
        </b>
        <span>
          {num(valor, 1)} de {num(max)} l
        </span>
      </div>
    </div>
  )
}

function Tabs({ tab, set }: { tab: Tab; set: (t: Tab) => void }) {
  return (
    <div className="mg-filtros mg-iv-tabs" role="tablist" aria-label="Apartados de inventario">
      {TABS.map((t) => (
        <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => set(t.id)}>
          {t.l}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- RESUMEN
function Resumen({ s, ir }: { s: ProtoState; ir: (t: Tab) => void }) {
  const valor = s.insumos.reduce((a, i) => a + valorInsumo(i), 0)
  const bajos = s.insumos.filter((i) => i.stock <= i.minimo)
  const mermas = s.movimientos.filter((m) => m.tipo === 'merma').reduce((a, m) => a + Math.abs(m.delta) * (s.insumos.find((i) => i.id === m.iid)?.coste ?? 0), 0)
  const frio = ocupacionFrio(s)
  const umbral = s.ajustes.umbralStock * 2
  const prods = useMemo(
    () =>
      s.productos
        .map((p) => ({ p, n: porciones(s, p.id), lim: insumoLimitante(s, p.id) }))
        .sort((a, b) => a.n - b.n),
    [s],
  )
  const riesgo = prods.filter((x) => x.n <= umbral)
  const lista = prods.slice(0, 6)
  return (
    <div className="mg-sec">
      <div className="mg-kpis">
        <Kpi i={0} label="Valor del inventario" sub="stock × coste unitario">
          <Counter value={valor} decimals={2} suffix=" €" />
        </Kpi>
        <Kpi i={1} label="Insumos bajo mínimo" sub={bajos.length ? bajos.slice(0, 2).map((i) => i.nombre).join(', ') + (bajos.length > 2 ? '…' : '') : `de ${s.insumos.length} insumos`} tono={bajos.length ? 'ko' : undefined}>
          <Counter value={bajos.length} />
        </Kpi>
        <Kpi i={2} label="Mermas de la travesía" sub={mermas ? 'registradas a coste' : 'sin mermas registradas'}>
          <Counter value={mermas} decimals={2} suffix=" €" />
        </Kpi>
        <Kpi i={3} label="Productos en riesgo" sub={`porciones ≤ ${umbral} (umbral × 2)`} tono={riesgo.length ? 'warn' : undefined}>
          <Counter value={riesgo.length} />
        </Kpi>
      </div>
      <div className="mg-grid2 even">
        <Card title="Cámara de frío" sub="Ocupación actual de los perecederos refrigerados">
          <Gauge valor={frio} max={s.almacen.frioLitros} />
          <p className="mg-nota">
            <Ico name="alert" size={14} />
            <span>El frío del buque es limitado: la cantidad de catering fresco que se puede cargar depende de esta capacidad.</span>
          </p>
        </Card>
        <Card title="Riesgo de rotura" sub="Productos con menos porciones y el insumo que los limita" right={<button className="mg-btn sm" onClick={() => ir('plan')}>Planificar pedido</button>}>
          <ul className="mg-crit">
            {lista.map(({ p, n, lim }) => {
              const tono = n <= s.ajustes.umbralStock ? 'ko' : n <= umbral ? 'warn' : 'ok'
              return (
                <motion.li key={p.id} layout>
                  <span className={`mg-dot ${tono}`} aria-hidden />
                  <div>
                    <b>{p.nombre}</b>
                    <span>{lim ? `Limita: ${lim.nombre} (${fmtQ(lim.stock, lim.unidad)})` : 'Sin escandallo'}</span>
                  </div>
                  <div className="mg-crit-r">
                    <b>{Number.isFinite(n) ? num(n) : '—'}</b>
                    <span className={`mg-crit-s ${tono}`}>{tono === 'ko' ? 'Crítico' : tono === 'warn' ? 'En riesgo' : 'Correcto'}</span>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </Card>
      </div>
      {bajos.length > 0 && (
        <Card title="Insumos bajo mínimo" sub="Reposición según su aprovisionamiento">
          <ul className="mg-crit">
            {bajos.map((i) => (
              <li key={i.id}>
                <span className="mg-dot ko" aria-hidden />
                <div>
                  <b>{i.nombre}</b>
                  <span>
                    Mínimo {fmtQ(i.minimo, i.unidad)} · {i.aprovisionamiento}
                  </span>
                </div>
                <div className="mg-crit-r">
                  <b>{fmtQ(i.stock, i.unidad)}</b>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card title="Contexto facilitado por Fred. Olsen" className="mg-iv-ctx">
        <ul className="mg-iv-ctxl">
          <li>Aprovisionamiento: compra semanal de aguas, refrescos, café, snacks y no perecederos; catering fresco recibido a diario.</li>
          <li>Cada referencia de venta tiene un escandallo: al vender una unidad, el sistema descuenta sus insumos.</li>
          <li>Hoy el equipo se avisa de palabra cuando algo se agota; su programa tiene una función para registrar el inventario inicial de perecederos que aún no está activada.</li>
          <li>No hay máquinas expendedoras: es un servicio externalizado.</li>
          <li>El frío es la limitación de capacidad. No hay frecuencia cuantificada de roturas de stock ni datos de edad de los pasajeros.</li>
        </ul>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------- ESCANDALLOS
function EditorEscandallo({ s, pid }: { s: ProtoState; pid: string }) {
  const lineas = s.escandallos[pid] ?? []
  const usados = new Set(lineas.map((l) => l.iid))
  const libres = s.insumos.filter((i) => !usados.has(i.id))
  const guardar = (l: LineaEscandallo[]) => setEscandallo(pid, l)
  const cambiar = (idx: number, patch: Partial<LineaEscandallo>) => guardar(lineas.map((l, k) => (k === idx ? { ...l, ...patch } : l)))
  return (
    <div className="mg-iv-ed">
      <p className="mg-nota" style={{ marginTop: 0 }}>
        <Ico name="caja" size={14} />
        <span>Al vender una unidad se descuentan estos insumos del inventario. Es el mismo sistema de escandallo que ya usa Fred. Olsen.</span>
      </p>
      <ul className="mg-iv-lin">
        <AnimatePresence initial={false}>
          {lineas.map((l, idx) => {
            const ins = s.insumos.find((i) => i.id === l.iid)
            if (!ins) return null
            return (
              <motion.li key={l.iid} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}>
                <select className="mg-iv-sel" aria-label="Insumo de la línea" value={l.iid} onChange={(e) => cambiar(idx, { iid: e.target.value })}>
                  <option value={l.iid}>{ins.nombre}</option>
                  {libres.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre}
                    </option>
                  ))}
                </select>
                <NumField label={`Cantidad de ${ins.nombre}`} value={l.qty} min={0.01} step={ins.unidad === 'ud' ? 1 : 5} suffix={ins.unidad} onCommit={(n) => cambiar(idx, { qty: n })} />
                <span className="mg-iv-lc">{eur(l.qty * ins.coste)}</span>
                <button className="mg-x" aria-label={`Quitar ${ins.nombre}`} onClick={() => guardar(lineas.filter((_, k) => k !== idx))}>
                  ×
                </button>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
      {lineas.length === 0 && <p className="mg-empty">Sin insumos: este producto no descuenta inventario.</p>}
      <div className="mg-iv-edf">
        <button className="mg-btn" disabled={!libres.length} onClick={() => guardar([...lineas, { iid: libres[0].id, qty: libres[0].unidad === 'ud' ? 1 : 10 }])}>
          + Añadir insumo
        </button>
        <span className="mg-sub">Coste de materia prima: <b>{eur(costeProducto(s, pid))}</b></span>
      </div>
    </div>
  )
}

function Escandallos({ s }: { s: ProtoState }) {
  const [abierto, setAbierto] = useState<string | null>(null)
  return (
    <Card title="Escandallos de los productos de venta" sub="Pulsa un producto para ver y editar su receta">
      <div className="mg-iv-tbl" role="table">
        <div className="mg-iv-row mg-iv-esc mg-iv-th" role="row">
          <span>Producto</span>
          <span>Precio</span>
          <span>Coste materia prima</span>
          <span>Margen</span>
          <span>Porciones</span>
          <span />
        </div>
        {s.productos.map((p) => {
          const coste = costeProducto(s, p.id)
          const margen = p.precio - coste
          const pct = p.precio > 0 ? (margen / p.precio) * 100 : 0
          const n = porciones(s, p.id)
          const on = abierto === p.id
          return (
            <div key={p.id} className={`mg-iv-grp${on ? ' on' : ''}`}>
              <button className="mg-iv-row mg-iv-esc mg-iv-click" aria-expanded={on} onClick={() => setAbierto(on ? null : p.id)}>
                <span className="mg-iv-nm">
                  <b>{p.nombre}</b>
                  <small>{p.cat}</small>
                </span>
                <span className="c" data-l="Precio">{eur(p.precio)}</span>
                <span className="c" data-l="Coste">{eur(coste)}</span>
                <span className="c" data-l="Margen">
                  <b>{eur(margen)}</b> <small className={pct < 40 ? 'warn' : ''}>({num(pct, 0)} %)</small>
                </span>
                <span className="c" data-l="Porciones">
                  {Number.isFinite(n) ? num(n) : '—'}
                </span>
                <motion.span className="mg-iv-chev" animate={{ rotate: on ? 90 : 0 }} aria-hidden>
                  ›
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                    <EditorEscandallo s={s} pid={p.id} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- INSUMOS
function Insumos({ s }: { s: ProtoState }) {
  const [f, setF] = useState<'todos' | Insumo['aprovisionamiento']>('todos')
  const lista = s.insumos.filter((i) => f === 'todos' || i.aprovisionamiento === f)
  const opts: { id: typeof f; l: string }[] = [
    { id: 'todos', l: `Todos (${s.insumos.length})` },
    { id: 'catering diario', l: `Catering diario (${s.insumos.filter((i) => i.aprovisionamiento === 'catering diario').length})` },
    { id: 'compra semanal', l: `Compra semanal (${s.insumos.filter((i) => i.aprovisionamiento === 'compra semanal').length})` },
  ]
  return (
    <Card
      title="Insumos"
      sub={`Última compra semanal: ${s.aprovisionamiento.ultimaCompraSemanal} · último catering: ${s.aprovisionamiento.ultimaRecepcionCatering}`}
      right={<span className="fob-pill">Valor total {eur(lista.reduce((a, i) => a + valorInsumo(i), 0))}</span>}
    >
      <div className="mg-filtros" role="group" aria-label="Filtrar por aprovisionamiento" style={{ marginBottom: 8 }}>
        {opts.map((o) => (
          <button key={o.id} className={f === o.id ? 'on' : ''} aria-pressed={f === o.id} onClick={() => setF(o.id)}>
            {o.l}
          </button>
        ))}
      </div>
      <div className="mg-iv-tbl" role="table">
        <div className="mg-iv-row mg-iv-ins mg-iv-th" role="row">
          <span>Insumo</span>
          <span>Tipo</span>
          <span>Conservación</span>
          <span>Aprovisionamiento</span>
          <span>Stock</span>
          <span>Mínimo</span>
          <span>Coste unitario</span>
          <span>Valor</span>
        </div>
        <AnimatePresence initial={false}>
          {lista.map((i) => {
            const nv = nivel(i)
            return (
              <motion.div key={i.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mg-iv-row mg-iv-ins">
                <span className="mg-iv-nm">
                  <b>{i.nombre}</b>
                  <small>{i.unidad}</small>
                </span>
                <span className="c" data-l="Tipo">
                  <span className={`fob-pill ${i.tipo === 'perecedero' ? 'amber' : ''}`}>{i.tipo === 'perecedero' ? 'Perecedero' : 'No perecedero'}</span>
                </span>
                <span className="c" data-l="Conservación">{i.conservacion === 'frio' ? 'Frío' : 'Seco'}</span>
                <span className="c" data-l="Aprovisionamiento">{i.aprovisionamiento === 'catering diario' ? 'Catering diario' : 'Compra semanal'}</span>
                <span className="c" data-l="Stock">
                  <b>{fmtQ(i.stock, i.unidad)}</b>{' '}
                  <span className={`fob-pill ${PILL[nv]}`}>{nv === 'ko' ? 'Bajo mínimo' : nv === 'warn' ? 'Cerca' : 'OK'}</span>
                </span>
                <span className="c" data-l="Mínimo">
                  <NumField label={`Mínimo de ${i.nombre}`} value={i.minimo} step={stepDe(i)} suffix={i.unidad} onCommit={(n) => setMinimoInsumo(i.id, n)} />
                </span>
                <span className="c" data-l="Coste unitario">{fmtCoste(i)}</span>
                <span className="c" data-l="Valor"><b>{eur(valorInsumo(i))}</b></span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- PLAN
function fuenteInsumo(s: ProtoState, iid: string): { t: string; tono: string } {
  const set = new Set<string>()
  for (const [pid, c] of Object.entries(CONSUMO_POR_PASAJERO)) if (s.escandallos[pid]?.some((l) => l.iid === iid)) set.add(c.fuente)
  if (set.size === 0) return { t: 'Sin consumo previsto', tono: '' }
  if (set.size === 2) return { t: 'Real + est.', tono: 'amber' }
  return set.has('real') ? { t: 'Real Bajamar', tono: 'green' } : { t: 'Estimado', tono: 'amber' }
}

type Par = { pas: number; margen: number; tipo: Insumo['aprovisionamiento'] }

function Plan({ s, par, setPar }: { s: ProtoState; par: Par; setPar: (p: Par) => void }) {
  const toast = useToast()
  const [ok, setOk] = useState(false)
  const plan = useMemo(() => planAprovisionamiento(s, par.pas, par.margen / 100, par.tipo), [s, par])
  const pedidas = plan.lineas.filter((l) => l.pedir > 0)
  const pct = plan.capacidadFrio > 0 ? plan.litrosFrio / plan.capacidadFrio : 0
  const barCol = plan.excedeFrio ? '#d7141a' : pct > 0.85 ? '#e3a600' : C.navy
  const topFrio = [...plan.lineas].filter((l) => l.litrosFrio > 0).sort((a, b) => b.litrosFrio - a.litrosFrio).slice(0, 3)
  const catering = par.tipo === 'catering diario'

  const confirmar = () => {
    const cant: Record<string, number> = {}
    for (const l of plan.lineas) cant[l.insumo.id] = l.pedir
    if (catering) recibirCatering(cant)
    else recibirCompraSemanal(cant)
    toast({ titulo: 'Recepción registrada', texto: `${catering ? 'Catering diario' : 'Compra semanal'}: ${pedidas.length} insumos · ${eur(plan.coste)}`, icono: 'box' })
    setOk(true)
    window.setTimeout(() => setOk(false), 2500)
  }
  const exportar = () => {
    const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const head = ['aprovisionamiento', 'insumo', 'unidad', 'necesidad_prevista', 'stock', 'cantidad_a_pedir', 'envase', 'coste_unitario_eur', 'coste_total_eur']
    const rows = plan.lineas.map((l) => [par.tipo, l.insumo.nombre, l.insumo.unidad, l.necesidad, Math.round(l.insumo.stock), l.pedir, l.insumo.envase ?? 1, l.insumo.coste.toString().replace('.', ','), (l.pedir * l.insumo.coste).toFixed(2).replace('.', ',')].map(q).join(';'))
    const blob = new Blob(['﻿' + [head.map(q).join(';'), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pedido-${par.tipo.replace(' ', '-')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const pasPct = ((par.pas - 500) / 4500) * 100
  const marPct = (par.margen / 30) * 100

  return (
    <div className="mg-sec">
      <div className="mg-grid2 even">
        <Card title="Previsión" sub="Supuestos editables para calcular el pedido">
          <p className="mg-lbl">Tipo de aprovisionamiento</p>
          <div className="fob-seg mg-seg" role="group" aria-label="Tipo de aprovisionamiento">
            {(['catering diario', 'compra semanal'] as const).map((t) => (
              <button key={t} className={par.tipo === t ? 'on' : ''} aria-pressed={par.tipo === t} onClick={() => setPar({ ...par, tipo: t })}>
                {t === 'catering diario' ? 'Catering diario' : 'Compra semanal'}
              </button>
            ))}
          </div>
          <div className="mg-regla-h" style={{ marginTop: 14 }}>
            <b>Pasajeros previstos</b>
            <NumField label="Pasajeros previstos" value={par.pas} min={0} max={20000} step={50} onCommit={(n) => setPar({ ...par, pas: n })} />
          </div>
          <input type="range" className="mg-range" aria-label="Pasajeros previstos" min={500} max={5000} step={50} value={clampN(par.pas, 500, 5000)} style={{ ['--p' as string]: `${pasPct}%` }} onChange={(e) => setPar({ ...par, pas: Number(e.target.value) })} />
          <p className="mg-nota" style={{ marginTop: 0 }}>
            <Ico name="alert" size={14} />
            <span>Supuesto por defecto: 2.300 pasajeros al día (8 salidas × ≈ 290). Es una hipótesis del equipo, no un dato de la naviera: ajústala a la previsión real.</span>
          </p>
          <div className="mg-regla-h" style={{ marginTop: 14 }}>
            <b>Margen de seguridad</b>
            <output>{par.margen} %</output>
          </div>
          <input type="range" className="mg-range" aria-label="Margen de seguridad en porcentaje" min={0} max={30} step={1} value={par.margen} style={{ ['--p' as string]: `${marPct}%` }} onChange={(e) => setPar({ ...par, margen: Number(e.target.value) })} />
          <p className="mg-nota" style={{ marginTop: 0 }}>
            <span>Se suma a la necesidad prevista para reducir faltas. A más margen, más riesgo de merma y de saturar el frío.</span>
          </p>
        </Card>
        <Card title="Capacidad de la cámara de frío" sub="Previsión tras la recepción (stock actual + pedido)">
          {catering ? (
            <>
              <div className="mg-iv-fbar" role="img" aria-label={`Frío previsto ${num(plan.litrosFrio, 1)} de ${plan.capacidadFrio} litros`}>
                <motion.i animate={{ width: `${Math.min(100, pct * 100)}%`, background: barCol }} transition={{ type: 'spring', stiffness: 140, damping: 24 }} />
              </div>
              <div className="mg-iv-fl">
                <b style={{ color: plan.excedeFrio ? '#9b1015' : undefined }}>
                  {num(plan.litrosFrio, 1)} l <small>de {num(plan.capacidadFrio)} l ({num(pct * 100, 0)} %)</small>
                </b>
                <span className="fob-muted">Hoy en cámara: {num(ocupacionFrio(s), 1)} l</span>
              </div>
              <AnimatePresence>
                {plan.excedeFrio && (
                  <motion.div role="alert" className="mg-iv-aviso" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <b>El pedido no cabe en la cámara de frío: reduce perecederos o reparte entregas.</b>
                    <span>Sobran {num(plan.litrosFrio - plan.capacidadFrio, 1)} l. Mayor ocupación: {topFrio.map((l) => `${l.insumo.nombre} (${num(l.litrosFrio, 1)} l)`).join(', ')}.</span>
                  </motion.div>
                )}
              </AnimatePresence>
              {!plan.excedeFrio && topFrio.length > 0 && <p className="mg-nota">Mayor ocupación de frío: {topFrio.map((l) => `${l.insumo.nombre} (${num(l.litrosFrio, 1)} l)`).join(', ')}.</p>}
            </>
          ) : (
            <p className="mg-empty">La compra semanal es de productos en seco (agua, refrescos, café, snacks): no ocupa la cámara de frío. Cambia a «Catering diario» para comprobar el frío.</p>
          )}
        </Card>
      </div>

      <Card
        title={`Propuesta de pedido · ${catering ? 'catering diario' : 'compra semanal'}`}
        sub={`${num(par.pas)} pasajeros · margen ${par.margen} % · cantidades redondeadas al envase`}
        right={
          <div className="mg-iv-acts">
            <button className="mg-btn" onClick={exportar}>
              <Ico name="download" size={15} />
              Exportar pedido (CSV)
            </button>
            <button className={`mg-btn solid mg-iv-conf${ok ? ' done' : ''}`} onClick={confirmar} disabled={plan.excedeFrio || pedidas.length === 0} title={plan.excedeFrio ? 'No cabe en la cámara de frío' : undefined}>
              {ok ? 'Recepción registrada' : 'Confirmar recepción'}
            </button>
          </div>
        }
      >
        <div className="mg-iv-tbl" role="table">
          <div className="mg-iv-row mg-iv-pl mg-iv-th" role="row">
            <span>Insumo</span>
            <span>Necesidad prevista</span>
            <span>Stock</span>
            <span>A pedir</span>
            <span>Coste</span>
            <span>Consumo</span>
          </div>
          {plan.lineas.map((l) => {
            const f = fuenteInsumo(s, l.insumo.id)
            const i = l.insumo
            return (
              <motion.div key={i.id} layout className={`mg-iv-row mg-iv-pl${l.pedir === 0 ? ' nada' : ''}`}>
                <span className="mg-iv-nm">
                  <b>{i.nombre}</b>
                  <small>
                    {i.conservacion === 'frio' ? 'Frío' : 'Seco'} · envase {fmtQ(i.envase ?? 1, i.unidad)}
                  </small>
                </span>
                <span className="c" data-l="Necesidad">{fmtQ(l.necesidad, i.unidad)}</span>
                <span className="c" data-l="Stock">{fmtQ(i.stock, i.unidad)}</span>
                <span className="c" data-l="A pedir">{l.pedir > 0 ? <b>{fmtQ(l.pedir, i.unidad)}</b> : <span className="mg-nd">Sin pedido</span>}</span>
                <span className="c" data-l="Coste">{l.pedir > 0 ? eur(l.pedir * i.coste) : '—'}</span>
                <span className="c" data-l="Consumo"><span className={`fob-pill ${f.tono}`}>{f.t}</span></span>
              </motion.div>
            )
          })}
          <div className="mg-iv-row mg-iv-pl mg-iv-tot">
            <span className="mg-iv-nm"><b>Total del pedido</b></span>
            <span className="c" />
            <span className="c" />
            <span className="c">{pedidas.length} insumos</span>
            <span className="c"><b>{eur(plan.coste)}</b></span>
            <span className="c" />
          </div>
        </div>
        <p className="mg-nota">
          <Ico name="alert" size={14} />
          <span>
            El pedido cubre la necesidad prevista más el margen y deja el stock por encima del mínimo. «Confirmar recepción» suma estas cantidades al inventario y queda registrado como entrada.
            {plan.excedeFrio && ' Está desactivado porque el pedido no cabe en el frío.'}
          </span>
        </p>
      </Card>

      <Card title="Hipótesis de consumo por pasajero" sub="Real = unidades del informe del Bajamar Express (ene–abr 2026) ÷ ≈166.453 pasajeros estimados. Est. = estimación del equipo.">
        <div className="mg-iv-hip">
          {Object.entries(CONSUMO_POR_PASAJERO)
            .sort((a, b) => b[1].u - a[1].u)
            .map(([pid, c]) => (
              <div key={pid}>
                <b>{s.productos.find((p) => p.id === pid)?.nombre ?? pid}</b>
                <span>
                  {num(c.u * 1000, 1)} ud / 1.000 pas. · <b>{num(c.u * par.pas)}</b> ud previstas
                </span>
                <span className={`fob-pill ${c.fuente === 'real' ? 'green' : 'amber'}`}>{c.fuente === 'real' ? 'Real Bajamar' : 'Estimado'}</span>
              </div>
            ))}
        </div>
      </Card>
    </div>
  )
}
const clampN = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

// ---------------------------------------------------------------- MOVIMIENTOS
const TIPO_L: Record<TipoMovimiento, string> = { venta: 'Venta', cancelacion: 'Cancelación', entrada: 'Entrada', merma: 'Merma', ajuste: 'Ajuste' }
const TIPO_P: Record<TipoMovimiento, string> = { venta: '', cancelacion: 'green', entrada: 'green', merma: 'red', ajuste: 'amber' }

function Movimientos({ s }: { s: ProtoState }) {
  const toast = useToast()
  const [tipo, setTipo] = useState<'todos' | TipoMovimiento>('todos')
  const [iid, setIid] = useState('todos')
  const [mi, setMi] = useState(s.insumos[0]?.id ?? '')
  const [mt, setMt] = useState<'merma' | 'entrada'>('merma')
  const [mq, setMq] = useState(1)
  const por = (iid2: string) => s.insumos.find((i) => i.id === iid2)
  const totales = useMemo(() => {
    const t: Record<TipoMovimiento, { n: number; v: number }> = { venta: { n: 0, v: 0 }, cancelacion: { n: 0, v: 0 }, entrada: { n: 0, v: 0 }, merma: { n: 0, v: 0 }, ajuste: { n: 0, v: 0 } }
    for (const m of s.movimientos) {
      t[m.tipo].n++
      t[m.tipo].v += Math.abs(m.delta) * (por(m.iid)?.coste ?? 0)
    }
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.movimientos, s.insumos])
  const filtrados = useMemo(() => s.movimientos.filter((m) => (tipo === 'todos' || m.tipo === tipo) && (iid === 'todos' || m.iid === iid)).slice().reverse().slice(0, 60), [s.movimientos, tipo, iid])
  const datos = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const m of s.movimientos) if (m.tipo === 'venta' || m.tipo === 'cancelacion') acc[m.iid] = (acc[m.iid] ?? 0) - m.delta
    return Object.entries(acc)
      .map(([id, q]) => {
        const i = s.insumos.find((x) => x.id === id)
        return { id, nombre: i?.nombre ?? id, q, v: Math.round(q * (i?.coste ?? 0) * 100) / 100, u: i?.unidad ?? 'ud' }
      })
      .filter((d) => d.q > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 8)
  }, [s.movimientos, s.insumos])
  const ins = por(mi)
  const registrar = () => {
    if (!ins || mq <= 0) return
    movimientoInventario(ins.id, mt === 'merma' ? -mq : mq, mt, mt === 'merma' ? 'Merma manual' : 'Entrada manual')
    toast({ titulo: mt === 'merma' ? 'Merma registrada' : 'Entrada registrada', texto: `${ins.nombre}: ${fmtQ(mq, ins.unidad)}`, icono: 'box' })
  }
  return (
    <div className="mg-sec">
      <div className="mg-grid2">
        <Card title="Consumo por insumo en la travesía" sub="Valor a coste de lo descontado por ventas (neto de cancelaciones)">
          {datos.length === 0 ? (
            <p className="mg-empty">Aún no hay consumo. Aparecerá aquí cuando se vendan pedidos.</p>
          ) : (
            <div className="mg-chart" style={{ height: datos.length * 30 + 28 }}>
              <ResponsiveContainer>
                <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="#e8edf5" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#5d6779' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} €`} />
                  <YAxis type="category" dataKey="nombre" width={118} tick={{ fontSize: 11, fill: '#1c2433' }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#eef3fb' }} contentStyle={{ borderRadius: 10, border: '1px solid #e2e7ef', fontSize: 12 }} formatter={(v: number, _n, p) => [`${eur(v)} · ${fmtQ(p.payload.q, p.payload.u)}`, 'Consumo']} />
                  <Bar dataKey="v" radius={[0, 4, 4, 0]} animationDuration={500}>
                    {datos.map((d, k) => (
                      <Cell key={d.id} fill={k === 0 ? C.navy : '#6f97d6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <div className="mg-col">
          <Card title="Totales por tipo" sub={`${s.movimientos.length} movimientos registrados`}>
            <ul className="mg-iv-tot5">
              {(Object.keys(TIPO_L) as TipoMovimiento[]).map((t) => (
                <li key={t}>
                  <span className={`fob-pill ${TIPO_P[t]}`}>{TIPO_L[t]}</span>
                  <span>{totales[t].n} mov.</span>
                  <b>{eur(totales[t].v)}</b>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Registrar movimiento" sub="Mermas (roturas, caducados) o entradas manuales">
            <div className="mg-iv-form">
              <select className="mg-iv-sel" aria-label="Insumo" value={mi} onChange={(e) => setMi(e.target.value)}>
                {s.insumos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre}
                  </option>
                ))}
              </select>
              <div className="fob-seg mg-seg" role="group" aria-label="Tipo de movimiento">
                <button className={mt === 'merma' ? 'on' : ''} aria-pressed={mt === 'merma'} onClick={() => setMt('merma')}>Merma</button>
                <button className={mt === 'entrada' ? 'on' : ''} aria-pressed={mt === 'entrada'} onClick={() => setMt('entrada')}>Entrada</button>
              </div>
              <NumField label="Cantidad" value={mq} min={0} step={ins ? stepDe(ins) : 1} suffix={ins?.unidad} onCommit={setMq} />
              <button className="mg-btn solid" onClick={registrar} disabled={mq <= 0}>Registrar</button>
            </div>
          </Card>
        </div>
      </div>
      <Card title="Histórico de movimientos" sub="Los 60 más recientes que cumplen el filtro">
        <div className="mg-filtros" role="group" aria-label="Filtrar por tipo" style={{ marginBottom: 8 }}>
          {(['todos', ...Object.keys(TIPO_L)] as ('todos' | TipoMovimiento)[]).map((t) => (
            <button key={t} className={tipo === t ? 'on' : ''} aria-pressed={tipo === t} onClick={() => setTipo(t)}>
              {t === 'todos' ? 'Todos' : TIPO_L[t]}
            </button>
          ))}
          <select className="mg-iv-sel mg-filtros-r" style={{ marginLeft: 'auto' }} aria-label="Filtrar por insumo" value={iid} onChange={(e) => setIid(e.target.value)}>
            <option value="todos">Todos los insumos</option>
            {s.insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </select>
        </div>
        {filtrados.length === 0 ? (
          <p className="mg-empty">Sin movimientos con este filtro.</p>
        ) : (
          <div className="mg-iv-tbl" role="table">
            <div className="mg-iv-row mg-iv-mov mg-iv-th" role="row">
              <span>Hora</span>
              <span>Tipo</span>
              <span>Insumo</span>
              <span>Cantidad</span>
              <span>Referencia</span>
            </div>
            <AnimatePresence initial={false}>
              {filtrados.map((m) => {
                const i = por(m.iid)
                return (
                  <motion.div key={m.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mg-iv-row mg-iv-mov">
                    <span className="c" data-l="Hora">{hhmm(m.t)}</span>
                    <span className="c" data-l="Tipo"><span className={`fob-pill ${TIPO_P[m.tipo]}`}>{TIPO_L[m.tipo]}</span></span>
                    <span className="mg-iv-nm"><b>{i?.nombre ?? m.iid}</b></span>
                    <span className="c" data-l="Cantidad"><b style={{ color: m.delta < 0 ? '#9b1015' : '#176b50' }}>{m.delta > 0 ? '+' : '−'}{i ? fmtQ(Math.abs(m.delta), i.unidad) : num(Math.abs(m.delta))}</b></span>
                    <span className="c" data-l="Referencia">{m.ref ?? '—'}</span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------- vista
export default function Inventario({ s }: { s: ProtoState }) {
  const [tab, setTab] = useState<Tab>('resumen')
  const [par, setPar] = useState<Par>({ pas: 2300, margen: 10, tipo: 'catering diario' })
  return (
    <div className="mg-sec">
      <Tabs tab={tab} set={setTab} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
          {tab === 'resumen' && <Resumen s={s} ir={setTab} />}
          {tab === 'escandallos' && <Escandallos s={s} />}
          {tab === 'insumos' && <Insumos s={s} />}
          {tab === 'plan' && <Plan s={s} par={par} setPar={setPar} />}
          {tab === 'movimientos' && <Movimientos s={s} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
