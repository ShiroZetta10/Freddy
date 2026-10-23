// Desglose de costes de FredOnBoard: personas, herramientas de desarrollo e infraestructura.
// Reglas: cada partida lleva (a) una fuente pública con URL consultada el 23-oct-2026, y/o (b) la etiqueta «supuesto del equipo».
// Los importes de las partidas editables se pueden cambiar en la página; aquí están los valores por defecto.
// Los precios en dólares de proveedores de software se tratan como euros 1:1 y sin IVA (cautela, sin convertir).
// De la suma de este desglose salen la implantación y la plataforma mensual del modelo de negocio (negocio.ts).

import { FUENTES_SIM } from './fuentes_simulador'

export type BloqueId = 'personas' | 'herramientas' | 'infraestructura'
/** unico: una vez (implantación del piloto) · mensual / anual: recurrente · variable: depende de las ventas, no suma al total fijo */
export type Periodo = 'unico' | 'mensual' | 'anual' | 'variable'

export const BLOQUES: { id: BloqueId; nombre: string; resumen: string }[] = [
  { id: 'personas', nombre: 'Personas', resumen: 'Horas de equipo externo a la tripulación, a tarifa de referencia. La tripulación no es un coste nuevo: solo se paga su formación.' },
  { id: 'herramientas', nombre: 'Herramientas de desarrollo', resumen: 'IAs de desarrollo, control de versiones, diseño y dominio, con precio público oficial.' },
  { id: 'infraestructura', nombre: 'Infraestructura', resumen: 'Hardware a bordo (tablets, red local, servidor, SAI, pantallas), nube en la UE, conectividad y pagos.' },
]

export type FuenteCoste = { id: string; titulo: string; dato: string; limite?: string; url: string; fecha: string }

const CONSULTA = 'Consultada el 23 oct 2026'
const sim = (id: number) => FUENTES_SIM.find((f) => f.id === id)!

