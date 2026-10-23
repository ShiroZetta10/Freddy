// Modelo de negocio de FredOnBoard (estimación de costes, beneficios y potencial de ventas).
// Regla: solo lo que viene de bajamar.ts / canarias.ts es dato real. Todo lo demás es SUPUESTO y se etiqueta como tal.
// Pensado para reutilizarse en la página del piloto: `calcular(params, { meses })` sirve para cualquier periodo.

import { derivados, totales, eur } from './bajamar'
import { FRACCIONES_DEFECTO, PILOTO_DEFECTO } from './costes'

export type Fuente = 'real' | 'derivado' | 'supuesto'

/** Parámetros editables del modelo (todos los porcentajes en puntos, p. ej. 25 = 25 %). */
export type Params = {
  /** % de las compras que pasan por el canal FredOnBoard */
  adopcion: number
  /** Aumento del % de pasajeros que compra, en puntos porcentuales (hoy ≈ 23 %) */
  subidaCompra: number
  /** Aumento del ticket medio en el canal digital por upselling, en % */
  subidaTicket: number
  /** Comisión de la pasarela de pago sobre las ventas digitales, en % */
  comision: number
  /** Coste mensual de plataforma (nube, mantenimiento, soporte, producto), en € */
  plataforma: number
  /** Coste de implantación (una sola vez), en € */
  implantacion: number
  /** Margen bruto de la cafetería sobre la venta incremental, en % */
  margen: number
  /** Buques adicionales con el servicio (solo alta velocidad con cafetería, aparte del Bajamar) */
  buques: number
  /** Venta de cada buque adicional respecto a la del Bajamar, en % */
  equivalencia: number
}

export type EscenarioId = 'prudente' | 'base' | 'optimista'

export const ESCENARIOS: { id: EscenarioId; nombre: string; resumen: string; params: Params }[] = [
  {
    id: 'prudente',
    nombre: 'Prudente',
    resumen: 'Adopción baja y subida de ticket pequeña: el servicio apenas cubre su coste en un solo buque.',
    params: { adopcion: 15, subidaCompra: 2, subidaTicket: 5, comision: 1.8, plataforma: PILOTO_DEFECTO.plataforma, implantacion: PILOTO_DEFECTO.implantacion, margen: 55, buques: 3, equivalencia: 40 },
  },
  {
    id: 'base',
    nombre: 'Base',
    resumen: 'Escenario de trabajo: un cuarto de las compras por el móvil y mejoras moderadas.',
    params: { adopcion: 25, subidaCompra: 3, subidaTicket: 10, comision: 1.5, plataforma: PILOTO_DEFECTO.plataforma, implantacion: PILOTO_DEFECTO.implantacion, margen: 55, buques: 5, equivalencia: 50 },
  },
  {
    id: 'optimista',
    nombre: 'Optimista',
    resumen: 'Adopción alta, como en cadenas con app madura, y upselling efectivo.',
    params: { adopcion: 35, subidaCompra: 5, subidaTicket: 15, comision: 1.2, plataforma: PILOTO_DEFECTO.plataforma, implantacion: PILOTO_DEFECTO.implantacion, margen: 55, buques: 7, equivalencia: 60 },
  },
]

/** Constantes del modelo que no se editan con sliders (siguen siendo supuestos). */
export const CONSTANTES = {
  /** Anualización de ene–abr: ×3, sin estacionalidad del verano */
  factorAnual: 3,
  mesesPeriodoReal: 4,
  /** Coste de plataforma de cada buque adicional, como fracción del coste del Bajamar. Sale del desglose de costes (costes.ts, columna «escala»): el servidor en tierra y el panel se comparten */
  plataformaPorBuqueExtra: FRACCIONES_DEFECTO.plataforma,
  /** Coste de implantación de cada buque adicional, como fracción del Bajamar. Sale del desglose de costes: hardware e instalación; el desarrollo ya está hecho */
  implantacionPorBuqueExtra: FRACCIONES_DEFECTO.implantacion,
  /** Máximo de buques adicionales del alcance: 8 de alta velocidad menos el Bajamar */
  buquesMax: 7,
}

