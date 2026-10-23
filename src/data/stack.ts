// Cómo se integra FredOnBoard con Ágora (TPV de Fred. Olsen) y fuentes públicas sobre Ágora.
// Decisión del equipo: Ágora forma parte del stack desde el piloto. Es la fuente de verdad de carta, precios, stock y caja.
// Lo que sabemos de Ágora sale de fuentes públicas (web del producto y guías de integración); el resto se valida con Fred. Olsen y con Ágora.
// No se describen endpoints concretos: la integración se explica por capacidades.

/** publico: lo dicen fuentes públicas · validar: a validar con Fred. Olsen / Ágora · propio: diseño nuestro, no depende de Ágora */
export type Confirmado = 'publico' | 'validar' | 'propio'

/** Una capacidad concreta de la integración y su estado de confirmación. */
export type Capacidad = { texto: string; estado: Confirmado }

export type Paso = { n: string; titulo: string; texto: string; estado: Confirmado }

/** Diseño principal: conector FredOnBoard ↔ Ágora en el servidor del barco. */
export const DISENO_PRINCIPAL = {
  titulo: 'Conector FredOnBoard ↔ Ágora en el servidor del barco',
  resumen:
    'Ágora sigue siendo la caja y la fuente de verdad de carta, precios, stock y cobros. FredOnBoard no la sustituye: un conector que corre en el servidor del barco habla con Ágora por su API HTTP/JSON, usando el módulo de integración, y cada pedido móvil acaba como una venta más en la caja.',
  pasos: [
    {
      n: '1',
      titulo: 'Leer carta, precios y stock',
      texto: 'El conector consulta a Ágora los productos, sus precios y el stock y los copia al servidor del barco, que los sirve por el wifi aunque no haya internet. Si cambia un precio en Ágora, cambia en la web del pasajero. El stock se lee si Ágora lo expone por cafetería (a validar).',
      estado: 'publico',
    },
    {
      n: '2',
      titulo: 'Escribir cada pedido como venta o ticket',
      texto: 'Cuando el pedido está cobrado, el conector lo registra en Ágora con sus líneas y su método de pago (por ejemplo «FredOnBoard · pasarela»). Así la venta móvil descuenta stock y entra en el cierre como cualquier otra.',
      estado: 'validar',
    },
    {
      n: '3',
      titulo: 'Cola de reintentos',
      texto: 'Si Ágora no responde (corte de red local, reinicio, actualización), el pedido queda en una cola en el servidor del barco y se reenvía con una clave única, sin duplicar la venta. La barra no se queda esperando.',
      estado: 'propio',
    },
    {
      n: '4',
      titulo: 'Conciliación diaria por cierre Z',
      texto: 'Al cerrar la caja, el conector lee el cierre Z de Ágora y lo cruza con los pedidos de FredOnBoard y con la liquidación de la pasarela. Las diferencias se marcan en el panel del manager.',
      estado: 'publico',
    },
  ] as Paso[],
}

export type EscenarioAgora = {
  id: string
  cuando: string
  nombre: string
  resumen: string
  como: string[]
  limites: string[]
  ruta?: string
  principal?: boolean
}