export const FUENTES_COSTES: FuenteCoste[] = [
  { id: 'F1', titulo: 'Claude: planes y precios (Team)', dato: 'Team, asiento estándar: 20 $ por asiento y mes con pago anual, 25 $ con pago mensual. Equipos de 2 a 150 asientos.', limite: 'La página no indica moneda ni IVA; se tratan como euros sin IVA.', url: 'https://claude.com/pricing', fecha: CONSULTA },
  { id: 'F2', titulo: 'GitHub Copilot: planes y precios', dato: 'Copilot Pro: 10 $ por usuario y mes. Pro+: 39 $.', limite: 'Dólares, sin IVA. El plan Business no aparece con precio en la página.', url: 'https://github.com/features/copilot/plans', fecha: CONSULTA },
  { id: 'F3', titulo: 'GitHub: planes y precios (Team)', dato: 'Team: 4 $ por usuario y mes durante los primeros 12 meses (según la página, con asterisco).', limite: 'Después de los 12 meses el precio vigente hay que revisarlo.', url: 'https://github.com/pricing', fecha: CONSULTA },
  { id: 'F4', titulo: 'Figma: planes y precios (Professional)', dato: 'Professional: 12 $ por editor y mes con pago anual, 15 $ con pago mensual.', limite: 'La página no distingue tipos de asiento ni indica moneda; se toma el precio por editor.', url: 'https://www.figma.com/pricing/', fecha: CONSULTA },
  { id: 'F5', titulo: 'Namecheap: registro de dominios .com', dato: 'Renovación de un .com: 18,48 $ al año (registro del primer año: 11,28 $ con descuento).', limite: 'Dólares. Un dominio .es o un registrador español puede costar distinto.', url: 'https://www.namecheap.com/domains/registration/gtld/com/', fecha: CONSULTA },
  { id: 'F6', titulo: 'Ubiquiti: Access Point U6 Pro', dato: 'U6 Pro: 159 $ (tienda de EE. UU.). Adaptador PoE de 15 W: 8 $ por separado.', limite: 'Precio de la tienda estadounidense sin IVA ni envío a Canarias. Es un punto de acceso profesional de referencia; la elección final es de IT de Fred. Olsen.', url: 'https://store.ui.com/us/en/products/u6-pro', fecha: CONSULTA },
  { id: 'F7', titulo: 'Hetzner Cloud: servidores de rendimiento regular', dato: 'CPX22 (4 GB de RAM, 80 GB NVMe): 19,99 € al mes sin IVA, con centros en Falkenstein, Núremberg y Helsinki (UE).', limite: 'Sin IVA. Disponibilidad variable según el plan. Referencia de precio de nube en la UE, no una elección de proveedor.', url: 'https://www.hetzner.com/cloud/regular-performance/', fecha: CONSULTA },
  { id: 'F8', titulo: 'Indeed España: salario de desarrollador/a de software', dato: 'Media de 32.446 € brutos al año (rango 22.164–47.498 €), actualizado el 18 oct 2026 sobre 1,3 k salarios publicados.', limite: 'La URL es la de «senior full stack developer» pero la página muestra la media de desarrollador/a de software. No publica cifra por hora. La página de Santa Cruz de Tenerife tiene solo 2 salarios (49.721 €) y no se usa.', url: 'https://es.indeed.com/career/senior-full-stack-developer/salaries', fecha: CONSULTA },
  { id: 'F9', titulo: 'Indeed España: salario de diseñador/a UX', dato: 'Media de 31.374 € brutos al año (rango 20.254–48.599 €), sobre 33 salarios, actualizado el 6 oct 2026.', limite: 'Media nacional; no hay dato fiable de Canarias.', url: 'https://es.indeed.com/career/dise%C3%B1ador-ux/salaries', fecha: CONSULTA },
  { id: 'F10', titulo: 'Indeed España: salario de jefe/a de proyecto', dato: 'Media de 38.252 € brutos al año (rango 25.638–57.073 €), sobre 277 salarios, actualizado el 4 oct 2026.', limite: 'Media nacional; se usa también para el rol de product owner.', url: 'https://es.indeed.com/career/jefe-de-proyecto/salaries', fecha: CONSULTA },
  { id: 'F11', titulo: 'Indeed España: salario de QA engineer', dato: 'Media de 37.887 € brutos al año (rango 25.097–57.197 €), sobre 67 salarios, actualizado el 25 sep 2026.', limite: 'Media nacional.', url: 'https://es.indeed.com/career/qa-engineer/salaries', fecha: CONSULTA },
  { id: 'F12', titulo: sim(7).titulo, dato: sim(7).dato, limite: 'Con un ticket medio de 5,90 € la cuota fija de 0,25 € pesa mucho (≈ 5,8 % efectivo). Un adquirente bancario puede ser más barato: depende del contrato de Fred. Olsen.', url: sim(7).url!, fecha: 'Consultada el 22 oct 2026' },
  { id: 'F13', titulo: sim(8).titulo, dato: sim(8).dato, limite: sim(8).limite, url: sim(8).url!, fecha: 'Consultada el 22 oct 2026' },
  { id: 'F14', titulo: sim(9).titulo, dato: sim(9).dato, limite: sim(9).limite, url: sim(9).url!, fecha: 'Consultada el 22 oct 2026' },
  { id: 'F15', titulo: sim(10).titulo, dato: sim(10).dato, limite: sim(10).limite, url: sim(10).url!, fecha: 'Consultada el 22 oct 2026' },
  { id: 'F16', titulo: sim(11).titulo, dato: sim(11).dato, limite: sim(11).limite, url: sim(11).url!, fecha: 'Consultada el 22 oct 2026' },
  { id: 'F17', titulo: sim(12).titulo, dato: sim(12).dato, limite: sim(12).limite, url: sim(12).url!, fecha: 'Consultada el 22 oct 2026' },
]

/* ------------------------------------------------------------------ tarifas de las personas */

/** Supuestos con los que se pasa del salario bruto publicado a una tarifa por hora. */
export const TARIFA_SUPUESTOS = {
  /** Cotización a cargo de la empresa sobre el bruto (supuesto: orden de magnitud habitual en España) */
  seguridadSocial: 1.31,
  /** Horas productivas por persona y año (supuesto) */
  horasAnio: 1750,
  /** Gastos generales y margen de un equipo proveedor sobre el coste laboral (supuesto) */
  gastosMargen: 1.4,
}

