// Fuentes y costes del Simulador de impacto (issue #1).
// Regla: cada cifra del simulador es (a) dato real de Fred. Olsen, sin URL pública, (b) dato de una fuente pública
// con URL comprobada, o (c) SUPUESTO del equipo, etiquetado como tal y sin URL.
// URLs comprobadas el 22-oct-2026 (la página existe y recoge el dato que se cita).
// Los precios son orientativos: cambian con el tiempo y se citan tal y como aparecían en la página.

export type Origen = 'real' | 'publicada'

export type FuenteSim = {
  /** Número que aparece como [n] junto a cada cifra */
  id: number
  titulo: string
  publica: string
  fecha?: string
  /** Qué dato tomamos de esta fuente */
  dato: string
  /** Matiz o límite del dato (proveedor, otro sector, precio con IVA…) */
  limite?: string
  /** Sin URL: dato facilitado por Fred. Olsen o documento interno */
  url?: string
  origen: Origen
}

export const FUENTES_SIM: FuenteSim[] = [
  {
    id: 1,
    titulo: 'Informe de ventas Bajamar Express ene–abr 2026, facilitado por Fred. Olsen Express a los equipos del hackathon',
    publica: 'Fred. Olsen Express',
    fecha: 'Ene–abr 2026',
    dato: 'Facturación de la barra (228.041 €), 38.651 tickets, ticket medio 5,90 €, consumo medio por pasajero 1,37 €, 3 cafeterías, capacidad 1.100 pasajeros. De ahí salen los ≈ 166.000 pasajeros estimados y el ≈ 23 % que compra hoy (cálculo propio).',
    limite: 'Dato real, sin URL pública. Solo ventas con importe positivo.',
    origen: 'real',
  },
  {
    id: 2,
    titulo: 'Report details patterns of fans abandoning F&B queues due to wait times (estudio «The Fan Experience», Oracle Hospitality y Turnkey Intelligence)',
    publica: 'Stadia Magazine',
    fecha: '14 jul 2016',
    dato: 'Más del 40 % de los aficionados abandonó una cola de restauración sin comprar en los 12 meses anteriores (encuesta a más de 3.500 aficionados de 8 países).',
    limite: 'Estadios, no ferris; encuesta de 2016. Justifica el problema de la cola, no la cifra de +3 puntos.',
    url: 'https://www.stadia-magazine.com/news/catering-concessions/report-details-patterns-of-fans-abandoning-fb-queues-due-to-wait-times.html',
    origen: 'publicada',
  },
  {
    id: 3,
    titulo: 'Starbucks mobile orders surpass 30% of total transactions at U.S. stores for the first time',
    publica: 'GeekWire',
    fecha: '31 ene 2024',
    dato: 'El 31 % de las transacciones en tiendas propias de Starbucks en EE. UU. se hicieron con la app (dato a 31 dic 2023).',
    limite: 'Cadena con una app madura y años de fidelización. Es un techo de referencia, no un punto de partida.',
    url: 'https://www.geekwire.com/2024/starbucks-mobile-orders-surpass-30-of-total-transactions-at-u-s-stores-for-the-first-time/',
    origen: 'publicada',
  },
  {
    id: 4,
    titulo: 'Chipotle announces fourth quarter and full year 2025 results',
    publica: 'Chipotle Mexican Grill (relaciones con inversores)',
    fecha: '3 feb 2026',
    dato: 'Las ventas digitales fueron el 36,7 % de los ingresos de comida y bebida en 2025 (37,2 % en el cuarto trimestre).',
    limite: 'Cadena de restauración en EE. UU., incluye recogida en tienda y reparto.',
    url: 'https://ir.chipotle.com/2026-02-03-CHIPOTLE-ANNOUNCES-FOURTH-QUARTER-AND-FULL-YEAR-2025-RESULTS',
    origen: 'publicada',
  },
  {
    id: 5,
    titulo: 'Iberia Express boosts onboard orders by 41% with Immfly’s In-Seat Order solution',
    publica: 'Future Travel Experience',
    fecha: '4 dic 2024',
    dato: 'Con el pedido a bordo de Immfly, el valor medio del pedido es un 42 % superior a la venta con carrito, los pedidos suben un 41 % y el gasto por pasajero un 29 % en los vuelos con el sistema.',
    limite: 'Dato del proveedor y la aerolínea, sin metodología ni línea base; compara con el carrito, no con una barra. No lo usamos como valor por defecto.',
    url: 'https://www.futuretravelexperience.com/2024/12/iberia-express-boosts-onboard-orders-by-41-with-immflys-in-seat-order-solution/',
    origen: 'publicada',
  },
  {
    id: 6,
    titulo: 'A mobile-focused fan experience fuels growth for the Tampa Bay Rays',
    publica: 'Shift4',
    dato: 'Aumento del 5,6 % en el ticket medio («check average») y del 31,2 % en pedidos en 6 puestos de mucho tráfico, tras una temporada con el sistema.',
    limite: 'Caso de un proveedor en un solo estadio; la página no indica fecha. Es la referencia prudente de subida de ticket.',
    url: 'https://www.shift4.com/no-NO/blog/a-mobile-focused-fan-experience-fuels-growth-for-the-tampa-bay-rays',
    origen: 'publicada',
  },
  {
    id: 7,
    titulo: 'Stripe: precios para empresas en España',
    publica: 'Stripe',
    fecha: 'Consultada el 22 oct 2026',
    dato: 'Tarjetas estándar del EEE: 1,5 % + 0,25 € por transacción. Tarjetas premium del EEE: 2,8 % + 0,25 €. Tarjetas del Reino Unido: 2,5 % + 0,25 €.',
    limite: 'Tarifa pública de una pasarela estándar. Un adquirente bancario (Redsys) puede ser más barato; depende del contrato de Fred. Olsen.',
    url: 'https://stripe.com/es/pricing',
    origen: 'publicada',
  },
  {
    id: 8,
    titulo: 'Tablet Samsung Galaxy Tab Active5 WiFi + 5G 8" 6 GB 128 GB',
    publica: 'PcComponentes',
    fecha: 'Precio consultado el 22 oct 2026',
    dato: '549,99 € (precio de venta; antes 599,99 €). Tablet resistente de uso profesional.',
    limite: 'Precio de tienda con IVA, sin descuento por volumen ni contrato profesional.',
    url: 'https://www.pccomponentes.com/tablet-samsung-galaxy-tab-active5-wifi-5g-8-6gb-128gb-verde-stylus-pen',
    origen: 'publicada',
  },
  {
    id: 9,
    titulo: 'Monitor Samsung QM43B Smart Signage 42,5" 4K, 24/7 (LH43QMBEPGCXEN)',
    publica: 'Chip7 (tienda de Portugal)',
    fecha: 'Precio consultado el 22 oct 2026',
    dato: '633,90 € con IVA. Pantalla de señalización profesional para uso continuo, válida para el aviso de pedidos «listos».',
    limite: 'Tienda portuguesa, IVA incluido. No incluye soporte ni instalación.',
    url: 'https://chip7.pt/perifericos/monitores/office/samsung/lh43qmcepgcxen',
    origen: 'publicada',
  },
  {
    id: 10,
    titulo: 'APC Back-UPS Pro BR900G-GR, SAI 900 VA',
    publica: 'PcComponentes',
    fecha: 'Precio consultado el 22 oct 2026',
    dato: '298,99 €. SAI para proteger el servidor a bordo frente a cortes de corriente.',
    limite: 'Precio de tienda con IVA.',
    url: 'https://www.pccomponentes.com/apc-back-ups-pro-br900g-gr-sai-900va',
    origen: 'publicada',
  },
  {
    id: 11,
    titulo: 'Starlink 2025, here we go again',
    publica: 'Panbo (Ben Stein)',
    fecha: '21 mar 2025 (actualizado el 31 mar 2025)',
    dato: 'Plan Global Priority de Starlink (uso en el mar): bloques de datos de 50 GB a 2 USD/GB y de 500 GB a 1 USD/GB.',
    limite: 'Precios en dólares de EE. UU., sin convertir; Starlink cambia planes y precios con frecuencia. Fred. Olsen ya tiene Starlink contratado y no conocemos su tarifa.',
    url: 'https://panbo.com/starlink-2025-here-we-go-again/',
    origen: 'publicada',
  },
  {
    id: 12,
    titulo: 'Estimating software maintenance costs: the forgotten key to total cost of ownership',
    publica: 'Edana',
    fecha: '3 ene 2026',
    dato: 'Regla habitual: el mantenimiento anual cuesta entre el 15 % y el 25 % del coste de desarrollo inicial.',
    limite: 'Regla general de una agencia; hay que ajustarla por criticidad y nivel de servicio.',
    url: 'https://edana.ch/en/2026/01/03/estimating-software-maintenance-costs-the-forgotten-key-to-total-cost-of-ownership/',
    origen: 'publicada',
  },
]

