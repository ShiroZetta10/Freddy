import { benchmarkA, benchmarkB, CRITERIOS, DESCARTADOS } from '../data/benchmarks'

const BLOQUES = [
  ['Objetivo y alcance', 'Diseñar un Click & Collect a bordo sin aumentar plantilla. Dos preguntas: dónde está Fred. Olsen frente a su competencia (A) y quién resuelve ya el problema en otros sectores (B).'],
  ['Selección de comparables', 'A: navieras de Canarias, España y Europa con trayectos similares. B: transporte con pedido desde el asiento, recintos con picos, restauración con pedido móvil y plataformas tecnológicas.'],
  ['Verticales y KPIs', 'Verticales alineadas con los criterios del jurado y con las preguntas del reto (colas, picos, stock, conexión, convivencia, pagos, impacto).'],
  ['Fuentes y método', 'Fuentes públicas primarias (webs, condiciones de venta, memorias, notas de prensa) y prensa especializada. Investigación asistida por agentes de IA y revisada por el equipo.'],
  ['Matriz y puntuación', 'Rúbrica 1–5 por vertical. 0 = sin información verificable (no penaliza). Media ponderada con pesos ajustables.'],
  ['Buenas prácticas', 'Prácticas concretas y replicables por empresa, y lo que no conviene copiar en un barco de 80 minutos.'],
  ['Gaps y oportunidades', 'Huecos del sector marítimo (no existe pedido móvil a bordo) y ventana competitiva en Canarias.'],
  ['Implicaciones para la solución', 'Cada insight se traduce en una decisión de diseño y un KPI del piloto (ver «Del benchmark a la solución»).'],
]

export default function Metodologia() {
  const total = benchmarkA.empresas.length + benchmarkB.empresas.length
  const fuentes = Array.from(new Set([...benchmarkA.fuentes, ...benchmarkB.fuentes])).filter((f) => f.startsWith('http'))
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Cómo se hizo</div>
        <h1>Metodología</h1>
        <p>
          {total} empresas analizadas en {benchmarkA.verticales.length + benchmarkB.verticales.length} verticales y {fuentes.length} fuentes. Investigación
          cerrada en octubre de 2026.
        </p>
      </div>

      <div className="blocks">
        {BLOQUES.map(([t, d]) => (
          <div key={t}>
            <strong>{t}</strong>
            <div className="small muted">{d}</div>
          </div>
        ))}
      </div>

      <div className="grid g2 section">
        <div className="card">
          <h3>Rúbrica</h3>
          <ul className="clean">
            <li><strong>5</strong>: referente / best-in-class</li>
            <li><strong>4</strong>: destacado</li>
            <li><strong>3</strong>: correcto, estándar del sector</li>
            <li><strong>2</strong>: básico</li>
            <li><strong>1</strong>: no existe o muy pobre</li>
            <li><strong>—</strong>: sin información verificable (se excluye del cálculo)</li>
          </ul>
          <p className="small muted" style={{ marginTop: 10 }}>
            [I] marca inferencias del equipo. Las cifras publicadas por proveedores tecnológicos se señalan como tales, porque no tienen auditoría independiente.
          </p>
        </div>
        <div className="card">
          <h3>Criterios del jurado → verticales</h3>
          {(['A', 'B'] as const).map((k) => {
            const b = k === 'A' ? benchmarkA : benchmarkB
            return (
              <div key={k} style={{ marginBottom: 10 }}>
                <div className="small" style={{ fontWeight: 700 }}>Benchmark {k}</div>
                {Object.entries(CRITERIOS).map(([c, info]) => (
                  <div key={c} className="small">
                    <span className="dot" style={{ background: info.color }} />
                    {info.nombre} ({info.peso} %):{' '}
                    <span className="muted">
                      {b.verticales.filter((v) => b.mapaCriterios[v.id] === c).map((v) => v.nombre).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card section">
        <h3>Referencias revisadas y ponderadas</h3>
        <p className="small muted">
          Retail (IKEA, Carrefour, Sephora, El Corte Inglés) y plataformas OMS (Cin7, SAP, KPS) entran en el benchmark B como referencias secundarias, con una
          relevancia de 1 a 5 para el reto. En el ranking su nota se multiplica por (0,5 + 0,1 × relevancia). Estas se descartaron:
        </p>
        <ul className="clean">
          {DESCARTADOS.map((d) => (
            <li key={d.nombre} className="small">
              <strong>{d.nombre}</strong> (relevancia {d.relevancia}/5): {d.motivo}
            </li>
          ))}
        </ul>
      </div>

      <div className="card section">
        <h3>Limitaciones</h3>
        <ul className="clean">
          <li>Muchas evidencias de estadios son de 2014–2019. Las de cruceros reflejan recortes posteriores por falta de personal.</li>
          <li>Pocas operadoras publican KPIs; los incrementos de ventas proceden sobre todo de casos de éxito de proveedores.</li>
          <li>No hay información pública sobre el TPV, la conectividad real ni la tripulación por cafetería de Fred. Olsen. Hay que validarlo.</li>
          <li>La puntuación es una valoración cualitativa del equipo, pensada para comparar, no para auditar.</li>
        </ul>
      </div>

      <details className="card section">
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--navy)' }}>Fuentes ({fuentes.length})</summary>
        <ol style={{ marginTop: 12 }}>
          {fuentes.map((f) => (
            <li key={f} className="src">
              <a href={f} target="_blank" rel="noreferrer">
                {f}
              </a>
            </li>
          ))}
        </ol>
      </details>
    </>
  )
}
