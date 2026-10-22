/**
 * FredOnBoard · "backend" simulado del prototipo.
 *
 * Un único estado compartido entre las tres vistas (pasajero, barra, manager):
 *  - Persistido en localStorage y sincronizado entre pestañas con BroadcastChannel
 *    → puedes abrir el pasajero en el móvil/pestaña A y la barra en la pestaña B y ver los pedidos llegar.
 *  - Reloj de demo acelerado: el viaje Santa Cruz → Agaete (80 min) avanza solo.
 *  - Un "bot" genera pedidos de otros pasajeros para que barra y manager tengan vida.
 *
 * Contrato para las vistas: leer con useProto(selector) y modificar SOLO con las acciones exportadas
 * (o con update() para casos propios).
 */
import { useSyncExternalStore } from 'react'

// ---------------------------------------------------------------- tipos
export type CafeteriaId = 'proa' | 'popa' | 'oro'
export type Categoria = 'Desayunos' | 'Bocadillos' | 'Sándwiches' | 'Bebidas' | 'Snacks' | 'Tienda'
export type Producto = {
  id: string
  nombre: string
  precio: number
  cat: Categoria
  desc: string
  km0?: boolean // producto canario / de proximidad («Elaborado en Canarias»)
  origen?: string // procedencia genérica (sin marcas), p. ej. «Quesería de Tenerife»
  tags?: string[] // 'sin gluten', 'vegetariano', 'combo'
  stock: number // unidades restantes en la travesía (total entre cafeterías)
  agotado: boolean // marcado a mano por la barra
  color: string // color de la ilustración
}
export type EstadoPedido = 'recibido' | 'preparando' | 'listo' | 'entregado' | 'cancelado'
export type LineaPedido = { pid: string; qty: number }
export type Pedido = {
  id: number // número visible (#214)
  clientKey: string // clave de idempotencia generada en el cliente
  ticket: string // localizador del billete
  nombre: string // nombre del pasajero
  asiento: string
  lineas: LineaPedido[]
  total: number
  cafeteria: CafeteriaId
  franja: number // índice de franja (minuto de viaje / tamaño de franja)
  estado: EstadoPedido
  prepedido: boolean
  pago: 'apple' | 'google' | 'tarjeta'
  sinPlastico?: boolean // «Sin cubiertos ni bolsa» (En Armonía con el Mar)
  tarifaJoven?: boolean // el billete es Tarifa Joven y se aplicó la ventaja propuesta
  descuentoJoven?: number // € descontados por la ventaja Tarifa Joven (ya restados de `total`)
  bot?: boolean
  t: Partial<Record<EstadoPedido | 'creado', number>> // marcas de tiempo (ms reales)
}
// ---------------------------------------------------------------- inventario
/**
 * Inventario por escandallo (como el sistema de Fred. Olsen): cada producto de venta descuenta
 * del inventario los insumos y cantidades de su receta. Aprovisionamiento real de la empresa:
 *  - No perecederos (agua, refrescos, café, snacks…): compra semanal.
 *  - Perecederos de catering: recepción diaria.
 * Limitación clave: el espacio de frío del buque.
 */
export type Unidad = 'ud' | 'g' | 'ml'
export type Insumo = {
  id: string
  nombre: string
  unidad: Unidad
  stock: number
  minimo: number // por debajo, alerta de reposición
  inicial: number // cantidad de referencia tras la última recepción
  tipo: 'perecedero' | 'no-perecedero'
  conservacion: 'frio' | 'seco'
  aprovisionamiento: 'catering diario' | 'compra semanal'
  coste: number // € por unidad de medida (ud, g o ml)
  litros?: number // volumen en frío por unidad de medida (para la capacidad de la cámara)
  envase?: number // tamaño de compra (redondeo del pedido)
}
export type LineaEscandallo = { iid: string; qty: number }
export type TipoMovimiento = 'venta' | 'cancelacion' | 'entrada' | 'merma' | 'ajuste'
export type Movimiento = { id: number; t: number; iid: string; delta: number; tipo: TipoMovimiento; ref?: string }

export type Fase = 'antes' | 'embarque' | 'navegando' | 'llegando' | 'llegado'
export type Billete = { ticket: string; nombre: string; asiento: string; idioma: 'es' | 'en' | 'de'; plus: number; tarifaJoven?: boolean }
export type Mensaje = { id: number; texto: string; t: number; de: 'manager' | 'sistema' }
export type Alerta = { id: number; nivel: 'info' | 'warn'; texto: string; t: number }

export type ProtoState = {
  version: number
  viaje: {
    buque: string
    origen: string
    destino: string
    salida: string // "08:00"
    duracionMin: number // 80
    minuto: number // minuto simulado del viaje: <0 antes de zarpar, 0..80 navegando, >80 llegado
    velocidad: number // minutos simulados por segundo real (0 = pausado)
  }
  ajustes: {
    franjaMin: number // tamaño de franja en minutos (5)
    topePorFranja: number // pedidos máximos por franja y cafetería
    cierreAntesLlegada: number // minutos antes de llegar en los que se cierran pedidos (20)
    umbralStock: number // se oculta el producto cuando quedan <= umbral
    pausa: Record<CafeteriaId, boolean>
    bot: boolean
    online: boolean // simula la conexión (Starlink) del barco
  }
  cafeterias: Record<CafeteriaId, { nombre: string; cubierta: string; abierta: boolean }>
  productos: Producto[]
  pedidos: Pedido[]
  pendientesOffline: Pedido[] // pedidos creados sin conexión, aún no sincronizados
  billetes: Billete[]
  mensajes: Mensaje[]
  alertas: Alerta[]
  siguienteId: number
  insumos: Insumo[]
  escandallos: Record<string, LineaEscandallo[]> // producto -> receta
  movimientos: Movimiento[] // últimos movimientos de inventario
  almacen: { frioLitros: number } // capacidad de la cámara de frío del buque
  aprovisionamiento: { ultimaCompraSemanal: string; ultimaRecepcionCatering: string }
  // métricas de línea base (datos reales del reto)
  base: { ventaPorPasajero: number; ticketMedio: number; tasaCompra: number; pasajeros: number }
}

