import A from './benchmark_a_navieras.json'
import BJ from './benchmark_b.json'

export type Eval = { puntuacion: number; evidencia: string; fuente: string }
export type Empresa = {
  id: string
  nombre: string
  sector: string
  pais: string
  logo_texto: string
  resumen: string
  click_collect: string
  evaluacion: Record<string, Eval>
  buenas_practicas: string[]
  datos_clave: { etiqueta: string; valor: string; fuente?: string }[]
  aplicacion_fred_olsen: string
  riesgos_o_limites: string
  confianza: string
  grupo: string
  /** Benchmark A: empresa incluida en el tablero del equipo */
  en_tablero?: boolean
  /** Referencias secundarias (retail/plataformas): relevancia 1-5 para el reto */
  relevancia?: number
  motivo_relevancia?: string
}
export type Descartado = { nombre: string; relevancia: number; motivo: string }
export type Vertical = { id: string; nombre: string; descripcion: string }
export type Tendencia = { titulo: string; descripcion: string; fuente?: string }
export type Insight = { titulo: string; descripcion: string; accion_para_solucion: string }
export type Criterio = 'ux' | 'innovacion' | 'viabilidad' | 'escalabilidad'

export type Benchmark = {
  key: 'A' | 'B'
  titulo: string
  subtitulo: string
  verticales: Vertical[]
  empresas: Empresa[]
  tendencias: (Tendencia & { grupo: string })[]
  insights: (Insight & { grupo: string })[]
  fuentes: string[]
  grupos: string[]
  // vertical -> criterio del jurado
  mapaCriterios: Record<string, Criterio>
}

type Raw = {
  grupo?: string
  verticales: Vertical[]
  empresas: (Omit<Empresa, 'grupo'> & { grupo?: string })[]
  tendencias: (Tendencia & { grupo?: string })[]
  insights: (Insight & { grupo?: string })[]
  fuentes: string[]
  descartados?: Descartado[]
}

const tag = (r: Raw, def: string) => ({
  empresas: r.empresas.map((e) => ({ ...e, grupo: e.grupo ?? def })) as Empresa[],
  tendencias: r.tendencias.map((t) => ({ ...t, grupo: t.grupo ?? def })),
  insights: r.insights.map((t) => ({ ...t, grupo: t.grupo ?? def })),
})

const a = tag(A as Raw, 'Navieras')
const b = tag(BJ as Raw, 'Otros')
const grupos = (es: Empresa[]) => Array.from(new Set(es.map((e) => e.grupo)))
export const DESCARTADOS: Descartado[] = (BJ as Raw).descartados ?? []

export const CRITERIOS: Record<Criterio, { nombre: string; peso: number; color: string }> = {
  ux: { nombre: 'Experiencia de usuario', peso: 40, color: 'var(--c1)' },
  innovacion: { nombre: 'Innovación', peso: 38, color: 'var(--c2)' },
  viabilidad: { nombre: 'Viabilidad técnica y económica', peso: 12, color: 'var(--c3)' },
  escalabilidad: { nombre: 'Escalabilidad', peso: 10, color: 'var(--c4)' },
}

export const benchmarkA: Benchmark = {
  key: 'A',
  titulo: 'Benchmark competitivo · Navieras',
  subtitulo: '¿Dónde está Fred. Olsen frente a las navieras de Canarias y Europa en digital y servicio a bordo?',
  verticales: (A as Raw).verticales,
  empresas: a.empresas,
  tendencias: a.tendencias,
  insights: a.insights,
  fuentes: (A as Raw).fuentes,
  grupos: ['Navieras'],
  mapaCriterios: {
    digital_app: 'ux',
    experiencia_abordo: 'ux',
    oferta_fyb: 'ux',
    pedido_movil: 'innovacion',
    innovacion: 'innovacion',
    conectividad: 'viabilidad',
    pagos_fidelizacion: 'escalabilidad',
    satisfaccion: 'ux',
  },
}

export const benchmarkB: Benchmark = {
  key: 'B',
  titulo: 'Benchmark funcional · Click & Collect',
  subtitulo: '¿Quién resuelve ya «pedir desde el sitio y recoger sin colas», y qué podemos copiar para un barco de 80 minutos?',
  verticales: (BJ as Raw).verticales,
  empresas: b.empresas,
  tendencias: b.tendencias,
  insights: b.insights,
  fuentes: (BJ as Raw).fuentes,
  grupos: grupos(b.empresas),
  mapaCriterios: {
    ux_pedido: 'ux',
    recogida_entrega: 'ux',
    accesibilidad: 'ux',
    convivencia_canales: 'ux',
    gestion_picos: 'innovacion',
    stock_tiempo_real: 'innovacion',
    offline_pagos: 'innovacion',
    impacto_kpis: 'viabilidad',
    tecnologia_integracion: 'escalabilidad',
  },
}

export const BENCHMARKS = { A: benchmarkA, B: benchmarkB }

/** Pesos por vertical derivados de los criterios del jurado (reparto a partes iguales dentro de cada criterio). */
export function pesosJurado(b: Benchmark): Record<string, number> {
  const count: Record<string, number> = {}
  Object.values(b.mapaCriterios).forEach((c) => (count[c] = (count[c] || 0) + 1))
  const out: Record<string, number> = {}
  b.verticales.forEach((v) => {
    const c = b.mapaCriterios[v.id]
    out[v.id] = c ? Math.round((CRITERIOS[c].peso / count[c]) * 10) / 10 : 0
  })
  return out
}
export function pesosIguales(b: Benchmark): Record<string, number> {
  const out: Record<string, number> = {}
  b.verticales.forEach((v) => (out[v.id] = 10))
  return out
}

/** Media ponderada (0-5). Las verticales con 0 (sin información) se excluyen y se renormaliza. */
export function puntuar(e: Empresa, pesos: Record<string, number>, ponderarRelevancia = false) {
  let s = 0,
    w = 0,
    cubiertas = 0
  for (const [k, p] of Object.entries(pesos)) {
    const v = e.evaluacion[k]?.puntuacion ?? 0
    if (v > 0 && p > 0) {
      s += v * p
      w += p
      cubiertas++
    }
  }
  let score = w ? s / w : 0
  // Referencias secundarias: la nota se pondera por su relevancia para el reto (5 = sin penalización)
  if (ponderarRelevancia && e.relevancia) score = score * (0.5 + 0.1 * e.relevancia)
  return { score, cobertura: cubiertas / Object.keys(pesos).length }
}

export const SECTOR_LABEL: Record<string, string> = {
  naviera: 'Naviera',
  ferrocarril: 'Ferrocarril',
  aerolinea: 'Aerolínea',
  crucero: 'Crucero',
  estadio: 'Estadio',
  restauracion: 'Restauración',
  aeropuerto: 'Aeropuerto',
  'plataforma-tech': 'Plataforma tech',
  otro: 'Otro',
}
