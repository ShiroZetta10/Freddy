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
export type ClaseId = 'estandar' | 'oro'
export type Categoria = 'Desayunos' | 'Bocadillos' | 'Sándwiches' | 'Bebidas' | 'Snacks' | 'Tienda'
export type Producto = {
  id: string
  nombre: string
  precio: number
  cat: Categoria
  desc: string
  km0?: boolean // producto canario / de proximidad
  elaboradoCanarias?: boolean // elaborado en Canarias (candidato al distintivo «Elaborado en Canarias»; su uso requiere autorización y producto certificado)
  incluidoOro?: boolean // incluido en el menú de Clase Oro (0 €) cuando se pide desde la cafetería Oro, hasta el límite por persona
  soloOro?: boolean // solo se sirve en la cafetería / salón Clase Oro
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
  nombre: string // nombre del pasajero (en el barco no hay asiento asignado)
  lineas: LineaPedido[]
  total: number
  cafeteria: CafeteriaId
  franja: number // índice de franja (minuto de viaje / tamaño de franja)
  estado: EstadoPedido
  prepedido: boolean
  pago: 'apple' | 'google' | 'tarjeta' | 'bono' | 'incluido' // 'bono' = total 0 € pagado con un bono · 'incluido' = total 0 € cubierto por el menú de Clase Oro
  clase?: ClaseId // 'oro' si el billete es Clase Oro (prioridad visual en barra)
  menuOro?: MenuOroAplicado // unidades del menú Clase Oro incluido (a 0 €) en este pedido
  servicio?: 'mesa' // servicio en mesa del salón Clase Oro (lo atiende la cafetería Oro)
  mesaRef?: string // referencia libre de mesa (no hay asiento asignado)
  bono?: BonoAplicado // bono de consumo canjeado en este pedido
  ventajas?: VentajaAplicada[] // ventajas por pedir con antelación aplicadas (solo pre-pedidos); el total ya las descuenta
  canal?: 'barra' // pedido creado en barra (bono físico canjeado en mostrador)
  sinPlastico?: boolean // «Sin cubiertos ni bolsa» (En Armonía con el Mar)
  tarifaJoven?: boolean // el billete es Tarifa Joven y se aplicó la ventaja propuesta
  descuentoJoven?: number // € descontados por la ventaja Tarifa Joven (ya restados de `total`)
  bot?: boolean
  manual?: number // minuto simulado en que la barra lo movió a mano por última vez (el auto-avance le deja margen)
  t: Partial<Record<EstadoPedido | 'creado', number>> // marcas de tiempo (ms reales)
}
/** Menú Clase Oro incluido aplicado a un pedido: qué unidades van a 0 € y su valor a precio de carta. */
export type MenuOroAplicado = { uds: number; valor: number; cubiertas: LineaPedido[] }
/** Bono aplicado a un pedido: qué unidades cubre (a 0 €) y su valor a precio de carta. */
export type BonoAplicado = { codigo: string; nombre: string; tipo: BonoOrigen; valor: number; cubiertas: LineaPedido[] }

// ---------------------------------------------------------------- ventajas por pedir con antelación
/** 'menu-exclusivo' = menú a precio cerrado que solo existe antes del viaje · 'descuento' = % sobre los productos a los que aplica. */
export type TipoVentaja = 'menu-exclusivo' | 'descuento'
/** Para qué sirve: potenciar producto canario · dar salida al consumo próximo (menos merma) · preparar mejor el barco. */
export type ObjetivoVentaja = 'canario' | 'consumo-proximo' | 'preparar-barco'
/** Reglas calculadas: km0 / elaborado en Canarias · perecederos con exceso o que caducan hoy (desde el inventario) · bocadillos y sándwiches. */
export type ReglaVentaja = 'canario' | 'consumo-proximo' | 'preparar'
export type AplicaVentaja = { modo: 'productos'; pids: string[] } | { modo: 'categorias'; cats: Categoria[] } | { modo: 'regla'; regla: ReglaVentaja }
export type Ventaja = {
  id: string
  nombre: string
  tipo: TipoVentaja
  objetivo: ObjetivoVentaja
  aplica: AplicaVentaja // a qué productos aplica un descuento (en un menú exclusivo no se usa: manda `menu`)
  menu: CoberturaBono[] // componentes del menú exclusivo (cada uno admite alternativas); vacío en un descuento
  valor: number // % de descuento (tipo 'descuento') o precio cerrado del menú en € (tipo 'menu-exclusivo')
  limiteTravesia: number | null // unidades (o menús) por travesía; null = sin límite
  limitePasajero: number | null // unidades (o menús) por pasajero y travesía; null = sin límite
  ventanaMin: number // se ofrece desde la compra del billete hasta estos minutos antes de zarpar
  activa: boolean
  propuesta: boolean // precios y porcentajes son una propuesta del equipo, por validar con Fred. Olsen
}
export type VentajaCubierta = { pid: string; qty: number; dto: number } // `qty` unidades de `pid` con `dto` € de descuento en total
/** Ventaja aplicada a un pedido: qué unidades cubre y cuánto descuenta (instantánea: sigue valiendo aunque luego se edite la ventaja). */
export type VentajaAplicada = { id: string; nombre: string; tipo: TipoVentaja; objetivo: ObjetivoVentaja; uds: number; descuento: number; cubiertas: VentajaCubierta[] }
/** Ajustes del cálculo de «consumo próximo» (se calcula con el inventario). */
export type VentajasCfg = {
  umbralExceso: number // un perecedero está «en exceso» si su stock supera lo previsto en este porcentaje (0,3 = +30 %)
  pasajerosDia: number // pasajeros previstos del día para la previsión (hipótesis del equipo, la misma del plan de aprovisionamiento)
  caducaHoy: string[] // insumos que el responsable marca como «caduca hoy» (p. ej. un lote)
}