// ---------------------------------------------------------------- datos iniciales
export const PRODUCTOS_INICIALES: Producto[] = [
  { id: 'cortado', nombre: 'Café cortado', precio: 1.9, cat: 'Desayunos', desc: 'Café de origen con leche canaria.', stock: 120, agotado: false, color: '#7a4b2a', km0: true, origen: 'Leche de ganaderías canarias' },
  { id: 'solo', nombre: 'Café solo', precio: 1.9, cat: 'Desayunos', desc: 'Espresso recién molido.', stock: 120, agotado: false, color: '#3b2416' },
  { id: 'oferta-bolleria', nombre: 'Bollería + bebida caliente', precio: 4.2, cat: 'Desayunos', desc: 'Croissant o napolitana con café o infusión.', tags: ['combo'], stock: 60, agotado: false, color: '#d99a3d' },
  { id: 'croissant', nombre: 'Croissant', precio: 2.1, cat: 'Desayunos', desc: 'Horneado a bordo.', stock: 8, agotado: false, color: '#e0a84f' },
  { id: 'pollo-gourmet', nombre: 'Bocadillo pollo gourmet', precio: 5.72, cat: 'Bocadillos', desc: 'Pollo asado, rúcula y alioli suave.', stock: 40, agotado: false, color: '#c0763a' },
  { id: 'serrano-queso', nombre: 'Bocadillo jamón serrano y queso', precio: 5.76, cat: 'Bocadillos', desc: 'Pan de leña y queso semicurado canario.', km0: true, origen: 'Quesería de Tenerife', stock: 35, agotado: false, color: '#b5453a' },
  { id: 'tortilla', nombre: 'Bocadillo de tortilla', precio: 5.77, cat: 'Bocadillos', desc: 'Tortilla de papas del día.', tags: ['vegetariano'], stock: 25, agotado: false, color: '#e8c25a' },
  { id: 'mixto', nombre: 'Sándwich mixto', precio: 5.7, cat: 'Sándwiches', desc: 'Jamón cocido y queso fundido.', stock: 30, agotado: false, color: '#d8b06a' },
  { id: 'atun', nombre: 'Sándwich de atún', precio: 5.73, cat: 'Sándwiches', desc: 'Atún, tomate y lechuga.', stock: 20, agotado: false, color: '#9fb36b' },
  { id: 'agua', nombre: 'Agua sin gas 1/2', precio: 1.75, cat: 'Bebidas', desc: 'Agua mineral canaria.', km0: true, origen: 'Manantial de Canarias', stock: 200, agotado: false, color: '#5aa7d6' },
  { id: 'refresco', nombre: 'Refresco de cola', precio: 2.3, cat: 'Bebidas', desc: 'Lata 33 cl.', stock: 90, agotado: false, color: '#8a1c1c' },
  { id: 'cerveza', nombre: 'Cerveza canaria', precio: 2.9, cat: 'Bebidas', desc: 'Tercio bien frío.', km0: true, origen: 'Cervecería artesana de Canarias', stock: 60, agotado: false, color: '#e3a600' },
  { id: 'papas', nombre: 'Papas fritas', precio: 1.8, cat: 'Snacks', desc: 'Bolsa individual.', tags: ['sin gluten'], stock: 70, agotado: false, color: '#f0c419' },
  { id: 'fruta', nombre: 'Plátano de Canarias', precio: 1.2, cat: 'Snacks', desc: 'IGP Plátano de Canarias.', km0: true, origen: 'Plátano de Canarias IGP', tags: ['sin gluten', 'vegetariano'], stock: 40, agotado: false, color: '#f2d43a' },
  // Tienda a bordo: producto canario y recuerdos («Lo nuestro viaja contigo»). Recogida en barra como el resto.
  { id: 'mojo', nombre: 'Mojo picón en tarro', precio: 4.5, cat: 'Tienda', desc: 'Mojo picón casero, tarro de 200 g.', km0: true, origen: 'Elaborado en Tenerife', stock: 24, agotado: false, color: '#b8321f' },
  { id: 'gofio', nombre: 'Gofio de millo tostado', precio: 3.2, cat: 'Tienda', desc: 'Gofio molido a la piedra, paquete de 500 g.', km0: true, origen: 'Gofio de La Palma', tags: ['vegetariano'], stock: 24, agotado: false, color: '#c9a35e' },
  { id: 'miel', nombre: 'Miel de abeja canaria', precio: 6.9, cat: 'Tienda', desc: 'Miel de flores de las islas, tarro de 250 g.', km0: true, origen: 'Apicultores de Tenerife', tags: ['sin gluten', 'vegetariano'], stock: 18, agotado: false, color: '#d9962b' },
  { id: 'dulces', nombre: 'Dulces típicos canarios', precio: 5.5, cat: 'Tienda', desc: 'Caja de galletas y dulces de almendra.', km0: true, origen: 'Obrador artesano de La Gomera', tags: ['vegetariano'], stock: 20, agotado: false, color: '#c98a5a' },
  { id: 'camiseta', nombre: 'Camiseta Fred. Olsen Express', precio: 14.9, cat: 'Tienda', desc: 'Algodón, recuerdo de tu travesía. Tallas S a XL.', stock: 12, agotado: false, color: '#0b3478' },
  { id: 'cartas', nombre: 'Juego de cartas infantil', precio: 6.5, cat: 'Tienda', desc: 'Baraja ilustrada con los barcos y las islas.', stock: 14, agotado: false, color: '#1f8f6a' },
]

