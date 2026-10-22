// Datos del plan de comunicación: análisis de redes, plan de lanzamiento y buyer personas.
// Criterio: solo se publican cifras verificadas con fuente y fecha de consulta. Lo demás queda «pendiente de medir».

export const CONSULTA = 'octubre 2026 (consulta: 22/10/2026)'

export type RedId = 'facebook' | 'youtube' | 'instagram' | 'linkedin' | 'tiktok'

export type Red = {
  id: RedId
  nombre: string
  url: string
  /** Para qué público y para qué sirve en el plan (conclusión de trabajo, no medida). */
  publico: string
  uso: string
  /** Estado del acceso automático el 22/10/2026. */
  acceso: string
  /** Dato verificado de la propia red, si lo hay. */
  verificado?: string
}

export const REDES: Red[] = [
  {
    id: 'facebook',
    nombre: 'Facebook',
    url: 'https://www.facebook.com/fredolsenexpress',
    publico: 'Residente frecuente y familias',
    uso: 'Avisos del servicio, rutas, horarios y comunidad. Es donde el residente pregunta y comenta.',
    acceso: 'Bloqueado al acceso automático (robots).',
  },
  {
    id: 'youtube',
    nombre: 'YouTube',
    url: 'https://www.youtube.com/channel/UC4RMFwTbVNbhju3sMHj2Drg',
    publico: 'Turista y quien se informa antes de viajar',
    uso: 'Vídeo explicativo de 45–60 s: cómo se pide y se recoge con FredOnBoard, con subtítulos ES/EN/DE.',
    acceso: 'La página del canal carga, pero sin suscriptores, vídeos ni visualizaciones; el feed RSS está bloqueado.',
    verificado: 'Canal oficial con identificador UC4RMFwTbVNbhju3sMHj2Drg y alias @fred.olsenexpress1385 (YouTube, consulta 22/10/2026).',
  },
  {
    id: 'instagram',
    nombre: 'Instagram',
    url: 'https://www.instagram.com/fredolsenexpress/',
    publico: 'Joven 12–25 y residente digital',
    uso: 'Reels y stories con producto canario, la barra y el atardecer en cubierta; stories con enlace al pre-pedido.',
    acceso: 'Bloqueado al acceso automático (robots).',
  },
  {
    id: 'linkedin',
    nombre: 'LinkedIn',
    url: 'https://www.linkedin.com/company/naviera-fred-olsen-express/',
    publico: 'Talento, instituciones y alianza Zetta10',
    uso: 'Historia del proyecto: talento canario, Gobierno de Canarias y Zetta10; resultados del piloto.',
    acceso: 'Bloqueado al acceso automático (robots).',
  },
  {
    id: 'tiktok',
    nombre: 'TikTok',
    url: 'https://www.tiktok.com/@fredolsenexpress',
    publico: 'Joven 12–25',
    uso: 'Vídeo corto y cercano: probar el pedido desde el sillón, reacción a la bandeja, producto canario.',
    acceso: 'Bloqueado al acceso automático (robots).',
  },
]

export type Fuente = { dato: string; valor: string; fuente: string; url?: string; fecha: string }

/** Cifras verificadas. No se añade nada que no tenga fuente. */
export const DATOS_VERIFICADOS: Fuente[] = [
  {
    dato: 'Seguidores en redes (suma de las cinco)',
    valor: '178.000',
    fuente: 'Presentación oficial del reto, Fred. Olsen Express (Hackathon Talento Canario)',
    fecha: 'Recogido en el material del reto; sin desglose por red',
  },
  {
    dato: 'Visitas mensuales a la web',
    valor: '450.000',
    fuente: 'Presentación oficial del reto, Fred. Olsen Express',
    fecha: 'Recogido en el material del reto',
  },
  {
    dato: 'Socios Fred. Olsen Plus',
    valor: '397.000',
    fuente: 'Presentación oficial del reto, Fred. Olsen Express',
    fecha: 'Recogido en el material del reto',
  },
  {
    dato: 'Satisfacción y NPS',
    valor: '8,81 / 10 · NPS 63,8 %',
    fuente: 'Presentación oficial del reto, Fred. Olsen Express',
    fecha: 'Recogido en el material del reto',
  },
  {
    dato: 'Cómo se cuenta hoy la hostelería a bordo en prensa',
    valor: '«propuesta culinaria variada que incluye gastronomía canaria»; «cafeterías, restaurante y sports bar»',
    fuente: 'Diario de Avisos, «Fred. Olsen Express convierte en un minicrucero su trayecto a Huelva» (buque de la línea Canarias–Huelva; no cita platos, precios ni productos)',
    url: 'https://diariodeavisos.elespanol.com/2026/06/fred-olsen-express-convierte-en-un-minicrucero-su-trayecto-a-huelva/',
    fecha: 'Publicado 10/06/2026 · consultado 22/10/2026',
  },
]