export type Resultado = {
  meses: number
  pasajeros: number
  compradoresBase: number
  compradoresNuevo: number
  tasaBase: number
  tasaNueva: number
  ticketNuevo: number
  ventaBase: number
  ventaNueva: number
  /** Venta que pasa por el canal digital (sobre la que se paga comisión) */
  ventaDigital: number
  incremental: number
  /** Porcentaje de la venta incremental sobre la actual */
  incrementalPct: number
  margenBruto: number
  comisionTotal: number
  plataformaTotal: number
  implantacion: number
  /** Coste del periodo: plataforma + comisión + implantación */
  costeTotal: number
  /** Margen bruto - comisión - plataforma, sin implantación */
  resultadoOperativo: number
  /** Resultado del periodo tras la implantación */
  resultadoNeto: number
  /** Resultado operativo mensual (para payback) */
  netoMensual: number
  /** Meses para recuperar la implantación; null si no se recupera */
  paybackMeses: number | null
  /** Venta por pasajero tras el servicio */
  ventaPorPasajero: number
}

export type Flota = {
  buques: number
  ventaIncremental: number
  margenBruto: number
  costeOperativo: number
  implantacion: number
  resultadoOperativo: number
  resultadoNetoAnio1: number
  /** Resultado operativo total (Bajamar + buques adicionales) */
  resultadoOperativoTotal: number
  paybackMeses: number | null
}

/**
 * Fórmula (por periodo):
 *   compradores = pasajeros × (% que compra hoy + subida)
 *   venta nueva = compradores × ticket medio × (1 + adopción × subida de ticket)
 *   incremental = venta nueva − venta actual
 *   resultado operativo = incremental × margen − comisión × venta digital − plataforma × meses
 *   payback = implantación ÷ resultado operativo mensual
 */
export function calcular(p: Params, opts: { meses?: number } = {}): Resultado {
  const meses = opts.meses ?? 12
  const pasajeros = (derivados.pasajerosEstimados / CONSTANTES.mesesPeriodoReal) * meses
  const tasaBase = derivados.tasaCompra
  const tasaNueva = tasaBase + p.subidaCompra / 100
  const adop = p.adopcion / 100
  const ticketNuevo = totales.ticketMedio * (1 + adop * (p.subidaTicket / 100))
  const ventaBase = pasajeros * tasaBase * totales.ticketMedio
  const compradoresNuevo = pasajeros * tasaNueva
  const ventaNueva = compradoresNuevo * ticketNuevo
  const ventaDigital = compradoresNuevo * adop * totales.ticketMedio * (1 + p.subidaTicket / 100)
  const incremental = ventaNueva - ventaBase
  const margenBruto = incremental * (p.margen / 100)
  const comisionTotal = ventaDigital * (p.comision / 100)
  const plataformaTotal = p.plataforma * meses
  const resultadoOperativo = margenBruto - comisionTotal - plataformaTotal
  const netoMensual = resultadoOperativo / meses
  return {
    meses,
    pasajeros,
    compradoresBase: pasajeros * tasaBase,
    compradoresNuevo,
    tasaBase,
    tasaNueva,
    ticketNuevo,
    ventaBase,
    ventaNueva,
    ventaDigital,
    incremental,
    incrementalPct: ventaBase ? incremental / ventaBase : 0,
    margenBruto,
    comisionTotal,
    plataformaTotal,
    implantacion: p.implantacion,
    costeTotal: plataformaTotal + comisionTotal + p.implantacion,
    resultadoOperativo,
    resultadoNeto: resultadoOperativo - p.implantacion,
    netoMensual,
    paybackMeses: netoMensual > 0 ? p.implantacion / netoMensual : null,
    ventaPorPasajero: pasajeros ? ventaNueva / pasajeros : 0,
  }
}

/**
 * Extrapolación prudente a la flota (anual): cada buque adicional vende `equivalencia` % de lo que vende el Bajamar,
 * con el mismo efecto relativo del servicio. La plataforma y la implantación de los buques extra son una fracción
 * de las del Bajamar. Es un supuesto, no una previsión.
 */
export function flota(p: Params, fr: { implantacion: number; plataforma: number } = FRACCIONES_DEFECTO): Flota {
  const b = calcular(p, { meses: 12 })
  const n = Math.max(0, Math.min(CONSTANTES.buquesMax, p.buques))
  const eq = p.equivalencia / 100
  const ventaIncremental = b.incremental * eq * n
  const margenBruto = b.margenBruto * eq * n
  const comision = b.comisionTotal * eq * n
  const plataforma = p.plataforma * 12 * fr.plataforma * n
  const costeOperativo = comision + plataforma
  const implantacion = p.implantacion * fr.implantacion * n
  const resultadoOperativo = margenBruto - costeOperativo
  const resultadoOperativoTotal = b.resultadoOperativo + resultadoOperativo
  const implTotal = p.implantacion + implantacion
  return {
    buques: n,
    ventaIncremental,
    margenBruto,
    costeOperativo,
    implantacion,
    resultadoOperativo,
    resultadoNetoAnio1: resultadoOperativoTotal - implTotal,
    resultadoOperativoTotal,
    paybackMeses: resultadoOperativoTotal > 0 ? implTotal / (resultadoOperativoTotal / 12) : null,
  }
}