export const INSUMOS_INICIALES: Insumo[] = [
  // Compra semanal · seco
  { id: 'cafe', nombre: 'Café en grano', unidad: 'g', stock: 3500, inicial: 6000, minimo: 800, tipo: 'no-perecedero', conservacion: 'seco', aprovisionamiento: 'compra semanal', coste: 0.018, envase: 1000 },
  { id: 'azucar', nombre: 'Azúcar (sobres)', unidad: 'ud', stock: 400, inicial: 1000, minimo: 100, tipo: 'no-perecedero', conservacion: 'seco', aprovisionamiento: 'compra semanal', coste: 0.01, envase: 500 },
  { id: 'vaso', nombre: 'Vasos para llevar', unidad: 'ud', stock: 350, inicial: 1000, minimo: 100, tipo: 'no-perecedero', conservacion: 'seco', aprovisionamiento: 'compra semanal', coste: 0.06, envase: 100 },
  { id: 'agua-bot', nombre: 'Agua sin gas 1/2 l', unidad: 'ud', stock: 180, inicial: 480, minimo: 48, tipo: 'no-perecedero', conservacion: 'seco', aprovisionamiento: 'compra semanal', coste: 0.22, envase: 24 },
  { id: 'cola-lata', nombre: 'Refresco de cola (lata)', unidad: 'ud', stock: 90, inicial: 240, minimo: 24, tipo: 'no-perecedero', conservacion: 'seco', aprovisionamiento: 'compra semanal', coste: 0.45, envase: 24 },
  { id: 'cerveza-tercio', nombre: 'Cerveza canaria (tercio)', unidad: 'ud', stock: 60, inicial: 144, minimo: 24, tipo: 'no-perecedero', conservacion: 'seco', aprovisionamiento: 'compra semanal', coste: 0.6, envase: 24 },
  { id: 'papas-bolsa', nombre: 'Papas fritas (bolsa)', unidad: 'ud', stock: 70, inicial: 150, minimo: 20, tipo: 'no-perecedero', conservacion: 'seco', aprovisionamiento: 'compra semanal', coste: 0.4, envase: 30 },
  // Catering diario · frío
  { id: 'leche', nombre: 'Leche', unidad: 'ml', stock: 5000, inicial: 8000, minimo: 1500, tipo: 'perecedero', conservacion: 'frio', aprovisionamiento: 'catering diario', coste: 0.0009, litros: 0.001, envase: 1000 },
  { id: 'pan-bocadillo', nombre: 'Pan de bocadillo', unidad: 'ud', stock: 70, inicial: 110, minimo: 15, tipo: 'perecedero', conservacion: 'seco', aprovisionamiento: 'catering diario', coste: 0.32, envase: 10 },
  { id: 'pan-molde', nombre: 'Pan de molde (rebanadas)', unidad: 'ud', stock: 90, inicial: 120, minimo: 20, tipo: 'perecedero', conservacion: 'seco', aprovisionamiento: 'catering diario', coste: 0.08, envase: 20 },
  { id: 'pollo', nombre: 'Pollo asado', unidad: 'g', stock: 3600, inicial: 4500, minimo: 900, tipo: 'perecedero', conservacion: 'frio', aprovisionamiento: 'catering diario', coste: 0.011, litros: 0.0015, envase: 500 },
  { id: 'serrano', nombre: 'Jamón serrano', unidad: 'g', stock: 1750, inicial: 2500, minimo: 500, tipo: 'perecedero', conservacion: 'frio', aprovisionamiento: 'catering diario', coste: 0.018, litros: 0.0015, envase: 250 },
  { id: 'queso-semi', nombre: 'Queso semicurado canario', unidad: 'g', stock: 1400, inicial: 2000, minimo: 400, tipo: 'perecedero', conservacion: 'frio', aprovisionamiento: 'catering diario', coste: 0.014, litros: 0.0012, envase: 250 },
  { id: 'jamon-cocido', nombre: 'Jamón cocido', unidad: 'g', stock: 1200, inicial: 1500, minimo: 300, tipo: 'perecedero', conservacion: 'frio', aprovisionamiento: 'catering diario', coste: 0.009, litros: 0.0015, envase: 250 },
  { id: 'queso-lonchas', nombre: 'Queso en lonchas', unidad: 'g', stock: 900, inicial: 1200, minimo: 250, tipo: 'perecedero', conservacion: 'frio', aprovisionamiento: 'catering diario', coste: 0.009, litros: 0.0012, envase: 250 },
  { id: 'atun', nombre: 'Atún', unidad: 'g', stock: 1000, inicial: 1200, minimo: 250, tipo: 'perecedero', conservacion: 'frio', aprovisionamiento: 'catering diario', coste: 0.012, litros: 0.0012, envase: 250 },
  { id: 'tortilla', nombre: 'Tortilla de papas (porción)', unidad: 'ud', stock: 25, inicial: 30, minimo: 6, tipo: 'perecedero', conservacion: 'frio', aprovisionamiento: 'catering diario', coste: 0.7, litros: 0.25, envase: 8 },
  { id: 'verdura', nombre: 'Tomate, lechuga y rúcula', unidad: 'g', stock: 1500, inicial: 2000, minimo: 400, tipo: 'perecedero', conservacion: 'frio', aprovisionamiento: 'catering diario', coste: 0.004, litros: 0.003, envase: 500 },
  { id: 'alioli', nombre: 'Alioli suave', unidad: 'g', stock: 600, inicial: 800, minimo: 150, tipo: 'perecedero', conservacion: 'frio', aprovisionamiento: 'catering diario', coste: 0.006, litros: 0.001, envase: 200 },
  { id: 'croissant', nombre: 'Croissant / napolitana', unidad: 'ud', stock: 12, inicial: 40, minimo: 8, tipo: 'perecedero', conservacion: 'seco', aprovisionamiento: 'catering diario', coste: 0.45, envase: 10 },
  { id: 'platano', nombre: 'Plátano de Canarias', unidad: 'ud', stock: 30, inicial: 40, minimo: 8, tipo: 'perecedero', conservacion: 'seco', aprovisionamiento: 'catering diario', coste: 0.25, envase: 10 },
  // Tienda a bordo · no perecedero, seco, compra semanal (el insumo es la propia unidad de venta)
  { id: 'ti-mojo', nombre: 'Mojo picón (tarro)', unidad: 'ud', stock: 24, inicial: 36, minimo: 6, tipo: 'no-perecedero', conservacion: 'seco', aprovisionamiento: 'compra semanal', coste: 2.1, envase: 12 },
  { id: 'ti-gofio', nombre: 'Gofio (paquete 500 g)', unidad: 'ud', stock: 24, inicial: 36, minimo: 6, tipo: 'no-perecedero', conservacion: 'seco', aprovisionamiento: 'compra semanal', coste: 1.4, envase: 12 },
  { id: 'ti-miel', nombre: 'Miel canaria (tarro)', unidad: 'ud', stock: 18, inicial: 24, minimo: 4, tipo: 'no-perecedero', conservacion: 'seco', aprovisionamiento: 'compra semanal', coste: 3.6, envase: 6 },
  { id: 'ti-dulces', nombre: 'Dulces típicos (caja)', unidad: 'ud', stock: 20, inicial: 30, minimo: 6, tipo: 'no-perecedero', conservacion: 'seco', aprovisionamiento: 'compra semanal', coste: 2.7, envase: 10 },
  { id: 'ti-camiseta', nombre: 'Camiseta Fred. Olsen', unidad: 'ud', stock: 12, inicial: 16, minimo: 3, tipo: 'no-perecedero', conservacion: 'seco', aprovisionamiento: 'compra semanal', coste: 6.5, envase: 4 },
  { id: 'ti-cartas', nombre: 'Juego de cartas infantil', unidad: 'ud', stock: 14, inicial: 20, minimo: 4, tipo: 'no-perecedero', conservacion: 'seco', aprovisionamiento: 'compra semanal', coste: 3, envase: 4 },
]

/** Escandallos: receta de cada producto de venta (cantidades por unidad vendida). */
export const ESCANDALLOS_INICIALES: Record<string, LineaEscandallo[]> = {
  cortado: [{ iid: 'cafe', qty: 7 }, { iid: 'leche', qty: 40 }, { iid: 'vaso', qty: 1 }, { iid: 'azucar', qty: 1 }],
  solo: [{ iid: 'cafe', qty: 7 }, { iid: 'vaso', qty: 1 }, { iid: 'azucar', qty: 1 }],
  'oferta-bolleria': [{ iid: 'croissant', qty: 1 }, { iid: 'cafe', qty: 7 }, { iid: 'leche', qty: 100 }, { iid: 'vaso', qty: 1 }, { iid: 'azucar', qty: 1 }],
  croissant: [{ iid: 'croissant', qty: 1 }],
  'pollo-gourmet': [{ iid: 'pan-bocadillo', qty: 1 }, { iid: 'pollo', qty: 90 }, { iid: 'verdura', qty: 10 }, { iid: 'alioli', qty: 15 }],
  'serrano-queso': [{ iid: 'pan-bocadillo', qty: 1 }, { iid: 'serrano', qty: 50 }, { iid: 'queso-semi', qty: 40 }],
  tortilla: [{ iid: 'pan-bocadillo', qty: 1 }, { iid: 'tortilla', qty: 1 }],
  mixto: [{ iid: 'pan-molde', qty: 2 }, { iid: 'jamon-cocido', qty: 40 }, { iid: 'queso-lonchas', qty: 30 }],
  atun: [{ iid: 'pan-molde', qty: 2 }, { iid: 'atun', qty: 50 }, { iid: 'verdura', qty: 45 }],
  agua: [{ iid: 'agua-bot', qty: 1 }],
  refresco: [{ iid: 'cola-lata', qty: 1 }],
  cerveza: [{ iid: 'cerveza-tercio', qty: 1 }],
  papas: [{ iid: 'papas-bolsa', qty: 1 }],
  fruta: [{ iid: 'platano', qty: 1 }],
  // tienda: la propia unidad
  mojo: [{ iid: 'ti-mojo', qty: 1 }],
  gofio: [{ iid: 'ti-gofio', qty: 1 }],
  miel: [{ iid: 'ti-miel', qty: 1 }],
  dulces: [{ iid: 'ti-dulces', qty: 1 }],
  camiseta: [{ iid: 'ti-camiseta', qty: 1 }],
  cartas: [{ iid: 'ti-cartas', qty: 1 }],
}

/**
 * Unidades vendidas por pasajero (para la previsión de aprovisionamiento).
 * Calculadas con el informe real del Bajamar Express (ene–abr 2026): unidades del top 10 ÷ ≈166.453 pasajeros estimados.
 * Los productos fuera del top 10 son estimaciones del equipo (marcadas con est.).
 */
