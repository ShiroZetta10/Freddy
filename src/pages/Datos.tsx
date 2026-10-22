import { Bar, BarChart, CartesianGrid, Cell, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { familias, franjas, franjasPorMes, meses, productos, totales, derivados, eur, num, pct } from '../data/bajamar'

const fmtK = (v: number) => `${num(v / 1000, 0)} k€`
const tipEur = (v: number) => eur(v)

export default function Datos() {
  const maxFranja = Math.max(...franjas.map((f) => f.facturacion))
  const share = franjas[0].facturacion / totales.facturacion
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Línea base · Bajamar Express · ene–abr 2026</div>
        <h1>Qué nos dicen las ventas actuales</h1>
        <p>
          Los datos oficiales del reto, puestos en gráficos para encontrar dónde actúa un Click & Collect: en qué momento, con qué productos y con
          cuánto margen de crecimiento.
        </p>
      </div>

      <div className="grid g3">
        <div className="card callout">
          <strong>La mañana es el pico.</strong> Concentra el {pct(share)} de la facturación ({eur(franjas[0].facturacion)}). Es la franja donde
          más colas se forman y la candidata ideal para el piloto.
        </div>
        <div className="card callout navy">
          <strong>Producto rápido y repetible.</strong> Bocadillos, cafés, sándwiches y agua son más de la mitad de las ventas del top 10. Un
          menú corto en la primera pantalla de la web cubre la mayoría de los pedidos.
        </div>
        <div className="card callout red">
          <strong>Margen enorme de conversión.</strong> Con 1,37 € por pasajero, solo ≈ {pct(derivados.tasaCompra)} de los{' '}
          {num(derivados.pasajerosEstimados)} pasajeros estimados compra algo.
        </div>
      </div>

      <div className="grid g2 section">
        <div className="card">
          <h3>Evolución mensual</h3>
          <p className="small muted">Facturación (barras) y ticket medio (línea). Abril es el mejor mes del periodo.</p>
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <ComposedChart data={meses}>
                <CartesianGrid stroke="#eef2f9" vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <YAxis yAxisId="l" tickFormatter={fmtK} tickLine={false} axisLine={false} width={56} />
                <YAxis yAxisId="r" orientation="right" domain={[5.5, 6.2]} tickFormatter={(v) => `${num(v, 2)} €`} tickLine={false} axisLine={false} width={60} />
                <Tooltip formatter={(v: number, n) => (n === 'Ticket medio' ? eur(v, 2) : eur(v))} />
                <Bar yAxisId="l" dataKey="facturacion" name="Facturación" fill="#0f3f86" radius={[8, 8, 0, 0]} />
                <Line yAxisId="r" dataKey="ticketMedio" name="Ticket medio" stroke="#e30613" strokeWidth={3} dot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3>Facturación por franja</h3>
          <p className="small muted">El mediodía tiene el ticket medio más alto (6,30 €). La «noche» acaba hacia las 21–22 h.</p>
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={franjas} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid stroke="#eef2f9" horizontal={false} />
                <XAxis type="number" tickFormatter={fmtK} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="franja" width={80} tickLine={false} axisLine={false} />
                <Tooltip formatter={tipEur} />
                <Bar dataKey="facturacion" name="Facturación" radius={[0, 8, 8, 0]}>
                  {franjas.map((f) => (
                    <Cell key={f.franja} fill={f.facturacion === maxFranja ? '#e30613' : '#0f3f86'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card section">
        <h3>Franjas mes a mes</h3>
        <p className="small muted">El patrón se repite todos los meses: el piloto puede planificarse con confianza sobre la franja de mañana.</p>
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={franjasPorMes}>
              <CartesianGrid stroke="#eef2f9" vertical={false} />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={fmtK} tickLine={false} axisLine={false} width={56} />
              <Tooltip formatter={tipEur} />
              <Legend />
              <Bar dataKey="Mañana" fill="#e30613" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Mediodía" fill="#0f3f86" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Tarde" fill="#7d9bd6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Noche" fill="#f39200" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid g2 section">
        <div className="card">
          <h3>Top 10 familias</h3>
          <div style={{ height: 360 }}>
            <ResponsiveContainer>
              <BarChart data={familias} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tickFormatter={fmtK} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="familia" width={110} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={tipEur} />
                <Bar dataKey="facturacion" name="Facturación" fill="#0f3f86" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3>Top 10 productos</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr className="tiny muted" style={{ textAlign: 'left' }}>
                <th style={{ padding: '6px 0' }}>Producto</th>
                <th style={{ textAlign: 'right' }}>Uds.</th>
                <th style={{ textAlign: 'right' }}>Facturación</th>
                <th style={{ textAlign: 'right' }}>€/ud.</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.producto} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '8px 0' }}>{p.producto}</td>
                  <td style={{ textAlign: 'right' }}>{num(p.unidades)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{eur(p.facturacion)}</td>
                  <td style={{ textAlign: 'right' }} className="muted">
                    {eur(p.facturacion / p.unidades, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="tiny muted" style={{ marginTop: 10 }}>
            €/ud. es un cálculo propio. El combo «bollería + bebida caliente» ya funciona: es un buen candidato a oferta exclusiva del canal móvil.
          </p>
        </div>
      </div>
      <p className="tiny muted section">
        Fuente: Fred. Olsen Express, «Del reto a los datos reales», ene–abr 2026. Solo ventas positivas, sin devoluciones ni operaciones a 0 €; sin desglose
        por TPV.
      </p>
    </>
  )
}