export const tarifaDesdeSalario = (brutoAnual: number) =>
  Math.round(((brutoAnual * TARIFA_SUPUESTOS.seguridadSocial) / TARIFA_SUPUESTOS.horasAnio) * TARIFA_SUPUESTOS.gastosMargen)

export const TARIFAS: { id: string; rol: string; salario: number; fuente: string; tarifa: number }[] = [
  { id: 'dev', rol: 'Desarrollo full-stack e integración', salario: 32446, fuente: 'F8', tarifa: tarifaDesdeSalario(32446) },
  { id: 'ux', rol: 'Diseño UX/UI', salario: 31374, fuente: 'F9', tarifa: tarifaDesdeSalario(31374) },
  { id: 'po', rol: 'Product owner / gestión del piloto y formación', salario: 38252, fuente: 'F10', tarifa: tarifaDesdeSalario(38252) },
  { id: 'qa', rol: 'QA (pruebas)', salario: 37887, fuente: 'F11', tarifa: tarifaDesdeSalario(37887) },
]
const T = Object.fromEntries(TARIFAS.map((t) => [t.id, t.tarifa])) as Record<string, number>

/* ------------------------------------------------------------------ partidas */

export type Partida = {
  id: string
  bloque: BloqueId
  concepto: string
  detalle: string
  /** Horas, licencias o unidades */
  cantidad: number
  unidad: string
  /** Si existe, el importe único es cantidad × meses × precio (licencias durante la implantación) */
  meses?: number
  /** Precio por unidad (€/h, €/licencia·mes, €/ud.) */
  precio: number
  periodo: Periodo
  /** Cómo crece al escalar a más barcos: 0 = no escala, 1 = se repite íntegro en cada barco, 0,3 = un 30 % por barco adicional */
  escala: number
  /** Fuentes públicas (ids de FUENTES_COSTES) */
  refs: string[]
  /** Cantidad o precio sin fuente: supuesto del equipo */
  supuesto: boolean
  /** Etiqueta de importe sin confirmar */
  avalidar?: string
  /** Texto del importe cuando es variable */
  textoVariable?: string
  nota?: string
  activa: boolean
}

type P = Omit<Partida, 'activa'>
const p = (x: P): Partida => ({ ...x, activa: true })