// ---------------------------------------------------------------- bonos de consumo
export type BonoOrigen = 'billete' | 'fisico'
export type EstadoBono = 'disponible' | 'canjeado' | 'caducado'
/** Qué cubre un bono: `qty` unidades de cualquiera de los productos `pids`. */
export type CoberturaBono = { etiqueta: string; pids: string[]; qty: number }
export type TipoBono = { id: string; nombre: string; desc: string; precio: number; cubre: CoberturaBono[] }
export type Bono = {
  codigo: string // BN-XXXX-C: de un solo uso, con letra de control
  tipo: BonoOrigen // 'billete' = comprado junto al billete · 'fisico' = comprado en físico (código impreso)
  tipoId: string
  nombre: string
  contenido: CoberturaBono[]
  precio: number // precio de referencia (lo que pagó el pasajero)
  estado: EstadoBono
  ticket?: string // localizador del billete al que va asociado (bonos de billete)
  canjeadoEn?: { pedido: number; t: number; hora: string; valor: number }
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
export type Billete = { ticket: string; nombre: string; clase?: ClaseId; vehiculo?: boolean; idioma: 'es' | 'en' | 'de'; plus: number; tarifaJoven?: boolean }
export type Mensaje = { id: number; texto: string; t: number; de: 'manager' | 'sistema' }
/**
 * Alerta del manager. Las que nacen de una condición (saturación de una cafetería, insumo bajo mínimo) llevan una `clave`
 * estable (tipo + entidad, p. ej. `inventario:croissant`) con la que se deduplican, se resuelven y se silencian.
 */
export type Alerta = {
  id: number
  nivel: 'info' | 'warn'
  texto: string
  t: number
  clave?: string
  tipo?: 'saturacion' | 'inventario'
  entidad?: string // cafetería (`proa`…) o insumo (`croissant`…)
  gravedad?: number // medida de lo grave que es la condición ahora
  paso?: number // cuánto debe empeorar `gravedad` para que una alerta silenciada vuelva a avisar
}
/** Alerta resuelta con una acción o descartada con la X: no vuelve mientras la condición siga igual (ver `actualizarAlertas`). */
export type AlertaSilenciada = { t: number; motivo: 'resuelta' | 'descartada'; gravedad: number; reaparece: number }

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
    upsellOro: boolean // mostrar al pasajero estándar la tarjeta «Pásate a Clase Oro»
    limiteMenuOro: number // unidades del menú Clase Oro incluido por pasajero y travesía (propuesta del equipo, a confirmar)
  }
  cafeterias: Record<CafeteriaId, { nombre: string; cubierta: string; abierta: boolean }>
  productos: Producto[]
  pedidos: Pedido[]
  pendientesOffline: Pedido[] // pedidos creados sin conexión, aún no sincronizados
  billetes: Billete[]
  mensajes: Mensaje[]
  alertas: Alerta[]
  alertasSilenciadas: Record<string, AlertaSilenciada> // por clave estable; compartido entre pestañas/iframes como el resto del estado
  siguienteId: number
  bonos: Bono[] // bonos de consumo emitidos (de billete y físicos); el código es de un solo uso
  ventajas: Ventaja[] // ventajas por pedir con antelación (configurables por el manager)
  ventajasCfg: VentajasCfg
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
  { id: 'cortado', nombre: 'Café cortado', precio: 1.9, cat: 'Desayunos', desc: 'Café de origen con leche canaria.', stock: 120, agotado: false, color: '#7a4b2a', km0: true, origen: 'Leche de ganaderías canarias', incluidoOro: true },
  { id: 'solo', nombre: 'Café solo', precio: 1.9, cat: 'Desayunos', desc: 'Espresso recién molido.', stock: 120, agotado: false, color: '#3b2416', incluidoOro: true },
  { id: 'oferta-bolleria', nombre: 'Bollería + bebida caliente', precio: 4.2, cat: 'Desayunos', desc: 'Croissant o napolitana con café o infusión.', tags: ['combo'], stock: 60, agotado: false, color: '#d99a3d', incluidoOro: true },
  { id: 'croissant', nombre: 'Croissant', precio: 2.1, cat: 'Desayunos', desc: 'Horneado a bordo.', stock: 8, agotado: false, color: '#e0a84f', incluidoOro: true },
  { id: 'pan-queso', nombre: 'Pan con queso de Tenerife', precio: 2.6, cat: 'Desayunos', desc: 'Pan de leña con queso semicurado canario.', km0: true, origen: 'Quesería de Tenerife', tags: ['vegetariano'], stock: 30, agotado: false, color: '#d4a85a' },
  { id: 'pollo-gourmet', nombre: 'Bocadillo pollo gourmet', precio: 5.72, cat: 'Bocadillos', desc: 'Pollo asado, rúcula y alioli suave.', stock: 40, agotado: false, color: '#c0763a', incluidoOro: true },
  { id: 'serrano-queso', nombre: 'Bocadillo jamón serrano y queso', precio: 5.76, cat: 'Bocadillos', desc: 'Pan de leña y queso semicurado canario.', km0: true, origen: 'Quesería de Tenerife', stock: 35, agotado: false, color: '#b5453a', incluidoOro: true },
  { id: 'tortilla', nombre: 'Bocadillo de tortilla', precio: 5.77, cat: 'Bocadillos', desc: 'Tortilla de papas del día.', tags: ['vegetariano'], stock: 25, agotado: false, color: '#e8c25a', incluidoOro: true },
  { id: 'mixto', nombre: 'Sándwich mixto', precio: 5.7, cat: 'Sándwiches', desc: 'Jamón cocido y queso fundido.', stock: 30, agotado: false, color: '#d8b06a', incluidoOro: true },
  { id: 'atun', nombre: 'Sándwich de atún', precio: 5.73, cat: 'Sándwiches', desc: 'Atún, tomate y lechuga.', stock: 20, agotado: false, color: '#9fb36b', incluidoOro: true },
  { id: 'agua', nombre: 'Agua sin gas 1/2', precio: 1.75, cat: 'Bebidas', desc: 'Agua mineral canaria.', km0: true, origen: 'Manantial de Canarias', stock: 200, agotado: false, color: '#5aa7d6', incluidoOro: true, elaboradoCanarias: true },
  { id: 'refresco', nombre: 'Refresco de cola', precio: 2.3, cat: 'Bebidas', desc: 'Lata 33 cl.', stock: 90, agotado: false, color: '#8a1c1c', incluidoOro: true },
  { id: 'cerveza', nombre: 'Cerveza canaria', precio: 2.9, cat: 'Bebidas', desc: 'Tercio bien frío.', km0: true, origen: 'Cervecería artesana de Canarias', stock: 60, agotado: false, color: '#e3a600', elaboradoCanarias: true },
  { id: 'papas', nombre: 'Papas fritas', precio: 1.8, cat: 'Snacks', desc: 'Bolsa individual.', tags: ['sin gluten'], stock: 70, agotado: false, color: '#f0c419', incluidoOro: true },
  { id: 'fruta', nombre: 'Plátano de Canarias', precio: 1.2, cat: 'Snacks', desc: 'IGP Plátano de Canarias.', km0: true, origen: 'Plátano de Canarias IGP', tags: ['sin gluten', 'vegetariano'], stock: 40, agotado: false, color: '#f2d43a', incluidoOro: true },
  // Tienda a bordo: producto canario y recuerdos («Lo nuestro viaja contigo»). Recogida en barra como el resto.
  { id: 'mojo', nombre: 'Mojo picón en tarro', precio: 4.5, cat: 'Tienda', desc: 'Mojo picón casero, tarro de 200 g.', km0: true, origen: 'Elaborado en Tenerife', stock: 24, agotado: false, color: '#b8321f', elaboradoCanarias: true },
  { id: 'gofio', nombre: 'Gofio de millo tostado', precio: 3.2, cat: 'Tienda', desc: 'Gofio molido a la piedra, paquete de 500 g.', km0: true, origen: 'Gofio de La Palma', tags: ['vegetariano'], stock: 24, agotado: false, color: '#c9a35e', elaboradoCanarias: true },
  { id: 'miel', nombre: 'Miel de abeja canaria', precio: 6.9, cat: 'Tienda', desc: 'Miel de flores de las islas, tarro de 250 g.', km0: true, origen: 'Apicultores de Tenerife', tags: ['sin gluten', 'vegetariano'], stock: 18, agotado: false, color: '#d9962b', elaboradoCanarias: true },
  { id: 'dulces', nombre: 'Dulces típicos canarios', precio: 5.5, cat: 'Tienda', desc: 'Caja de galletas y dulces de almendra.', km0: true, origen: 'Obrador artesano de La Gomera', tags: ['vegetariano'], stock: 20, agotado: false, color: '#c98a5a', elaboradoCanarias: true },
  { id: 'camiseta', nombre: 'Camiseta Fred. Olsen Express', precio: 14.9, cat: 'Tienda', desc: 'Algodón, recuerdo de tu travesía. Tallas S a XL.', stock: 12, agotado: false, color: '#0b3478' },
  { id: 'cartas', nombre: 'Juego de cartas infantil', precio: 6.5, cat: 'Tienda', desc: 'Baraja ilustrada con los barcos y las islas.', stock: 14, agotado: false, color: '#1f8f6a' },
  // Menú Clase Oro: platos fríos que solo se sirven en el salón Oro (incluidos hasta el límite por persona). Precios de carta de referencia.
  { id: 'oro-tabla', nombre: 'Tabla de quesos y embutidos canarios', precio: 8.5, cat: 'Snacks', desc: 'Selección fría para compartir, con pan.', km0: true, origen: 'Quesería de Tenerife', stock: 30, agotado: false, color: '#c98a4a', soloOro: true, incluidoOro: true },
  { id: 'oro-gourmet', nombre: 'Sándwich gourmet frío', precio: 5.9, cat: 'Sándwiches', desc: 'Pan artesano, jamón serrano, queso y rúcula.', stock: 30, agotado: false, color: '#b0773a', soloOro: true, incluidoOro: true },
  { id: 'oro-ensalada', nombre: 'Ensalada fría de pollo', precio: 6.5, cat: 'Snacks', desc: 'Pollo asado, tomate, lechuga y rúcula.', tags: ['sin gluten'], stock: 25, agotado: false, color: '#7fa65a', soloOro: true, incluidoOro: true },
  { id: 'oro-postre', nombre: 'Postre del día', precio: 3.2, cat: 'Snacks', desc: 'Postre frío de la cocina del barco.', tags: ['vegetariano'], stock: 30, agotado: false, color: '#d9b36a', soloOro: true, incluidoOro: true },
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
  { id: 'postre', nombre: 'Postre del día (ración)', unidad: 'ud', stock: 30, inicial: 40, minimo: 8, tipo: 'perecedero', conservacion: 'frio', aprovisionamiento: 'catering diario', coste: 0.9, litros: 0.2, envase: 8 },
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
  'pan-queso': [{ iid: 'pan-bocadillo', qty: 1 }, { iid: 'queso-semi', qty: 50 }],
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
  // menú Clase Oro (platos fríos)
  'oro-tabla': [{ iid: 'queso-semi', qty: 60 }, { iid: 'serrano', qty: 40 }, { iid: 'pan-bocadillo', qty: 1 }],
  'oro-gourmet': [{ iid: 'pan-molde', qty: 2 }, { iid: 'serrano', qty: 40 }, { iid: 'queso-lonchas', qty: 30 }, { iid: 'verdura', qty: 20 }],
  'oro-ensalada': [{ iid: 'pollo', qty: 80 }, { iid: 'verdura', qty: 90 }, { iid: 'alioli', qty: 10 }],
  'oro-postre': [{ iid: 'postre', qty: 1 }],
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
  'pan-queso': { u: 0.006, fuente: 'est.' },
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
  { ticket: 'FO7K2Q', nombre: 'Carmen', clase: 'estandar', idioma: 'es', plus: 340 },
  { ticket: 'FO9X4M', nombre: 'Tom', clase: 'estandar', idioma: 'en', plus: 0 },
  { ticket: 'FO3H8B', nombre: 'Greta', clase: 'oro', vehiculo: true, idioma: 'de', plus: 1250 }, // Clase Oro y viaja con vehículo: desembarque prioritario
  { ticket: 'FO2J5T', nombre: 'Yeray', clase: 'estandar', idioma: 'es', plus: 120, tarifaJoven: true },
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


// ---------------------------------------------------------------- clases de billete: Estándar vs Clase Oro
/** Unidades del menú Clase Oro incluido por pasajero y travesía. Propuesta del equipo: Fred. Olsen no publica un límite (a confirmar). */
export const LIMITE_MENU_ORO = 6

export type EstadoVerificacion = 'verificado' | 'corregido' | 'a-confirmar'
export type Prestacion = {
  id: string
  etiqueta: string
  estandar: string
  oro: string
  estado: EstadoVerificacion // verificado = coincide con fredolsen.es · corregido = la propuesta inicial no se sostenía · a-confirmar = sin fuente oficial
  nota: string
}
export const FUENTES_CLASES = [
  { id: 'oro', titulo: 'Clase Oro (web oficial)', url: 'https://www.fredolsen.es/en/gold-class' },
  { id: 'tarifas', titulo: 'Tarifas (web oficial)', url: 'https://www.fredolsen.es/en/rates' },
  { id: 'faq', titulo: 'Preguntas frecuentes (web oficial)', url: 'https://www.fredolsen.es/en/faqs' },
]
/** Tabla comparativa verificada con fredolsen.es (consulta del 22/10/2026). Tarifas interinsulares; los servicios pueden variar según el buque. */
export const PRESTACIONES: Prestacion[] = [
  { id: 'salon', etiqueta: 'Salón', estandar: 'Salón general, butacas estándar', oro: 'Salón Clase Oro: aforo reducido, butacas extra confort, mesas de reunión', estado: 'verificado', nota: 'El acceso al salón solo está en las tarifas Priority y Oro. La web habla de «Clase Oro Lounge»; «VIP» aparece en la tabla de tarifas.' },
  { id: 'embarque', etiqueta: 'Embarque', estandar: 'General en Básica; prioritario en Óptima Web+', oro: 'Prioritario', estado: 'corregido', nota: 'La propuesta inicial decía «flujo general» para todo Estándar, pero Óptima Web+ también tiene embarque prioritario (también Priority).' },
  { id: 'desembarque', etiqueta: 'Desembarque con vehículo', estandar: 'Orden general', oro: 'Prioritario, solo si viajas con vehículo', estado: 'corregido', nota: 'La web limita el desembarque prioritario a la tarifa Oro con vehículo. Sin vehículo no hay prioridad de desembarque.' },
  { id: 'comida', etiqueta: 'Comida y bebida', estandar: 'De pago en cafetería (en Óptima Web+, menú a bordo en cafeterías «Web Plus»)', oro: 'Servicio gastronómico incluido durante la travesía: bebidas, platos, snacks y postres', estado: 'corregido', nota: 'Incluido, pero con condiciones: platos fríos y calientes de lunes a viernes; fines de semana y festivos solo selección fría; se consume a bordo (no se puede sacar del barco); menús especiales con 48 h de antelación. No hay límite publicado: el prototipo aplica uno propio. Alcohol: a confirmar con Fred. Olsen.' },
  { id: 'terraza', etiqueta: 'Terraza', estandar: 'Zonas exteriores generales', oro: 'Terraza exclusiva dentro del salón Oro', estado: 'verificado', nota: 'Terraza exclusiva de Oro confirmada. Qué zonas exteriores tiene Estándar en el Bajamar Express: a confirmar con Fred. Olsen.' },
  { id: 'atencion', etiqueta: 'Atención', estandar: 'General en cafetería o recepción', oro: 'Servicio en el asiento y trato personalizado, con pocos pasajeros', estado: 'verificado', nota: 'La web dice que el personal sirve en el asiento y que el aforo reducido permite trato personalizado. «Personal dedicado» no figura literalmente: a confirmar.' },
  { id: 'trabajo', etiqueta: 'Trabajo y wifi', estandar: 'Wifi general del barco', oro: 'Mesas de reunión, enchufes y wifi en el salón', estado: 'corregido', nota: 'Mesas, enchufes y wifi están confirmados. «Mejor conectividad» no figura en ninguna fuente oficial y se ha retirado. Enchufes en el salón general: a confirmar.' },
  { id: 'flex', etiqueta: 'Flexibilidad', estandar: 'Cambios de fecha, hora y tarifa según disponibilidad; sin vuelta abierta, Puntos Plus ni reembolso (salvo Óptima Flexible)', oro: 'Cambios + vuelta abierta, pago con Puntos Plus y reembolso', estado: 'corregido', nota: 'Todas las tarifas permiten cambios (con diferencia si cambia la tarifa; billete válido 1 año). Vuelta abierta, pago con Puntos Plus y reembolso son de Óptima Flexible y de Oro. No aplica a la ruta Canarias–Huelva.' },
]
export type ReglaAtencion = { id: string; texto: string; estado: 'prototipo' | 'a-confirmar' }
/** Lógica de atención al cliente por clase (propuesta del equipo, implementada en el prototipo). */
export const REGLAS_ATENCION: Record<ClaseId, { nombre: string; tono: string; reglas: ReglaAtencion[] }> = {
  estandar: {
    nombre: 'Clase Estándar (Básica / Óptima)',
    tono: 'Ágil y directo',
    reglas: [
      { id: 'e1', texto: 'Mostrar servicios adicionales: tarjeta discreta «Pásate a Clase Oro» (conmutable) con lo que incluye; precio a consultar.', estado: 'prototipo' },
      { id: 'e2', texto: 'Notificaciones estándar de embarque y llegada.', estado: 'prototipo' },
      { id: 'e3', texto: 'Promociones de cafetería y bar en la carta (p. ej. bollería + bebida caliente).', estado: 'prototipo' },
      { id: 'e4', texto: 'Ofrecer también Priority como escalón intermedio (salón, embarque prioritario y comida, sin desembarque prioritario ni flexibilidad).', estado: 'a-confirmar' },
    ],
  },
  oro: {
    nombre: 'Clase Oro (Confort Oro)',
    tono: 'Premium y personalizado: se trata al pasajero por su nombre',
    reglas: [
      { id: 'o1', texto: 'Distintivo Clase Oro en la cabecera de la app y en la pantalla de viaje.', estado: 'prototipo' },
      { id: 'o2', texto: 'Aviso de embarque prioritario y, con vehículo, de desembarque prioritario.', estado: 'prototipo' },
      { id: 'o3', texto: 'Acceso directo desde la app al menú Clase Oro incluido, con servicio en mesa en el salón Oro.', estado: 'prototipo' },
      { id: 'o4', texto: 'Botón de soporte prioritario en Ayuda: la solicitud aparece como alerta al responsable.', estado: 'prototipo' },
      { id: 'o5', texto: 'Carril físico de embarque y desembarque prioritario (señalización y personal): a confirmar con Fred. Olsen.', estado: 'a-confirmar' },
    ],
  },
}

