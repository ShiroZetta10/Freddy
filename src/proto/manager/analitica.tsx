import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ProtoState, VENTAJA_JOVEN, eur, kpis, producto, sostenibilidad } from '../store'
import { C, Card, Counter, Dot, Ico, num } from './util'

type Tono = 'ok' | 'warn' | 'ko' | 'nd'

function csv(s: ProtoState) {
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const head = ['pedido', 'localizador', 'pasajero', 'cafeteria', 'franja_inicio', 'estado', 'prepedido', 'pago', 'sin_cubiertos', 'tarifa_joven', 'descuento_joven_eur', 'total_eur', 'lineas', 'creado']
  const rows = s.pedidos.map((p) =>
    [
      p.id,
      p.ticket,
      p.nombre,
      s.cafeterias[p.cafeteria].nombre,
      p.franja * s.ajustes.franjaMin,
      p.estado,
      p.prepedido ? 'si' : 'no',
      p.pago,
      p.sinPlastico ? 'si' : 'no',
      p.tarifaJoven ? 'si' : 'no',
      (p.descuentoJoven ?? 0).toFixed(2).replace('.', ','),
      p.total.toFixed(2).replace('.', ','),
      p.lineas.map((l) => `${l.qty}x ${producto(s, l.pid).nombre}`).join(' | '),
      new Date(p.t.creado ?? 0).toISOString(),
    ]
      .map(q)
      .join(';'),
  )
  return '﻿' + [head.map(q).join(';'), ...rows].join('\r\n')
}

