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
export type Categoria = 'Desayunos' | 'Bocadillos' | 'Sándwiches' | 'Bebidas' | 'Snacks'
export type Producto = {
  id: string
  nombre: string
  precio: number
  cat: Categoria
  desc: string
  km0?: boolean
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
  bot?: boolean
  t: Partial<Record<EstadoPedido | 'creado', number>> // marcas de tiempo (ms reales)
}
export type Fase = 'antes' | 'embarque' | 'navegando' | 'llegando' | 'llegado'
export type Billete = { ticket: string; nombre: string; asiento: string; idioma: 'es' | 'en' | 'de'; plus: number }
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
  // métricas de línea base (datos reales del reto)
  base: { ventaPorPasajero: number; ticketMedio: number; tasaCompra: number; pasajeros: number }
}

// ---------------------------------------------------------------- datos iniciales
export const PRODUCTOS_INICIALES: Producto[] = [
  { id: 'cortado', nombre: 'Café cortado', precio: 1.9, cat: 'Desayunos', desc: 'Café de origen con leche canaria.', stock: 120, agotado: false, color: '#7a4b2a', km0: true },
  { id: 'solo', nombre: 'Café solo', precio: 1.9, cat: 'Desayunos', desc: 'Espresso recién molido.', stock: 120, agotado: false, color: '#3b2416' },
  { id: 'oferta-bolleria', nombre: 'Bollería + bebida caliente', precio: 4.2, cat: 'Desayunos', desc: 'Croissant o napolitana con café o infusión.', tags: ['combo'], stock: 60, agotado: false, color: '#d99a3d' },
  { id: 'croissant', nombre: 'Croissant', precio: 2.1, cat: 'Desayunos', desc: 'Horneado a bordo.', stock: 8, agotado: false, color: '#e0a84f' },
  { id: 'pollo-gourmet', nombre: 'Bocadillo pollo gourmet', precio: 5.72, cat: 'Bocadillos', desc: 'Pollo asado, rúcula y alioli suave.', stock: 40, agotado: false, color: '#c0763a' },
  { id: 'serrano-queso', nombre: 'Bocadillo jamón serrano y queso', precio: 5.76, cat: 'Bocadillos', desc: 'Pan de leña y queso semicurado canario.', km0: true, stock: 35, agotado: false, color: '#b5453a' },
  { id: 'tortilla', nombre: 'Bocadillo de tortilla', precio: 5.77, cat: 'Bocadillos', desc: 'Tortilla de papas del día.', tags: ['vegetariano'], stock: 25, agotado: false, color: '#e8c25a' },
  { id: 'mixto', nombre: 'Sándwich mixto', precio: 5.7, cat: 'Sándwiches', desc: 'Jamón cocido y queso fundido.', stock: 30, agotado: false, color: '#d8b06a' },
  { id: 'atun', nombre: 'Sándwich de atún', precio: 5.73, cat: 'Sándwiches', desc: 'Atún, tomate y lechuga.', stock: 20, agotado: false, color: '#9fb36b' },
  { id: 'agua', nombre: 'Agua sin gas 1/2', precio: 1.75, cat: 'Bebidas', desc: 'Agua mineral canaria.', km0: true, stock: 200, agotado: false, color: '#5aa7d6' },
  { id: 'refresco', nombre: 'Refresco de cola', precio: 2.3, cat: 'Bebidas', desc: 'Lata 33 cl.', stock: 90, agotado: false, color: '#8a1c1c' },
  { id: 'cerveza', nombre: 'Cerveza canaria', precio: 2.9, cat: 'Bebidas', desc: 'Tercio bien frío.', km0: true, stock: 60, agotado: false, color: '#e3a600' },
  { id: 'papas', nombre: 'Papas fritas', precio: 1.8, cat: 'Snacks', desc: 'Bolsa individual.', tags: ['sin gluten'], stock: 70, agotado: false, color: '#f0c419' },
  { id: 'fruta', nombre: 'Plátano de Canarias', precio: 1.2, cat: 'Snacks', desc: 'IGP Plátano de Canarias.', km0: true, tags: ['sin gluten', 'vegetariano'], stock: 40, agotado: false, color: '#f2d43a' },
]