export const CONSUMO_POR_PASAJERO: Record<string, { u: number; fuente: 'real' | 'est.' }> = {
  agua: { u: 8090 / 166453, fuente: 'real' },
  'pollo-gourmet': { u: 2376 / 166453, fuente: 'real' },
  cortado: { u: 6274 / 166453, fuente: 'real' },
  mixto: { u: 1964 / 166453, fuente: 'real' },
  'serrano-queso': { u: 1819 / 166453, fuente: 'real' },
  'oferta-bolleria': { u: 2178 / 166453, fuente: 'real' },
  solo: { u: 4157 / 166453, fuente: 'real' },
  atun: { u: 1083 / 166453, fuente: 'real' },
  tortilla: { u: 1013 / 166453, fuente: 'real' },
  croissant: { u: 0.008, fuente: 'est.' },
  refresco: { u: 0.02, fuente: 'est.' },
  cerveza: { u: 0.015, fuente: 'est.' },
  papas: { u: 0.015, fuente: 'est.' },
  fruta: { u: 0.006, fuente: 'est.' },
  mojo: { u: 0.004, fuente: 'est.' },
  gofio: { u: 0.004, fuente: 'est.' },
  miel: { u: 0.003, fuente: 'est.' },
  dulces: { u: 0.006, fuente: 'est.' },
  camiseta: { u: 0.0015, fuente: 'est.' },
  cartas: { u: 0.002, fuente: 'est.' },
}

export const BILLETES_DEMO: Billete[] = [
  { ticket: 'FO7K2Q', nombre: 'Carmen', asiento: '42C', idioma: 'es', plus: 340 },
  { ticket: 'FO9X4M', nombre: 'Tom', asiento: '17A', idioma: 'en', plus: 0 },
  { ticket: 'FO3H8B', nombre: 'Greta', asiento: 'Oro 4', idioma: 'de', plus: 1250 },
  { ticket: 'FO2J5T', nombre: 'Yeray', asiento: '23B', idioma: 'es', plus: 120, tarifaJoven: true },
]

/**
 * Ventaja PROPUESTA para billetes Tarifa Joven (12–25 años): -20 % en un café o refresco por pedido
 * (la unidad elegible más cara). Es una propuesta de FredOnBoard, no una condición vigente de Fred. Olsen.
 */
export const VENTAJA_JOVEN = {
  pct: 0.2,
  pids: ['cortado', 'solo', 'refresco'],
  propuesta: true,
  texto: 'Tarifa Joven: café o refresco −20 % con tu pedido',
}

const NOMBRES_BOT = ['Ana', 'Luis', 'Marta', 'Jonay', 'Yeray', 'Elena', 'Pedro', 'Nira', 'Acerina', 'Raúl', 'Sofía', 'Iván', 'Beatriz', 'Dácil', 'Hugo']

export function estadoInicial(): ProtoState {
  return recalcular({
    version: 3,
    viaje: { buque: 'Bajamar Express', origen: 'Santa Cruz de Tenerife', destino: 'Agaete', salida: '08:00', duracionMin: 80, minuto: -25, velocidad: 0.5 },
    ajustes: {
      franjaMin: 5,
      topePorFranja: 8,
      cierreAntesLlegada: 20,
      umbralStock: 2,
      pausa: { proa: false, popa: false, oro: false },
      bot: true,
      online: true,
    },
    cafeterias: {
      proa: { nombre: 'Cafetería Proa', cubierta: 'Cubierta 5 · proa', abierta: true },
      popa: { nombre: 'Cafetería Popa', cubierta: 'Cubierta 5 · popa', abierta: true },
      oro: { nombre: 'Clase Oro', cubierta: 'Cubierta 6', abierta: true },
    },
    productos: PRODUCTOS_INICIALES.map((p) => ({ ...p })),
    pedidos: [],
    pendientesOffline: [],
    billetes: BILLETES_DEMO.map((b) => ({ ...b })),
    mensajes: [{ id: 1, texto: 'Bienvenidos a bordo del Bajamar Express. Mar en calma, llegada prevista a Agaete a las 09:20.', t: Date.now(), de: 'sistema' }],
    alertas: [],
    siguienteId: 201,
    insumos: INSUMOS_INICIALES.map((i) => ({ ...i })),
    escandallos: JSON.parse(JSON.stringify(ESCANDALLOS_INICIALES)),
    movimientos: [],
    almacen: { frioLitros: 60 },
    aprovisionamiento: { ultimaCompraSemanal: 'Lunes 06:30', ultimaRecepcionCatering: 'Hoy 06:45' },
    base: { ventaPorPasajero: 1.37, ticketMedio: 5.9, tasaCompra: 1.37 / 5.9, pasajeros: 420 },
  })
}

// ---------------------------------------------------------------- store (localStorage + BroadcastChannel)
const KEY = 'fredonboard-proto-v3'
const canal: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(KEY) : null

function cargar(): ProtoState {
  try {
    const raw = localStorage.getItem(KEY)
    const t = Number(localStorage.getItem(KEY + '-t') || 0)
    // una demo abandonada (más de 20 min sin actividad) arranca de cero con una travesía nueva
    if (raw && Date.now() - t < 20 * 60 * 1000) {
      const s = JSON.parse(raw) as ProtoState
      if (s.version === 3) return recalcular(s)
    }
  } catch {
    /* sin almacenamiento: seguimos en memoria */
  }
  return estadoInicial()
}

let state: ProtoState = cargar()
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())

function guardar() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    localStorage.setItem(KEY + '-t', String(Date.now()))
  } catch {
    /* ignorar */
  }
}

canal?.addEventListener('message', (e) => {
  if (e.data?.type === 'state') {
    state = e.data.state
    emit()
  }
})

export function getState() {
  return state
}

/** Mutación inmutable genérica. Úsala para acciones propias de una vista. */
export function update(fn: (s: ProtoState) => ProtoState) {
  state = fn(state)
  guardar()
  canal?.postMessage({ type: 'state', state })
  emit()
}

function subscribe(f: () => void) {
  subs.add(f)
  return () => {
    subs.delete(f)
  }
}

