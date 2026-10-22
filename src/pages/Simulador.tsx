import { useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, LabelList } from 'recharts'
import { totales, derivados, eur, num, pct } from '../data/bajamar'

export default function Simulador() {
  const pax = derivados.pasajerosEstimados
  const base = derivados.tasaCompra
  const [nuevos, setNuevos] = useState(3) // puntos porcentuales
  const [movil, setMovil] = useState(25) // % de compras vía móvil
  const [uplift, setUplift] = useState(15) // % uplift ticket en canal móvil
  const [anual, setAnual] = useState(false)

  const tasa = base + nuevos / 100
  const ticketMix = totales.ticketMedio * (1 + (movil / 100) * (uplift / 100))
  const factor = anual ? 3 : 1
  const facturacionBase = totales.facturacion * factor
  const facturacionNueva = pax * tasa * ticketMix * factor
  const delta = facturacionNueva - facturacionBase
  const ventaPax = tasa * ticketMix
  const pedidosMovil = pax * tasa * (movil / 100) * factor

  const dotsBase = Math.round(base * 100)
  const dotsNew = Math.round(nuevos)

  const chart = [
    { n: 'Actual', v: facturacionBase },
    { n: 'Con Click & Collect', v: facturacionNueva },
  ]

  const Range = (p: { label: string; value: number; set: (n: number) => void; min: number; max: number; step?: number; fmt: (n: number) => string; help: string }) => (
    <div className="range-row">
      <label>
        <span>{p.label}</span>
        <span style={{ color: 'var(--red)' }}>{p.fmt(p.value)}</span>
      </label>
      <input type="range" min={p.min} max={p.max} step={p.step ?? 1} value={p.value} onChange={(e) => p.set(+e.target.value)} aria-label={p.label} />
      <div className="tiny muted">{p.help}</div>
    </div>
  )

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">What-if · Supuestos explícitos</div>
        <h1>Simulador de impacto</h1>
        <p>
          Parte de los datos reales del Bajamar Express (ene–abr 2026) y mueve los supuestos. Las referencias del benchmark sirven para calibrar
          escenarios prudentes o ambiciosos. Es una estimación para el piloto, no una previsión.
        </p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)', alignItems: 'start' }}>
        <div className="card">
          <Range
            label="Nuevos compradores"
            value={nuevos}
            set={setNuevos}
            min={0}
            max={15}
            step={0.5}
            fmt={(n) => `+${num(n, 1)} pp`}
            help={`Pasajeros que hoy no compran (por la cola o la pereza de levantarse) y pasarían a hacerlo. Hoy compra ≈ ${pct(base)}. Ref.: más del 40 % de los aficionados abandona una cola sin comprar (Oracle/Turnkey).`}
          />
          <Range
            label="Compras hechas por el móvil"
            value={movil}
            set={setMovil}
            min={0}
            max={60}
            fmt={(n) => `${n} %`}
            help="Ref.: Starbucks, 31 % de las transacciones por la app tras años de madurez. Chipotle, 36,7 % de ventas digitales."
          />
          <Range
            label="Subida del ticket en el canal móvil"
            value={uplift}
            set={setUplift}
            min={0}
            max={45}
            fmt={(n) => `+${n} %`}
            help="Ref.: +42 % Iberia Express/Immfly, +5,6 % Tampa Bay Rays (datos de proveedor). Palanca: combos y sugerencias (upselling)."
          />
          <div className="tabs">
            <button className={!anual ? 'on' : ''} onClick={() => setAnual(false)}>
              Ene–abr (4 meses)
            </button>
            <button className={anual ? 'on' : ''} onClick={() => setAnual(true)}>
              Anualizado ×3
            </button>
          </div>
          <p className="tiny muted" style={{ marginTop: 10 }}>
            Modelo: pasajeros × % que compra × ticket medio × (1 + % móvil × subida del ticket). Pasajeros estimados = 228.041 € ÷ 1,37 € ≈ {num(pax)}{' '}
            (ene–abr). El anualizado es una simple ×3 y no incluye la estacionalidad del verano.
          </p>
        </div>

        <div className="grid">
          <div className="card" style={{ background: 'var(--navy)', color: '#fff' }}>
            <div className="eyebrow" style={{ color: 'var(--yellow)' }}>
              Facturación incremental {anual ? 'anual' : '(4 meses)'}
            </div>
            <div className="big-number" style={{ color: '#fff' }}>
              {delta >= 0 ? '+' : ''}
              {eur(delta)}
            </div>
            <div style={{ opacity: 0.85 }}>
              {pct(delta / facturacionBase, 1)} sobre la base · venta por pasajero {eur(totales.consumoPorPasajero, 2)} → <strong>{eur(ventaPax, 2)}</strong>
            </div>
          </div>
          <div className="grid g2">
            <div className="card stat">
              <div className="label">Pasajeros que compran</div>
              <div className="value">{pct(tasa)}</div>
              <div className="sub">antes {pct(base)}</div>
            </div>
            <div className="card stat">
              <div className="label">Pedidos móvil {anual ? '/ año' : '/ 4 meses'}</div>
              <div className="value">{num(pedidosMovil)}</div>
              <div className="sub">que dejan de pasar por la cola tradicional</div>
            </div>
          </div>
          <div className="card">
            <h3>De cada 100 pasajeros</h3>
            <div className="people" aria-label={`${dotsBase} compran hoy, ${dotsNew} nuevos`}>
              {Array.from({ length: 100 }).map((_, i) => (
                <span key={i} className={`person${i < dotsBase ? ' base' : i < dotsBase + dotsNew ? ' new' : ''}`} />
              ))}
            </div>
            <div className="legend">
              <span>
                <span className="dot" style={{ background: 'var(--navy-3)' }} />
                compran hoy ({dotsBase})
              </span>
              <span>
                <span className="dot" style={{ background: 'var(--red)' }} />
                nuevos con Click & Collect ({dotsNew})
              </span>
              <span>
                <span className="dot" style={{ background: 'var(--s0)' }} />
                no compran
              </span>
            </div>
          </div>
          <div className="card">
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={chart} layout="vertical" margin={{ left: 20, right: 70 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="n" width={140} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => eur(v)} />
                  <Bar dataKey="v" radius={[0, 10, 10, 0]}>
                    {chart.map((c, i) => (
                      <Cell key={i} fill={i ? '#e30613' : '#0f3f86'} />
                    ))}
                    <LabelList dataKey="v" position="right" formatter={(v: number) => eur(v)} style={{ fontWeight: 700, fontSize: 12 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 900px){ .grid[style*="1.2fr"]{ grid-template-columns: 1fr !important; } }`}</style>
    </>
  )
}