/** Unidades del menú Oro ya consumidas por un billete (pedidos activos, también los pendientes de sincronizar). Un pedido cancelado las devuelve. */
export const oroUsadas = (s: Pick<ProtoState, 'pedidos' | 'pendientesOffline'>, ticket: string) =>
  [...s.pedidos, ...s.pendientesOffline].filter((p) => p.ticket === ticket && p.estado !== 'cancelado').reduce((a, p) => a + (p.menuOro?.uds ?? 0), 0)

export type PlanMenuOro = { elegible: boolean; limite: number; usadas: number; restantes: number; cubiertas: LineaPedido[]; uds: number; valor: number }
/**
 * Menú Clase Oro incluido: solo para billetes Oro y pedidos a la cafetería Oro. Las unidades elegibles del carrito (por orden de carrito)
 * pasan a 0 € hasta agotar el límite por persona; lo que exceda se cobra a precio de carta.
 */
export function planMenuOro(s: ProtoState, billete: Partial<Pick<Billete, 'ticket' | 'clase'>>, cafeteria: CafeteriaId | undefined, lineas: LineaPedido[]): PlanMenuOro {
  const limite = s.ajustes.limiteMenuOro
  const elegible = billete.clase === 'oro' && cafeteria === 'oro' && !!billete.ticket
  const usadas = billete.ticket ? oroUsadas(s, billete.ticket) : 0
  const restantes = elegible ? Math.max(0, limite - usadas) : 0
  const cub: LineaPedido[] = []
  let quedan = restantes
  let valor = 0
  if (elegible) {
    for (const l of lineas) {
      if (quedan <= 0) break
      const p = s.productos.find((x) => x.id === l.pid)
      if (!p?.incluidoOro || l.qty <= 0) continue
      const n = Math.min(quedan, l.qty)
      cub.push({ pid: l.pid, qty: n })
      valor += p.precio * n
      quedan -= n
    }
  }
  return { elegible, limite, usadas, restantes, cubiertas: cub, uds: restantes - quedan, valor: Math.round(valor * 100) / 100 }
}

// ---------------------------------------------------------------- bonos: catálogo y códigos
/**
 * Tipos de bono de consumo (menús prepagados). Se compran junto al billete o en físico (código impreso de un solo uso).
 * Precios de referencia = propuesta del equipo, por validar con Fred. Olsen.
 */
export const TIPOS_BONO: TipoBono[] = [
  {
    id: 'desayuno',
    nombre: 'Menú desayuno',
    desc: '1 bebida caliente + 1 bollería',
    precio: 3.9,
    cubre: [
      { etiqueta: 'Bebida caliente', pids: ['cortado', 'solo'], qty: 1 },
      { etiqueta: 'Bollería', pids: ['croissant'], qty: 1 },
    ],
  },
  {
    id: 'bocadillo',
    nombre: 'Menú bocadillo + bebida',
    desc: '1 bocadillo o sándwich + 1 agua o refresco',
    precio: 6.9,
    cubre: [
      { etiqueta: 'Bocadillo o sándwich', pids: ['pollo-gourmet', 'serrano-queso', 'tortilla', 'mixto', 'atun'], qty: 1 },
      { etiqueta: 'Agua o refresco', pids: ['agua', 'refresco'], qty: 1 },
    ],
  },
  {
    id: 'cafe-snack',
    nombre: 'Menú café y snack',
    desc: '1 café + 1 snack (papas o plátano)',
    precio: 3.2,
    cubre: [
      { etiqueta: 'Café', pids: ['cortado', 'solo'], qty: 1 },
      { etiqueta: 'Snack', pids: ['papas', 'fruta'], qty: 1 },
    ],
  },
]
export const tipoBono = (id: string) => TIPOS_BONO.find((t) => t.id === id)!

const COD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin I, O, 0, 1 (se confunden al teclear)
const COD_CTRL = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
/** Letra de control de 4 caracteres: detecta erratas al teclear el código. */
function letraControl(cuerpo: string) {
  let n = 0
  for (let i = 0; i < cuerpo.length; i++) n += (COD_CHARS.indexOf(cuerpo[i]) + 1) * (i + 1)
  return COD_CTRL[n % COD_CTRL.length]
}
/** Código legible de un solo uso: BN-7K2Q-D (cuerpo de 4 + letra de control). */
export const codigoBono = (cuerpo: string) => `BN-${cuerpo}-${letraControl(cuerpo)}`
/** Normaliza lo que teclea o escanea el pasajero (minúsculas, espacios, guiones opcionales) y comprueba la letra de control. */
export function normalizarCodigoBono(raw: string): string | null {
  const c = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const m = /^(?:BN)?([A-Z0-9]{4})([A-Z])$/.exec(c)
  if (!m || [...m[1]].some((ch) => !COD_CHARS.includes(ch)) || letraControl(m[1]) !== m[2]) return null
  return `BN-${m[1]}-${m[2]}`
}
const nuevoCuerpo = () => Array.from({ length: 4 }, () => COD_CHARS[Math.floor(Math.random() * COD_CHARS.length)]).join('')

function mkBono(tipoId: string, origen: BonoOrigen, cuerpo: string, ticket?: string): Bono {
  const t = tipoBono(tipoId)
  return { codigo: codigoBono(cuerpo), tipo: origen, tipoId, nombre: t.nombre, contenido: t.cubre.map((c) => ({ ...c, pids: [...c.pids] })), precio: t.precio, estado: 'disponible', ...(ticket ? { ticket } : {}) }
}

/**
 * Bonos de partida de la demo.
 *  - De billete (comprados junto al billete): Carmen «Menú desayuno», Tom «Menú bocadillo + bebida», Yeray «Menú desayuno»
 *    (Yeray tiene Tarifa Joven: sirve para probar que bono y ventaja conviven sin doble descuento) y 3 de otros pasajeros.
 *  - Físicos (código impreso de un solo uso): 4 códigos para que el jurado los pruebe.
 */
export function bonosIniciales(): Bono[] {
  return [
    mkBono('desayuno', 'billete', 'D4PM', 'FO7K2Q'),
    mkBono('bocadillo', 'billete', 'T6QJ', 'FO9X4M'),
    mkBono('desayuno', 'billete', 'R2WK', 'FO2J5T'),
    mkBono('bocadillo', 'billete', 'G8XN', 'FO5C7E'),
    mkBono('desayuno', 'billete', 'M3VB', 'FO6D2R'),
    mkBono('cafe-snack', 'billete', 'K9HY', 'FO4P8T'),
    mkBono('desayuno', 'fisico', '7K2Q'),
    mkBono('bocadillo', 'fisico', '4M9D'),
    mkBono('cafe-snack', 'fisico', 'X3TB'),
    mkBono('desayuno', 'fisico', 'H8N5'),
  ]
}

// ---------------------------------------------------------------- ventajas por pedir con antelación: demo
/** Pasajeros previstos al día para la previsión de consumo (hipótesis del equipo: 8 salidas × ≈ 290; la misma del plan de aprovisionamiento del manager). */
export const PASAJEROS_DIA_PREVISTOS = 2300
/**
 * Ventajas de demo. Precios, porcentajes y límites son una PROPUESTA del equipo (`propuesta: true`): hay que validarlos con Fred. Olsen.
 *  - «Menú Desayuno Canario»: café con leche canaria + bollería o pan con queso de Tenerife + plátano de Canarias o agua canaria, a precio cerrado.
 *  - «−15 % en bocadillos y sándwiches»: lo que conviene preparar con antelación.
 *  - «−25 % en consumo próximo»: la lista se calcula con el inventario (perecederos con exceso o que caducan hoy).
 */
export function ventajasIniciales(): Ventaja[] {
  return [
    {
      id: 'v-desayuno-canario',
      nombre: 'Menú Desayuno Canario solo antes del viaje',
      tipo: 'menu-exclusivo',
      objetivo: 'canario',
      aplica: { modo: 'regla', regla: 'canario' },
      menu: [
        { etiqueta: 'Café con leche canaria', pids: ['cortado'], qty: 1 },
        { etiqueta: 'Bollería o pan con queso de Tenerife', pids: ['croissant', 'pan-queso'], qty: 1 },
        { etiqueta: 'Plátano de Canarias o agua canaria', pids: ['fruta', 'agua'], qty: 1 },
      ],
      valor: 4.4,
      limiteTravesia: 40,
      limitePasajero: 2,
      ventanaMin: 15,
      activa: true,
      propuesta: true,
    },
    {
      id: 'v-bocadillos-15',
      nombre: '−15 % en bocadillos y sándwiches pedidos antes de embarcar',
      tipo: 'descuento',
      objetivo: 'preparar-barco',
      aplica: { modo: 'regla', regla: 'preparar' },
      menu: [],
      valor: 15,
      limiteTravesia: 60,
      limitePasajero: 4,
      ventanaMin: 15,
      activa: true,
      propuesta: true,
    },
    {
      id: 'v-consumo-proximo-25',
      nombre: '−25 % en productos de consumo próximo',
      tipo: 'descuento',
      objetivo: 'consumo-proximo',
      aplica: { modo: 'regla', regla: 'consumo-proximo' },
      menu: [],
      valor: 25,
      limiteTravesia: 30,
      limitePasajero: 3,
      ventanaMin: 15,
      activa: true,
      propuesta: true,
    },
  ]
}

const NOMBRES_BOT = ['Ana', 'Luis', 'Marta', 'Jonay', 'Yeray', 'Elena', 'Pedro', 'Nira', 'Acerina', 'Raúl', 'Sofía', 'Iván', 'Beatriz', 'Dácil', 'Hugo']

