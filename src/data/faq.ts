// Preguntas que nos puede hacer el jurado o el equipo de Fred. Olsen, con nuestra respuesta.
// Las preguntas salen de un ensayo con el "agente Fred. Olsen" (docs/persona-fred-olsen.md).
// Regla: responder con honestidad; lo que es supuesto se dice como supuesto.

export type Categoria =
  | 'Stack técnico'
  | 'Conectividad y offline'
  | 'Pagos y seguridad'
  | 'Integraciones'
  | 'Operativa a bordo'
  | 'Inventario'
  | 'Negocio y costes'
  | 'Piloto'
  | 'Legal y datos'

export type Pregunta = {
  id: string
  cat: Categoria
  q: string
  a: string[] // párrafos
  corto: string // respuesta en una frase (para decir en voz alta)
  supuesto?: boolean // la respuesta depende de datos a validar con Fred. Olsen
}

export const CATEGORIAS: Categoria[] = [
  'Stack técnico',
  'Conectividad y offline',
  'Pagos y seguridad',
  'Integraciones',
  'Operativa a bordo',
  'Inventario',
  'Negocio y costes',
  'Piloto',
  'Legal y datos',
]

export const FAQ: Pregunta[] = [
  // ---------------------------------------------------------------- STACK
  {
    id: 'pwa',
    cat: 'Stack técnico',
    q: '¿Por qué una web (PWA) y no una app nativa? En iOS el push web solo funciona si se añade a la pantalla de inicio.',
    corto: 'Porque en 80 minutos nadie se descarga una app: el QR de la mesa abre la web al instante, y el aviso «listo» no depende del push.',
    a: [
      'El pasajero ocasional no va a instalar nada para un trayecto de 80 minutos, y la app actual tiene una valoración de 2,0/5. Una web que se abre con el QR de la mesa o desde el portal wifi llega a todos desde el primer día.',
      'Es cierto que en iOS las notificaciones web solo funcionan si la web se añade a la pantalla de inicio. Por eso el aviso «tu pedido está listo» no depende del push: la página de seguimiento se actualiza sola mientras está abierta, la barra tiene una pantalla con los números listos (como en McDonald’s o Burger King) y, si el pasajero lo acepta, se envía un WhatsApp con el canal que Fred. Olsen ya usa.',
      'Si en el futuro se quiere app, el mismo código se reutiliza dentro de la app actual (WebView) o con Capacitor, sin rehacerlo.',
    ],
  },
  {
    id: 'stack',
    cat: 'Stack técnico',
    q: '¿Qué stack proponéis exactamente para producción?',
    corto: 'TypeScript de punta a punta: web React, un servidor ligero en cada buque y un servicio en la nube con PostgreSQL.',
    a: [
      'Web del pasajero, tablet de barra y panel del manager: React + TypeScript (PWA con service worker para que cargue sin internet). Es lo mismo que el prototipo, así que el trabajo de interfaz ya está hecho.',
      'A bordo: un servidor ligero por buque (Node.js + TypeScript en Docker, base de datos SQLite o PostgreSQL) que sirve la web por el wifi del barco, guarda pedidos y stock y empuja los cambios en tiempo real a las tablets (WebSockets).',
      'En tierra: un servicio en la nube (Node.js + PostgreSQL, alojado en la UE) para la carta, los precios, la analítica, el panel del manager y la conexión con pasarela de pago, reservas y TPV.',
      'Elegimos tecnologías estándar, muy extendidas y con mucho talento disponible en Canarias, para que el equipo de IT de Fred. Olsen o cualquier proveedor puedan mantenerlo.',
    ],
  },
  {
    id: 'edge',
    cat: 'Stack técnico',
    q: '¿Qué es exactamente el «servidor local a bordo»? ¿Quién lo repara si falla en medio del mar?',
    corto: 'Un mini PC industrial por buque, sin piezas móviles, que se reinicia solo; si falla, la barra sigue vendiendo como hoy.',
    a: [
      'Un mini PC industrial sin ventilador (tipo NUC o similar) conectado a la red del barco, con un SAI pequeño. Ejecuta el servidor en Docker y se actualiza en remoto cuando el barco está en puerto.',
      'Se diseña para fallar de forma segura: el servicio se reinicia solo, los datos se guardan en disco en cada pedido y, si el equipo cae del todo, los pasajeros ven «el pedido por móvil no está disponible ahora» y la barra sigue vendiendo como hoy con el TPV. Nunca bloquea la venta tradicional.',
      'Para el piloto basta con un equipo en el Bajamar Express y uno de repuesto en tierra. Quién lo instala y mantiene (IT de Fred. Olsen o un proveedor) es una decisión a tomar con la empresa.',
    ],
    supuesto: true,
  },
  {
    id: 'sync',
    cat: 'Stack técnico',
    q: 'Con un servidor por barco y otro en la nube, ¿cómo resolvéis los conflictos de sincronización?',
    corto: 'Evitando que haya conflictos: cada dato tiene un único dueño. El barco manda en pedidos y stock durante la travesía; la nube, en carta y precios.',
    a: [
      'No usamos sincronización «todos escriben en todo». Cada tipo de dato tiene un único dueño. Durante la travesía, los pedidos y el stock solo se escriben en el servidor del barco; la nube recibe una copia. La carta, los precios y las reglas solo se escriben en la nube y bajan al barco.',
      'Los pedidos suben a la nube con una cola de salida (patrón outbox): si no hay conexión, esperan y se reenvían. Cada pedido lleva una clave única generada en el móvil, así que un reenvío nunca crea un pedido duplicado ni un segundo cobro.',
      'Un cambio de precio hecho en mitad de una travesía se aplica a los pedidos nuevos; los ya pagados conservan su precio.',
    ],
  },
  {
    id: 'stock',
    cat: 'Stack técnico',
    q: 'Si se vende lo mismo en barra y en móvil a la vez, ¿quién gana? ¿Cómo evitáis vender agotados?',
    corto: 'Un umbral de seguridad: el producto desaparece del móvil antes de llegar a cero, y la barra lo puede marcar agotado en un toque.',
    a: [
      'El stock es por cafetería y vive en el servidor del barco. En la fase 0 (sin integración con el TPV), la barra carga el stock al empezar y lo ajusta con un toque; el móvil oculta un producto cuando quedan pocas unidades (umbral configurable), no cuando llega a cero, para dejar margen a la venta presencial.',
      'En la fase 1, con integración con el TPV, cada venta en barra también descuenta stock y el margen se puede reducir.',
      'Si aun así un producto se agota después de pagar, el pasajero elige entre cambiarlo o que se le devuelva solo esa línea, en lugar de cancelar todo el pedido (el fallo que vimos en OUIGO).',
    ],
  },
  {
    id: 'prototipo-real',
    cat: 'Stack técnico',
    q: 'Vuestro prototipo guarda todo en el navegador. ¿Qué parte existe de verdad y qué parte es maqueta?',
    corto: 'Las tres interfaces y la lógica de negocio son reales; el servidor está simulado dentro del navegador para poder enseñarlo sin infraestructura.',
    a: [
      'Real: las tres interfaces completas (pasajero, barra y manager), las reglas de negocio (franjas con tope, umbral de stock, pausa, cierre antes de llegar, idempotencia de pedidos, cancelación) y la sincronización en tiempo real entre pantallas.',
      'Simulado: el servidor (la lógica vive en el navegador y se comparte entre pestañas con localStorage y BroadcastChannel), el pago (no se cobra nada), la validación del billete (tres billetes de prueba), la conexión del barco (un interruptor) y el chat (respuestas por palabras clave, sin IA real).',
      'La lógica está separada en un único módulo (store), así que pasar a un servidor real consiste en sustituir ese módulo por llamadas a una API, sin rehacer las pantallas.',
    ],
  },
  {
    id: 'mantenimiento',
    cat: 'Stack técnico',
    q: '¿Quién mantiene esto cuando acabe el hackathon?',
    corto: 'Proponemos que lo desarrolle y mantenga el IT de Fred. Olsen o un proveedor elegido por la empresa; nosotros entregamos el código, la documentación y el traspaso.',
    a: [
      'El código está en un repositorio, documentado y con tecnologías estándar. Proponemos un traspaso formal al equipo que elija Fred. Olsen (IT interno o proveedor) y acompañamiento durante el piloto.',
      'Lo que no queremos es que dependa de nosotros: por eso elegimos un stack común y evitamos piezas propietarias.',
    ],
  },
  {
    id: 'ia',
    cat: 'Stack técnico',
    q: 'El chat con IA: ¿cuánto cuesta, qué pasa si se inventa algo y en qué idiomas funciona?',
    corto: 'Es opcional, solo responde con información aprobada por Fred. Olsen y nunca contesta sobre alérgenos: para eso enseña la ficha oficial.',
    a: [
      'La interfaz principal es guiada y funciona sin IA. El chat es una ayuda opcional para dudas (dónde está la cafetería, cuándo llegamos, cómo cancelar), en español, inglés y alemán.',
      'Para evitar que se invente cosas, solo responde a partir de contenidos aprobados por Fred. Olsen (carta, horarios, políticas) y de los datos del viaje. Si no lo sabe, lo dice y ofrece contactar con la tripulación. Sobre alérgenos no responde nunca con texto libre: enseña la ficha oficial del producto.',
      'El coste por conversación con un modelo comercial es de céntimos; se puede limitar por pasajero. Si no hay conexión, el chat pasa a respuestas predefinidas. El proveedor de IA se encapsula para poder cambiarlo.',
    ],
    supuesto: true,
  },
  {
    id: 'app-actual',
    cat: 'Stack técnico',
    q: 'Decís «también dentro de la app». ¿Cómo, si la app actual tiene una valoración de 2,0/5?',
    corto: 'Con un enlace o una vista web dentro de la app: es la misma web, así que no añadimos complejidad a una app que ya da problemas.',
    a: [
      'FredOnBoard no depende de la app. Dentro de la app bastaría con un acceso que abra la misma web (enlace o WebView), identificada con la reserva del usuario. Es un cambio pequeño y no toca la lógica de la app.',
      'Si Fred. Olsen renueva su app en el futuro, FredOnBoard se integra como una sección más.',
    ],
  },

  // ---------------------------------------------------------------- CONECTIVIDAD
  {
    id: 'starlink',
    cat: 'Conectividad y offline',
    q: 'Starlink falla en puerto o con mala mar. ¿Habéis medido la conectividad real del Bajamar Express?',
    corto: 'No, es un supuesto. Por eso el diseño no depende de internet: la web y los pedidos funcionan por el wifi del barco aunque Starlink caiga.',
    a: [
      'No la hemos medido; es uno de los supuestos que hay que validar con el equipo técnico. Precisamente por eso la arquitectura no depende de internet: la web se sirve desde el servidor del barco por el wifi interno, así que pedir, preparar, avisar y recoger funciona aunque Starlink esté caído.',
      'Lo único que necesita internet es cobrar con tarjeta y subir los datos a la nube. Ver la pregunta sobre pagos sin conexión.',
      'En la semana 0 del piloto proponemos medir la conectividad a lo largo de la ruta.',
    ],
    supuesto: true,
  },
  {
    id: 'ancho-banda',
    cat: 'Conectividad y offline',
    q: 'Si el wifi se satura con 1.100 pasajeros viendo vídeos, ¿el pedido compite con TikTok?',
    corto: 'No compite por Starlink: el tráfico del pedido va del móvil al servidor del barco por la red local, y pesa unos pocos KB.',
    a: [
      'La web se carga una vez (unos cientos de KB) y queda guardada en el móvil; cada pedido son unos pocos KB. Ese tráfico va del móvil al servidor del barco por la red local y no pasa por el enlace por satélite, que es el que se satura.',
      'Además, se puede dar prioridad en la red del barco al tráfico hacia el servidor de FredOnBoard (QoS). Es una configuración a revisar con IT.',
    ],
    supuesto: true,
  },
  {
    id: 'acceso-offline',
    cat: 'Conectividad y offline',
    q: 'Sin internet, ¿cómo llega el pasajero a la web si no la tenía abierta?',
    corto: 'Por el wifi del barco: el portal de bienvenida y el QR de las mesas apuntan al servidor de a bordo, que no necesita internet.',
    a: [
      'El QR de las mesas y la página de bienvenida del wifi apuntan a una dirección del propio barco. Al conectarse al wifi, el pasajero llega a FredOnBoard aunque no haya salida a internet.',
      'Quien hizo un pre-pedido ya tiene la web guardada en el móvil (service worker) y puede ver su pedido y su QR incluso sin datos.',
    ],
  },
  {
    id: 'offline-garantia',
    cat: 'Conectividad y offline',
    q: 'Un pedido hecho sin conexión, ¿tiene garantizado el producto? ¿Y si el servidor se reinicia antes de sincronizar?',
    corto: 'Si el móvil llega al servidor del barco, el pedido se reserva al momento y se guarda en disco; lo que espera a internet es solo el cobro y la copia en la nube.',
    a: [
      'Hay dos tipos de «sin conexión». Sin internet pero con wifi del barco: el pedido llega al servidor, se reserva el stock y se guarda en disco al instante; un reinicio no lo pierde.',
      'Sin wifi del barco (el móvil está desconectado): el pedido se queda en el móvil y se envía solo al volver la conexión, con la misma clave para que nunca se duplique. Hasta entonces el pasajero ve «pendiente de enviar» y no se le promete el producto.',
    ],
  },

  // ---------------------------------------------------------------- PAGOS
  {
    id: 'pago-offline',
    cat: 'Pagos y seguridad',
    q: 'Si no hay conexión, ¿quién autoriza la tarjeta? ¿Y si la preautorización caduca o el banco la rechaza al cobrar?',
    corto: 'Nadie: sin internet no se puede autorizar una tarjeta. El pedido queda «pendiente de pago» y no se prepara hasta cobrarlo, o se paga al recoger.',
    a: [
      'Somos claros: una tarjeta no se puede autorizar sin internet. Si Starlink cae justo al pagar, el pedido queda «pendiente de pago» y la barra no lo prepara hasta que se confirma el cobro. Si la caída se alarga, el pasajero puede pagar al recoger con el TPV de la barra.',
      'Con conexión, el cobro se hace al pedir (prepago), como en Starbucks o en los estadios. La preautorización con cobro al entregar es opcional y se usaría solo si el banco de Fred. Olsen lo recomienda; en un trayecto de 80 minutos no hay riesgo de caducidad.',
      'Si un cobro falla, el pedido no pasa a cocina y el pasajero puede reintentar con otro medio de pago.',
    ],
  },
  {
    id: 'pci',
    cat: 'Pagos y seguridad',
    q: '¿Quién cumple PCI DSS? No queremos datos de tarjeta en vuestro servidor.',
    corto: 'La pasarela de pago: los datos de la tarjeta se introducen en su página o en Apple Pay/Google Pay y nunca pasan por nuestros servidores.',
    a: [
      'Usamos una pasarela alojada o tokenizada (la del banco con el que ya trabaja Fred. Olsen, o similar). El pasajero introduce la tarjeta en el formulario de la pasarela o paga con Apple Pay o Google Pay; nuestros servidores solo reciben un identificador del pago y su resultado.',
      'Así el alcance de PCI DSS para Fred. Olsen es el mínimo, y en el servidor del barco no hay ningún dato de tarjeta.',
    ],
  },
  {
    id: 'qr',
    cat: 'Pagos y seguridad',
    q: 'El QR de recogida se puede copiar o compartir. ¿Cómo evitáis que alguien recoja el pedido de otro?',
    corto: 'El QR está firmado, es de un solo uso y la tablet enseña el nombre y el localizador: el camarero puede comprobarlo de un vistazo.',
    a: [
      'El QR lleva el número de pedido y una clave secreta firmada por el servidor, así que no se puede inventar. Es de un solo uso: en cuanto se entrega, deja de valer.',
      'Al escanearlo, la tablet muestra el nombre y el localizador del pasajero. Para un ticket medio de 5,90 € es un control proporcionado; en Clase Oro se podría pedir además el billete.',
    ],
  },
  {
    id: 'wifi-seguridad',
    cat: 'Pagos y seguridad',
    q: 'En un wifi abierto a bordo: ¿suplantación del portal, robo de sesión, abuso del chat?',
    corto: 'HTTPS en todo, sesiones ligadas al billete y de corta duración, límites de uso en el chat y pagos siempre en la pasarela.',
    a: [
      'Todo el tráfico va cifrado (HTTPS también en el servidor del barco, con su certificado). La sesión del pasajero se basa en su localizador y caduca al terminar el viaje; no hay contraseñas que robar.',
      'El chat tiene límite de mensajes por pasajero y solo puede consultar información pública del viaje y del pasajero que pregunta.',
      'El riesgo de un portal falso en un wifi abierto existe en cualquier wifi público. Se mitiga con el QR físico de las mesas y comprobando siempre la dirección en la pasarela de pago, que es donde se introducen datos sensibles.',
    ],
  },

  // ---------------------------------------------------------------- INTEGRACIONES
  {
    id: 'tpv',
    cat: 'Integraciones',
    q: 'No sabéis qué TPV usamos. ¿Cuánto se complica la fase 1 si el proveedor no tiene API?',
    corto: 'El piloto no depende del TPV: la fase 0 funciona con la tablet y una exportación diaria. La integración se diseña cuando sepamos el modelo.',
    a: [
      'La fase 0 (el piloto) funciona sin integración: los pedidos se gestionan en la tablet de barra y las ventas se concilian con una exportación diaria.',
      'Para la fase 1 hay tres caminos según el TPV: API del proveedor (lo ideal), importación de ficheros programada, o registrar las ventas de FredOnBoard en el TPV como una forma de pago más. La elección depende del modelo, que es una de las primeras cosas que necesitamos saber.',
    ],
    supuesto: true,
  },
  {
    id: 'reservas',
    cat: 'Integraciones',
    q: 'La identificación por localizador: ¿contra qué sistema se valida? ¿Y si varias personas comparten localizador?',
    corto: 'Contra el listado de pasajeros de cada salida, en solo lectura; cada pedido lleva el nombre de quien pide, aunque compartan reserva.',
    a: [
      'Basta con acceso de solo lectura al listado de pasajeros de cada salida (localizador y nombres; en el barco no hay asiento asignado), por API o con una exportación antes de zarpar que se carga en el servidor del barco. No necesitamos escribir en el sistema de reservas.',
      'Si en una reserva viajan varias personas, tras el localizador se elige quién pide. Cada pedido lleva su nombre y se puede pedir para otro, por ejemplo para una persona mayor que no use el móvil.',
    ],
    supuesto: true,
  },
  {
    id: 'plus',
    cat: 'Integraciones',
    q: 'Plus Points y Tarjeta Plus: ¿cómo evitáis fraude y errores de saldo?',
    corto: 'No está en el MVP. Cuando se haga, será solo a través de la API oficial del programa, nunca con saldos propios.',
    a: [
      'Los puntos quedan fuera del MVP del piloto, precisamente para no tocar sistemas críticos sin integración fiable. En la hoja de ruta, FredOnBoard solo informaría al sistema oficial de Tarjeta Plus de cada compra, y sería ese sistema el que suma o canjea puntos.',
    ],
  },

  // ---------------------------------------------------------------- OPERATIVA
  {
    id: 'tablet',
    cat: 'Operativa a bordo',
    q: 'Tablet en barra, barco moviéndose, manos mojadas, hora punta: ¿la habéis probado con tripulación real?',
    corto: 'Todavía no: es lo primero que haríamos en la semana 0 del piloto. Está diseñada con botones grandes y una sola acción por pedido.',
    a: [
      'No la hemos probado a bordo y lo decimos así. Está pensada para ese entorno: botones grandes, una sola acción por pedido, alto contraste y sonido opcional. Para el piloto proponemos una tablet resistente con funda, soporte fijo y carga en la propia barra.',
      'La semana 0 del piloto es para probarla con la tripulación en travesías reales y ajustar el diseño antes de medir.',
    ],
  },
  {
    id: 'carga',
    cat: 'Operativa a bordo',
    q: 'Decís «sin aumentar la carga». ¿Quién prepara el pedido móvil y cuánto tiempo extra cuesta?',
    corto: 'Lo prepara la misma tripulación, pero se ahorra tomar nota y cobrar, que es la parte lenta. Lo mediremos en el piloto.',
    a: [
      'Los mismos camareros preparan el pedido. La diferencia es que llega ya pagado y ordenado por franja, así que se ahorra tomar nota, cobrar y dar cambio.',
      'La capacidad la controla la propia barra: un tope de pedidos por franja y un botón de pausa. Si se satura, no entran más pedidos móviles. El tiempo por pedido y la carga del equipo son KPIs del piloto, no una promesa.',
    ],
  },
  {
    id: 'conciliacion',
    cat: 'Operativa a bordo',
    q: '¿Cómo se cuadra la caja diaria entre las ventas web y el TPV sin horas extra?',
    corto: 'Las ventas FredOnBoard ya están cobradas por la pasarela; al cerrar la travesía se genera el resumen y se cruza solo con el TPV.',
    a: [
      'Los pedidos de FredOnBoard se cobran por la pasarela, no en la caja, así que no hay efectivo que cuadrar. Al cerrar la travesía, la tablet genera el resumen (pedidos, importes, no recogidos).',
      'En la fase 0, ese resumen se exporta y se cruza con la pasarela automáticamente. En la fase 1 entra directamente en el TPV como un medio de pago más.',
    ],
  },

  // ---------------------------------------------------------------- NEGOCIO
  {
    id: 'coste-infra',
    cat: 'Negocio y costes',
    q: '¿Cuánto cuesta la infraestructura por barco y por mes? Quiero una cifra y sus supuestos.',
    corto: 'Del orden de 1.000–1.500 € de equipo por barco y unos cientos de euros al mes para toda la flota, sin contar el desarrollo. Son estimaciones a validar.',
    a: [
      'Estimación de partida, a validar con IT y proveedores:',
      'Por buque, una vez: mini PC industrial con SAI (≈ 600–900 €) y una tablet resistente por cafetería con funda y soporte (≈ 300–500 € cada una).',
      'Mensual para la flota: nube en la UE (≈ 100–300 €), IA del chat con límite de uso (≈ decenas de euros) y comisiones de la pasarela, que dependen del contrato con el banco.',
      'El mayor coste es el desarrollo y el mantenimiento, que depende de quién lo haga (IT interno o proveedor). En el modelo de negocio del plan de implementación usamos 30.000 € de implantación y 1.800 €/mes de plataforma, que ya incluye mantenimiento, soporte y producto, no solo la nube.',
    ],
    supuesto: true,
  },
  {
    id: 'comision',
    cat: 'Negocio y costes',
    q: '¿Qué comisión se come la pasarela sobre un ticket de 5,90 €? ¿Queda margen?',
    corto: 'Usando el banco con el que Fred. Olsen ya cobra en barra, la comisión es parecida a la de un pago con tarjeta hoy; una pasarela genérica sería más cara.',
    a: [
      'Con una pasarela genérica con cuota fija por operación, en tickets pequeños la comisión pesa mucho. Por eso proponemos usar el adquirente con el que Fred. Olsen ya trabaja en sus TPV, con una comisión similar a la de un pago con tarjeta en barra.',
      'Además, juntar productos en un solo pedido (combos, pre-pedido) sube el ticket medio y diluye la parte fija. Es una cifra a validar con finanzas antes del piloto.',
    ],
    supuesto: true,
  },
  {
    id: 'uplift',
    cat: 'Negocio y costes',
    q: 'Citáis +42 % de ticket medio de otros casos, con datos del proveedor. ¿Qué esperáis vosotros?',
    corto: 'No prometemos el 42 %. Nuestro modelo va de +9 % de facturación (prudente) a +16 % (base), y es justo lo que el piloto tiene que medir.',
    a: [
      'Esa cifra es de un proveedor y de otro sector, y así la presentamos. En el modelo de negocio del plan de implementación, el escenario prudente (15 % de adopción, +2 puntos de pasajeros que compran, +5 % de ticket en el canal móvil) da ≈ +9 % de facturación, unos 64.500 € al año en el Bajamar; el base (25 %, +3 puntos, +10 %) da ≈ +16 %, unos 108.000 €.',
      'La base real es 1,37 € por pasajero y un 23 % de pasajeros que compran. El piloto mide exactamente esos dos números frente al grupo de control.',
    ],
  },
  {
    id: 'plazos',
    cat: 'Negocio y costes',
    q: '¿En cuánto tiempo estaría listo para un piloto real?',
    corto: 'Unas 10–12 semanas desde que tengamos acceso a los datos de reservas, la pasarela y el wifi del barco. Las pantallas ya existen.',
    a: [
      'Las interfaces y las reglas de negocio ya están en el prototipo. Falta construir el servidor del barco y el de la nube, conectar la pasarela de pago y el listado de pasajeros, instalar el equipo y probar con la tripulación.',
      'Estimamos 10–12 semanas desde que haya acceso a esos sistemas, más la semana 0 de pruebas a bordo. Es una estimación que afinaremos con el equipo técnico.',
    ],
    supuesto: true,
  },

  // ---------------------------------------------------------------- PILOTO
  {
    id: 'muestra',
    cat: 'Piloto',
    q: 'Seis semanas, una cafetería y la mañana: ¿es suficiente muestra? ¿Y el efecto novedad?',
    corto: 'Son unos 2.300 tickets por semana solo en el Bajamar; miramos la tendencia semana a semana y, si hace falta, se alarga.',
    a: [
      'Según los datos del reto, el Bajamar Express hace unos 2.300 tickets por semana, y la mañana concentra el 38 % de la facturación. En 4 semanas con servicio hay miles de transacciones, suficiente para ver diferencias claras en compra por pasajero y en tiempos.',
      'Para separar el efecto novedad, miramos la evolución semana a semana: si el uso cae a la mitad tras la primera semana, lo veremos. Si hace falta, el piloto se alarga o se amplía a la tarde.',
    ],
  },
  {
    id: 'control',
    cat: 'Piloto',
    q: '¿Por qué el Bañaderos Express es un buen grupo de control?',
    corto: 'Es un buque gemelo en la misma ruta, así que compara lo mismo: mismo tipo de pasajero, horarios y oferta.',
    a: [
      'El Bajamar y el Bañaderos son trimaranes gemelos en la misma ruta Santa Cruz – Agaete. Compararlos en las mismas semanas reduce el efecto de la estacionalidad y de cambios en la demanda.',
      'Además comparamos el Bajamar consigo mismo antes y durante el piloto (2 semanas de línea base).',
    ],
  },
  {
    id: 'parada',
    cat: 'Piloto',
    q: '¿Cuál es el criterio exacto para parar si el servicio empeora la cola presencial?',
    corto: 'Si la espera en la cola presencial empeora más de un 20 % dos semanas seguidas, o hay un pedido duplicado cobrado, se pausa y se revisa.',
    a: [
      'Proponemos criterios de parada claros, a acordar con operaciones: si la espera de la cola presencial empeora más de un 20 % frente a la línea base durante dos semanas seguidas, si se cobra dos veces un mismo pedido o si la tripulación lo pide por carga de trabajo.',
      'Y criterios de éxito: más venta por pasajero que el control, recogida en menos de 2 minutos desde «listo» y cero pedidos duplicados.',
    ],
  },

  // ---------------------------------------------------------------- LEGAL
  {
    id: 'rgpd',
    cat: 'Legal y datos',
    q: '¿Qué datos personales guardáis, con qué base legal y durante cuánto tiempo?',
    corto: 'Los mínimos para servir el pedido (localizador, nombre y lo pedido), alojados en la UE y borrados tras el plazo que fije el área legal.',
    a: [
      'Para servir el pedido basta con el localizador, el nombre y lo pedido. La base legal es la ejecución del contrato (el propio pedido). El marketing y las ofertas solo con consentimiento aparte.',
      'Datos alojados en la UE. El servidor del barco borra los datos personales al cerrar la travesía y la nube los conserva el tiempo que fije el área legal (por ejemplo, el necesario para facturación). La analítica del piloto se hace con datos agregados.',
    ],
    supuesto: true,
  },
  {
    id: 'alergenos',
    cat: 'Legal y datos',
    q: 'Alérgenos e información alimentaria: ¿la carta digital cumple la normativa? ¿Y la accesibilidad?',
    corto: 'La carta muestra los 14 alérgenos de cada producto desde la ficha oficial de Fred. Olsen, y la web se diseña para cumplir WCAG 2.1 AA.',
    a: [
      'Cada producto muestra sus alérgenos según la información oficial de restauración de Fred. Olsen (Reglamento UE 1169/2011). La fuente es la misma ficha que usa la barra hoy, no un texto escrito por nosotros ni por la IA.',
      'La web se diseña para cumplir WCAG 2.1 AA (contraste, tamaño de botones, lector de pantalla, texto grande), en línea con la certificación de accesibilidad universal de la flota.',
    ],
  },
  {
    id: 'proveedores',
    cat: 'Legal y datos',
    q: '¿Y si el proveedor de IA, de nube o de pagos cambia precios o condiciones?',
    corto: 'Cada proveedor está detrás de una interfaz propia, así que se puede cambiar; y lo esencial (pedir y recoger) no depende de la IA.',
    a: [
      'La pasarela de pago, la nube y la IA se usan a través de una capa propia, de modo que cambiar de proveedor afecta a un módulo y no a toda la solución. La nube usa PostgreSQL y contenedores estándar, sin servicios exclusivos de un proveedor.',
      'El chat con IA es opcional: si deja de compensar, se apaga y FredOnBoard sigue funcionando igual.',
    ],
  },
  // ---------------------------------------------------------------- INVENTARIO (con respuestas reales de Fred. Olsen)
  {
    id: 'inv-escandallo',
    cat: 'Inventario',
    q: '¿Cómo sabe FredOnBoard qué hay disponible si nuestro inventario funciona por escandallo?',
    corto: 'Usa el mismo modelo: cada producto tiene su escandallo y, al venderlo, descuenta sus insumos. Lo que se puede vender lo marca el insumo más escaso.',
    a: [
      'Fred. Olsen nos confirmó que cada referencia de venta tiene asociado un escandallo y que al vender una unidad se descuentan los insumos correspondientes. FredOnBoard funciona igual: un bocadillo de pollo descuenta pan, pollo, verdura y alioli.',
      'Las unidades disponibles de cada producto se calculan con el insumo que limita (si queda pan para 6 bocadillos, solo se ofrecen 6, aunque haya pollo para 40). Además se aplica el umbral de seguridad para no vender lo último que se está despachando en barra.',
      'Si un mismo insumo lo usan varios productos (croissant suelto y oferta de bollería), al agotarse desaparecen los dos a la vez.',
    ],
  },
  {
    id: 'inv-reposicion',
    cat: 'Inventario',
    q: '¿Cómo encaja con nuestro aprovisionamiento (compra semanal y catering diario)?',
    corto: 'Igual que hoy: los no perecederos se cargan con la compra semanal y los frescos con la recepción diaria de catering; la tablet de barra registra ambas en un toque.',
    a: [
      'La empresa compra una vez por semana aguas, refrescos, café, snacks y no perecederos, y recibe el catering fresco cada día. En FredOnBoard cada insumo indica su vía de aprovisionamiento, y la barra registra la recepción del catering y la compra semanal con un botón; también puede registrar mermas, entradas y recuentos.',
      'Esto activa la función que su programa ya tiene pero no usa: registrar el inventario inicial de perecederos con la compra diaria y saber cuándo se agotan.',
    ],
  },
  {
    id: 'inv-agotados',
    cat: 'Inventario',
    q: 'Hoy el equipo se avisa de palabra cuando algo se agota. ¿Qué cambia?',
    corto: 'El aviso es automático: al agotarse un insumo, la barra recibe una alerta, el producto desaparece del móvil y el manager lo ve en su panel.',
    a: [
      'Cuando un producto se queda sin porciones porque falta un insumo, la tablet avisa («se ha agotado el bocadillo de pollo: falta pan de bocadillo»), la carta del pasajero lo oculta al instante y el panel del manager lo marca como riesgo de rotura. Si un insumo baja de su mínimo, salta una alerta de reposición.',
      'Así nadie vende algo que no hay y el pasajero no se entera en la barra.',
    ],
  },
  {
    id: 'inv-cantidades',
    cat: 'Inventario',
    q: '¿Cómo ayuda a decidir cuánta comida cargar, si el frío del barco es limitado?',
    corto: 'Con un plan de aprovisionamiento: pasajeros previstos × consumo real por pasajero × escandallo, más margen, comprobando que quepa en la cámara de frío.',
    a: [
      'Fred. Olsen decide hoy las cantidades con la previsión de pasajeros, la expectativa de venta, el top 10 de productos, la duración del trayecto y la capacidad de almacenamiento, sobre todo el frío.',
      'El panel del manager propone el pedido con esos mismos criterios: consumo por pasajero calculado con el informe real del Bajamar (para el top 10) y estimado para el resto, multiplicado por la previsión de pasajeros y por el escandallo, más un margen de seguridad y menos el stock actual. Si el pedido no cabe en la cámara de frío, lo avisa.',
      'Con los datos de FredOnBoard (pre-pedidos, ventas por franja) la previsión mejora con el tiempo, y se reducen tanto las faltas como las mermas.',
    ],
    supuesto: true,
  },
  {
    id: 'inv-expendedoras',
    cat: 'Inventario',
    q: '¿Por qué no poner máquinas expendedoras en lugar de una app?',
    corto: 'Fred. Olsen no las tiene por la externalización del servicio y por la gestión de fallos técnicos; FredOnBoard no añade máquinas, usa la barra y la tripulación que ya existen.',
    a: [
      'La empresa nos indicó que no hay máquinas expendedoras a bordo por cuestiones de externalización del servicio y de gestión de posibles fallos técnicos. FredOnBoard respeta esa decisión: no añade hardware de venta, solo una tablet en la barra y el móvil del pasajero, y si algo falla la barra sigue vendiendo como hoy.',
    ],
  },
  {
    id: 'inv-edades',
    cat: 'Inventario',
    q: '¿Tenéis en cuenta la edad de los pasajeros para la oferta?',
    corto: 'No: Fred. Olsen no tiene datos de edad. Personalizamos por momento del día, cafetería e idioma, y por lo que se vende.',
    a: [
      'La empresa no dispone de datos de edad de los pasajeros, y FredOnBoard tampoco los pide (minimización de datos). La oferta se adapta al momento del viaje (desayuno por la mañana), al idioma del billete, a la cafetería y a lo que más se vende en cada franja.',
    ],
  },
  // ---------------------------------------------------------------- ENCAJE CON FRED. OLSEN
  {
    id: 'on-board-club',
    cat: 'Integraciones',
    q: 'Ya tenemos On Board Club y carta digital. ¿FredOnBoard compite con eso?',
    corto: 'No: FredOnBoard vive dentro de On Board Club. Es la pieza que convierte la carta digital en pedido, pago y recogida.',
    a: [
      'On Board Club ya es el punto de entrada digital a bordo (películas, series, juegos y wifi). FredOnBoard se añade como una sección más: el pasajero no instala nada nuevo ni aprende otra marca.',
      'En el piloto se abre desde el portal wifi y el QR de las mesas; en la fase de escalado entra en la app de Fred. Olsen y en Fred. Olsen Plus.',
    ],
  },
  {
    id: 'canario',
    cat: 'Operativa a bordo',
    q: '¿Qué tiene de canario la propuesta, más allá de la ruta?',
    corto: 'Producto canario y KM0 destacado y filtrable, tienda a bordo con producto de las islas, cero papel y talento canario detrás.',
    a: [
      'Carta: distintivo «Producto canario» con su origen y un filtro propio, en la línea de «Elaborado en Canarias» y «Lo nuestro viaja contigo».',
      'Tienda a bordo: mojo, gofio, miel y dulces típicos que se piden sin levantarse y se recogen en barra, como pide el reto («cafeterías y tiendas»).',
      'En Armonía con el Mar: ticket digital (cero papel), opción «sin cubiertos ni bolsa» y menos desperdicio gracias a la previsión por escandallo. El piloto lo mide.',
      'Talento: diseñado por el equipo Shiro en Talento Canario, con un stack abierto que puede mantener un equipo local.',
    ],
  },
  {
    id: 'joven',
    cat: 'Negocio y costes',
    q: '¿Cómo encaja con el público joven y la Tarifa Joven?',
    corto: 'Es digital, sin instalar nada, y los billetes de Tarifa Joven tienen una ventaja propuesta: −20 % en el café o refresco del pedido.',
    a: [
      'El público de 12 a 25 años ya vive en el móvil: pedir desde el móvil es su forma natural de comprar.',
      'La ventaja joven es una propuesta para el piloto, no una condición actual de Fred. Olsen. Medimos su uso como KPI para decidir si mantenerla.',
    ],
    supuesto: true,
  },
]

