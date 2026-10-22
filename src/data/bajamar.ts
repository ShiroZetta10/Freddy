// Datos oficiales del reto: "Informe de ventas Bajamar Express", ene–abr 2026 (Fred. Olsen Express).
// Criterio de origen: solo ventas con importe positivo; sin devoluciones ni operaciones a 0 €.

export const totales = {
  facturacion: 228041.02,
  tickets: 38651,
  ticketMedio: 5.9,
  consumoPorPasajero: 1.37,
  duracionMin: 80,
  cafeterias: 3,
  capacidadPax: 1100,
}

export const meses = [
  { mes: 'Ene', facturacion: 54296.23, tickets: 9098, ticketMedio: 5.97 },
  { mes: 'Feb', facturacion: 57662.42, tickets: 10037, ticketMedio: 5.74 },
  { mes: 'Mar', facturacion: 47220.35, tickets: 8153, ticketMedio: 5.79 },
  { mes: 'Abr', facturacion: 68862.02, tickets: 11363, ticketMedio: 6.06 },
]

export const franjas = [
  { franja: 'Mañana', horas: '06:00–12:59', facturacion: 86278.54, tickets: 14098, ticketMedio: 6.12 },
  { franja: 'Mediodía', horas: '13:00–16:59', facturacion: 68548.25, tickets: 10877, ticketMedio: 6.3 },
  { franja: 'Tarde', horas: '17:00–20:59', facturacion: 61428.85, tickets: 11529, ticketMedio: 5.33 },
  { franja: 'Noche', horas: '21:00–22:00*', facturacion: 11785.38, tickets: 2147, ticketMedio: 5.49 },
]

export const franjasPorMes = [
  { mes: 'Ene', Mañana: 21128.06, Mediodía: 16906.31, Tarde: 13826.65, Noche: 2435.21 },
  { mes: 'Feb', Mañana: 22330.74, Mediodía: 17343.09, Tarde: 15304.84, Noche: 2683.75 },
  { mes: 'Mar', Mañana: 17320.86, Mediodía: 14428.58, Tarde: 12465.9, Noche: 3005.01 },
  { mes: 'Abr', Mañana: 25498.88, Mediodía: 19870.27, Tarde: 19831.46, Noche: 3661.41 },
]

export const familias = [
  { familia: 'Bocadillos', facturacion: 40315 },
  { familia: 'Cafés', facturacion: 38327 },
  { familia: 'Sándwiches', facturacion: 21268 },
  { familia: 'Ofertas', facturacion: 20723 },
  { familia: 'Aguas', facturacion: 18927 },
  { familia: 'Bollería', facturacion: 17934 },
  { familia: 'Refrescos cola', facturacion: 13893 },
  { familia: 'Cervezas', facturacion: 13449 },
  { familia: 'Snacks', facturacion: 13291 },
  { familia: 'Croissants', facturacion: 3777 },
]

export const productos = [
  { producto: 'Agua sin gas 1/2', unidades: 8090, facturacion: 14129.77 },
  { producto: 'Bocadillo pollo gourmet', unidades: 2376, facturacion: 13581.27 },
  { producto: 'Café cortado', unidades: 6274, facturacion: 11912.29 },
  { producto: 'Sándwich mixto', unidades: 1964, facturacion: 11186.12 },
  { producto: 'Bocadillo jamón serrano y queso', unidades: 1819, facturacion: 10478.46 },
  { producto: 'Oferta bollería + bebida caliente', unidades: 2178, facturacion: 9145.71 },
  { producto: 'Café solo', unidades: 4157, facturacion: 7890.56 },
  { producto: 'Dorada', unidades: 2802, facturacion: 7760.43 },
  { producto: 'Sándwich atún', unidades: 1083, facturacion: 6201.9 },
  { producto: 'Bocadillo tortilla', unidades: 1013, facturacion: 5850.05 },
]

// Derivados (cálculo propio a partir de los datos oficiales)
export const derivados = {
  // pasajeros estimados = facturación / consumo medio por pasajero
  pasajerosEstimados: Math.round(totales.facturacion / totales.consumoPorPasajero),
  // tickets por pasajero ≈ consumo por pasajero / ticket medio
  tasaCompra: totales.consumoPorPasajero / totales.ticketMedio,
}

export const eur = (n: number, d = 0) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: d, minimumFractionDigits: d })
export const num = (n: number, d = 0) =>
  n.toLocaleString('es-ES', { maximumFractionDigits: d, minimumFractionDigits: d })
export const pct = (n: number, d = 0) => `${num(n * 100, d)} %`