export function estadoInicial(): ProtoState {
  return recalcular({
    version: 8,
    viaje: { buque: 'Bajamar Express', origen: 'Santa Cruz de Tenerife', destino: 'Agaete', salida: '08:00', duracionMin: 80, minuto: -25, velocidad: 0.5 },
    ajustes: {
      franjaMin: 5,
      topePorFranja: 8,
      cierreAntesLlegada: 20,
      umbralStock: 2,
      pausa: { proa: false, popa: false, oro: false },
      bot: true,
      online: true,
      upsellOro: true,
      limiteMenuOro: LIMITE_MENU_ORO,
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
    alertasSilenciadas: {},
    siguienteId: 201,
    bonos: bonosIniciales(),
    ventajas: ventajasIniciales(),
    ventajasCfg: { umbralExceso: 0.3, pasajerosDia: PASAJEROS_DIA_PREVISTOS, caducaHoy: ['jamon-cocido'] }, // demo: un lote de jamón cocido que caduca hoy
    insumos: INSUMOS_INICIALES.map((i) => ({ ...i })),
    escandallos: JSON.parse(JSON.stringify(ESCANDALLOS_INICIALES)),
    movimientos: [],
    almacen: { frioLitros: 60 },
    aprovisionamiento: { ultimaCompraSemanal: 'Lunes 06:30', ultimaRecepcionCatering: 'Hoy 06:45' },
    base: { ventaPorPasajero: 1.37, ticketMedio: 5.9, tasaCompra: 1.37 / 5.9, pasajeros: 420 },
  })
}

// ---------------------------------------------------------------- store (localStorage + BroadcastChannel)
const KEY = 'fredonboard-proto-v8'
const canal: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(KEY) : null

function cargar(): ProtoState {
  try {
    const raw = localStorage.getItem(KEY)
    const t = Number(localStorage.getItem(KEY + '-t') || 0)
    // una demo abandonada (más de 20 min sin actividad) arranca de cero con una travesía nueva
    if (raw && Date.now() - t < 20 * 60 * 1000) {
      const s = JSON.parse(raw) as ProtoState
      if (s.version === 8) return recalcular(s)
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

// ---------------------------------------------------------------- bonos: motor
/** Estado efectivo: un bono disponible caduca al llegar a puerto. */
export const estadoBono = (s: Pick<ProtoState, 'viaje'>, b: Bono): EstadoBono => (b.estado === 'disponible' && s.viaje.minuto >= s.viaje.duracionMin ? 'caducado' : b.estado)

export type ConsultaBono = { ok: true; bono: Bono } | { ok: false; motivo: 'formato' | 'desconocido' | 'ajeno' | 'usado' | 'caducado'; bono?: Bono }

/** Valida un código: formato (letra de control), existencia, titular (bonos de billete), un solo uso y caducidad. */
export function consultarBono(s: ProtoState, raw: string, ticket?: string): ConsultaBono {
  const cod = normalizarCodigoBono(raw)
  if (!cod) return { ok: false, motivo: 'formato' }
  const bono = s.bonos.find((b) => b.codigo === cod)
  if (!bono) return { ok: false, motivo: 'desconocido' }
  if (bono.tipo === 'billete' && ticket && bono.ticket !== ticket) return { ok: false, motivo: 'ajeno' }
  const e = estadoBono(s, bono)
  if (e === 'canjeado') return { ok: false, motivo: 'usado', bono }
  if (e === 'caducado') return { ok: false, motivo: 'caducado', bono }
  return { ok: true, bono }
}

export type FaltaBono = { cobertura: CoberturaBono; qty: number; opciones: string[] }
export type PlanBono = { cubiertas: LineaPedido[]; valor: number; faltan: FaltaBono[]; completo: boolean }

/**
 * Qué parte del carrito cubre un bono. Por cada cobertura se toman las unidades elegibles MÁS BARATAS del carrito
 * (la ventaja nunca supera lo que el pasajero ha elegido y no hay sorpresas); esas unidades pasan a 0 €.
 * `faltan` lista lo que aún no está en el carrito, con los productos vendibles que lo completan.
 */
export function planBono(s: ProtoState, bono: Pick<Bono, 'contenido'>, lineas: LineaPedido[]): PlanBono {
  const resto = new Map<string, number>()
  for (const l of lineas) if (l.qty > 0) resto.set(l.pid, (resto.get(l.pid) ?? 0) + l.qty)
  const cubiertas = new Map<string, number>()
  const faltan: FaltaBono[] = []
  let valor = 0
  for (const c of bono.contenido) {
    let necesita = c.qty
    const elegibles = c.pids
      .filter((pid) => (resto.get(pid) ?? 0) > 0)
      .sort((a, b) => (s.productos.find((p) => p.id === a)?.precio ?? 0) - (s.productos.find((p) => p.id === b)?.precio ?? 0))
    for (const pid of elegibles) {
      if (necesita <= 0) break
      const n = Math.min(necesita, resto.get(pid)!)
      resto.set(pid, resto.get(pid)! - n)
      cubiertas.set(pid, (cubiertas.get(pid) ?? 0) + n)
      valor += (s.productos.find((p) => p.id === pid)?.precio ?? 0) * n
      necesita -= n
    }
    if (necesita > 0) {
      const opciones = c.pids
        .map((pid) => s.productos.find((p) => p.id === pid))
        .filter((p): p is Producto => !!p && disponible(s, p) > 0)
        .sort((a, b) => a.precio - b.precio)
        .map((p) => p.id)
      faltan.push({ cobertura: c, qty: necesita, opciones })
    }
  }
  return { cubiertas: [...cubiertas].map(([pid, qty]) => ({ pid, qty })), valor: Math.round(valor * 100) / 100, faltan, completo: faltan.length === 0 }
}

const restarLineas = (lineas: LineaPedido[], cubiertas: LineaPedido[]) =>
  lineas.map((l) => ({ ...l, qty: l.qty - (cubiertas.find((c) => c.pid === l.pid)?.qty ?? 0) })).filter((l) => l.qty > 0)

// ---------------------------------------------------------------- ventajas por pedir con antelación: motor
/**
 * REGLA DE CONVIVENCIA (sin doble descuento): cada unidad del pedido recibe, como mucho, UN beneficio. Orden de aplicación:
 *   1) menú Clase Oro incluido (0 €) → 2) bono de consumo (0 €) → 3) ventaja por pedir con antelación → 4) Tarifa Joven.
 * Cada paso solo actúa sobre las unidades que los anteriores han dejado libres. Dentro del paso 3, primero los menús exclusivos y después
 * los descuentos; si varios descuentos aplican a una misma unidad gana el de mayor ahorro. Las ventajas solo existen en pre-pedidos
 * (antes de zarpar y dentro de su ventana): a bordo no se ofrecen.
 */
const c2 = (n: number) => Math.round(n * 100) / 100

/** Pedidos que cuentan para los límites: activos (no cancelados), incluidos los pendientes de sincronizar, sin duplicados. */
function pedidosContables(s: Pick<ProtoState, 'pedidos' | 'pendientesOffline'>): Pedido[] {
  const vistos = new Set<string>()
  const out: Pedido[] = []
  for (const p of [...s.pedidos, ...s.pendientesOffline]) {
    if (vistos.has(p.clientKey)) continue
    vistos.add(p.clientKey)
    if (p.estado !== 'cancelado') out.push(p)
  }
  return out
}

/** ¿Está abierta la ventana de la ventaja? Desde la compra del billete hasta `ventanaMin` minutos antes de zarpar. */
export const ventanaAbierta = (s: Pick<ProtoState, 'viaje'>, v: Pick<Ventaja, 'ventanaMin'>) => s.viaje.minuto < -Math.max(0, v.ventanaMin)
/** Una ventaja se ofrece si está activa y su ventana sigue abierta (siempre antes de zarpar). */
export const ventajaVigente = (s: Pick<ProtoState, 'viaje'>, v: Pick<Ventaja, 'ventanaMin' | 'activa'>) => v.activa && ventanaAbierta(s, v)

/** Unidades (o menús) ya usados de una ventaja en esta travesía, opcionalmente solo de un billete. Un pedido cancelado devuelve su cupo. */
export const ventajaUsadas = (s: Pick<ProtoState, 'pedidos' | 'pendientesOffline'>, id: string, ticket?: string) =>
  pedidosContables(s)
    .filter((p) => !ticket || p.ticket === ticket)
    .reduce((a, p) => a + (p.ventajas?.find((x) => x.id === id)?.uds ?? 0), 0)

export type EstadoVentaja = {
  vigente: boolean
  motivo?: 'inactiva' | 'cerrada' | 'agotada' | 'agotada-pasajero'
  usadasTravesia: number
  usadasPasajero: number
  restoTravesia: number | null // null = sin límite
  restoPasajero: number | null
  resto: number // unidades que aún se pueden aplicar (Infinity = sin límite)
  hasta: string // hora (HH:MM) a la que se cierra la ventana
  minutosHasta: number // minutos simulados que quedan para el cierre (0 si ya cerró)
}
export function estadoVentaja(s: ProtoState, v: Ventaja, ticket?: string): EstadoVentaja {
  const usadasTravesia = ventajaUsadas(s, v.id)
  const usadasPasajero = ticket ? ventajaUsadas(s, v.id, ticket) : 0
  const restoTravesia = v.limiteTravesia == null ? null : Math.max(0, v.limiteTravesia - usadasTravesia)
  const restoPasajero = v.limitePasajero == null || !ticket ? null : Math.max(0, v.limitePasajero - usadasPasajero)
  const resto = Math.min(restoTravesia ?? Infinity, restoPasajero ?? Infinity)
  const abierta = ventanaAbierta(s, v)
  const motivo = !v.activa ? 'inactiva' : !abierta ? 'cerrada' : restoTravesia === 0 ? 'agotada' : restoPasajero === 0 ? 'agotada-pasajero' : undefined
  return {
    vigente: !motivo,
    motivo,
    usadasTravesia,
    usadasPasajero,
    restoTravesia,
    restoPasajero,
    resto,
    hasta: horaDe(s, -Math.max(0, v.ventanaMin)),
    minutosHasta: Math.max(0, Math.round(-Math.max(0, v.ventanaMin) - s.viaje.minuto)),
  }
}

// ---- consumo próximo: se calcula con el inventario
/** Consumo previsto de un insumo en el día: pasajeros previstos × consumo por pasajero × escandallo (datos reales del Bajamar donde los hay). */
export function previstoInsumo(s: Pick<ProtoState, 'escandallos' | 'ventajasCfg'>, iid: string): number {
  let n = 0
  for (const [pid, c] of Object.entries(CONSUMO_POR_PASAJERO)) for (const e of s.escandallos[pid] ?? []) if (e.iid === iid) n += s.ventajasCfg.pasajerosDia * c.u * e.qty
  return n
}
/** Insumo que más pesa en el coste de un producto (el «principal» de su escandallo). */
export function insumoPrincipal(s: Pick<ProtoState, 'escandallos' | 'insumos'>, pid: string): Insumo | undefined {
  let mejor: Insumo | undefined
  let max = -1
  for (const l of s.escandallos[pid] ?? []) {
    const i = s.insumos.find((x) => x.id === l.iid)
    if (i && l.qty * i.coste > max) {
      max = l.qty * i.coste
      mejor = i
    }
  }
  return mejor
}
export type InsumoProximo = { insumo: Insumo; previsto: number; ratio: number; motivo: 'exceso' | 'caduca-hoy'; sobrante: number }
/**
 * Perecederos de consumo próximo: los que tienen más stock del previsto (por encima de `umbralExceso`) o que el responsable marca como «caduca hoy».
 * `sobrante` = lo que se perdería si no sale (todo el stock si caduca hoy; el exceso sobre lo previsto en el otro caso).
 */
export function insumosConsumoProximo(s: ProtoState): InsumoProximo[] {
  const out: InsumoProximo[] = []
  for (const insumo of s.insumos) {
    if (insumo.tipo !== 'perecedero' || insumo.stock <= 0) continue
    const previsto = previstoInsumo(s, insumo.id)
    const ratio = previsto > 0 ? insumo.stock / previsto : Infinity
    const caduca = s.ventajasCfg.caducaHoy.includes(insumo.id)
    if (!caduca && ratio < 1 + s.ventajasCfg.umbralExceso) continue
    out.push({ insumo, previsto, ratio, motivo: caduca ? 'caduca-hoy' : 'exceso', sobrante: caduca ? insumo.stock : Math.max(0, insumo.stock - previsto) })
  }
  return out
}
export type ProductoProximo = InsumoProximo & { producto: Producto }
/** Productos de consumo próximo ahora: aquellos cuyo insumo principal es un perecedero en exceso o que caduca hoy (solo los que se pueden pedir). */
export function productosConsumoProximo(s: ProtoState): ProductoProximo[] {
  const por = new Map(insumosConsumoProximo(s).map((x) => [x.insumo.id, x] as const))
  if (!por.size) return []
  const out: ProductoProximo[] = []
  for (const producto of s.productos) {
    if (producto.soloOro || disponible(s, producto) <= 0) continue
    const i = insumoPrincipal(s, producto.id)
    const x = i && por.get(i.id)
    if (x) out.push({ ...x, producto })
  }
  return out
}

/** ¿Aplica la ventaja (de descuento) a este producto? `proximo` = pids de consumo próximo ya calculados. */
export function aplicaA(s: ProtoState, v: Pick<Ventaja, 'aplica'>, p: Producto, proximo?: Set<string>): boolean {
  const a = v.aplica
  if (a.modo === 'productos') return a.pids.includes(p.id)
  if (a.modo === 'categorias') return a.cats.includes(p.cat)
  if (a.regla === 'canario') return !!p.km0 || !!p.elaboradoCanarias
  if (a.regla === 'preparar') return p.cat === 'Bocadillos' || p.cat === 'Sándwiches'
  return (proximo ?? new Set(productosConsumoProximo(s).map((x) => x.producto.id))).has(p.id)
}
/** Productos a los que aplica ahora una ventaja (solo los que se pueden pedir: con stock y fuera de la carta exclusiva de Clase Oro). */
export function productosDeVentaja(s: ProtoState, v: Ventaja): Producto[] {
  const vendibles = s.productos.filter((p) => !p.soloOro && disponible(s, p) > 0)
  if (v.tipo === 'menu-exclusivo') {
    const pids = new Set(v.menu.flatMap((c) => c.pids))
    return vendibles.filter((p) => pids.has(p.id))
  }
  const proximo = v.aplica.modo === 'regla' && v.aplica.regla === 'consumo-proximo' ? new Set(productosConsumoProximo(s).map((x) => x.producto.id)) : undefined
  return vendibles.filter((p) => aplicaA(s, v, p, proximo))
}

export type PlanVentajas = { aplicadas: VentajaAplicada[]; descuento: number; cubiertas: VentajaCubierta[] }
const SIN_VENTAJAS: PlanVentajas = { aplicadas: [], descuento: 0, cubiertas: [] }

/**
 * Qué ventajas por pedir con antelación se aplican a unas líneas (las que quedan tras menú Oro y bono). Solo si el pedido es un pre-pedido
 * (antes de zarpar) y la ventana de cada ventaja sigue abierta. Respeta los límites por travesía y por pasajero (cancelar devuelve el cupo).
 *  - Menú exclusivo: por cada menú completo en el carrito (se toman las unidades elegibles más baratas, como en un bono) se cobra el precio cerrado,
 *    solo si es menor que la suma a precio de carta. El ahorro se reparte entre sus unidades.
 *  - Descuento: % sobre cada unidad elegible; si hay límite, se aplica primero a donde más ahorra.
 */
export function planVentajas(s: ProtoState, ticket: string | undefined, lineas: LineaPedido[]): PlanVentajas {
  if (s.viaje.minuto >= 0) return SIN_VENTAJAS
  const vig = s.ventajas.filter((v) => ventajaVigente(s, v))
  if (!vig.length) return SIN_VENTAJAS
  const resto = new Map<string, number>()
  for (const l of lineas) if (l.qty > 0) resto.set(l.pid, (resto.get(l.pid) ?? 0) + l.qty)
  if (!resto.size) return SIN_VENTAJAS
  const cupo = new Map(vig.map((v) => [v.id, estadoVentaja(s, v, ticket).resto] as const))
  const acum = new Map<string, { uds: number; cub: Map<string, { qty: number; dto: number }> }>()
  const anotar = (v: Ventaja, pid: string, qty: number, dto: number, uds: number) => {
    const a = acum.get(v.id) ?? { uds: 0, cub: new Map() }
    const c = a.cub.get(pid) ?? { qty: 0, dto: 0 }
    a.cub.set(pid, { qty: c.qty + qty, dto: c2(c.dto + dto) })
    a.uds += uds
    acum.set(v.id, a)
  }
  const precio = (pid: string) => s.productos.find((p) => p.id === pid)?.precio ?? 0

  // 1) menús exclusivos (precio cerrado)
  for (const v of vig.filter((x) => x.tipo === 'menu-exclusivo' && x.menu.length > 0)) {
    while ((cupo.get(v.id) ?? 0) > 0) {
      const plan = planBono(s, { contenido: v.menu }, [...resto].map(([pid, qty]) => ({ pid, qty })))
      if (!plan.completo || plan.valor - v.valor < 0.005) break
      const ahorro = c2(plan.valor - v.valor)
      let repartido = 0
      plan.cubiertas.forEach((c, k) => {
        const dto = k === plan.cubiertas.length - 1 ? c2(ahorro - repartido) : c2((ahorro * precio(c.pid) * c.qty) / plan.valor)
        repartido = c2(repartido + dto)
        resto.set(c.pid, (resto.get(c.pid) ?? 0) - c.qty)
        anotar(v, c.pid, c.qty, dto, k === 0 ? 1 : 0) // el menú cuenta como 1 unidad
      })
      cupo.set(v.id, (cupo.get(v.id) ?? 0) - 1)
    }
  }

  // 2) descuentos: cada unidad, con la ventaja que más ahorra
  const proximo = vig.some((v) => v.tipo === 'descuento' && v.aplica.modo === 'regla' && v.aplica.regla === 'consumo-proximo') ? new Set(productosConsumoProximo(s).map((x) => x.producto.id)) : undefined
  const pares: { v: Ventaja; pid: string; ahorro: number }[] = []
  for (const v of vig.filter((x) => x.tipo === 'descuento'))
    for (const pid of resto.keys()) {
      const p = s.productos.find((x) => x.id === pid)
      if (p && aplicaA(s, v, p, proximo)) pares.push({ v, pid, ahorro: c2((p.precio * v.valor) / 100) })
    }
  pares.sort((a, b) => b.ahorro - a.ahorro)
  for (const par of pares) {
    const n = Math.min(resto.get(par.pid) ?? 0, cupo.get(par.v.id) ?? 0)
    if (n <= 0 || par.ahorro <= 0) continue
    resto.set(par.pid, (resto.get(par.pid) ?? 0) - n)
    cupo.set(par.v.id, (cupo.get(par.v.id) ?? 0) - n)
    anotar(par.v, par.pid, n, c2(par.ahorro * n), n)
  }

  const aplicadas: VentajaAplicada[] = []
  const total = new Map<string, { qty: number; dto: number }>()
  for (const v of vig) {
    const a = acum.get(v.id)
    if (!a || a.uds <= 0) continue
    const cubiertas = [...a.cub].map(([pid, c]) => ({ pid, qty: c.qty, dto: c.dto }))
    for (const c of cubiertas) {
      const t = total.get(c.pid) ?? { qty: 0, dto: 0 }
      total.set(c.pid, { qty: t.qty + c.qty, dto: c2(t.dto + c.dto) })
    }
    aplicadas.push({ id: v.id, nombre: v.nombre, tipo: v.tipo, objetivo: v.objetivo, uds: a.uds, descuento: c2(cubiertas.reduce((x, c) => x + c.dto, 0)), cubiertas })
  }
  return { aplicadas, descuento: c2(aplicadas.reduce((x, a) => x + a.descuento, 0)), cubiertas: [...total].map(([pid, c]) => ({ pid, qty: c.qty, dto: c.dto })) }
}

/** Precio unitario con ventaja de descuento (el mejor aplicable ahora a un billete), para mostrarlo tachado en la carta. */
export function ventajaDeProducto(s: ProtoState, ticket: string | undefined, p: Producto, proximo?: Set<string>): { ventaja: Ventaja; precio: number } | null {
  if (s.viaje.minuto >= 0 || p.soloOro) return null
  proximo ??= new Set(productosConsumoProximo(s).map((x) => x.producto.id))
  let mejor: { ventaja: Ventaja; precio: number } | null = null
  for (const v of s.ventajas) {
    if (v.tipo !== 'descuento' || !estadoVentaja(s, v, ticket).vigente || !aplicaA(s, v, p, proximo)) continue
    const precio = c2(p.precio - c2((p.precio * v.valor) / 100))
    if (!mejor || precio < mejor.precio) mejor = { ventaja: v, precio }
  }
  return mejor
}

/** Contadores de la travesía para el manager: pre-pedidos con ventaja, unidades, importe descontado y efecto en producto canario y en merma. */
export function estadisticasVentajas(s: ProtoState) {
  const validos = pedidosContables(s)
  const pre = validos.filter((p) => p.prepedido)
  const con = validos.filter((p) => p.ventajas?.length)
  const sin = pre.filter((p) => !p.ventajas?.length)
  const udsDe = (ps: Pedido[]) => ps.reduce((a, p) => a + p.lineas.reduce((b, l) => b + l.qty, 0), 0)
  const canDe = (ps: Pedido[]) => ps.reduce((a, p) => a + p.lineas.reduce((b, l) => b + (esCanario(s, l.pid) ? l.qty : 0), 0), 0)
  const todas = con.flatMap((p) => p.ventajas ?? [])
  const cub = (f: (v: VentajaAplicada) => boolean) => todas.filter(f).flatMap((v) => v.cubiertas)
  const porObjetivo = (o: ObjetivoVentaja) => {
    const vs = todas.filter((v) => v.objetivo === o)
    return { uds: vs.reduce((a, v) => a + v.uds, 0), descuento: c2(vs.reduce((a, v) => a + v.descuento, 0)), pedidos: con.filter((p) => p.ventajas?.some((v) => v.objetivo === o)).length }
  }
  const canarias = cub(() => true).filter((c) => esCanario(s, c.pid))
  const proximo = cub((v) => v.objetivo === 'consumo-proximo')
  return {
    prepedidos: pre.length,
    pedidos: con.length,
    pctPrepedidos: pre.length ? con.length / pre.length : 0,
    uds: todas.reduce((a, v) => a + v.uds, 0),
    descuento: c2(todas.reduce((a, v) => a + v.descuento, 0)),
    importe: c2(con.reduce((a, p) => a + p.total, 0)),
    // producto canario: unidades canarias con ventaja y peso del canario en pre-pedidos con y sin ventaja
    udsCanariasConVentaja: canarias.reduce((a, c) => a + c.qty, 0),
    pctCanarioCon: udsDe(con) ? canDe(con) / udsDe(con) : 0,
    pctCanarioSin: udsDe(sin) ? canDe(sin) / udsDe(sin) : 0,
    // merma: unidades de consumo próximo que han salido con ventaja (a coste de materia prima) y lo que aún queda por dar salida
    udsProximo: proximo.reduce((a, c) => a + c.qty, 0),
    costeProximo: c2(proximo.reduce((a, c) => a + c.qty * costeProducto(s, c.pid), 0)),
    sobranteCoste: c2(insumosConsumoProximo(s).reduce((a, x) => a + x.sobrante * x.insumo.coste, 0)),
    // preparar el barco: unidades que la barra conoce antes de zarpar
    preparar: porObjetivo('preparar-barco'),
    canario: porObjetivo('canario'),
    porVentaja: s.ventajas.map((v) => {
      const vs = todas.filter((x) => x.id === v.id)
      return { id: v.id, pedidos: con.filter((p) => p.ventajas?.some((x) => x.id === v.id)).length, uds: vs.reduce((a, x) => a + x.uds, 0), descuento: c2(vs.reduce((a, x) => a + x.descuento, 0)) }
    }),
  }
}

// ---- acciones del manager
const nuevoIdVentaja = () => 'v-' + Math.random().toString(36).slice(2, 7)
/** Crea una ventaja (por defecto, un −10 % en bebidas y snacks canarios, desactivada para que el manager la revise antes de publicarla). */
export function crearVentaja(base?: Partial<Ventaja>): Ventaja {
  const v: Ventaja = {
    id: nuevoIdVentaja(),
    nombre: 'Nueva ventaja por pedir con antelación',
    tipo: 'descuento',
    objetivo: 'canario',
    aplica: { modo: 'regla', regla: 'canario' },
    menu: [],
    valor: 10,
    limiteTravesia: 30,
    limitePasajero: 3,
    ventanaMin: 15,
    activa: false,
    propuesta: true,
    ...base,
  }
  update((s) => ({ ...s, ventajas: [...s.ventajas, v] }))
  return v
}
export function actualizarVentaja(id: string, patch: Partial<Omit<Ventaja, 'id'>>) {
  update((s) => ({ ...s, ventajas: s.ventajas.map((v) => (v.id === id ? { ...v, ...patch } : v)) }))
}
export function eliminarVentaja(id: string) {
  update((s) => ({ ...s, ventajas: s.ventajas.filter((v) => v.id !== id) }))
}
export function setVentajasCfg(patch: Partial<VentajasCfg>) {
  update((s) => ({ ...s, ventajasCfg: { ...s.ventajasCfg, ...patch } }))
}
/** Marca o desmarca un insumo perecedero como «caduca hoy» (entra o sale del consumo próximo). */
export function setCaducaHoy(iid: string, on: boolean) {
  update((s) => ({ ...s, ventajasCfg: { ...s.ventajasCfg, caducaHoy: on ? [...new Set([...s.ventajasCfg.caducaHoy, iid])] : s.ventajasCfg.caducaHoy.filter((x) => x !== iid) } }))
}

/**
 * Cotización completa de un pedido: subtotal, menú Oro, bono, ventajas por pedir con antelación y Tarifa Joven sin doble descuento.
 * Orden: menú Oro → bono (esas unidades quedan a 0 €) → ventajas por antelación → Tarifa Joven; cada paso solo recae en unidades que los anteriores no han cubierto.
 * Un bono incompleto no se aplica (`plan.faltan` dice qué añadir).
 */
export function cotizar(s: ProtoState, billete: Pick<Billete, 'tarifaJoven'> & Partial<Pick<Billete, 'ticket' | 'clase'>>, lineas: LineaPedido[], bono?: Bono | null, cafeteria?: CafeteriaId, opciones?: { sinVentajas?: boolean }) {
  const subtotal = totalLineas(s, lineas)
  // 1) menú Clase Oro incluido (solo billete Oro en la cafetería Oro) · 2) bono sobre lo que queda · 3) ventajas por pedir con antelación sobre lo que queda
  // · 4) Tarifa Joven sobre lo que queda. Cada unidad recibe, como mucho, un beneficio (ver «REGLA DE CONVIVENCIA»).
  const oro = planMenuOro(s, billete, cafeteria, lineas)
  const tras = oro.cubiertas.length ? restarLineas(lineas, oro.cubiertas) : lineas
  const plan = bono ? planBono(s, bono, tras) : null
  const aplicado = plan && plan.completo ? plan : null
  const valorBono = aplicado?.valor ?? 0
  const cubiertas = aplicado?.cubiertas ?? []
  const trasBono = aplicado ? restarLineas(tras, cubiertas) : tras
  const ventajas = opciones?.sinVentajas ? SIN_VENTAJAS : planVentajas(s, billete.ticket, trasBono)
  const trasVentajas = ventajas.cubiertas.length ? restarLineas(trasBono, ventajas.cubiertas) : trasBono
  const dtoJoven = descuentoJoven(s, billete, trasVentajas)
  const total = Math.max(0, Math.round((subtotal - oro.valor - valorBono - ventajas.descuento - dtoJoven) * 100) / 100)
  return { subtotal, plan, valorBono, cubiertas, dtoJoven, total, oro, ventajas }
}

/** Bonos de un billete (comprados con él) que se pueden usar ahora. */
export const bonosDeBillete = (s: ProtoState, ticket: string) => s.bonos.filter((b) => b.tipo === 'billete' && b.ticket === ticket && estadoBono(s, b) === 'disponible')

/** Estadísticas para el manager: emitidos, canjeados, % de canje, ingresos anticipados y valor canjeado. */
export function estadisticasBonos(s: ProtoState) {
  const e = (b: Bono) => estadoBono(s, b)
  const emitidos = s.bonos.length
  const canjeados = s.bonos.filter((b) => e(b) === 'canjeado')
  const deBillete = s.bonos.filter((b) => b.tipo === 'billete')
  const fisicos = s.bonos.filter((b) => b.tipo === 'fisico')
  return {
    emitidos,
    deBillete: deBillete.length,
    fisicos: fisicos.length,
    canjeados: canjeados.length,
    disponibles: s.bonos.filter((b) => e(b) === 'disponible').length,
    caducados: s.bonos.filter((b) => e(b) === 'caducado').length,
    pctCanje: emitidos ? canjeados.length / emitidos : 0,
    ingresosAnticipados: Math.round(deBillete.reduce((a, b) => a + b.precio, 0) * 100) / 100, // vendidos con el billete
    ingresosFisicos: Math.round(fisicos.reduce((a, b) => a + b.precio, 0) * 100) / 100,
    valorCanjeado: Math.round(canjeados.reduce((a, b) => a + (b.canjeadoEn?.valor ?? 0), 0) * 100) / 100,
    pedidosConBono: s.pedidos.filter((p) => p.bono && p.estado !== 'cancelado').length,
    porTipo: TIPOS_BONO.map((t) => ({
      tipo: t,
      emitidos: s.bonos.filter((b) => b.tipoId === t.id).length,
      canjeados: canjeados.filter((b) => b.tipoId === t.id).length,
    })),
  }
}

/** Emite un bono (venta en físico o con el billete). Devuelve el bono creado. */
export function emitirBono(tipoId: string, origen: BonoOrigen, ticket?: string): Bono {
  let cuerpo = nuevoCuerpo()
  while (state.bonos.some((b) => b.codigo === codigoBono(cuerpo))) cuerpo = nuevoCuerpo()
  const bono = mkBono(tipoId, origen, cuerpo, ticket)
  update((s) => ({ ...s, bonos: [...s.bonos, bono] }))
  return bono
}

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
  | { ok: false; motivo: MotivoError; detalle?: string }
export type MotivoError = 'solo-oro' | 'cerrado' | 'pausa' | 'franja-llena' | 'sin-stock' | 'bono-invalido' | 'bono-ajeno' | 'bono-usado' | 'bono-caducado' | 'bono-incompleto'

/** Relee el estado de localStorage: otra pestaña puede haber canjeado un bono sin que haya llegado aún el aviso del canal. */
function refrescarDesdeAlmacen() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    const st = JSON.parse(raw) as ProtoState
    if (st.version === 8 && st.bonos?.some((b) => b.estado !== 'disponible' && state.bonos.find((x) => x.codigo === b.codigo)?.estado === 'disponible')) {
      state = recalcular(st)
      emit()
    }
  } catch {
    /* sin almacenamiento */
  }
}

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
  bono?: string // código del bono a canjear en este pedido (de un solo uso)
  canal?: 'barra'
  mesa?: boolean // Clase Oro: servir en mi mesa del salón Oro
  mesaRef?: string
  bot?: boolean
}): ResultadoPedido {
  if (input.bono) refrescarDesdeAlmacen()
  const s = state
  const existente = [...s.pedidos, ...s.pendientesOffline].find((p) => p.clientKey === input.clientKey)
  if (existente) return { ok: true, pedido: existente, offline: !s.pedidos.includes(existente), duplicado: true }
  if (!pedidosAbiertos(s)) return { ok: false, motivo: 'cerrado' }
  // bono: debe existir, ser de este billete (si es de billete), estar disponible y el carrito debe contener lo que cubre
  let bono: Bono | undefined
  if (input.bono) {
    const c = consultarBono(s, input.bono, input.billete.ticket)
    if (!c.ok) return { ok: false, motivo: c.motivo === 'usado' ? 'bono-usado' : c.motivo === 'caducado' ? 'bono-caducado' : c.motivo === 'ajeno' ? 'bono-ajeno' : 'bono-invalido', detalle: input.bono }
    bono = c.bono
    const oroPrevio = planMenuOro(s, input.billete, input.cafeteria, input.lineas)
    if (!planBono(s, bono, oroPrevio.cubiertas.length ? restarLineas(input.lineas, oroPrevio.cubiertas) : input.lineas).completo) return { ok: false, motivo: 'bono-incompleto', detalle: bono.nombre }
  }
  if (s.ajustes.pausa[input.cafeteria]) return { ok: false, motivo: 'pausa' }
  // la carta del salón Oro solo se sirve a billetes Oro y desde la cafetería Oro
  const intruso = input.lineas.find((l) => producto(s, l.pid).soloOro && !(input.billete.clase === 'oro' && input.cafeteria === 'oro'))
  if (intruso) return { ok: false, motivo: 'solo-oro', detalle: producto(s, intruso.pid).nombre }
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
  const cot = cotizar(s, input.billete, input.lineas, bono, input.cafeteria, input.canal === 'barra' ? { sinVentajas: true } : undefined)
  const descuento = cot.dtoJoven
  const esOro = input.billete.clase === 'oro'
  const mesa = !!input.mesa && esOro && input.cafeteria === 'oro'
  const pedido: Pedido = {
    id: s.siguienteId,
    clientKey: input.clientKey,
    ticket: input.billete.ticket,
    nombre: input.billete.nombre,
    lineas: input.lineas,
    total: cot.total,
    cafeteria: input.cafeteria,
    franja: input.franja,
    estado: 'recibido',
    prepedido: s.viaje.minuto < 0,
    pago: cot.total === 0 && bono ? 'bono' : cot.total === 0 && cot.oro.uds > 0 ? 'incluido' : input.pago,
    ...(esOro ? { clase: 'oro' as const } : {}),
    ...(cot.oro.uds > 0 ? { menuOro: { uds: cot.oro.uds, valor: cot.oro.valor, cubiertas: cot.oro.cubiertas } } : {}),
    ...(mesa ? { servicio: 'mesa' as const, ...(input.mesaRef?.trim() ? { mesaRef: input.mesaRef.trim().slice(0, 24) } : {}) } : {}),
    ...(bono ? { bono: { codigo: bono.codigo, nombre: bono.nombre, tipo: bono.tipo, valor: cot.valorBono, cubiertas: cot.cubiertas } } : {}),
    ...(cot.ventajas.aplicadas.length ? { ventajas: cot.ventajas.aplicadas } : {}), // solo en pre-pedidos (antes de zarpar): el descuento ya está en `total`
    ...(input.canal ? { canal: input.canal } : {}),
    ...(input.sinPlastico ? { sinPlastico: true } : {}),
    ...(descuento > 0 ? { tarifaJoven: true, descuentoJoven: descuento } : input.billete.tarifaJoven ? { tarifaJoven: true } : {}),
    bot: input.bot,
    t: { creado: Date.now(), recibido: Date.now() },
  }
  const offline = !s.ajustes.online && !input.bot
  let conflicto = false
  update((st) => {
    // un solo uso: se revalida dentro de la transacción y el bono queda canjeado (también si el pedido queda en cola offline)
    if (bono && st.bonos.find((b) => b.codigo === bono!.codigo)?.estado !== 'disponible') {
      conflicto = true
      return st
    }
    const neg: Record<string, number> = {}
    for (const [iid, q] of Object.entries(cons)) neg[iid] = -q
    // el canje descuenta insumos igual que una venta normal (movimiento «venta», pagado con bono)
    const conInv = aplicarMovimientos(st, neg, 'venta', bono ? `#${pedido.id} · bono ${bono.codigo}` : `#${pedido.id}`)
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
      bonos: bono ? st.bonos.map((b) => (b.codigo === bono!.codigo ? { ...b, estado: 'canjeado' as const, canjeadoEn: { pedido: pedido.id, t: Date.now(), hora: horaDe(st, st.viaje.minuto), valor: cot.valorBono } } : b)) : st.bonos,
    }
  })
  if (conflicto) return { ok: false, motivo: 'bono-usado', detalle: input.bono }
  return { ok: true, pedido, offline, duplicado: false }
}