/** Componentes de la arquitectura propuesta (para el diagrama y la tabla del stack). */
export const STACK: { capa: string; prototipo: string; produccion: string }[] = [
  { capa: 'Pasajero', prototipo: 'React 18 + TypeScript, framer-motion, QR', produccion: 'PWA React + TypeScript con service worker (sin instalar). Acceso por QR de las mesas, portal wifi, email y WhatsApp' },
  { capa: 'Barra', prototipo: 'React (misma base), WebAudio para avisos', produccion: 'PWA en tablet resistente fijada en la barra, conectada al servidor del barco por la red local' },
  { capa: 'Manager', prototipo: 'React + Recharts', produccion: 'Panel web en la nube con datos de toda la flota' },
  { capa: 'Servidor del barco', prototipo: 'Simulado en el navegador (localStorage + BroadcastChannel)', produccion: 'Node.js + TypeScript en Docker sobre mini PC industrial; SQLite/PostgreSQL; WebSockets' },
  { capa: 'Nube', prototipo: '—', produccion: 'Node.js + PostgreSQL alojado en la UE; carta, precios, analítica, cola de sincronización' },
  { capa: 'Pagos', prototipo: 'Simulado', produccion: 'Pasarela del banco de Fred. Olsen (tokenizada, Apple Pay/Google Pay). Sin datos de tarjeta en nuestros servidores' },
  { capa: 'Integraciones', prototipo: 'Billetes de prueba', produccion: 'Listado de pasajeros por salida (solo lectura); Ágora por su API HTTP/JSON o por fichero, según la opción elegida; Fred. Olsen Plus en la hoja de ruta' },
  { capa: 'Asistente', prototipo: 'Palabras clave (ES/EN/DE)', produccion: 'LLM con contenidos aprobados y límites de uso; sin conexión, respuestas predefinidas' },
  { capa: 'Inventario', prototipo: 'Escandallos, insumos y plan de aprovisionamiento simulados', produccion: 'Escandallos e insumos sincronizados con el programa de inventario de Fred. Olsen; recepción diaria y semanal registrada en la tablet' },
  { capa: 'Despliegue', prototipo: 'GitHub Pages', produccion: 'Contenedores; actualización remota del servidor del barco en puerto; monitorización y alertas' },
]