function exportar(s: ProtoState) {
  const blob = new Blob([csv(s)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pedidos-${s.viaje.buque.replace(/\s+/g, '-').toLowerCase()}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Comp({ label, base, medido, fmt, extra, objetivo }: { label: string; base: number; medido: number; fmt: (n: number) => string; extra?: string; objetivo?: number }) {
  const max = Math.max(base, medido, objetivo ?? 0) * 1.08 || 1
  const w = (n: number) => `${(n / max) * 100}%`
  return (
    <div className="mg-comp">
      <div className="mg-comp-h">
        <b>{label}</b>
        {extra && <span>{extra}</span>}
      </div>
      <div className="mg-comp-r">
        <span>Línea base real</span>
        <div className="mg-track">
          <motion.i style={{ background: C.sky }} animate={{ width: w(base) }} />
        </div>
        <output>{fmt(base)}</output>
      </div>
      <div className="mg-comp-r">
        <span>Medido en la demo</span>
        <div className="mg-track">
          <motion.i style={{ background: C.navy }} animate={{ width: w(medido) }} />
          {objetivo !== undefined && <u style={{ left: w(objetivo) }} title="Objetivo" />}
        </div>
        <output>{fmt(medido)}</output>
      </div>
    </div>
  )
}

export default function Analitica({ s }: { s: ProtoState }) {
  const k = kpis(s)
  const eco = sostenibilidad(s)
  const validos = s.pedidos.filter((p) => p.estado !== 'cancelado')
  const base = s.base

  const top = useMemo(() => {
    const m = new Map<string, { n: string; u: number; v: number }>()
    for (const p of validos)
      for (const l of p.lineas) {
        const pr = producto(s, l.pid)
        const x = m.get(l.pid) ?? { n: pr.nombre, u: 0, v: 0 }
        x.u += l.qty
        x.v += l.qty * pr.precio
        m.set(l.pid, x)
      }
    return [...m.values()]
      .sort((a, b) => b.v - a.v)
      .slice(0, 6)
      .map((x) => ({ ...x, n: x.n.length > 20 ? x.n.slice(0, 19) + '…' : x.n, v: Math.round(x.v * 100) / 100 }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.pedidos, s.productos])

  const pagos = (['apple', 'google', 'tarjeta'] as const).map((id, i) => ({
    id,
    name: { apple: 'Apple Pay', google: 'Google Pay', tarjeta: 'Tarjeta' }[id],
    value: validos.filter((p) => p.pago === id).length,
    color: [C.navy, C.sky, C.gold][i],
  }))
  const totalPagos = pagos.reduce((a, p) => a + p.value, 0)

  // criterios de éxito
  const uplift = k.ventaPorPasajeroDigital / base.ventaPorPasajero
  const claves = [...s.pedidos, ...s.pendientesOffline].map((p) => p.clientKey)
  const duplicados = claves.length - new Set(claves).size
  const hayEntregas = s.pedidos.some((p) => p.t.listo && p.t.entregado)
  const totalIds = k.pedidos + k.cancelados
  const pctPre = k.pedidos ? k.prepedidos / k.pedidos : 0
  const pctCanc = totalIds ? k.cancelados / totalIds : 0
  const criterios: { t: string; obj: string; med: string; tono: Tono }[] = [
    { t: 'Venta por pasajero', obj: '+10 % sobre la base', med: k.pedidos ? `${uplift >= 0 ? '+' : ''}${num(uplift * 100, 1)} %` : 'sin datos', tono: !k.pedidos ? 'nd' : uplift >= 0.1 ? 'ok' : uplift >= 0.05 ? 'warn' : 'ko' },
    { t: 'Recogida en barra', obj: 'menos de 2 min (listo → recogida)', med: hayEntregas ? `${num(k.recogidaMediaSeg)} s` : 'sin datos', tono: !hayEntregas ? 'nd' : k.recogidaMediaSeg < 120 ? 'ok' : k.recogidaMediaSeg < 180 ? 'warn' : 'ko' },
    { t: 'Pedidos duplicados', obj: '0 (pedido idempotente)', med: String(duplicados), tono: duplicados === 0 ? 'ok' : 'ko' },
    { t: 'Cancelaciones', obj: 'hasta el 5 % de los pedidos', med: totalIds ? `${num(pctCanc * 100, 1)} %` : 'sin datos', tono: !totalIds ? 'nd' : pctCanc <= 0.05 ? 'ok' : pctCanc <= 0.1 ? 'warn' : 'ko' },
    { t: 'Pre-pedidos', obj: 'al menos el 15 % del total', med: k.pedidos ? `${num(pctPre * 100, 1)} %` : 'sin datos', tono: !k.pedidos ? 'nd' : pctPre >= 0.15 ? 'ok' : pctPre >= 0.08 ? 'warn' : 'ko' },
  ]
  const verdes = criterios.filter((c) => c.tono === 'ok').length
  const TXT: Record<Tono, string> = { ok: 'Cumplido', warn: 'En camino', ko: 'Por debajo', nd: 'Sin datos' }

  return (
    <div className="mg-sec">
      <div className="mg-toolbar">
        <p>
          Línea base real del Bajamar Express frente a lo medido en esta demo ({k.pedidos} {k.pedidos === 1 ? 'pedido' : 'pedidos'}).
        </p>
        <button className="fob-btn navy" onClick={() => exportar(s)} disabled={!s.pedidos.length}>
          <Ico name="download" size={17} /> Exportar CSV
        </button>
      </div>
      <div className="mg-grid2 even">
        <div className="mg-col">
          <Card title="Frente a la línea base" sub="Venta digital sobre 420 pasajeros; se asume incremental a la venta actual en barra">
            <Comp label="Venta por pasajero" base={base.ventaPorPasajero} medido={base.ventaPorPasajero + k.ventaPorPasajeroDigital} fmt={(n) => eur(n)} objetivo={base.ventaPorPasajero * 1.1} extra={k.pedidos ? `+${num(uplift * 100, 1)} % digital` : undefined} />
            <Comp label="Ticket medio" base={base.ticketMedio} medido={k.ticketMedio} fmt={(n) => eur(n)} extra={k.pedidos ? `${k.ticketMedio >= base.ticketMedio ? '+' : ''}${num((k.ticketMedio / base.ticketMedio - 1) * 100, 1)} %` : undefined} />
            <Comp label="Pasajeros que compran" base={base.tasaCompra * 100} medido={k.adopcion * 100} fmt={(n) => `${num(n, 1)} %`} extra="base ≈ 23 %; medido = solo compradores digitales" />
          </Card>
          <Card title="Criterios de éxito del piloto" sub={`${verdes} de ${criterios.length} cumplidos ahora mismo`}>
            <ul className="mg-crit">
              {criterios.map((c) => (
                <li key={c.t}>
                  <Dot tone={c.tono} />
                  <div>
                    <b>{c.t}</b>
                    <span>Objetivo: {c.obj}</span>
                  </div>
                  <div className="mg-crit-r">
                    <b>{c.med}</b>
                    <span className={`mg-crit-s ${c.tono}`}>{TXT[c.tono]}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="mg-col">
          <Card title="Ventas por producto" sub="Top 6 por ingresos (€)">
            {top.length === 0 ? (
              <p className="mg-empty">Sin ventas todavía.</p>
            ) : (
              <div className="mg-chart" style={{ height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={top} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#5d6779' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="n" width={118} tick={{ fontSize: 11.5, fill: '#1c2433' }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#eef3fb' }} formatter={(v: number, _n, e) => [`${eur(v)} · ${e.payload.u} uds.`, 'Ingresos']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e7ef', fontSize: 12 }} />
                    <Bar dataKey="v" fill={C.navy} radius={[0, 4, 4, 0]} barSize={16} animationDuration={500} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
          <Card title="En Armonía con el Mar" sub="Papel cero, menos plásticos y producto de las islas">
            <div className="mg-eco">
              <div>
                <b>
                  <Counter value={eco.ticketsPapelEvitados} />
                </b>
                <span>Tickets en papel evitados</span>
                <small>Ticket digital: 1 por pedido</small>
              </div>
              <div>
                <b>
                  <Counter value={eco.sinPlastico} />
                </b>
                <span>Pedidos sin cubiertos ni bolsa</span>
                <small>{k.pedidos ? `${num(eco.pctSinPlastico * 100)} % de los pedidos` : 'sin datos'}</small>
              </div>
              <div>
                <b>{k.pedidos ? `${num(eco.pctCanario * 100)} %` : '—'}</b>
                <span>Venta de producto canario / KM0</span>
                <small>{k.pedidos ? `${eco.udsCanarias} de ${eco.uds} uds. · tienda ${eur(eco.ventaTienda)}` : 'sin datos'}</small>
              </div>
            </div>
            <p className="mg-eco-j">
              <span className="fob-pill">Tarifa Joven</span>
              {eco.pedidosJoven} {eco.pedidosJoven === 1 ? 'pedido' : 'pedidos'} con la ventaja «{VENTAJA_JOVEN.texto}» ({eur(eco.descuentoJoven)} descontados) · <i>ventaja propuesta, por validar con Fred. Olsen</i>
            </p>
          </Card>
          <div className="mg-mini">
            <Card title="Mix de pago">
              <div className="mg-pay">
                <div className="mg-donut">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={totalPagos ? pagos : [{ id: 'x', name: '', value: 1, color: '#e8edf5' }]} dataKey="value" innerRadius="62%" outerRadius="92%" stroke="#fff" strokeWidth={2} animationDuration={500}>
                        {(totalPagos ? pagos : [{ color: '#e8edf5' }]).map((p, i) => (
                          <Cell key={i} fill={p.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul>
                  {pagos.map((p) => (
                    <li key={p.id}>
                      <i style={{ background: p.color }} />
                      {p.name} <b>{totalPagos ? num((p.value / totalPagos) * 100) : 0} %</b>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
            <Card title="Pre-pedidos y cancelaciones">
              <div className="mg-ring-r">
                <div>
                  <span>Pre-pedidos</span>
                  <b>{num(pctPre * 100, 1)} %</b>
                  <div className="mg-track">
                    <motion.i style={{ background: C.teal }} animate={{ width: `${pctPre * 100}%` }} />
                  </div>
                </div>
                <div>
                  <span>Cancelaciones</span>
                  <b>
                    {k.cancelados} <small>({num(pctCanc * 100, 1)} %)</small>
                  </b>
                  <div className="mg-track">
                    <motion.i style={{ background: C.gold }} animate={{ width: `${pctCanc * 100}%` }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