/** Alternativas técnicas según dónde esté Ágora y si el módulo de integración está activo. */
export const ESCENARIOS_AGORA: EscenarioAgora[] = [
  {
    id: 'bordo',
    cuando: 'Ágora está en un servidor propio a bordo (on premise)',
    nombre: 'Conector local en la red del barco',
    principal: true,
    resumen: 'El caso más sencillo y el que mejor encaja con el modo sin internet: el conector del servidor FredOnBoard habla con Ágora por la red local del barco.',
    como: ['Conector junto al servidor del barco, con la URL del TPV y un token de API', 'Lectura y escritura sin salir del barco: no depende de Starlink', 'Cola de reintentos local y cierre Z leído en el propio barco'],
    limites: ['Hay que acordar con IT quién instala y mantiene el equipo y el acceso a la red de caja', 'Una instancia de Ágora por buque o por cafetería: se confirma'],
  },
  {
    id: 'tierra',
    cuando: 'Ágora está en tierra o en la nube',
    nombre: 'Conector en el servicio central, con caché a bordo',
    resumen: 'La integración vive en el servicio central de la nube. El barco guarda una copia de carta, precios y stock para vender sin internet y sube los pedidos cuando hay enlace.',
    como: ['El servicio central lee de Ágora y envía la copia al barco', 'Los pedidos suben por la cola de salida (Starlink) y se escriben en Ágora desde tierra', 'Cierre Z y conciliación en el servicio central'],
    limites: ['La venta entra en Ágora con retraso si el enlace cae, y el stock a bordo es una copia', 'Hay que decidir qué manda en el stock durante la travesía (el barco, como hasta ahora)'],
  },
  {
    id: 'puente',
    cuando: 'Ágora no tiene todavía el módulo de integración activo (o no admite crear pedidos desde fuera)',
    nombre: 'Modo puente temporal con exportación',
    resumen: 'Mientras se activa el módulo, el piloto no se bloquea: FredOnBoard carga la carta desde un fichero de Ágora y devuelve las ventas en una exportación diaria que se cruza con el cierre Z.',
    como: ['Carta y precios cargados desde la exportación de Ágora', 'Exportación diaria de pedidos para registrarlos o cuadrarlos en la caja', 'Mismo conector: al activarse el módulo, se sustituye la exportación por la API sin cambiar la web ni la tablet'],
    limites: ['Doble registro de stock hasta activar el módulo', 'Es un puente con fecha: no es el diseño final'],
    ruta: 'Se activa solo si en la Fase 0 no se consigue el módulo a tiempo.',
  },
]

export type Evolucion = { nombre: string; resumen: string; cuando: string }

export const EVOLUCION_ERP: Evolucion = {
  nombre: 'Evolución para el escalado: plataforma corporativa (ERP)',
  resumen: 'Si IT de Fred. Olsen centraliza los datos en un ERP o en una plataforma de integración propia, FredOnBoard puede conectarse ahí y no a cada Ágora. Ágora seguiría siendo la caja; el ERP sería el punto único de carta, compras y contabilidad.',
  cuando: 'Fase 3, al escalar a la flota, y solo si IT lo pide.',
}

export type FlujoItem = { dato: string; detalle: string; estado: Confirmado }

/** De Ágora a FredOnBoard. */
export const FLUJO_DESDE_AGORA: FlujoItem[] = [
  { dato: 'Carta y productos', detalle: 'Familias y nombres de producto', estado: 'publico' },
  { dato: 'Precios', detalle: 'Precio de venta de cada producto', estado: 'publico' },
  { dato: 'Stock', detalle: 'Existencias para ocultar un producto antes de agotarse', estado: 'validar' },
  { dato: 'Ventas y cierres Z', detalle: 'Para conciliar y para medir el piloto y el control', estado: 'publico' },
]

/** De FredOnBoard a Ágora. */
export const FLUJO_HACIA_AGORA: FlujoItem[] = [
  { dato: 'Pedido como venta o ticket', detalle: 'Con sus líneas, el importe y la cafetería', estado: 'validar' },
  { dato: 'Método de pago', detalle: 'Un medio propio («FredOnBoard · pasarela») para no mezclarlo con la caja', estado: 'validar' },
  { dato: 'Estado y devoluciones', detalle: 'Pedido recogido, línea devuelta o producto agotado', estado: 'validar' },
  { dato: 'Descuento de stock', detalle: 'Cada venta móvil descuenta como una de barra', estado: 'validar' },
]

export type Requisito = { texto: string; tipo: 'Requisito' | 'Supuesto'; detalle: string }