export const PARTIDAS: Partida[] = [
  /* ---------- personas: único ---------- */
  p({ id: 'p-dev', bloque: 'personas', concepto: 'Desarrollo full-stack del piloto', detalle: 'Web del pasajero, tablet de barra, panel de manager, servidor local, pasarela y failsafes con QR', cantidad: 320, unidad: 'h', precio: T.dev, periodo: 'unico', escala: 0, refs: ['F8'], supuesto: true, nota: 'El desarrollo se hace una vez; no se repite por barco.' }),
  p({ id: 'p-agora', bloque: 'personas', concepto: 'Integración con Ágora e IT', detalle: 'Conector con el módulo de integración, entorno de pruebas, cierre Z y conciliación', cantidad: 100, unidad: 'h', precio: T.dev, periodo: 'unico', escala: 0.3, refs: ['F8'], supuesto: true, nota: 'En cada barco nuevo se configura y prueba contra su Ágora (30 %).' }),
  p({ id: 'p-red', bloque: 'personas', concepto: 'Red local a bordo', detalle: 'Configuración del punto de acceso, portal cautivo y mini equipo que sirve la web sin internet', cantidad: 40, unidad: 'h', precio: T.dev, periodo: 'unico', escala: 1, refs: ['F8'], supuesto: true }),
  p({ id: 'p-ux', bloque: 'personas', concepto: 'Diseño UX/UI', detalle: 'Flujos del pasajero y de la tablet, accesibilidad, QR en barra y en el móvil', cantidad: 80, unidad: 'h', precio: T.ux, periodo: 'unico', escala: 0, refs: ['F9'], supuesto: true }),
  p({ id: 'p-po', bloque: 'personas', concepto: 'Product owner y gestión del piloto', detalle: 'Fase 0 y Fase 1 (≈ 8–10 semanas): medición de línea base, acuerdos con Fred. Olsen, seguimiento', cantidad: 120, unidad: 'h', precio: T.po, periodo: 'unico', escala: 0.3, refs: ['F10'], supuesto: true }),
  p({ id: 'p-qa', bloque: 'personas', concepto: 'QA y pruebas a bordo', detalle: 'Pruebas funcionales, sin conexión, picos de pedidos y pagos con devolución', cantidad: 60, unidad: 'h', precio: T.qa, periodo: 'unico', escala: 0.3, refs: ['F11'], supuesto: true }),
  p({ id: 'p-formacion', bloque: 'personas', concepto: 'Formación de la tripulación', detalle: 'Preparación del material y sesiones cortas (≈ 30 min) por turno, más guía de una página', cantidad: 16, unidad: 'h', precio: T.po, periodo: 'unico', escala: 1, refs: ['F10'], supuesto: true, nota: 'Solo se paga la hora de quien forma. El tiempo de la tripulación en la sesión es de su jornada: no es coste nuevo ni amplía la plantilla.' }),
  /* ---------- personas: recurrente ---------- */
  p({ id: 'p-mant', bloque: 'personas', concepto: 'Mantenimiento y evolución', detalle: 'Correcciones, actualizaciones de dependencias y mejoras pequeñas', cantidad: 10, unidad: 'h/mes', precio: T.dev, periodo: 'mensual', escala: 0.1, refs: ['F8', 'F17'], supuesto: true, nota: '≈ 22 % anual del coste de desarrollo inicial, dentro del 15–25 % que cita la regla publicada [F17].' }),
  p({ id: 'p-soporte', bloque: 'personas', concepto: 'Soporte a cafeterías y manager', detalle: 'Atención de incidencias de la tablet, del panel y de la conciliación', cantidad: 8, unidad: 'h/mes', precio: T.dev, periodo: 'mensual', escala: 0.5, refs: ['F8'], supuesto: true }),
  p({ id: 'p-producto', bloque: 'personas', concepto: 'Producto y seguimiento de KPIs', detalle: 'Revisión mensual con Fred. Olsen, carta, franjas y mejoras', cantidad: 14, unidad: 'h/mes', precio: T.po, periodo: 'mensual', escala: 0.3, refs: ['F10'], supuesto: true }),

  /* ---------- herramientas: único (durante la implantación) ---------- */
  p({ id: 'h-claude', bloque: 'herramientas', concepto: 'Claude Team (IA de desarrollo)', detalle: '2 asientos estándar (mínimo del plan) durante la implantación, pago mensual', cantidad: 2, unidad: 'licencias', meses: 3, precio: 25, periodo: 'unico', escala: 0, refs: ['F1'], supuesto: true }),
  p({ id: 'h-copilot', bloque: 'herramientas', concepto: 'GitHub Copilot Pro', detalle: '2 licencias durante la implantación', cantidad: 2, unidad: 'licencias', meses: 3, precio: 10, periodo: 'unico', escala: 0, refs: ['F2'], supuesto: true }),
  p({ id: 'h-github', bloque: 'herramientas', concepto: 'GitHub Team (repositorio y CI)', detalle: '3 usuarios: desarrollo, diseño y producto', cantidad: 3, unidad: 'licencias', meses: 3, precio: 4, periodo: 'unico', escala: 0, refs: ['F3'], supuesto: true }),
  p({ id: 'h-figma', bloque: 'herramientas', concepto: 'Figma Professional', detalle: '1 editor para el diseño del piloto, pago mensual', cantidad: 1, unidad: 'licencia', meses: 3, precio: 15, periodo: 'unico', escala: 0, refs: ['F4'], supuesto: true }),
  /* ---------- herramientas: recurrente ---------- */
  p({ id: 'h-claude-r', bloque: 'herramientas', concepto: 'Claude Team (mantenimiento)', detalle: '2 asientos estándar con pago anual', cantidad: 2, unidad: 'licencias', precio: 20, periodo: 'mensual', escala: 0, refs: ['F1'], supuesto: true }),
  p({ id: 'h-copilot-r', bloque: 'herramientas', concepto: 'GitHub Copilot Pro (mantenimiento)', detalle: '1 licencia', cantidad: 1, unidad: 'licencia', precio: 10, periodo: 'mensual', escala: 0, refs: ['F2'], supuesto: true }),
  p({ id: 'h-github-r', bloque: 'herramientas', concepto: 'GitHub Team (mantenimiento)', detalle: '2 usuarios', cantidad: 2, unidad: 'licencias', precio: 4, periodo: 'mensual', escala: 0, refs: ['F3'], supuesto: true, nota: 'El precio de 4 $ vale los primeros 12 meses según la página; después, revisar.' }),
  p({ id: 'h-dominio', bloque: 'herramientas', concepto: 'Dominio de la web del servicio', detalle: 'Renovación anual de un .com', cantidad: 1, unidad: 'dominio', precio: 18.48, periodo: 'anual', escala: 0, refs: ['F5'], supuesto: false }),

  /* ---------- infraestructura: único ---------- */
  p({ id: 'i-tablet', bloque: 'infraestructura', concepto: 'Tablets resistentes de barra', detalle: 'Samsung Galaxy Tab Active5, una por cafetería', cantidad: 3, unidad: 'ud.', precio: 549.99, periodo: 'unico', escala: 1, refs: ['F13'], supuesto: false }),
  p({ id: 'i-tablet-r', bloque: 'infraestructura', concepto: 'Tablet de repuesto', detalle: 'Una en tierra, compartida por la flota', cantidad: 1, unidad: 'ud.', precio: 549.99, periodo: 'unico', escala: 0, refs: ['F13'], supuesto: false }),
  p({ id: 'i-soporte', bloque: 'infraestructura', concepto: 'Funda y soporte fijo de tablet', detalle: 'Uno por tablet en barra', cantidad: 3, unidad: 'ud.', precio: 60, periodo: 'unico', escala: 1, refs: [], supuesto: true }),
  p({ id: 'i-ap', bloque: 'infraestructura', concepto: 'Punto de acceso wifi: red local a bordo', detalle: 'Ubiquiti UniFi U6 Pro (referencia); uno por zona de cafetería', cantidad: 3, unidad: 'ud.', precio: 159, periodo: 'unico', escala: 1, refs: ['F6'], supuesto: true, nota: 'La cantidad depende de la cobertura real del barco: la confirma IT de Fred. Olsen.' }),
  p({ id: 'i-ap-r', bloque: 'infraestructura', concepto: 'Punto de acceso de repuesto', detalle: 'Uno en tierra, compartido por la flota', cantidad: 1, unidad: 'ud.', precio: 159, periodo: 'unico', escala: 0, refs: ['F6'], supuesto: false }),
  p({ id: 'i-poe', bloque: 'infraestructura', concepto: 'Adaptadores PoE', detalle: 'Alimentan los puntos de acceso por el cable de red', cantidad: 4, unidad: 'ud.', precio: 8, periodo: 'unico', escala: 0.75, refs: ['F6'], supuesto: false }),
  p({ id: 'i-minipc', bloque: 'infraestructura', concepto: 'Mini equipo / servidor de a bordo', detalle: 'Mini PC industrial sin ventilador: sirve la web sin internet y sincroniza con la nube', cantidad: 1, unidad: 'ud.', precio: 700, periodo: 'unico', escala: 1, refs: [], supuesto: true, nota: 'Punto medio de 600–900 € de la FAQ técnica; sin presupuesto de proveedor.' }),
  p({ id: 'i-minipc-r', bloque: 'infraestructura', concepto: 'Mini equipo de repuesto', detalle: 'Uno en tierra, compartido por la flota', cantidad: 1, unidad: 'ud.', precio: 700, periodo: 'unico', escala: 0, refs: [], supuesto: true }),
  p({ id: 'i-sai', bloque: 'infraestructura', concepto: 'SAI para el servidor', detalle: 'APC Back-UPS Pro 900 VA', cantidad: 1, unidad: 'ud.', precio: 298.99, periodo: 'unico', escala: 1, refs: ['F15'], supuesto: false }),
  p({ id: 'i-pantallas', bloque: 'infraestructura', concepto: 'Pantalla de aviso de pedidos «listos»', detalle: 'Samsung QM43B 43", una por cafetería (opcional: sin ella, solo aviso en el móvil)', cantidad: 3, unidad: 'ud.', precio: 633.9, periodo: 'unico', escala: 1, refs: ['F14'], supuesto: false }),
  p({ id: 'i-qr', bloque: 'infraestructura', concepto: 'Impresión de QR', detalle: 'QR de mesa y QR de barra con el stock (failsafe), en material resistente al agua', cantidad: 1, unidad: 'lote', precio: 150, periodo: 'unico', escala: 1, refs: [], supuesto: true }),
  p({ id: 'i-cable', bloque: 'infraestructura', concepto: 'Cableado, fijaciones y material de instalación', detalle: 'Cable de red, canaleta, bridas y anclajes a bordo', cantidad: 1, unidad: 'lote', precio: 250, periodo: 'unico', escala: 1, refs: [], supuesto: true }),
  p({ id: 'i-test', bloque: 'infraestructura', concepto: 'Entorno de pruebas en la nube (UE)', detalle: 'Un servidor durante la implantación', cantidad: 1, unidad: 'servidor', meses: 3, precio: 19.99, periodo: 'unico', escala: 0, refs: ['F7'], supuesto: false }),
  /* ---------- infraestructura: recurrente ---------- */
  p({ id: 'i-nube', bloque: 'infraestructura', concepto: 'Nube en la UE (aplicación y base de datos)', detalle: '2 servidores Hetzner CPX22 (referencia de precio): API y panel, y base de datos', cantidad: 2, unidad: 'servidores', precio: 19.99, periodo: 'mensual', escala: 0.25, refs: ['F7'], supuesto: true, nota: 'El número de servidores es un supuesto. Sin IVA.' }),
  p({ id: 'i-servicios', bloque: 'infraestructura', concepto: 'Correo transaccional, monitorización y copias externas', detalle: 'Servicios gestionados pequeños', cantidad: 1, unidad: 'paquete', precio: 40, periodo: 'mensual', escala: 0, refs: [], supuesto: true }),
  p({ id: 'i-ia', bloque: 'infraestructura', concepto: 'Chat con IA, con límite de uso', detalle: 'Opcional; se puede apagar', cantidad: 1, unidad: 'servicio', precio: 30, periodo: 'mensual', escala: 0.5, refs: [], supuesto: true, nota: 'Mismo supuesto que el simulador del benchmark (S11).' }),
  p({ id: 'i-agora', bloque: 'infraestructura', concepto: 'Licencia del módulo de integración de Ágora', detalle: 'Necesaria para el conector. Sin precio público: importe y periodicidad por confirmar', cantidad: 1, unidad: 'licencia', precio: 0, periodo: 'mensual', escala: 1, refs: [], supuesto: true, avalidar: 'a validar con Ágora', nota: '0 € no significa gratis: es un coste anticipable sin presupuesto. Al conocerlo, se escribe aquí y se recalcula todo.' }),
  p({ id: 'i-starlink', bloque: 'infraestructura', concepto: 'Conectividad Starlink (ya contratada por la naviera)', detalle: 'Coste incremental casi nulo: solo sincroniza pedidos con la nube. Se reserva un bloque de 50 GB al año', cantidad: 1, unidad: 'bloque 50 GB/año', precio: 100, periodo: 'anual', escala: 1, refs: ['F16'], supuesto: true, nota: 'Fred. Olsen ya paga Starlink; los pedidos de un año caben en un bloque (2 $/GB, tratado como 2 €). Si el plan actual los absorbe, es 0 €.' }),
  p({ id: 'i-pasarela', bloque: 'infraestructura', concepto: 'Pasarela de pago (comisión)', detalle: 'Stripe, tarjetas estándar del EEE: 1,5 % + 0,25 € por operación', cantidad: 1, unidad: 'comisión', precio: 0, periodo: 'variable', escala: 0, refs: ['F12'], supuesto: false, textoVariable: '1,5 % + 0,25 €', nota: 'Depende de las ventas: no suma al total fijo. El modelo de negocio la calcula aparte (parámetro «comisión»).' }),
]