/** Clase Oro: solicitud de soporte prioritario (incidencia o cambio). Llega al responsable como alerta destacada. */
export function solicitarSoporteOro(billete: Pick<Billete, 'ticket' | 'nombre' | 'clase'>, motivo?: string) {
  if (billete.clase !== 'oro') return false
  const t = Date.now()
  update((s) => ({ ...s, alertas: [...s.alertas, { id: t + 3, nivel: 'warn' as const, texto: `Soporte prioritario Clase Oro: ${billete.nombre} (${billete.ticket}) solicita ayuda${motivo ? ` · ${motivo}` : ''}`, t }].slice(-12) }))
  return true
}

/**
 * Barra: pasa un pedido al siguiente estado. `desde` es el estado que la barra tenía en pantalla al pulsar: si el auto-avance
 * del reloj ya lo movió en ese instante, el toque no se aplica (así un solo toque nunca salta dos estados).
 */
export function avanzarPedido(id: number, desde?: EstadoPedido) {
  const orden: EstadoPedido[] = ['recibido', 'preparando', 'listo', 'entregado']
  update((s) => ({
    ...s,
    pedidos: s.pedidos.map((p) => {
      if (p.id !== id) return p
      if (desde && p.estado !== desde) return p
      const i = orden.indexOf(p.estado)
      if (i < 0 || i === orden.length - 1) return p
      const nuevo = orden[i + 1]
      return { ...p, estado: nuevo, manual: s.viaje.minuto, t: { ...p.t, [nuevo]: Date.now() } }
    }),
  }))
}