export const REQUISITOS_AGORA: Requisito[] = [
  { tipo: 'Requisito', texto: 'Módulo de integración de Ágora licenciado y activo', detalle: 'Según las fuentes públicas, sin él la API no está disponible. Coste de la licencia: a validar con Ágora.' },
  { tipo: 'Requisito', texto: 'Acceso por API: token y URL del TPV, y un entorno de pruebas', detalle: 'Es lo que piden integraciones de terceros como Recipok. Hace falta antes de escribir código.' },
  { tipo: 'Supuesto', texto: 'Dónde corre Ágora: a bordo, en tierra o en la nube', detalle: 'Decide qué alternativa técnica se usa. A validar con Fred. Olsen.' },
  { tipo: 'Supuesto', texto: 'Ágora admite crear ventas o tickets desde fuera', detalle: 'Las fuentes públicas hablan de leer ventas, productos y cobros y de sincronizar entradas de stock. Crear ventas desde un tercero no está confirmado. A validar con Ágora.' },
  { tipo: 'Supuesto', texto: 'Ágora gestiona el stock por cafetería', detalle: 'Si solo hay stock por almacén, FredOnBoard lo reparte por cafetería. A validar con Fred. Olsen.' },
  { tipo: 'Supuesto', texto: 'Límites de uso de la API', detalle: 'No hay límites de tasa ni paginación documentados. Se prueban en el entorno de pruebas.' },
  { tipo: 'Requisito', texto: 'Quién mantiene el conector y su acceso a la red de caja', detalle: 'IT de Fred. Olsen o un proveedor. Decisión pendiente.' },
]

export const FUENTES_AGORA = [
  { t: 'Ágora: ficha del producto (softwaredoit.es)', url: 'https://www.softwaredoit.es/agora/agora.html' },
  { t: 'Ágora POS API: guía de integración (chift.eu)', url: 'https://www.chift.eu/blog/agora-pos-api-integration-how-to-connect-set-up-and-follow-best-practices' },
  { t: 'Integración de Ágora con Recipok (token y URL del TPV)', url: 'https://recipok.com/wp-content/uploads/2024/05/Integracion-de-Agora-con-Recipok-Presentacion-1.pdf' },
]

// ---------------------------------------------------------------------------------------------
// Red local a bordo (wifi y portal cautivo como en los aviones) y modo degradado sin Starlink.
// Es un diseño nuestro: el rendimiento real (cobertura, usuarios simultáneos) se mide en la Fase 0.
// ---------------------------------------------------------------------------------------------

export type NivelRed = {
  id: string
  etiqueta: string
  nombre: string
  resumen: string
  incluye: string[]
  limites: string[]
}

export const NIVELES_RED: NivelRed[] = [
  {
    id: 'n0',
    etiqueta: 'Nivel 0 · paso previo',
    nombre: 'Red local a bordo',
    resumen:
      'La forma más sencilla de empezar el piloto, sin servidor completo todavía. Un punto de acceso wifi del barco con portal cautivo y un equipo pequeño que sirve la web de FredOnBoard (PWA) y reparte los pedidos entre los móviles y la tablet de barra, sin internet.',
    incluye: [
      'Punto de acceso wifi del barco con portal cautivo: al conectarse, el móvil abre FredOnBoard solo',
      'Mini equipo de a bordo que sirve la PWA y guarda los pedidos del viaje en una base de datos local',
      'Los pedidos llegan a la tablet de barra por la red local; la barra cobra con Ágora como hoy',
      'Carta y precios cargados en el equipo antes de zarpar (copia de Ágora o exportación)',
    ],
    limites: ['Sin conector Ágora en vivo: el stock se ajusta a mano en la tablet', 'Sin cola de reintentos ni conciliación automática'],
  },
  {
    id: 'n1',
    etiqueta: 'Nivel 1 · objetivo del piloto',
    nombre: 'Servidor de a bordo',
    resumen:
      'El servidor de a bordo actual toma el relevo del equipo pequeño, sobre la misma red local: conector Ágora, base de datos y colas. Es el nivel que describe el resto de esta página.',
    incluye: [
      'Conector Ágora: lee carta, precios y stock y escribe cada pedido como venta',
      'Base de datos (SQLite o PostgreSQL), WebSockets hacia las tablets y colas de salida',
      'Cola hacia la nube por Starlink, sin pedidos duplicados',
    ],
    limites: ['Requiere el módulo de integración de Ágora y su acceso desde la red del barco (a validar)'],
  },
]

