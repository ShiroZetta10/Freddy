// Preguntas que el equipo Shiro propone hacer a Fred. Olsen, y opciones de stack según sus respuestas.
// Lo que sabemos de Ágora sale de fuentes públicas (web del producto y guías de integración); el resto se valida con la empresa.

export type PreguntaFO = {
  id: string
  q: string
  porQue: string
  sabemos: string[]
  segun: { si: string; entonces: string }[]
}

export const PREGUNTAS_FO: PreguntaFO[] = [
  {
    id: 'agora',
    q: '¿Para qué usan actualmente Ágora?',
    porQue:
      'Ágora es la pieza que decide cuánto hay que construir. Si ya lleva la carta, los precios, el stock y la caja, FredOnBoard se conecta a ella en vez de duplicarla.',
    sabemos: [
      'Ágora es un TPV de hostelería y retail: venta, caja, clientes y fidelización, control de stock, compras e inventario.',
      'Tiene funciones multi-local y multitienda, comandero digital, carta digital por QR, pedidos web y pantallas de cocina.',
      'Se puede instalar en local (servidor propio), en la nube o en web, con pago único o mensual.',
      'Ofrece integración por HTTP (JSON o XML) con un módulo de integración que hay que tener licenciado y activo. Da acceso a ventas, cierres Z, productos, pedidos y cobros.',
    ],
    segun: [
      { si: 'Solo lo usan como caja en cada cafetería', entonces: 'FredOnBoard lleva carta y stock, y vuelca a Ágora cada venta como ticket para cuadrar la caja (opción B o A).' },
      { si: 'También llevan en Ágora la carta, los precios y el stock', entonces: 'Ágora es la fuente de verdad: FredOnBoard lee de ahí carta y stock, y escribe los pedidos (opción A).' },
      { si: 'Ya usan su carta QR o los pedidos web de Ágora', entonces: 'Aprovechamos esa base y FredOnBoard aporta la experiencia: On Board Club, franjas, aviso «listo» y recogida con QR (opción C).' },
      { si: 'No tienen el módulo de integración de Ágora', entonces: 'Piloto sin tocar Ágora (opción B) y presupuesto del módulo para la fase de integración.' },
    ],
  },
  {
    id: 'inventario',
    q: '¿Cómo gestionan el inventario entre tierra y mar? ¿Y entre cafeterías?',
    porQue:
      'El reto pide «stock actualizado». Para que el móvil no venda lo que no hay, necesitamos saber dónde vive el dato del stock y cada cuánto se actualiza.',
    sabemos: [
      'Compra semanal de no perecederos y catering fresco diario (respuesta de Fred. Olsen).',
      'El stock se descuenta por escandallo: cada venta resta sus ingredientes.',
      'Los agotados se avisan hoy de palabra y la función de perecederos no está activada.',
      'Las cantidades se cargan según la previsión de pasajeros, la venta esperada, el top 10, la duración y el frío disponible.',
    ],
    segun: [
      { si: 'Hay un almacén por cafetería en Ágora', entonces: 'El móvil muestra el stock de la cafetería elegida y permite recoger en otra si una se agota.' },
      { si: 'Todo el barco comparte un único almacén', entonces: 'Un stock común con reparto por cafetería en FredOnBoard; los traspasos se registran como movimientos.' },
      { si: 'Tierra y barco se sincronizan solo al llegar a puerto', entonces: 'El servidor a bordo manda durante la travesía y se concilia con tierra al atracar (ya funciona así en el prototipo).' },
      { si: 'El catering entra como albarán en Ágora', entonces: 'FredOnBoard lee esa entrada y recalcula las porciones disponibles al zarpar.' },
    ],
  },
  {
    id: 'stack',
    q: '¿Qué stack usan? ¿Nuestro stack se podría integrar fácilmente con el suyo?',
    porQue:
      'Queremos que el piloto encaje en lo que ya tienen (sistema de reservas, Ágora, app, On Board Club y wifi) y no añadir una isla que luego haya que mantener aparte.',
    sabemos: [
      'Nuestro stack es estándar y abierto: web React con TypeScript (sin instalar), Node.js y PostgreSQL o SQLite, y servidor a bordo que funciona sin internet.',
      'Todo lo que intercambiamos con otros sistemas va por API HTTP/JSON o por fichero (CSV), así que cualquier equipo de IT puede mantenerlo.',
      'No sabemos aún su sistema de reservas, su proveedor de pagos ni cómo se sirve On Board Club a bordo.',
    ],
    segun: [
      { si: 'Tienen API del sistema de reservas', entonces: 'Validamos el localizador en tiempo real; si no, cargamos la lista de pasajeros antes de zarpar.' },
      { si: 'On Board Club se sirve desde un servidor a bordo', entonces: 'FredOnBoard se instala en ese mismo servidor como una sección más.' },
      { si: 'Tienen pasarela de pago contratada', entonces: 'La usamos tal cual (pago tokenizado); si no, una pasarela estándar con Apple Pay y Google Pay.' },
      { si: 'IT prefiere un proveedor externo', entonces: 'Entregamos el código y la documentación; el stack no depende de licencias propias.' },
    ],
  },
]