export function setEstadoPedido(id: number, estado: EstadoPedido) {
  update((s) => ({ ...s, pedidos: s.pedidos.map((p) => (p.id === id ? { ...p, estado, manual: s.viaje.minuto, t: { ...p.t, [estado]: Date.now() } } : p)) }))
}

// ---------------------------------------------------------------- auto-avance de los pedidos reales (reloj simulado)
/** Minutos simulados de preparación: el pedido empieza a prepararse PREP_MIN antes de que se abra su franja y queda listo al abrirse. */
export const PREP_MIN = 4
/** Si la barra movió un pedido a mano, el reloj no lo toca hasta pasados estos minutos simulados (la barra manda; si se olvida, el reloj lo alcanza). */
export const GRACIA_MANUAL_MIN = 3
const ORDEN_AUTO: EstadoPedido[] = ['recibido', 'preparando', 'listo']
/** Estado en el que debería estar un pedido según el reloj del viaje y su franja de recogida. */
export function estadoPorReloj(s: Pick<ProtoState, 'ajustes'>, p: Pick<Pedido, 'franja'>, minuto: number): EstadoPedido {
  const inicio = p.franja * s.ajustes.franjaMin
  if (minuto >= inicio) return 'listo'
  if (minuto >= inicio - PREP_MIN) return 'preparando'
  return 'recibido'
}
/** Un paso de auto-avance (nunca retrocede ni salta). `entregado` solo lo marca la barra con el QR: un pedido listo se queda en listo. */
function autoAvanzar(s: ProtoState, minuto: number, ahora: number): Pedido[] {
  return s.pedidos.map((p) => {
    if (p.bot || (p.estado !== 'recibido' && p.estado !== 'preparando')) return p
    const objetivo = ORDEN_AUTO.indexOf(estadoPorReloj(s, p, minuto))
    const actual = ORDEN_AUTO.indexOf(p.estado)
    if (objetivo <= actual) return p
    if (p.manual !== undefined && minuto - p.manual < GRACIA_MANUAL_MIN) return p
    const nuevo = ORDEN_AUTO[actual + 1]
    return { ...p, estado: nuevo, t: { ...p.t, [nuevo]: ahora } }
  })
}