/** Hook con el estado completo (referencia estable). Deriva lo que necesites con useMemo. */
export function useProtoState(): ProtoState {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

/**
 * Hook de lectura con selector. IMPORTANTE: el selector debe devolver un valor estable
 * (primitivo o una referencia que ya exista en el estado, p. ej. s => s.pedidos).
 * NO devuelvas arrays/objetos nuevos (filter/map) aquí: usa useProtoState() + useMemo.
 */
export function useProto<T>(sel: (s: ProtoState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => sel(state),
    () => sel(state),
  )
}

// ---------------------------------------------------------------- utilidades
export const eur = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
export const producto = (s: ProtoState, pid: string) => s.productos.find((p) => p.id === pid)!

/** Hora del reloj simulada (HH:MM) para un minuto de viaje. */
export function horaDe(s: ProtoState, minuto: number) {
  const [h, m] = s.viaje.salida.split(':').map(Number)
  const t = h * 60 + m + Math.round(minuto)
  const hh = Math.floor((((t % 1440) + 1440) % 1440) / 60)
  const mm = (((t % 60) + 60) % 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function fase(s: ProtoState): Fase {
  const m = s.viaje.minuto
  if (m < -15) return 'antes'
  if (m < 0) return 'embarque'
  if (m < s.viaje.duracionMin - 15) return 'navegando'
  if (m < s.viaje.duracionMin) return 'llegando'
  return 'llegado'
}

/** Progreso 0..1 de la travesía. */
export const progreso = (s: ProtoState) => Math.max(0, Math.min(1, s.viaje.minuto / s.viaje.duracionMin))

/** ¿Se aceptan pedidos ahora? (abiertos desde la compra del billete hasta X min antes de llegar) */
export function pedidosAbiertos(s: ProtoState) {
  return s.viaje.minuto < s.viaje.duracionMin - s.ajustes.cierreAntesLlegada
}

/** Unidades disponibles a la venta (descontando umbral de seguridad y marcas de agotado). */
export function disponible(s: ProtoState, p: Producto) {
  if (p.agotado) return 0
  return Math.max(0, p.stock - s.ajustes.umbralStock)
}

export type Franja = { idx: number; desde: string; hasta: string; ocupados: number; tope: number; llena: boolean; pasada: boolean }

/**
 * Franjas de recogida disponibles para una cafetería.
 * Los pre-pedidos (antes de zarpar) se recogen a partir del minuto 5 de travesía.
 */
export function franjas(s: ProtoState, caf: CafeteriaId, cuantas = 6): Franja[] {
  const f = s.ajustes.franjaMin
  const limite = s.viaje.duracionMin - s.ajustes.cierreAntesLlegada + f
  const inicio = Math.max(5, Math.ceil((s.viaje.minuto + 5) / f) * f)
  const out: Franja[] = []
  for (let m = inicio; m < limite && out.length < cuantas; m += f) {
    const idx = m / f
    const ocupados = s.pedidos.filter((p) => p.cafeteria === caf && p.franja === idx && p.estado !== 'cancelado').length
    out.push({ idx, desde: horaDe(s, m), hasta: horaDe(s, m + f), ocupados, tope: s.ajustes.topePorFranja, llena: ocupados >= s.ajustes.topePorFranja, pasada: false })
  }
  return out
}

export const totalLineas = (s: ProtoState, lineas: LineaPedido[]) =>
  Math.round(lineas.reduce((a, l) => a + producto(s, l.pid).precio * l.qty, 0) * 100) / 100

/** Descuento de la ventaja Tarifa Joven (propuesta): -20 % en la unidad más cara de café o refresco del pedido. */
export function descuentoJoven(s: ProtoState, billete: Pick<Billete, 'tarifaJoven'>, lineas: LineaPedido[]): number {
  if (!billete.tarifaJoven) return 0
  const precios = lineas.filter((l) => l.qty > 0 && VENTAJA_JOVEN.pids.includes(l.pid)).map((l) => s.productos.find((p) => p.id === l.pid)?.precio ?? 0)
  if (!precios.length) return 0
  return Math.round(Math.max(...precios) * VENTAJA_JOVEN.pct * 100) / 100
}

/** Total a pagar de unas líneas para un billete (aplica la ventaja joven si corresponde). */
export const totalPedido = (s: ProtoState, billete: Pick<Billete, 'tarifaJoven'>, lineas: LineaPedido[]) =>
  Math.round((totalLineas(s, lineas) - descuentoJoven(s, billete, lineas)) * 100) / 100

const SOLO_BEBIDA = ['cortado', 'solo']
/** ¿Son todo bebidas? (por defecto, esos pedidos van «sin cubiertos ni bolsa»). */
export const soloBebidas = (s: ProtoState, lineas: LineaPedido[]) =>
  lineas.length > 0 && lineas.every((l) => { const p = s.productos.find((x) => x.id === l.pid); return !!p && (p.cat === 'Bebidas' || SOLO_BEBIDA.includes(p.id)) })

/** ¿Es producto canario / KM0? */
export const esCanario = (s: ProtoState, pid: string) => !!s.productos.find((p) => p.id === pid)?.km0

// ---------------------------------------------------------------- motor de inventario
const r2 = (n: number) => Math.round(n * 1000) / 1000

/** Unidades vendibles de un producto según el stock de sus insumos (el insumo más escaso manda). */
export function porciones(s: Pick<ProtoState, 'insumos' | 'escandallos'>, pid: string): number {
  const rec = s.escandallos[pid]
  if (!rec || !rec.length) return Infinity
  return Math.max(0, Math.min(...rec.map((l) => Math.floor((s.insumos.find((i) => i.id === l.iid)?.stock ?? 0) / l.qty))))
}

/** Insumo que limita las porciones de un producto (el «cuello de botella»). */
export function insumoLimitante(s: ProtoState, pid: string): Insumo | undefined {
  const rec = s.escandallos[pid]
  if (!rec) return undefined
  let peor: Insumo | undefined
  let min = Infinity
  for (const l of rec) {
    const i = s.insumos.find((x) => x.id === l.iid)
    if (!i) continue
    const n = Math.floor(i.stock / l.qty)
    if (n < min) {
      min = n
      peor = i
    }
  }
  return peor
}

/** Coste de materia prima de un producto según su escandallo. */
export function costeProducto(s: ProtoState, pid: string): number {
  return Math.round((s.escandallos[pid] ?? []).reduce((a, l) => a + (s.insumos.find((i) => i.id === l.iid)?.coste ?? 0) * l.qty, 0) * 100) / 100
}

/** Consumo de insumos de unas líneas de pedido. */
export function consumo(s: Pick<ProtoState, 'escandallos'>, lineas: LineaPedido[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const l of lineas) for (const e of s.escandallos[l.pid] ?? []) out[e.iid] = (out[e.iid] ?? 0) + e.qty * l.qty
  return out
}

/** Recalcula el stock vendible de cada producto a partir de los insumos (p.stock es una caché derivada). */
export function recalcular(s: ProtoState): ProtoState {
  return { ...s, productos: s.productos.map((p) => (s.escandallos[p.id] ? { ...p, stock: porciones(s, p.id) } : p)) }
}

let movId = Date.now()
function aplicarMovimientos(s: ProtoState, deltas: Record<string, number>, tipo: TipoMovimiento, ref?: string): ProtoState {
  const t = Date.now()
  const movs: Movimiento[] = Object.entries(deltas)
    .filter(([, d]) => d !== 0)
    .map(([iid, delta]) => ({ id: ++movId, t, iid, delta: r2(delta), tipo, ref }))
  const insumos = s.insumos.map((i) => (deltas[i.id] ? { ...i, stock: Math.max(0, r2(i.stock + deltas[i.id])) } : i))
  return recalcular({ ...s, insumos, movimientos: [...s.movimientos, ...movs].slice(-400) })
}

/** Registra un movimiento manual de inventario (entrada, merma o ajuste). */
export function movimientoInventario(iid: string, delta: number, tipo: Exclude<TipoMovimiento, 'venta' | 'cancelacion'>, ref?: string) {
  update((s) => aplicarMovimientos(s, { [iid]: delta }, tipo, ref))
}
/** Fija el stock contado de un insumo (inventario físico); registra la diferencia como ajuste. */
export function contarInsumo(iid: string, contado: number) {
  const i = state.insumos.find((x) => x.id === iid)
  if (!i) return
  movimientoInventario(iid, Math.max(0, contado) - i.stock, 'ajuste', 'Recuento')
}
export function setMinimoInsumo(iid: string, minimo: number) {
  update((s) => ({ ...s, insumos: s.insumos.map((i) => (i.id === iid ? { ...i, minimo: Math.max(0, minimo) } : i)) }))
}
export function setEscandallo(pid: string, lineas: LineaEscandallo[]) {
  update((s) => recalcular({ ...s, escandallos: { ...s.escandallos, [pid]: lineas.filter((l) => l.qty > 0) } }))
}

/** Recepción del catering diario: repone los perecederos hasta la cantidad indicada (o su cantidad de referencia). */
export function recibirCatering(cantidades?: Record<string, number>) {
  update((s) => {
    const deltas: Record<string, number> = {}
    for (const i of s.insumos) if (i.aprovisionamiento === 'catering diario') deltas[i.id] = (cantidades?.[i.id] ?? Math.max(0, i.inicial - i.stock))
    return { ...aplicarMovimientos(s, deltas, 'entrada', 'Catering diario'), aprovisionamiento: { ...s.aprovisionamiento, ultimaRecepcionCatering: `Hoy ${horaDe(s, s.viaje.minuto)}` } }
  })
}
/** Recepción de la compra semanal de no perecederos. */
export function recibirCompraSemanal(cantidades?: Record<string, number>) {
  update((s) => {
    const deltas: Record<string, number> = {}
    for (const i of s.insumos) if (i.aprovisionamiento === 'compra semanal') deltas[i.id] = (cantidades?.[i.id] ?? Math.max(0, i.inicial - i.stock))
    return { ...aplicarMovimientos(s, deltas, 'entrada', 'Compra semanal'), aprovisionamiento: { ...s.aprovisionamiento, ultimaCompraSemanal: `Hoy ${horaDe(s, s.viaje.minuto)}` } }
  })
}

export type LineaPlan = {
  insumo: Insumo
  necesidad: number // consumo previsto en el periodo
  pedir: number // cantidad a pedir (redondeada al envase)
  litrosFrio: number
}
/**
 * Plan de aprovisionamiento: previsión de pasajeros × consumo por pasajero (datos reales del Bajamar)
 * × escandallo, más un margen de seguridad, menos el stock actual. Comprueba la capacidad de frío.
 */
export function planAprovisionamiento(s: ProtoState, pasajerosPrevistos: number, margen = 0.1, tipo: Insumo['aprovisionamiento'] = 'catering diario') {
  const necesidad: Record<string, number> = {}
  for (const [pid, c] of Object.entries(CONSUMO_POR_PASAJERO)) {
    const unidades = pasajerosPrevistos * c.u
    for (const e of s.escandallos[pid] ?? []) necesidad[e.iid] = (necesidad[e.iid] ?? 0) + unidades * e.qty
  }
  const lineas: LineaPlan[] = s.insumos
    .filter((i) => i.aprovisionamiento === tipo)
    .map((i) => {
      const nec = (necesidad[i.id] ?? 0) * (1 + margen)
      const falta = Math.max(0, nec + i.minimo - i.stock)
      const env = i.envase ?? 1
      const pedir = Math.ceil(falta / env) * env
      return { insumo: i, necesidad: Math.round(nec), pedir, litrosFrio: i.conservacion === 'frio' ? r2((i.stock + pedir) * (i.litros ?? 0)) : 0 }
    })
  const litros = Math.round(lineas.reduce((a, l) => a + l.litrosFrio, 0) * 10) / 10
  const coste = Math.round(lineas.reduce((a, l) => a + l.pedir * l.insumo.coste, 0) * 100) / 100
  return { lineas, litrosFrio: litros, capacidadFrio: s.almacen.frioLitros, excedeFrio: litros > s.almacen.frioLitros, coste }
}

/** Ocupación actual de la cámara de frío (litros). */
export const ocupacionFrio = (s: ProtoState) => Math.round(s.insumos.reduce((a, i) => a + (i.conservacion === 'frio' ? i.stock * (i.litros ?? 0) : 0), 0) * 10) / 10

// ---------------------------------------------------------------- acciones
export function login(ticket: string): Billete | null {
  const t = ticket.trim().toUpperCase()
  return state.billetes.find((b) => b.ticket === t) ?? null
}

export type ResultadoPedido =
  | { ok: true; pedido: Pedido; offline: boolean; duplicado: boolean }
  | { ok: false; motivo: 'cerrado' | 'pausa' | 'franja-llena' | 'sin-stock'; detalle?: string }

/**
 * Crea un pedido de forma idempotente: si ya existe uno con la misma clientKey, devuelve ese
 * (así un reintento por mala conexión nunca duplica pedido ni cobro).
 */
export function crearPedido(input: {
  clientKey: string
  billete: Billete
  lineas: LineaPedido[]
  cafeteria: CafeteriaId
  franja: number
  pago: Pedido['pago']
  sinPlastico?: boolean
  bot?: boolean
}): ResultadoPedido {
  const s = state
  const existente = [...s.pedidos, ...s.pendientesOffline].find((p) => p.clientKey === input.clientKey)
  if (existente) return { ok: true, pedido: existente, offline: !s.pedidos.includes(existente), duplicado: true }
  if (!pedidosAbiertos(s)) return { ok: false, motivo: 'cerrado' }
  if (s.ajustes.pausa[input.cafeteria]) return { ok: false, motivo: 'pausa' }
  const ocupados = s.pedidos.filter((p) => p.cafeteria === input.cafeteria && p.franja === input.franja && p.estado !== 'cancelado').length
  if (ocupados >= s.ajustes.topePorFranja) return { ok: false, motivo: 'franja-llena' }
  for (const l of input.lineas) {
    const p = producto(s, l.pid)
    if (disponible(s, p) < l.qty) return { ok: false, motivo: 'sin-stock', detalle: p.nombre }
  }
  // varias líneas pueden compartir insumo (p. ej. croissant suelto + oferta de bollería)
  const cons = consumo(s, input.lineas)
  for (const [iid, q] of Object.entries(cons)) {
    const ins = s.insumos.find((i) => i.id === iid)
    if (ins && ins.stock < q) {
      const afectado = input.lineas.find((l) => s.escandallos[l.pid]?.some((e) => e.iid === iid))
      return { ok: false, motivo: 'sin-stock', detalle: afectado ? producto(s, afectado.pid).nombre : ins.nombre }
    }
  }
  const descuento = descuentoJoven(s, input.billete, input.lineas)
  const pedido: Pedido = {
    id: s.siguienteId,
    clientKey: input.clientKey,
    ticket: input.billete.ticket,
    nombre: input.billete.nombre,
    asiento: input.billete.asiento,
    lineas: input.lineas,
    total: Math.round((totalLineas(s, input.lineas) - descuento) * 100) / 100,
    cafeteria: input.cafeteria,
    franja: input.franja,
    estado: 'recibido',
    prepedido: s.viaje.minuto < 0,
    pago: input.pago,
    ...(input.sinPlastico ? { sinPlastico: true } : {}),
    ...(descuento > 0 ? { tarifaJoven: true, descuentoJoven: descuento } : input.billete.tarifaJoven ? { tarifaJoven: true } : {}),
    bot: input.bot,
    t: { creado: Date.now(), recibido: Date.now() },
  }
  const offline = !s.ajustes.online && !input.bot
  update((st) => {
    const neg: Record<string, number> = {}
    for (const [iid, q] of Object.entries(cons)) neg[iid] = -q
    const conInv = aplicarMovimientos(st, neg, 'venta', `#${pedido.id}`)
    // productos sin escandallo (si los hubiera) mantienen el descuento directo
    const productos = conInv.productos.map((p) => {
      const l = input.lineas.find((x) => x.pid === p.id)
      return l && !st.escandallos[p.id] ? { ...p, stock: p.stock - l.qty } : p
    })
    return {
      ...conInv,
      productos,
      siguienteId: st.siguienteId + 1,
      pedidos: offline ? st.pedidos : [...st.pedidos, pedido],
      pendientesOffline: offline ? [...st.pendientesOffline, pedido] : st.pendientesOffline,
    }
  })
  return { ok: true, pedido, offline, duplicado: false }
}

export function avanzarPedido(id: number) {
  const orden: EstadoPedido[] = ['recibido', 'preparando', 'listo', 'entregado']
  update((s) => ({
    ...s,
    pedidos: s.pedidos.map((p) => {
      if (p.id !== id) return p
      const i = orden.indexOf(p.estado)
      if (i < 0 || i === orden.length - 1) return p
      const nuevo = orden[i + 1]
      return { ...p, estado: nuevo, t: { ...p.t, [nuevo]: Date.now() } }
    }),
  }))
}

export function setEstadoPedido(id: number, estado: EstadoPedido) {
  update((s) => ({ ...s, pedidos: s.pedidos.map((p) => (p.id === id ? { ...p, estado, t: { ...p.t, [estado]: Date.now() } } : p)) }))
}

/** Cancelación del pasajero: solo mientras está «recibido». Devuelve el stock. */
export function cancelarPedido(id: number): boolean {
  const p = state.pedidos.find((x) => x.id === id)
  if (!p || p.estado !== 'recibido') return false
  update((s) => {
    const conInv = aplicarMovimientos(s, consumo(s, p.lineas), 'cancelacion', `#${id}`)
    return {
      ...conInv,
      pedidos: s.pedidos.map((x) => (x.id === id ? { ...x, estado: 'cancelado', t: { ...x.t, cancelado: Date.now() } } : x)),
      productos: conInv.productos.map((pr) => {
        const l = p.lineas.find((x) => x.pid === pr.id)
        return l && !s.escandallos[pr.id] ? { ...pr, stock: pr.stock + l.qty } : pr
      }),
    }
  })
  return true
}

/** Entrega por QR: el QR contiene "FOB:<id>:<clientKey>". */
export function entregarPorQR(codigo: string): { ok: boolean; pedido?: Pedido; motivo?: string } {
  const m = /^FOB:(\d+):(.+)$/.exec(codigo.trim())
  const p = m ? state.pedidos.find((x) => x.id === Number(m[1]) && x.clientKey === m[2]) : state.pedidos.find((x) => String(x.id) === codigo.trim())
  if (!p) return { ok: false, motivo: 'QR no reconocido' }
  if (p.estado === 'entregado') return { ok: false, pedido: p, motivo: 'Ya entregado' }
  if (p.estado === 'cancelado') return { ok: false, pedido: p, motivo: 'Pedido cancelado' }
  setEstadoPedido(p.id, 'entregado')
  return { ok: true, pedido: { ...p, estado: 'entregado' } }
}

export const qrDe = (p: Pedido) => `FOB:${p.id}:${p.clientKey}`

export function setAgotado(pid: string, agotado: boolean) {
  update((s) => ({ ...s, productos: s.productos.map((p) => (p.id === pid ? { ...p, agotado } : p)) }))
}
/**
 * Ajusta las porciones de un producto. Con escandallo, ajusta el insumo que limita ese producto
 * (queda registrado como «ajuste»); sin escandallo, cambia el stock directamente.
 */
export function setStock(pid: string, stock: number) {
  const s0 = state
  const rec = s0.escandallos[pid]
  if (!rec || !rec.length) {
    update((s) => ({ ...s, productos: s.productos.map((p) => (p.id === pid ? { ...p, stock: Math.max(0, stock) } : p)) }))
    return
  }
  const lim = insumoLimitante(s0, pid)
  if (!lim) return
  const qty = rec.find((l) => l.iid === lim.id)!.qty
  const actual = porciones(s0, pid)
  const objetivo = Math.max(0, stock)
  // mantener el resto de la porción sobrante al ajustar
  const delta = (objetivo - actual) * qty
  update((s) => aplicarMovimientos(s, { [lim.id]: delta }, 'ajuste', `Porciones de ${producto(s, pid).nombre}`))
}
export function setPrecio(pid: string, precio: number) {
  update((s) => ({ ...s, productos: s.productos.map((p) => (p.id === pid ? { ...p, precio: Math.max(0, Math.round(precio * 100) / 100) } : p)) }))
}
export function setPausa(caf: CafeteriaId, pausa: boolean) {
  update((s) => ({ ...s, ajustes: { ...s.ajustes, pausa: { ...s.ajustes.pausa, [caf]: pausa } } }))
}
export function setAjustes(patch: Partial<ProtoState['ajustes']>) {
  update((s) => ({ ...s, ajustes: { ...s.ajustes, ...patch } }))
}
export function setViaje(patch: Partial<ProtoState['viaje']>) {
  update((s) => ({ ...s, viaje: { ...s.viaje, ...patch } }))
}
export function enviarMensaje(texto: string, de: Mensaje['de'] = 'manager') {
  update((s) => ({ ...s, mensajes: [...s.mensajes, { id: Date.now(), texto, t: Date.now(), de }] }))
}
export function setOnline(online: boolean) {
  update((s) => {
    if (!online) return { ...s, ajustes: { ...s.ajustes, online } }
    // al volver la conexión, se sincronizan los pendientes (idempotente por clientKey)
    const nuevos = s.pendientesOffline.filter((p) => !s.pedidos.some((x) => x.clientKey === p.clientKey))
    return { ...s, ajustes: { ...s.ajustes, online }, pedidos: [...s.pedidos, ...nuevos], pendientesOffline: [] }
  })
}
export function resetDemo() {
  finDesde = null
  update(() => estadoInicial())
}
/** Saltar a una fase del viaje (controles de demo). */
export function irAFase(f: Fase) {
  const m: Record<Fase, number> = { antes: -25, embarque: -10, navegando: 12, llegando: 68, llegado: 82 }
  setViaje({ minuto: m[f] })
}

// ---------------------------------------------------------------- motor de la demo (reloj + bot)
let motor: number | null = null
/** Momento (real) en que la travesía llegó a su fin; pasados FIN_ESPERA_MS empieza una travesía nueva sola. */
let finDesde: number | null = null
const FIN_ESPERA_MS = 45000
let ultimoTick = Date.now()

/** Arranca el reloj y el bot. Idempotente; llamar desde el shell del prototipo. Solo una pestaña "lidera". */
export function arrancarMotor() {
  if (motor !== null) return
  ultimoTick = Date.now()
  motor = window.setInterval(tick, 1000)
}
export function pararMotor() {
  if (motor !== null) window.clearInterval(motor)
  motor = null
}

function esLider() {
  // la pestaña visible lidera para no acelerar el reloj N veces con varias pestañas abiertas
  try {
    const k = 'fredonboard-lider'
    const ahora = Date.now()
    const raw = localStorage.getItem(k)
    const [id, t] = raw ? raw.split('|') : ['', '0']
    if (!raw || id === LIDER_ID || ahora - Number(t) > 3000) {
      localStorage.setItem(k, `${LIDER_ID}|${ahora}`)
      return true
    }
    return false
  } catch {
    return true
  }
}
const LIDER_ID = uid()

function tick() {
  const ahora = Date.now()
  const dt = (ahora - ultimoTick) / 1000
  ultimoTick = ahora
  if (!esLider()) return
  const s = state
  if (s.viaje.velocidad <= 0) return
  const minuto = Math.min(s.viaje.duracionMin + 10, s.viaje.minuto + dt * s.viaje.velocidad)
  // fin de trayecto: tras unos segundos en puerto, la demo vuelve a empezar con una travesía nueva
  if (minuto >= s.viaje.duracionMin + 10) {
    if (finDesde === null) finDesde = ahora
    else if (ahora - finDesde > FIN_ESPERA_MS) {
      finDesde = null
      const nuevo = estadoInicial()
      state = { ...nuevo, mensajes: [{ id: ahora, texto: 'Nueva travesía: la demo ha vuelto a empezar.', t: ahora, de: 'sistema' }, ...nuevo.mensajes] }
      guardar()
      canal?.postMessage({ type: 'state', state })
      emit()
      return
    }
  } else finDesde = null

  let next: ProtoState = { ...s, viaje: { ...s.viaje, minuto } }

  // barra automática para pedidos del bot (los del usuario los mueve la barra humana… o el auto-avance tras un tiempo)
  next = {
    ...next,
    pedidos: next.pedidos.map((p) => {
      const edad = (ahora - (p.t.creado ?? ahora)) / 1000
      if (p.bot) {
        if (p.estado === 'recibido' && edad > 6) return { ...p, estado: 'preparando', t: { ...p.t, preparando: ahora } }
        if (p.estado === 'preparando' && edad > 16) return { ...p, estado: 'listo', t: { ...p.t, listo: ahora } }
        if (p.estado === 'listo' && edad > 30) return { ...p, estado: 'entregado', t: { ...p.t, entregado: ahora } }
      }
      return p
    }),
  }

  // alertas de saturación
  const caf: CafeteriaId[] = ['proa', 'popa', 'oro']
  const alertas = [...next.alertas]
  for (const c of caf) {
    const activos = next.pedidos.filter((p) => p.cafeteria === c && (p.estado === 'recibido' || p.estado === 'preparando')).length
    const yaHay = alertas.some((a) => a.texto.startsWith(next.cafeterias[c].nombre) && ahora - a.t < 30000)
    if (activos >= 7 && !yaHay) alertas.push({ id: ahora + c.length, nivel: 'warn', texto: `${next.cafeterias[c].nombre}: ${activos} pedidos en preparación`, t: ahora })
  }
  // alertas de inventario: insumo bajo mínimo y producto agotado por falta de insumo
  for (const i of next.insumos) {
    const yaHay = alertas.some((a) => a.texto.includes(i.nombre) && ahora - a.t < 60000)
    if (i.stock <= i.minimo && !yaHay)
      alertas.push({ id: ahora + i.id.length * 7, nivel: 'warn', texto: `Inventario: ${i.nombre} bajo mínimo (${Math.round(i.stock)} ${i.unidad}). Reposición: ${i.aprovisionamiento}.`, t: ahora })
  }
  next = { ...next, alertas: alertas.slice(-12) }

  state = next
  guardar()
  canal?.postMessage({ type: 'state', state })
  emit()

  // bot: pedidos de otros pasajeros (más intensos al zarpar, como en los datos reales de la mañana)
  if (s.ajustes.bot && s.ajustes.online && pedidosAbiertos(state)) {
    const m = state.viaje.minuto
    const intensidad = m < 0 ? 0.25 : m < 25 ? 0.45 : 0.2
    if (Math.random() < intensidad * Math.min(2, dt)) botPedido()
  }
}

function botPedido() {
  const s = state
  const disp = s.productos.filter((p) => disponible(s, p) > 0)
  if (!disp.length) return
  const pick = (l: Producto[]) => l[Math.floor(Math.random() * l.length)]
  const tienda = disp.filter((p) => p.cat === 'Tienda')
  const canarios = disp.filter((p) => p.km0 && p.cat !== 'Tienda')
  const resto = disp.filter((p) => p.cat !== 'Tienda')
  const n = 1 + Math.floor(Math.random() * 2)
  const lineas: LineaPedido[] = []
  const meter = (p?: Producto) => {
    if (p && !lineas.some((l) => l.pid === p.id)) lineas.push({ pid: p.id, qty: 1 })
  }
  const r = Math.random()
  // ~14 % piden algo de la tienda, ~35 % algún producto canario de la carta
  if (r < 0.14 && tienda.length) meter(pick(tienda))
  else if (r < 0.49 && canarios.length) meter(pick(canarios))
  for (let i = 0; i < n && lineas.length < n; i++) meter(pick(resto.length ? resto : disp))
  if (!lineas.length) return
  const cafs: CafeteriaId[] = ['proa', 'proa', 'popa', 'popa', 'oro']
  const cafeteria = cafs[Math.floor(Math.random() * cafs.length)]
  const libres = franjas(s, cafeteria, 4).filter((f) => !f.llena)
  if (!libres.length) return
  const nombre = NOMBRES_BOT[Math.floor(Math.random() * NOMBRES_BOT.length)]
  // «sin cubiertos ni bolsa»: por defecto en bebidas solas (como en la app), y a veces también en el resto
  const sinPlastico = soloBebidas(s, lineas) ? Math.random() < 0.8 : Math.random() < 0.3
  crearPedido({
    clientKey: uid(),
    billete: { ticket: 'BOT', nombre, asiento: `${10 + Math.floor(Math.random() * 60)}${'ABCD'[Math.floor(Math.random() * 4)]}`, idioma: 'es', plus: 0, tarifaJoven: Math.random() < 0.2 },
    lineas,
    cafeteria,
    franja: libres[0].idx,
    pago: Math.random() < 0.5 ? 'apple' : 'google',
    sinPlastico,
    bot: true,
  })
}

// ---------------------------------------------------------------- KPIs (para manager)
export function kpis(s: ProtoState) {
  const validos = s.pedidos.filter((p) => p.estado !== 'cancelado')
  const ventas = validos.reduce((a, p) => a + p.total, 0)
  const entregados = s.pedidos.filter((p) => p.estado === 'entregado' && p.t.listo && p.t.entregado)
  const recogidaMedia = entregados.length ? entregados.reduce((a, p) => a + (p.t.entregado! - p.t.listo!), 0) / entregados.length / 1000 : 0
  const ticketMedio = validos.length ? ventas / validos.length : 0
  const compradores = new Set(validos.map((p) => p.nombre + p.asiento)).size
  return {
    pedidos: validos.length,
    ventas,
    ticketMedio,
    compradores,
    adopcion: compradores / s.base.pasajeros,
    ventaPorPasajeroDigital: ventas / s.base.pasajeros,
    recogidaMediaSeg: recogidaMedia,
    prepedidos: validos.filter((p) => p.prepedido).length,
    enCola: s.pedidos.filter((p) => p.estado === 'recibido' || p.estado === 'preparando').length,
    listos: s.pedidos.filter((p) => p.estado === 'listo').length,
    cancelados: s.pedidos.filter((p) => p.estado === 'cancelado').length,
  }
}

/** Indicadores «En Armonía con el Mar» (papel cero, menos plásticos) e identidad canaria. */
export function sostenibilidad(s: ProtoState) {
  const validos = s.pedidos.filter((p) => p.estado !== 'cancelado')
  const ventas = validos.reduce((a, p) => a + p.total, 0)
  let canario = 0
  let tienda = 0
  let uds = 0
  let udsCanarias = 0
  for (const p of validos)
    for (const l of p.lineas) {
      const pr = s.productos.find((x) => x.id === l.pid)
      if (!pr) continue
      const imp = pr.precio * l.qty
      uds += l.qty
      if (pr.km0) {
        canario += imp
        udsCanarias += l.qty
      }
      if (pr.cat === 'Tienda') tienda += imp
    }
  const bruto = validos.reduce((a, p) => a + p.lineas.reduce((b, l) => b + (s.productos.find((x) => x.id === l.pid)?.precio ?? 0) * l.qty, 0), 0)
  const jovenes = validos.filter((p) => p.tarifaJoven)
  return {
    ticketsPapelEvitados: validos.length, // ticket 100 % digital: 1 por pedido
    sinPlastico: validos.filter((p) => p.sinPlastico).length,
    pctSinPlastico: validos.length ? validos.filter((p) => p.sinPlastico).length / validos.length : 0,
    pctCanario: bruto ? canario / bruto : 0, // % de la venta (a precio de carta) que es producto canario/KM0
    udsCanarias,
    uds,
    ventaCanaria: canario,
    ventaTienda: tienda,
    pedidosJoven: jovenes.length,
    descuentoJoven: jovenes.reduce((a, p) => a + (p.descuentoJoven ?? 0), 0),
    ventas,
  }
}