export const NO_ENCONTRADO =
  'No se ha encontrado ninguna fuente pública con seguidores por red, frecuencia de publicación ni interacciones por publicación. Una nota de elDiario.es (MMI Analytics, 09/02/2023) menciona «más de 160 menciones de 74 autores únicos» sobre Fred. Olsen, pero es del grupo y no de los perfiles de Express, y no habla de hostelería: no se usa como dato.'

export type FilaMetodo = { que: string; donde: string; como: string }

export const METODOLOGIA: FilaMetodo[] = [
  { que: 'Seguidores', donde: 'Cabecera del perfil (anotar la fecha)', como: 'Cifra exacta o redondeada tal como la muestra la red.' },
  { que: 'Publicaciones del periodo', donde: 'Feed de los últimos 90 días contados hacia atrás desde el día de la medición', como: 'Contar publicaciones, reels, stories destacadas y vídeos. Frecuencia = publicaciones / 13 semanas.' },
  { que: 'Tipo de contenido', donde: 'Cada publicación del periodo', como: 'Clasificar en: servicio y avisos, destino, producto y hostelería a bordo, institucional y talento, promoción.' },
  { que: 'Interacciones', donde: 'Debajo de cada publicación', como: 'Reacciones + comentarios + compartidos (+ guardados si se ven). En vídeo, anotar también visualizaciones.' },
  { que: 'Tasa de engagement por publicación', donde: 'Hoja de cálculo del equipo', como: 'Interacciones de la publicación / seguidores × 100. Media de todas las del periodo.' },
  { que: 'Hostelería a bordo', donde: 'Búsqueda por «cafetería», «restaurante», «Clase Oro», «menú», «canario» en el feed', como: 'Repetir el cálculo solo con esas publicaciones y compararlo con la media de la red.' },
]

export const CONCLUSIONES = [
  { t: 'Una red, un papel', d: 'Hipótesis de trabajo a validar con la medición: TikTok e Instagram para el joven; Facebook para el residente; YouTube para el vídeo explicativo; LinkedIn para talento y la alianza con Zetta10.' },
  { t: 'La hostelería se cuenta como oferta, no como servicio', d: 'En prensa se habla de gastronomía canaria, cafeterías, restaurante y sports bar en términos generales, sin platos, precios ni forma de pedir. FredOnBoard aporta justo lo que falta: el cómo.' },
  { t: 'Falta medir lo importante', d: 'No sabemos todavía si las publicaciones de comida a bordo rinden por encima de la media. Es lo primero que debe cerrar el equipo con la tabla de abajo antes de fijar metas definitivas.' },
]

// ---------------------------------------------------------------- plan de lanzamiento en redes

export type PiezaRed = { formato: string; copy: string }
export type PlanRed = {
  id: RedId
  objetivo: string
  formato: string
  piezas: PiezaRed[]
  teaser: string
  lanzamiento: string
  refuerzo: string
  kpi: string
}