/* ------------------------------------------------------------------ cálculo */

export type Edit = { cantidad: number; meses: number; precio: number; activa: boolean }
export type Edits = Record<string, Edit>

export const editsIniciales = (): Edits =>
  Object.fromEntries(PARTIDAS.map((x) => [x.id, { cantidad: x.cantidad, meses: x.meses ?? 1, precio: x.precio, activa: x.activa }]))

export const CONTINGENCIA_DEFECTO = 10

/** Importe de una partida para un barco, en su periodo (único: total; mensual: €/mes; anual: €/año). */
export function importe(x: Partida, e: Edit): number {
  if (!e.activa || x.periodo === 'variable') return 0
  return e.cantidad * (x.meses !== undefined && x.periodo === 'unico' ? e.meses : 1) * e.precio
}

/** Multiplicador al escalar a `barcos` buques. */
export const mult = (x: Partida, barcos: number) => 1 + x.escala * Math.max(0, barcos - 1)

export type TotalBloque = { unico: number; mensual: number; anual: number }
export type Totales = {
  barcos: number
  bloques: Record<BloqueId, TotalBloque>
  unicoBruto: number
  contingencia: number
  /** Coste único total, con contingencia */
  unico: number
  /** Recurrente en €/mes (los anuales prorrateados) */
  mensual: number
  /** Recurrente en €/año */
  anual: number
}

