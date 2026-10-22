import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Benchmark, Empresa } from '../data/benchmarks'

const COLORS = ['#0b3478', '#e3a600', '#2a8f84', '#d7141a']

export default function RadarCompare({ b, empresas }: { b: Benchmark; empresas: Empresa[] }) {
  const data = b.verticales.map((v) => {
    const row: Record<string, string | number> = { vertical: v.nombre }
    empresas.forEach((e) => (row[e.nombre] = e.evaluacion[v.id]?.puntuacion ?? 0))
    return row
  })
  return (
    <div style={{ width: '100%', height: 420 }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="#dde3ef" />
          <PolarAngleAxis dataKey="vertical" tick={{ fontSize: 11, fill: '#5b6782' }} />
          <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10, fill: '#9aa5bc' }} angle={90} />
          {empresas.map((e, i) => (
            <Radar
              key={e.id}
              name={e.nombre}
              dataKey={e.nombre}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.14}
              strokeWidth={2}
            />
          ))}
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