export const PLAN_REDES: PlanRed[] = [
  {
    id: 'instagram',
    objetivo: 'Que el joven y el residente digital conozcan FredOnBoard y pre-pidan.',
    formato: 'Reel de 15 s, stories con enlace y carrusel de producto canario.',
    piezas: [
      { formato: 'Reel · teaser', copy: 'Algo se cocina a bordo del Bajamar Express. Pronto pedirás desde tu sitio y recogerás sin colas.' },
      { formato: 'Reel · lanzamiento', copy: 'Ya puedes pedir desde el sillón. Escanea el código de la mesa o entra en On Board Club, elige y recoge cuando esté listo. Sin cuenta, sin descargas.' },
      { formato: 'Carrusel · refuerzo', copy: 'Hecho en Canarias, pedido en dos toques. Mira qué productos de las islas ya están en la carta del Bajamar Express.' },
    ],
    teaser: 'Semanas −2 y −1',
    lanzamiento: 'Semana 1',
    refuerzo: 'Semanas 2 a 4, un reel por semana',
    kpi: 'Clics en el enlace de la story: 1,5 % de las visualizaciones',
  },
  {
    id: 'tiktok',
    objetivo: 'Llegar al joven de Tarifa Joven con prueba de uso real.',
    formato: 'Vídeo vertical de 15–25 s, tono cercano y sin guion rígido.',
    piezas: [
      { formato: 'Vídeo · teaser', copy: 'POV: son las 8 de la mañana, estás en el barco y tu café ya está pedido.' },
      { formato: 'Vídeo · lanzamiento', copy: 'Probamos pedir desde el salón, sin levantarnos ni hacer cola. Spoiler: tu bocata sale antes de que lo pienses.' },
      { formato: 'Vídeo · refuerzo', copy: 'Tarifa Joven más pedido anticipado: viaja, pide y recoge sin hacer cola.' },
    ],
    teaser: 'Semana −1',
    lanzamiento: 'Semana 1',
    refuerzo: 'Semanas 2 a 4, un vídeo por semana',
    kpi: 'Visualizaciones completas: 30 % del total',
  },
  {
    id: 'facebook',
    objetivo: 'Informar al residente frecuente de que el servicio existe y cómo se usa.',
    formato: 'Publicación con imagen y texto breve; respuesta a comentarios con enlace.',
    piezas: [
      { formato: 'Publicación · teaser', copy: 'Muy pronto, en el Bajamar Express (Santa Cruz de Tenerife – Agaete): pide desde tu sitio y recoge sin colas.' },
      { formato: 'Publicación · lanzamiento', copy: 'Desde hoy, en el Bajamar Express: pide sin levantarte y recoge sin colas. La barra de siempre sigue atendiendo igual.' },
      { formato: 'Publicación · refuerzo', copy: 'Tu desayuno puede estar pedido cuando subes a bordo. Lo eliges desde el mensaje de tu billete.' },
    ],
    teaser: 'Semana −1',
    lanzamiento: 'Semana 1',
    refuerzo: 'Semanas 2 a 4, dos publicaciones por semana',
    kpi: 'Clics en el enlace: 1 % de las personas alcanzadas',
  },
  {
    id: 'youtube',
    objetivo: 'Explicar el servicio de principio a fin para el turista y quien duda.',
    formato: 'Vídeo explicativo de 45–60 s con subtítulos en ES, EN y DE.',
    piezas: [
      { formato: 'Vídeo · lanzamiento', copy: 'Cómo pedir en el Bajamar Express en tres pasos: abre On Board Club, elige tu pedido y recógelo con tu código.' },
      { formato: 'Vídeo · refuerzo (EN)', copy: 'Order without getting up, collect without queuing. How FredOnBoard works on the Bajamar Express.' },
    ],
    teaser: 'No aplica',
    lanzamiento: 'Semana 1',
    refuerzo: 'Semana 3, versión EN y DE',
    kpi: 'Retención media: 50 % del vídeo',
  },
  {
    id: 'linkedin',
    objetivo: 'Contar el proyecto: talento canario, Gobierno de Canarias y Zetta10.',
    formato: 'Artículo corto y publicación con cifras del piloto.',
    piezas: [
      { formato: 'Publicación · lanzamiento', copy: 'Un equipo de talento canario, con Zetta10 y el Gobierno de Canarias, pone a prueba en el Bajamar Express una forma nueva de pedir a bordo.' },
      { formato: 'Publicación · refuerzo', copy: 'Primeros resultados del piloto FredOnBoard: qué funcionó, qué ajustamos y qué viene.' },
    ],
    teaser: 'No aplica',
    lanzamiento: 'Semana 1',
    refuerzo: 'Semana 8, resultados del piloto',
    kpi: 'Interacciones: 3 % de los seguidores',
  },
]

// ---------------------------------------------------------------- buyer personas

export type PersonaId = 'yaiza' | 'hugo' | 'anke' | 'manuel' | 'marta'

export type Avatar = { fondo: string; piel: string; pelo: string; ropa: string; peloTipo: 'corto' | 'largo' | 'moño' | 'calvo' | 'gorra'; gafas?: boolean }

export type Persona = {
  id: PersonaId
  nombre: string
  edad: number
  etiqueta: string
  perfil: string
  contexto: string
  digital: string
  necesidades: string[]
  motivaciones: string[]
  frenos: string[]
  mensaje: string
  canal: string
  base: string[]
  avatar: Avatar
  /** Creatividad del panel de esta persona. */
  panel: { titular: string; sub: string; cta: string; story: string; wifi: string; barra: string }
}