/** Supuestos del equipo: sin fuente pública. Se muestran con la etiqueta «Supuesto» y sin enlace externo. */
export type SupuestoSim = { id: string; nombre: string; valor: string; nota: string }

export const SUPUESTOS_SIM: SupuestoSim[] = [
  { id: 'S1', nombre: 'Nuevos compradores: +3 puntos', valor: '+3 pp (rango 0–15)', nota: 'Escenario base del plan de implementación. Ninguna fuente pública da este valor para un ferry; [2] solo muestra que existe abandono de cola. Lo mide el piloto.' },
  { id: 'S2', nombre: 'Compras por el móvil: 25 %', valor: '25 % (rango 0–60)', nota: 'Escenario base del plan. Se queda por debajo de lo que alcanzan cadenas con app madura [3][4], porque el pasajero de un trayecto de 80 minutos no instala nada.' },
  { id: 'S3', nombre: 'Subida del ticket en el canal móvil: +10 %', valor: '+10 % (rango 0–45)', nota: 'Escenario base del plan. Antes el simulador partía de +15 %, que no tiene fuente. Queda entre el +5,6 % de [6] y el +42 % de [5], más cerca del primero.' },
  { id: 'S4', nombre: 'Anualización ×3', valor: '× 3 (4 meses → 12)', nota: 'Multiplica ene–abr por 3. No recoge la estacionalidad del verano ni los meses sin datos.' },
  { id: 'S5', nombre: 'Margen bruto sobre la venta incremental: 55 %', valor: '55 %', nota: 'No tenemos el margen real de la barra (escandallo). Mismo valor que el plan de implementación.' },
  { id: 'S6', nombre: 'Coste de desarrollo de producción: 16.500 €', valor: '16.500 €', nota: 'Estimación propia del simulador, sin presupuesto de proveedor. El plan de implementación lo desglosa por horas y tarifas (desarrollo, integración con Ágora, red local, UX, producto y QA).' },
  { id: 'S7', nombre: 'Mini PC servidor a bordo: 700 € por unidad', valor: '700 €', nota: 'Punto medio del rango de 600–900 € de la FAQ técnica (mini PC industrial sin ventilador). Sin presupuesto de proveedor.' },
  { id: 'S8', nombre: 'Funda y soporte fijo de tablet: 60 €', valor: '60 €', nota: 'Estimación sin presupuesto.' },
  { id: 'S9', nombre: 'Impresión de QR de mesa: 150 €', valor: '150 €', nota: 'Lote de pegatinas o tarjetas resistentes al agua para las mesas. Estimación sin presupuesto.' },
  { id: 'S10', nombre: 'Piloto, formación y contingencia', valor: '3.000 € · 1.500 € · 4.500 €', nota: 'Estimación propia del simulador. El plan de implementación desglosa la formación por horas y aplica un 10 % de contingencia.' },
  { id: 'S11', nombre: 'Nube en la UE y chat con IA', valor: '200 €/mes · 30 €/mes', nota: 'La FAQ técnica estima 100–300 €/mes de nube y «decenas de euros» de IA. Sin presupuesto de proveedor.' },
  { id: 'S12', nombre: 'Soporte y producto a tiempo parcial: 1.300 €/mes', valor: '1.300 €/mes', nota: 'Estimación propia del simulador, más prudente que el desglose del plan de implementación (≈ 1.350 €/mes de plataforma con mantenimiento, soporte, producto, herramientas y nube).' },
  { id: 'S13', nombre: 'Tráfico por pedido: 800 KB', valor: '800 KB por sesión de pedido', nota: 'La web se carga una vez (cientos de KB, luego queda en el móvil) y cada pedido son pocos KB. Sin medir: se medirá en la semana 0 del piloto.' },
  { id: 'S14', nombre: 'Uso total de datos de los pasajeros: 30 % conectados × 100 MB', valor: '30 % · 100 MB', nota: 'Solo sirve para comparar. No tenemos datos reales del wifi del Bajamar Express; Fred. Olsen puede sustituirlos.' },
  { id: 'S15', nombre: 'Licencia del módulo de integración de Ágora: sin importe', valor: '0 € (a validar con Ágora)', nota: 'Ágora exige el módulo de integración licenciado y activo [fuentes públicas del producto], pero no hemos encontrado su precio ni si es cuota única o recurrente. Se deja a 0 € como coste anticipable hasta tener presupuesto de Ágora; no es un coste cero real.' },
]