/** Flujo acumulado mes a mes (el mes 0 es la implantación). Sin rampa de adopción. */
export function flujoAcumulado(p: Params, meses = 36): number[] {
  const r = calcular(p, { meses: 12 })
  return Array.from({ length: meses + 1 }, (_, m) => -p.implantacion + r.netoMensual * m)
}

/** Cada supuesto con su fuente. `clave` enlaza con Params cuando aplica. */
export const FUENTES: { nombre: string; valor: string; fuente: Fuente; nota: string }[] = [
  { nombre: 'Facturación de la barra, ene–abr 2026', valor: '228.041 €', fuente: 'real', nota: 'Informe de ventas Bajamar Express (datos del reto).' },
  { nombre: 'Tickets y ticket medio', valor: '38.651 · 5,90 €', fuente: 'real', nota: 'Informe de ventas Bajamar Express.' },
  { nombre: 'Consumo medio por pasajero', valor: '1,37 €', fuente: 'real', nota: 'Dato del reto.' },
  { nombre: 'Pasajeros y % que compra hoy', valor: '≈ 166.000 (4 meses) · ≈ 23 %', fuente: 'derivado', nota: 'Cálculo propio: facturación ÷ consumo por pasajero, y consumo ÷ ticket medio.' },
  { nombre: 'Anualización', valor: '× 3 (ene–abr → año)', fuente: 'supuesto', nota: 'Sin estacionalidad: no recoge el verano ni los meses sin datos. A validar con el año completo.' },
  { nombre: 'Adopción del canal', valor: '15 / 25 / 35 %', fuente: 'supuesto', nota: 'Referencias de otros sectores en el benchmark (datos de proveedor), no de Fred. Olsen. Se mide en el piloto.' },
  { nombre: 'Aumento del % que compra', valor: '+2 / +3 / +5 puntos', fuente: 'supuesto', nota: 'Hipótesis oficial del reto: «impulsar compras adicionales». Se mide contra línea base.' },
  { nombre: 'Aumento del ticket por upselling', valor: '+5 / +10 / +15 %', fuente: 'supuesto', nota: 'Combos y sugerencias. Referencias del benchmark son datos de proveedor y más altas; se parte de valores prudentes.' },
  { nombre: 'Comisión de la pasarela', valor: '1,5 % (1,2–1,8 %)', fuente: 'supuesto', nota: 'Orden de magnitud habitual; la tarifa real depende del banco de Fred. Olsen.' },
  { nombre: 'Margen bruto sobre la venta incremental', valor: '55 %', fuente: 'supuesto', nota: 'No tenemos el margen real de la barra. Fred. Olsen puede sustituirlo con su escandallo.' },
  { nombre: 'Coste de implantación', valor: `${eur(PILOTO_DEFECTO.implantacion)}`, fuente: 'supuesto', nota: 'Suma del desglose de costes (personas, herramientas e infraestructura del piloto, más 10 % de contingencia). Precios de hardware y herramientas con fuente pública; horas y algunas partidas, supuestos del equipo. Sin presupuestos de proveedores.' },
  { nombre: 'Coste mensual de plataforma', valor: `${eur(PILOTO_DEFECTO.plataforma)}/mes`, fuente: 'supuesto', nota: 'Suma del desglose recurrente: mantenimiento, soporte y producto, licencias de desarrollo, nube, conectividad y dominio (los anuales prorrateados). No incluye la comisión de la pasarela, que se calcula aparte, ni la licencia del módulo de integración de Ágora (a 0 € hasta tener presupuesto).' },
  { nombre: 'Licencia del módulo de integración de Ágora', valor: 'Sin importe · a validar con Ágora', fuente: 'supuesto', nota: 'Las fuentes públicas dicen que el módulo debe estar licenciado y activo, pero no su precio. No está incluida en la implantación ni en la plataforma (sí tiene su línea, a 0 €); figura a 0 € en el desglose y en el simulador hasta tener presupuesto.' },
  { nombre: 'Flota: buques y ventas respecto al Bajamar', valor: '3–7 buques · 40–60 %', fuente: 'supuesto', nota: 'Solo buques de alta velocidad con cafetería. No tenemos ventas de otros buques: es una extrapolación prudente.' },
]