export const PERSONAS: Persona[] = [
  {
    id: 'yaiza',
    nombre: 'Yaiza',
    edad: 38,
    etiqueta: 'Residente frecuente',
    perfil: 'Vive en Tenerife y trabaja en Gran Canaria varios días por semana. Viaja sola, sin vehículo.',
    contexto: 'Sale en el barco de primera hora de la mañana. Quiere un café y algo de desayuno sin perder el sitio ni la calma.',
    digital: 'Móvil a diario. Ya recibe el WhatsApp de Fred. Olsen y abre el correo de la reserva.',
    necesidades: ['Ahorrar tiempo en un trayecto que repite', 'Recoger cuando esté listo, sin cola'],
    motivaciones: ['Rutina predecible', 'Plus Points por cada pedido'],
    frenos: ['No quiere crear otra cuenta', 'Teme perder el sitio junto a la ventana'],
    mensaje: 'Pide sin levantarte, recoge sin colas.',
    canal: 'WhatsApp del check-in y email del billete',
    base: ['Franja de mañana: 14.098 tickets, el 36 % de los 38.651 del informe', 'Café cortado, 6.274 unidades, y oferta bollería + bebida caliente, 2.178', 'Hay 397.000 socios Plus'],
    avatar: { fondo: '#dbe7f7', piel: '#e0ac86', pelo: '#2b1b12', ropa: '#0b3478', peloTipo: 'largo' },
    panel: { titular: 'Tu café, listo cuando tú lo estés', sub: 'Pide desde tu sitio y recoge sin colas.', cta: 'Pide desde tu mesa', story: 'Tu desayuno ya está pedido.', wifi: 'Tu pedido de hoy, a un toque', barra: 'Recoge aquí tu pedido FredOnBoard' },
  },
  {
    id: 'hugo',
    nombre: 'Hugo',
    edad: 17,
    etiqueta: 'Joven · Tarifa Joven',
    perfil: 'Estudiante de bachillerato. Viaja con amigos, con Tarifa Joven (12–25, hasta −25 %).',
    contexto: 'Escapada de fin de semana a Gran Canaria. Pasa el viaje con el móvil y el wifi del barco.',
    digital: 'Nativo digital. Vive en Instagram y TikTok; paga con el móvil y no usa el correo.',
    necesidades: ['Pedir sin moverse del grupo', 'Precio claro y ventajas por ser joven'],
    motivaciones: ['Ventajas de Tarifa Joven', 'Compartir con su gente'],
    frenos: ['No quiere instalar otra app', 'Se corta si tiene que hablar con el personal'],
    mensaje: 'Viaja, pide y recoge sin colas, desde el móvil.',
    canal: 'Instagram, TikTok y portal wifi de On Board Club',
    base: ['Tarifa Joven 12–25, hasta −25 %', 'Refrescos de cola y snacks suman 27.184 € en el informe', 'On Board Club y wifi a bordo ya existen'],
    avatar: { fondo: '#fff1bf', piel: '#c98f67', pelo: '#1b1b1b', ropa: '#d7141a', peloTipo: 'gorra' },
    panel: { titular: 'El viaje, a tu ritmo', sub: 'Con Tarifa Joven, pide desde el móvil y recoge cuando esté listo.', cta: 'Abrir On Board Club', story: 'Pide sin moverte del grupo.', wifi: 'Tarifa Joven: pedir es más fácil', barra: 'Joven: enseña tu QR y recoge' },
  },
  {
    id: 'anke',
    nombre: 'Anke',
    edad: 52,
    etiqueta: 'Turista · DE / EN',
    perfil: 'Visitante alemana de vacaciones en Canarias. Viaja en pareja y habla inglés con soltura.',
    contexto: 'Una excursión de día entre islas. Quiere probar producto local sin complicarse con el idioma.',
    digital: 'Usa el móvil con datos limitados en itinerancia: valora el wifi del barco. Mira YouTube y Google antes de viajar.',
    necesidades: ['Carta en su idioma', 'Probar producto canario sin hablar con nadie'],
    motivaciones: ['Experiencia local auténtica', 'Comodidad'],
    frenos: ['El idioma en la barra', 'No sabe cómo funciona el barco ni la cola'],
    mensaje: 'Order from your table. Taste the islands, no queue.',
    canal: 'Email de confirmación trilingüe y QR de mesas',
    base: ['Turistas ES / EN / DE como público del plan', 'Dorada, 2.802 unidades, entre los diez productos más vendidos', 'Producto canario destacado y filtro KM0 en la carta'],
    avatar: { fondo: '#e3f2ee', piel: '#f0c9a8', pelo: '#b9892e', ropa: '#2a8f84', peloTipo: 'moño', gafas: true },
    panel: { titular: 'Taste the islands', sub: 'Order from your table. Collect without queuing. In English, Deutsch, español.', cta: 'Scan to order', story: 'Pedir en tu idioma.', wifi: 'Order in English or Deutsch', barra: 'Collect your order here' },
  },
  {
    id: 'manuel',
    nombre: 'Manuel',
    edad: 71,
    etiqueta: 'Persona mayor',
    perfil: 'Jubilado, de Agaete. Viaja a menudo a Tenerife por consultas médicas y a ver a la familia.',
    contexto: 'Se sienta cerca de la barra y pide su café de siempre. No suele llevar el móvil cargado.',
    digital: 'Móvil básico y poca confianza con códigos QR. Se fía de lo que oye y de lo que ve en el cartel.',
    necesidades: ['Que la barra siga igual', 'Trato cercano y cartel grande y claro'],
    motivaciones: ['Rutina de siempre', 'Que su vecino también lo use sin problemas'],
    frenos: ['Desconfía de pagar con el móvil', 'Teme que la barra desaparezca'],
    mensaje: 'La barra sigue igual. FredOnBoard solo quita cola a los demás.',
    canal: 'Megafonía, cartel en la barra y personal de sala',
    base: ['Persona mayor o sin móvil como público del plan', 'Café solo, 4.157 unidades, y café cortado, 6.274', 'Hipótesis oficial: integrar sin ampliar dotación'],
    avatar: { fondo: '#ece6f5', piel: '#d9a67c', pelo: '#d8d8d8', ropa: '#5d6779', peloTipo: 'calvo', gafas: true },
    panel: { titular: 'La barra, como siempre', sub: 'Pide en la barra con el trato de siempre. El pedido desde el móvil es solo una opción más.', cta: 'Pregunta a nuestro equipo', story: 'La barra sigue atendiendo igual.', wifi: 'La barra sigue abierta, como siempre', barra: 'Aquí también se pide de toda la vida' },
  },
  {
    id: 'marta',
    nombre: 'Marta',
    edad: 45,
    etiqueta: 'Clase Oro',
    perfil: 'Directiva que viaja por trabajo entre islas. Reserva Clase Oro y valora el tiempo.',
    contexto: 'Aprovecha el trayecto para trabajar con el portátil. Prefiere que le lleven el pedido o recogerlo sin interrumpirse.',
    digital: 'Muy digital en lo profesional; el correo es su canal. Poco tiempo para redes.',
    necesidades: ['Servicio sin fricción', 'Atención personal si la pide'],
    motivaciones: ['Productividad en el viaje', 'Trato diferenciado'],
    frenos: ['No quiere que el servicio la distraiga', 'Rechaza el ruido y la publicidad'],
    mensaje: 'Pide sin levantarte y sigue a lo tuyo.',
    canal: 'Email del billete y personal de sala',
    base: ['Clase Oro como público del plan (canal: email y personal de sala)', 'Mediodía: ticket medio más alto del informe, 6,30 €', 'Los detalles de comportamiento son supuestos'],
    avatar: { fondo: '#fdf0cc', piel: '#e6b894', pelo: '#3a2a1e', ropa: '#0b3478', peloTipo: 'corto', gafas: true },
    panel: { titular: 'Tu tiempo, a bordo', sub: 'Pide desde tu butaca de Clase Oro y recibe tu pedido sin interrumpirte.', cta: 'Pedir ahora', story: 'Sin interrupciones.', wifi: 'Clase Oro: pide y sigue trabajando', barra: 'Clase Oro: tu pedido está listo' },
  },
]

export type FormatoPanel = 'mupi' | 'barra' | 'story' | 'wifi'
export const FORMATOS: { id: FormatoPanel; nombre: string; donde: string }[] = [
  { id: 'mupi', nombre: 'Mupi en terminal', donde: 'Terminal de Santa Cruz de Tenerife, sala de espera' },
  { id: 'barra', nombre: 'Cartel en barra', donde: 'Punto de recogida FredOnBoard en la cafetería' },
  { id: 'story', nombre: 'Story de Instagram 9:16', donde: 'Cuenta de Fred. Olsen Express' },
  { id: 'wifi', nombre: 'Banner del portal wifi', donde: 'Portal de bienvenida de On Board Club' },
]