/** Una línea de coste editable: importe = cantidad × precio unitario. `refs` apunta a FUENTES_SIM o a SUPUESTOS_SIM. */
export type LineaCoste = {
  id: string
  concepto: string
  detalle: string
  cantidad: number
  unidad: string
  precio: number
  refs: string[]
  /** Se incluye por defecto */
  activa: boolean
  /** Importe sin confirmar: se muestra con esta etiqueta junto al concepto */
  avalidar?: string
}

/** Costes únicos del piloto: 1 buque (Bajamar Express), 3 cafeterías. */
export const COSTES_UNICOS: LineaCoste[] = [
  { id: 'dev', concepto: 'Desarrollo de producción e integración', detalle: 'Conector con Ágora, pasarela de pago, servidor del barco y nube', cantidad: 1, unidad: 'ud.', precio: 16500, refs: ['S6'], activa: true },
  { id: 'tablet', concepto: 'Tablets resistentes de barra', detalle: '3 cafeterías + 1 de repuesto', cantidad: 4, unidad: 'ud.', precio: 549.99, refs: ['8'], activa: true },
  { id: 'soporte', concepto: 'Funda y soporte fijo de tablet', detalle: 'Uno por tablet', cantidad: 4, unidad: 'ud.', precio: 60, refs: ['S8'], activa: true },
  { id: 'minipc', concepto: 'Mini PC servidor a bordo', detalle: '1 en el buque + 1 de repuesto en tierra', cantidad: 2, unidad: 'ud.', precio: 700, refs: ['S7'], activa: true },
  { id: 'sai', concepto: 'SAI para el servidor', detalle: 'Evita cortes si falla la corriente', cantidad: 1, unidad: 'ud.', precio: 298.99, refs: ['10'], activa: true },
  { id: 'pantallas', concepto: 'Pantallas de pedidos «listos»', detalle: 'Una por cafetería (opcional: si no, solo aviso en el móvil)', cantidad: 3, unidad: 'ud.', precio: 633.9, refs: ['9'], activa: true },
  { id: 'qr', concepto: 'Impresión de QR para mesas', detalle: 'Lote para el buque', cantidad: 1, unidad: 'lote', precio: 150, refs: ['S9'], activa: true },
  { id: 'piloto', concepto: 'Piloto, medición y conciliación', detalle: '10 % del presupuesto del plan', cantidad: 1, unidad: 'ud.', precio: 3000, refs: ['S10'], activa: true },
  { id: 'formacion', concepto: 'Formación corta y material', detalle: '5 % del presupuesto del plan', cantidad: 1, unidad: 'ud.', precio: 1500, refs: ['S10'], activa: true },
  { id: 'contingencia', concepto: 'Contingencia', detalle: '15 % del presupuesto del plan', cantidad: 1, unidad: 'ud.', precio: 4500, refs: ['S10'], activa: true },
]