// ---------------------------------------------------------------- alertas del manager
/** Tiempo (ms reales) que una alerta resuelta o descartada permanece silenciada aunque su condición siga. */
export const SILENCIO_ALERTA_MS = 5 * 60 * 1000

/**
 * Resuelve (acción pulsada) o descarta (X) una alerta. Desaparece y, si nace de una condición, queda silenciada por su clave estable:
 * no se vuelve a crear mientras la condición no cambie de forma significativa (ver `actualizarAlertas`).
 */
export function resolverAlerta(id: number, motivo: 'resuelta' | 'descartada' = 'resuelta') {
  update((s) => {
    const a = s.alertas.find((x) => x.id === id)
    if (!a) return s
    const g = a.gravedad ?? 0
    return {
      ...s,
      alertas: s.alertas.filter((x) => x.id !== id),
      alertasSilenciadas: a.clave ? { ...s.alertasSilenciadas, [a.clave]: { t: Date.now(), motivo, gravedad: g, reaparece: g + (a.paso ?? 1) } } : s.alertasSilenciadas,
    }
  })
}

type Condicion = { clave: string; tipo: NonNullable<Alerta['tipo']>; entidad: string; estado: 'activa' | 'intermedia' | 'despejada'; texto: string; gravedad: number; paso: number }
/** Condiciones que generan alertas. `intermedia` = histéresis: ni se crea alerta nueva ni se reactiva una silenciada (evita parpadeos). */
function condicionesAlerta(s: ProtoState): Condicion[] {
  const out: Condicion[] = []
  for (const c of ['proa', 'popa', 'oro'] as CafeteriaId[]) {
    const activos = s.pedidos.filter((p) => p.cafeteria === c && (p.estado === 'recibido' || p.estado === 'preparando')).length
    out.push({ clave: `saturacion:${c}`, tipo: 'saturacion', entidad: c, estado: activos >= 7 ? 'activa' : activos <= 5 ? 'despejada' : 'intermedia', texto: `${s.cafeterias[c].nombre}: ${activos} pedidos en preparación`, gravedad: activos, paso: 3 })
  }
  for (const i of s.insumos) {
    out.push({
      clave: `inventario:${i.id}`,
      tipo: 'inventario',
      entidad: i.id,
      estado: i.stock <= i.minimo ? 'activa' : 'despejada',
      texto: `Inventario: ${i.nombre} bajo mínimo (${Math.round(i.stock)} ${i.unidad}). Reposición: ${i.aprovisionamiento}.`,
      gravedad: i.stock <= 0 ? 2 : i.stock <= i.minimo / 2 ? 1 : 0, // bajo mínimo → a la mitad → agotado
      paso: 1,
    })
  }
  return out
}

let seqAlerta = 0
/**
 * Regenera las alertas de condición con deduplicación por clave estable (tipo + entidad), no por texto:
 *  - condición activa y sin alerta → se crea; con alerta → se actualiza su texto (mismo id).
 *  - condición despejada → la alerta se retira sola y se olvida su silencio (si reaparece, avisa de nuevo).
 *  - alerta resuelta/descartada (silenciada) → no vuelve mientras la condición siga igual; sí si empeora
 *    (`gravedad` ≥ la que tenía + `paso`) o pasados SILENCIO_ALERTA_MS.
 */
function actualizarAlertas(s: ProtoState, ahora: number): Pick<ProtoState, 'alertas' | 'alertasSilenciadas'> {
  let alertas = s.alertas
  const sil = { ...(s.alertasSilenciadas ?? {}) }
  const poner = (a: Alerta[]) => {
    alertas = a
  }
  for (const c of condicionesAlerta(s)) {
    const idx = alertas.findIndex((a) => a.clave === c.clave)
    if (c.estado === 'despejada') {
      delete sil[c.clave]
      if (idx >= 0) poner(alertas.filter((_, k) => k !== idx))
      continue
    }
    const sl = sil[c.clave]
    if (sl) {
      const vuelve = c.estado === 'activa' && (c.gravedad >= sl.reaparece || ahora - sl.t >= SILENCIO_ALERTA_MS)
      if (!vuelve) {
        if (idx >= 0) poner(alertas.filter((_, k) => k !== idx))
        continue
      }
      delete sil[c.clave]
    }
    if (idx >= 0) {
      const a = alertas[idx]
      if (a.texto !== c.texto || a.gravedad !== c.gravedad) poner(alertas.map((x, k) => (k === idx ? { ...x, texto: c.texto, gravedad: c.gravedad } : x)))
    } else if (c.estado === 'activa') {
      poner([...alertas, { id: ahora * 100 + (seqAlerta++ % 100), nivel: 'warn', texto: c.texto, t: ahora, clave: c.clave, tipo: c.tipo, entidad: c.entidad, gravedad: c.gravedad, paso: c.paso }])
    }
  }
  return { alertas: alertas.slice(-12), alertasSilenciadas: sil }
}

/** Alerta «Reponer»: recibe el insumo hasta su cantidad de referencia (la condición desaparece sola). */
export function reponerInsumo(iid: string) {
  const i = state.insumos.find((x) => x.id === iid)
  if (!i) return
  movimientoInventario(iid, Math.max(0, i.inicial - i.stock), 'entrada', 'Reposición desde alerta')
}