export const BILLETES_DEMO: Billete[] = [
  { ticket: 'FO7K2Q', nombre: 'Carmen', asiento: '42C', idioma: 'es', plus: 340 },
  { ticket: 'FO9X4M', nombre: 'Tom', asiento: '17A', idioma: 'en', plus: 0 },
  { ticket: 'FO3H8B', nombre: 'Greta', asiento: 'Oro 4', idioma: 'de', plus: 1250 },
]

const NOMBRES_BOT = ['Ana', 'Luis', 'Marta', 'Jonay', 'Yeray', 'Elena', 'Pedro', 'Nira', 'Acerina', 'Raúl', 'Sofía', 'Iván', 'Beatriz', 'Dácil', 'Hugo']

export function estadoInicial(): ProtoState {
  return {
    version: 1,
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
    base: { ventaPorPasajero: 1.37, ticketMedio: 5.9, tasaCompra: 1.37 / 5.9, pasajeros: 420 },
  }
}

// ---------------------------------------------------------------- store (localStorage + BroadcastChannel)
const KEY = 'fredonboard-proto-v1'
const canal: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(KEY) : null

function cargar(): ProtoState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as ProtoState
      if (s.version === 1) return s
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
  const pedido: Pedido = {
    id: s.siguienteId,
    clientKey: input.clientKey,
    ticket: input.billete.ticket,
    nombre: input.billete.nombre,
    asiento: input.billete.asiento,
    lineas: input.lineas,
    total: totalLineas(s, input.lineas),
    cafeteria: input.cafeteria,
    franja: input.franja,
    estado: 'recibido',
    prepedido: s.viaje.minuto < 0,
    pago: input.pago,
    bot: input.bot,
    t: { creado: Date.now(), recibido: Date.now() },
  }
  const offline = !s.ajustes.online && !input.bot
  update((st) => ({
    ...st,
    siguienteId: st.siguienteId + 1,
    productos: st.productos.map((p) => {
      const l = input.lineas.find((x) => x.pid === p.id)
      return l ? { ...p, stock: p.stock - l.qty } : p
    }),
    pedidos: offline ? st.pedidos : [...st.pedidos, pedido],
    pendientesOffline: offline ? [...st.pendientesOffline, pedido] : st.pendientesOffline,
  }))
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
  update((s) => ({
    ...s,
    pedidos: s.pedidos.map((x) => (x.id === id ? { ...x, estado: 'cancelado', t: { ...x.t, cancelado: Date.now() } } : x)),
    productos: s.productos.map((pr) => {
      const l = p.lineas.find((x) => x.pid === pr.id)
      return l ? { ...pr, stock: pr.stock + l.qty } : pr
    }),
  }))
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
export function setStock(pid: string, stock: number) {
  update((s) => ({ ...s, productos: s.productos.map((p) => (p.id === pid ? { ...p, stock: Math.max(0, stock) } : p)) }))
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
  update(() => estadoInicial())
}
/** Saltar a una fase del viaje (controles de demo). */
export function irAFase(f: Fase) {
  const m: Record<Fase, number> = { antes: -25, embarque: -10, navegando: 12, llegando: 68, llegado: 82 }
  setViaje({ minuto: m[f] })
}

// ---------------------------------------------------------------- motor de la demo (reloj + bot)
let motor: number | null = null
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
  const n = 1 + Math.floor(Math.random() * 2)
  const lineas: LineaPedido[] = []
  for (let i = 0; i < n; i++) {
    const p = disp[Math.floor(Math.random() * disp.length)]
    if (!lineas.some((l) => l.pid === p.id)) lineas.push({ pid: p.id, qty: 1 })
  }
  const cafs: CafeteriaId[] = ['proa', 'proa', 'popa', 'popa', 'oro']
  const cafeteria = cafs[Math.floor(Math.random() * cafs.length)]
  const libres = franjas(s, cafeteria, 4).filter((f) => !f.llena)
  if (!libres.length) return
  const nombre = NOMBRES_BOT[Math.floor(Math.random() * NOMBRES_BOT.length)]
  crearPedido({
    clientKey: uid(),
    billete: { ticket: 'BOT', nombre, asiento: `${10 + Math.floor(Math.random() * 60)}${'ABCD'[Math.floor(Math.random() * 4)]}`, idioma: 'es', plus: 0 },
    lineas,
    cafeteria,
    franja: libres[0].idx,
    pago: Math.random() < 0.5 ? 'apple' : 'google',
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