export function totales(edits: Edits, barcos = 1, contingenciaPct = CONTINGENCIA_DEFECTO): Totales {
  const bloques: Record<BloqueId, TotalBloque> = {
    personas: { unico: 0, mensual: 0, anual: 0 },
    herramientas: { unico: 0, mensual: 0, anual: 0 },
    infraestructura: { unico: 0, mensual: 0, anual: 0 },
  }
  for (const x of PARTIDAS) {
    const v = importe(x, edits[x.id]) * mult(x, barcos)
    const b = bloques[x.bloque]
    if (x.periodo === 'unico') b.unico += v
    else if (x.periodo === 'mensual') b.mensual += v
    else if (x.periodo === 'anual') b.mensual += v / 12
  }
  for (const id of Object.keys(bloques) as BloqueId[]) bloques[id].anual = bloques[id].mensual * 12
  const unicoBruto = bloques.personas.unico + bloques.herramientas.unico + bloques.infraestructura.unico
  const contingencia = unicoBruto * (contingenciaPct / 100)
  const mensual = bloques.personas.mensual + bloques.herramientas.mensual + bloques.infraestructura.mensual
  return { barcos, bloques, unicoBruto, contingencia, unico: unicoBruto + contingencia, mensual, anual: mensual * 12 }
}

/**
 * Fracción del coste de implantación y de plataforma del primer buque que cuesta cada buque adicional.
 * Sale de la columna «escala» de las partidas: sustituye a los 0,40 y 0,25 que antes eran supuestos sueltos.
 */