export const MODO_DEGRADADO = {
  titulo: 'Ruta alternativa: modo degradado cuando Starlink cae',
  resumen:
    'Starlink solo une el barco con tierra. Lo que pasa dentro del barco no depende de él: la red local sigue sirviendo la web, los pedidos y la barra.',
  sigue: ['Web de FredOnBoard por el portal cautivo', 'Carta, precios y stock del servidor de a bordo', 'Pedidos del móvil a la tablet de barra', 'Cobro en el mostrador con Ágora', 'Avisos de «pedido listo» dentro de la web'],
  seEncola: ['Cobro online con la pasarela (si no hay enlace, se paga en el mostrador)', 'Copia de pedidos y analítica a la nube', 'Cambios de carta y reglas hechos en tierra'],
}

export const REFERENCIAS_RED = [
  {
    t: 'Gogo Vision: el contenido está en un servidor del avión y llega a los dispositivos por la red de cabina, sin conexión a internet (Aviation Today)',
    url: 'https://www.aviationtoday.com/2016/02/04/gogo-vision-achieves-2000-aircraft-milestone/',
  },
  {
    t: 'Vueling: portal de entretenimiento, menú y tienda a bordo por conexión directa al servidor del avión, sin wifi ni datos (Russian Tourism News)',
    url: 'https://www.rustourismnews.com/2026/04/14/vueling-launches-free-onboard-entertainment-across-its-fleet/',
  },
  {
    t: 'Inflight Dublin: portal IFE inalámbrico con servidor y puntos de acceso a bordo, accesible desde cualquier navegador estándar (Runway Girl Network)',
    url: 'https://runwaygirlnetwork.com/2015/05/irish-ife-player-jumps-into-wireless-space-with-new-retail-portal/',
  },
]

/** Requisitos y supuestos nuevos: red local a bordo y failsafes QR. Todos a validar. */
export const REQUISITOS_RED: Requisito[] = [
  { tipo: 'Supuesto', texto: 'Cobertura wifi en todo el salón y las tres cafeterías', detalle: 'Hay que medir la cobertura en el Bajamar Express, con el barco lleno y en cubierta si se quiere pedir desde fuera. Puede hacer falta más de un punto de acceso.' },
  { tipo: 'Supuesto', texto: 'Capacidad de usuarios simultáneos del punto de acceso', detalle: 'No sabemos cuántos pasajeros se conectarán a la vez en un trayecto de 80 minutos. Se prueba con carga real antes de elegir el equipo.' },
  { tipo: 'Supuesto', texto: 'Seguridad del portal en una red abierta', detalle: 'Un portal cautivo en una wifi sin clave no cifra el tráfico. Hay que decidir clave o red abierta con HTTPS local, aislamiento de clientes y no guardar datos de tarjeta.' },
  { tipo: 'Supuesto', texto: 'Caducidad del QR de stock', detalle: 'Un QR de stock viejo puede mostrar disponible lo ya agotado. Se propone una validez corta (por ejemplo 30 minutos) y refresco en cada cambio; el valor se ajusta con el piloto.' },
  { tipo: 'Requisito', texto: 'Alimentación y montaje del equipo de a bordo', detalle: 'Punto de acceso y mini equipo con SAI, fijados y en un lugar ventilado. Quién los instala: decisión pendiente con Fred. Olsen.' },
]