/** Costes recurrentes fijos (mensuales). Mantenimiento, wifi y comisión se calculan aparte. */
export const COSTES_MENSUALES: LineaCoste[] = [
  { id: 'nube', concepto: 'Nube en la UE (PostgreSQL, analítica)', detalle: 'Carta, precios, panel del manager', cantidad: 12, unidad: 'meses', precio: 200, refs: ['S11'], activa: true },
  { id: 'ia', concepto: 'Chat con IA, con límite de uso', detalle: 'Opcional; se puede apagar', cantidad: 12, unidad: 'meses', precio: 30, refs: ['S11'], activa: true },
  { id: 'agora', concepto: 'Licencia del módulo de integración de Ágora', detalle: 'Necesaria para el conector. Importe y periodicidad por confirmar; se introduce aquí cuando Ágora dé presupuesto', cantidad: 12, unidad: 'meses', precio: 0, refs: ['S15'], activa: true, avalidar: 'a validar con Ágora' },
  { id: 'soporte', concepto: 'Soporte y producto a tiempo parcial', detalle: 'Atención de incidencias y mejoras', cantidad: 12, unidad: 'meses', precio: 1300, refs: ['S12'], activa: true },
]

export const MANTENIMIENTO = {
  /** % anual del coste de desarrollo. Rango publicado: 15–25 % [12] */
  pct: 20,
  min: 15,
  max: 25,
  refs: ['12', 'S6'],
}

export const WIFI = {
  kbPorPedido: 800,
  /** Precio de referencia por GB si todo el tráfico saliera por satélite (2 USD/GB [11], tratado como 2 €) */
  eurPorGb: 2,
  conectadosPct: 30,
  mbPorPasajero: 100,
  refs: ['11', 'S13', 'S14'],
}

export const PASARELA = {
  /** Stripe España, tarjetas estándar del EEE [7] */
  pct: 1.5,
  fija: 0.25,
  /** Plan de implementación: 1,5 % sin cuota fija (negocio.ts) */
  pctPlan: 1.5,
  refs: ['7'],
}

export const MARGEN_DEFECTO = 55