export type OpcionStack = {
  id: string
  nombre: string
  resumen: string
  como: string[]
  pros: string[]
  contras: string[]
  esfuerzo: 'Bajo' | 'Medio' | 'Alto'
  cuando: string
}

export const OPCIONES_STACK: OpcionStack[] = [
  {
    id: 'B',
    nombre: 'B · FredOnBoard autónomo + conciliación',
    resumen: 'FredOnBoard lleva su carta y su stock; al cerrar cada travesía se exporta la venta para cuadrarla con Ágora.',
    como: ['Carta y stock cargados en el panel del manager', 'Exportación CSV o cierre diario hacia Ágora', 'Sin tocar la instalación de Ágora'],
    pros: ['Piloto en semanas', 'Cero riesgo para la caja actual', 'No depende del módulo de integración'],
    contras: ['Doble registro de carta y stock', 'El stock no se cruza en tiempo real con la venta de barra'],
    esfuerzo: 'Bajo',
    cuando: 'Recomendada para el piloto en el Bajamar Express.',
  },
  {
    id: 'A',
    nombre: 'A · Integración directa con Ágora',
    resumen: 'Ágora es la fuente de verdad: FredOnBoard lee carta, precios y stock, y escribe cada pedido como venta.',
    como: ['Módulo de integración de Ágora (API HTTP/JSON)', 'Conector en el servidor del barco, con cola si Ágora no responde', 'Un solo stock para barra y móvil'],
    pros: ['Una sola caja y un solo stock', 'Sin doble trabajo para la tripulación', 'Escala a toda la flota'],
    contras: ['Licencia del módulo de integración', 'Depende de dónde esté instalado Ágora (barco o tierra)'],
    esfuerzo: 'Medio',
    cuando: 'Fase de integración, tras validar el piloto.',
  },
  {
    id: 'C',
    nombre: 'C · Sobre la carta QR y los pedidos web de Ágora',
    resumen: 'Usamos lo que Ágora ya trae y FredOnBoard aporta la experiencia: On Board Club, franjas, aviso «listo» y recogida con QR.',
    como: ['Carta y cobro desde Ágora', 'FredOnBoard como capa de experiencia y de avisos', 'Panel de barra de Ágora o el nuestro'],
    pros: ['Menos desarrollo', 'Producto ya soportado por el proveedor del TPV'],
    contras: ['Menos control de la experiencia', 'Franjas, pre-pedido y funcionamiento sin internet dependen de Ágora'],
    esfuerzo: 'Bajo',
    cuando: 'Si ya tienen esos módulos contratados y les funcionan a bordo.',
  },
  {
    id: 'D',
    nombre: 'D · A través de su plataforma corporativa',
    resumen: 'Si IT centraliza datos en un ERP o en una plataforma de integración propia, FredOnBoard se conecta ahí y no a cada sistema.',
    como: ['Conector con su ERP o su middleware', 'Ágora, reservas y fidelización llegan a través de ellos'],
    pros: ['Encaja con la arquitectura de IT', 'Un único punto de integración'],
    contras: ['Más dependencias y plazos de IT', 'Requiere conocer su stack (pregunta 3)'],
    esfuerzo: 'Alto',
    cuando: 'Escalado a la flota, si así lo pide IT.',
  },
]

export const FUENTES_AGORA = [
  { t: 'Ágora: ficha del producto (softwaredoit.es)', url: 'https://www.softwaredoit.es/agora/agora.html' },
  { t: 'Ágora POS API: guía de integración (chift.eu)', url: 'https://www.chift.eu/blog/agora-pos-api-integration-how-to-connect-set-up-and-follow-best-practices' },
  { t: 'Integración de Ágora con Recipok (token y URL del TPV)', url: 'https://recipok.com/wp-content/uploads/2024/05/Integracion-de-Agora-con-Recipok-Presentacion-1.pdf' },
]