/** Cancelación del pasajero: solo mientras está «recibido». Devuelve el stock. */
export function cancelarPedido(id: number): boolean {
  const p = state.pedidos.find((x) => x.id === id)
  if (!p || p.estado !== 'recibido') return false
  update((s) => {
    const conInv = aplicarMovimientos(s, consumo(s, p.lineas), 'cancelacion', `#${id}`)
    return {
      ...conInv,
      // el bono vuelve a estar disponible (si el pedido se cancela, el código no se pierde)
      bonos: p.bono ? s.bonos.map((b) => (b.codigo === p.bono!.codigo && b.canjeadoEn?.pedido === id ? { ...b, estado: 'disponible' as const, canjeadoEn: undefined } : b)) : s.bonos,
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

/**
 * Barra: canjea un bono físico para un pasajero sin móvil. Crea el pedido en la cafetería indicada (franja libre más próxima),
 * pagado por completo con el bono; entra en el tablero como cualquier otro pedido, sin pasos extra para la tripulación.
 */
export function canjearBonoEnBarra(input: { codigo: string; nombre?: string; cafeteria: CafeteriaId; elecciones: string[]; clientKey?: string }): ResultadoPedido {
  const s = state
  const libre = franjas(s, input.cafeteria, 6).find((f) => !f.llena)
  if (!libre) return { ok: false, motivo: s.ajustes.pausa[input.cafeteria] ? 'pausa' : 'franja-llena' }
  const lineas: LineaPedido[] = []
  for (const pid of input.elecciones) {
    const l = lineas.find((x) => x.pid === pid)
    if (l) l.qty += 1
    else lineas.push({ pid, qty: 1 })
  }
  return crearPedido({
    clientKey: input.clientKey ?? uid(),
    billete: { ticket: 'BARRA', nombre: input.nombre?.trim() || 'Mostrador', idioma: 'es', plus: 0 },
    lineas,
    cafeteria: input.cafeteria,
    franja: libre.idx,
    pago: 'bono',
    bono: input.codigo,
    canal: 'barra',
  })
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

/** Arranca el reloj y el bot. Idempotente; llamar desde el shell del prototipo (cualquier vista, también solo la del pasajero). Solo una pestaña «lidera». */
export function arrancarMotor() {
  if (motor !== null) return
  ultimoTick = Date.now()
  motor = window.setInterval(tick, 1000)
  window.addEventListener('pagehide', soltarLiderazgo)
}
export function pararMotor() {
  if (motor !== null) window.clearInterval(motor)
  motor = null
  window.removeEventListener('pagehide', soltarLiderazgo)
  soltarLiderazgo()
}

// elección de líder entre pestañas/iframes: solo una avanza el reloj (si no, el viaje iría N veces más rápido)
const LIDER_KEY = 'fredonboard-lider'
const LIDER_TTL_MS = 3000 // un líder que no renueva en este tiempo (pestaña cerrada, congelada o muy estrangulada) pierde el puesto
const MAX_SALTO_S = 5 // al relevar a un líder se recupera como mucho este tiempo de reloj perdido
const LIDER_ID = uid()

/**
 * Renueva o toma el liderazgo. Devuelve si esta pestaña lidera y, si acaba de relevar a otra, la hora (ms) del último tick de la anterior.
 * Una pestaña visible releva a una oculta (los navegadores estrangulan los temporizadores de las ocultas). Si el líder se cierra
 * libera el puesto al instante (`soltarLiderazgo`), y si desaparece sin avisar lo releva otra a los LIDER_TTL_MS.
 */
function liderazgo(ahora: number): { lider: boolean; previo?: number } {
  try {
    const visible = typeof document === 'undefined' || !document.hidden
    const raw = localStorage.getItem(LIDER_KEY)
    const [id, t, vis] = raw ? raw.split('|') : ['', '0', '0']
    const mio = id === LIDER_ID
    if (!raw || mio || id === '' || ahora - Number(t) > LIDER_TTL_MS || (visible && vis === '0')) {
      localStorage.setItem(LIDER_KEY, `${LIDER_ID}|${ahora}|${visible ? 1 : 0}`)
      return { lider: true, previo: mio || !raw ? undefined : Number(t) }
    }
    return { lider: false }
  } catch {
    return { lider: true }
  }
}
function soltarLiderazgo() {
  try {
    const [id, t] = (localStorage.getItem(LIDER_KEY) ?? '').split('|')
    if (id === LIDER_ID) localStorage.setItem(LIDER_KEY, `|${t}|0`) // sin dueño, pero conserva la hora del último tick para no perder reloj
  } catch {
    /* ignorar */
  }
}

function tick() {
  const ahora = Date.now()
  let dt = (ahora - ultimoTick) / 1000
  ultimoTick = ahora
  const { lider, previo } = liderazgo(ahora)
  if (!lider) return
  // relevo de líder: recupera el reloj que se perdió mientras nadie lideraba (acotado)
  if (previo !== undefined && previo > 0) dt = Math.min(MAX_SALTO_S, Math.max(dt, (ahora - previo) / 1000))
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
  // al llegar a puerto, los bonos sin canjear caducan
  if (minuto >= s.viaje.duracionMin && next.bonos.some((b) => b.estado === 'disponible')) next = { ...next, bonos: next.bonos.map((b) => (b.estado === 'disponible' ? { ...b, estado: 'caducado' as const } : b)) }

  // barra automática: los pedidos del bot avanzan por tiempo real; los del usuario, con el reloj simulado y su franja de recogida
  // (así funcionan aunque no haya ninguna barra abierta, y respetan la velocidad elegida en los controles de demo)
  next = {
    ...next,
    pedidos: autoAvanzar(next, minuto, ahora).map((p) => {
      const edad = (ahora - (p.t.creado ?? ahora)) / 1000
      if (p.bot) {
        if (p.estado === 'recibido' && edad > 6) return { ...p, estado: 'preparando', t: { ...p.t, preparando: ahora } }
        if (p.estado === 'preparando' && edad > 16) return { ...p, estado: 'listo', t: { ...p.t, listo: ahora } }
        if (p.estado === 'listo' && edad > 30) return { ...p, estado: 'entregado', t: { ...p.t, entregado: ahora } }
      }
      return p
    }),
  }

  // alertas de saturación por cafetería e inventario bajo mínimo (claves estables; ver actualizarAlertas)
  next = { ...next, ...actualizarAlertas(next, ahora) }

  state = next
  guardar()
  canal?.postMessage({ type: 'state', state })
  emit()

  // bot: pedidos de otros pasajeros (más intensos al zarpar, como en los datos reales de la mañana)
  if (s.ajustes.bot && s.ajustes.online && pedidosAbiertos(state)) {
    const m = state.viaje.minuto
    const intensidad = m < 0 ? 0.25 : m < 25 ? 0.45 : 0.2
    if (Math.random() < intensidad * Math.min(2, dt)) botPedido()
    // pre-pedidos de pasajeros prudentes: mientras hay ventajas por pedir con antelación, parte de los pedidos simulados las usan (hay datos en barra y manager)
    if (m < 0 && state.ventajas.some((v) => ventajaVigente(state, v)) && Math.random() < 0.25 * Math.min(2, dt)) botPedido(true)
  }
}

const elegir = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)]

/** Carrito de un pasajero simulado que aprovecha una ventaja por pedir con antelación (menú completo o producto al que aplica el descuento). */
function lineasConVentaja(s: ProtoState, vig: Ventaja[], disp: Producto[]): LineaPedido[] | null {
  const v = elegir(vig)
  const out: LineaPedido[] = []
  const meter = (pid: string, qty = 1) => {
    const l = out.find((x) => x.pid === pid)
    if (l) l.qty += qty
    else out.push({ pid, qty })
  }
  if (v.tipo === 'menu-exclusivo') {
    for (const c of v.menu) {
      const ok = c.pids.map((pid) => disp.find((p) => p.id === pid)).filter((p): p is Producto => !!p)
      if (!ok.length) return null
      meter(elegir(ok).id, c.qty)
    }
    return out.length ? out : null
  }
  const proximo = v.aplica.modo === 'regla' && v.aplica.regla === 'consumo-proximo' ? new Set(productosConsumoProximo(s).map((x) => x.producto.id)) : undefined
  const elegibles = disp.filter((p) => aplicaA(s, v, p, proximo))
  if (!elegibles.length) return null
  meter(elegir(elegibles).id)
  if (Math.random() < 0.45) meter(elegir(disp.filter((p) => p.cat === 'Bebidas' || p.id === 'cortado' || p.id === 'solo')).id)
  return out
}

const ticketFalso = () => 'FO' + Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')

function botPedido(conVentaja = false) {
  const s = state
  const disp = s.productos.filter((p) => disponible(s, p) > 0 && !p.soloOro)
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
  // pre-pedido con ventaja por antelación (antes de zarpar): menú exclusivo o producto con descuento; se aplica sola en `crearPedido`
  const vigentes = s.ventajas.filter((v) => ventajaVigente(s, v))
  let conV = false
  if (vigentes.length && (conVentaja || Math.random() < 0.3)) {
    const lv = lineasConVentaja(s, vigentes, disp)
    if (lv) {
      lineas.splice(0, lineas.length, ...lv)
      conV = true
    }
  }
  if (conVentaja && !conV) return
  if (!lineas.length) return
  const cafs: CafeteriaId[] = ['proa', 'proa', 'popa', 'popa', 'oro']
  const cafeteria = cafs[Math.floor(Math.random() * cafs.length)]
  const libres = franjas(s, cafeteria, 4).filter((f) => !f.llena)
  if (!libres.length) return
  const nombre = NOMBRES_BOT[Math.floor(Math.random() * NOMBRES_BOT.length)]
  const ticketBot = ticketFalso()
  // algún pasajero simulado paga con bono (~12 %): compra el menú, lo emite el billete o el mostrador y lo canjea
  let bonoBot: string | undefined
  if (!conV && Math.random() < 0.12) {
    const tipo = TIPOS_BONO[Math.floor(Math.random() * TIPOS_BONO.length)]
    const menu: LineaPedido[] = []
    for (const c of tipo.cubre) {
      const ok = c.pids.map((pid) => disp.find((p) => p.id === pid)).filter((p): p is Producto => !!p)
      if (!ok.length) break
      const p = pick(ok)
      const ya = menu.find((l) => l.pid === p.id)
      if (ya) ya.qty += c.qty
      else menu.push({ pid: p.id, qty: c.qty })
    }
    if (menu.length >= 1 && tipo.cubre.every((c) => c.pids.some((pid) => menu.some((l) => l.pid === pid)))) {
      const fisico = Math.random() < 0.4
      bonoBot = emitirBono(tipo.id, fisico ? 'fisico' : 'billete', fisico ? undefined : ticketBot).codigo
      lineas.splice(0, lineas.length, ...menu)
    }
  }
  // otros pasajeros compraron bono con el billete y aún no lo han usado (para que el % de canje sea realista)
  if (Math.random() < 0.2) emitirBono(TIPOS_BONO[Math.floor(Math.random() * TIPOS_BONO.length)].id, 'billete', ticketFalso())
  // «sin cubiertos ni bolsa»: por defecto en bebidas solas (como en la app), y a veces también en el resto
  const sinPlastico = soloBebidas(s, lineas) ? Math.random() < 0.8 : Math.random() < 0.3
  crearPedido({
    clientKey: uid(),
    billete: { ticket: ticketBot, nombre, idioma: 'es', plus: 0, tarifaJoven: Math.random() < 0.2 },
    lineas,
    bono: bonoBot,
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
  const compradores = new Set(validos.map((p) => p.ticket + p.nombre)).size
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