export function fraccionesPorBuque(edits: Edits): { implantacion: number; plataforma: number } {
  let u = 0, uEsc = 0, m = 0, mEsc = 0
  for (const x of PARTIDAS) {
    const v = importe(x, edits[x.id])
    if (x.periodo === 'unico') { u += v; uEsc += v * x.escala }
    else if (x.periodo === 'mensual') { m += v; mEsc += v * x.escala }
    else if (x.periodo === 'anual') { m += v / 12; mEsc += (v / 12) * x.escala }
  }
  return { implantacion: u ? uEsc / u : 0, plataforma: m ? mEsc / m : 0 }
}

export const EDITS_DEFECTO = editsIniciales()
/** Totales del piloto (1 buque) con los valores por defecto, redondeados al euro: alimentan el modelo de negocio. */
export const PILOTO_DEFECTO = (() => {
  const t = totales(EDITS_DEFECTO, 1)
  return { implantacion: Math.round(t.unico), plataforma: Math.round(t.mensual) }
})()
export const FRACCIONES_DEFECTO = fraccionesPorBuque(EDITS_DEFECTO)

/** Estimaciones globales con las que arrancó el modelo de negocio, antes del desglose. Solo para la tabla de conciliación. */
export const ANTES = { implantacion: 30000, plataforma: 1800 }
