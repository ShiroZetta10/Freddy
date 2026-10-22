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

// ---------------------------------------------------------------- paneles y piezas publicitarias

export type Ambito = 'redes' | 'tierra' | 'barco'
export const AMBITOS: { id: Ambito; nombre: string; desc: string }[] = [
  { id: 'redes', nombre: 'Redes sociales', desc: 'Anuncios y publicaciones en los perfiles y campañas de pago de Fred. Olsen Express.' },
  { id: 'tierra', nombre: 'Espacios físicos en tierra', desc: 'Carretera, estación marítima, rampas y pasarelas: ubicaciones propuestas, a confirmar con Fred. Olsen y con los propietarios del soporte.' },
  { id: 'barco', nombre: 'Dentro del barco', desc: 'Señalética, cartelería y pantallas del Bajamar Express. Aquí el pasajero ya está a bordo: la pieza guía, no vende.' },
]

export type FormatoPanel =
  | 'story' | 'feed' | 'meta' | 'vertical' | 'youtube'
  | 'mupi' | 'valla' | 'lona' | 'rampa'
  | 'indicador' | 'suelo' | 'mesa' | 'pantalla' | 'barra' | 'mostrador' | 'wifi'

export type FormatoInfo = {
  id: FormatoPanel
  ambito: Ambito
  nombre: string
  /** Etiqueta corta del selector. */
  corto: string
  /** true si el titular y la llamada a la acción cambian con la buyer persona. */
  porPersona: boolean
  medidas: string
  ubicacion: string
  publico: string
  mensaje: string
  momento: string
  kpi: string
}

export const FORMATOS: FormatoInfo[] = [
  // ---- redes
  {
    id: 'meta', ambito: 'redes', nombre: 'Banner de anuncio en Meta (Facebook e Instagram)', corto: 'Banner Meta', porPersona: true,
    medidas: 'Horizontal 1200 × 628 px (1,91:1) y cuadrado 1080 × 1080 px (1:1)',
    ubicacion: 'Anuncio de pago en Facebook e Instagram, segmentado por intereses y por residencia en Canarias (propuesta)',
    publico: 'Residente frecuente y joven digital; versión en inglés y alemán para turistas',
    mensaje: 'Titular de la persona + «Pide sin levantarte, recoge sin colas» + botón de llamada a la acción. Sin QR: en pantalla el botón lleva al enlace',
    momento: 'Teaser en las semanas −2 y −1 (solo marca); lanzamiento en la semana 1; refuerzo con el producto canario',
    kpi: 'Clics en el enlace sobre impresiones',
  },
  {
    id: 'feed', ambito: 'redes', nombre: 'Post de feed de Instagram 1:1', corto: 'Post Instagram 1:1', porPersona: true,
    medidas: '1080 × 1080 px (1:1), con zona segura de 80 px en cada borde',
    ubicacion: 'Feed del perfil @fredolsenexpress (publicación orgánica; opción de promocionarla)',
    publico: 'Residente digital y joven de 12 a 25',
    mensaje: 'Una frase, un producto canario y el nombre del servicio. El pie de foto lleva el enlace de la biografía',
    momento: 'Lanzamiento (semana 1) y refuerzo semanal con un producto distinto',
    kpi: 'Guardados y compartidos por publicación',
  },
  {
    id: 'story', ambito: 'redes', nombre: 'Story de Instagram 9:16', corto: 'Story 9:16', porPersona: true,
    medidas: '1080 × 1920 px (9:16)',
    ubicacion: 'Cuenta de Fred. Olsen Express; pegatina de enlace a On Board Club',
    publico: 'Joven 12–25 y residente digital',
    mensaje: 'Titular de la persona y botón. Una sola idea por story',
    momento: 'Teaser en la semana −1, lanzamiento en la semana 1 y recordatorio el jueves antes del fin de semana',
    kpi: 'Clics en el enlace sobre visualizaciones de la story',
  },
  {
    id: 'vertical', ambito: 'redes', nombre: 'Anuncio vertical de TikTok y Reels con guion de 3 escenas', corto: 'Vídeo vertical', porPersona: true,
    medidas: '1080 × 1920 px (9:16), 15 s; subtítulos incrustados, sin depender del sonido',
    ubicacion: 'TikTok e Instagram Reels, orgánico y como anuncio de pago (propuesta)',
    publico: 'Joven 12–25 y residente digital',
    mensaje: 'Pedir y recoger en 15 segundos, contado con el gancho de cada persona',
    momento: 'Teaser (escena 1 sola) en la semana −1; vídeo completo en el lanzamiento; variantes por persona en el refuerzo',
    kpi: 'Visualizaciones completas sobre reproducciones',
  },
  {
    id: 'youtube', ambito: 'redes', nombre: 'Cabecera del canal y miniatura del vídeo tutorial de YouTube', corto: 'Cabecera y miniatura YouTube', porPersona: true,
    medidas: 'Cabecera 2560 × 1440 px, con zona visible en todos los dispositivos de 1546 × 423 px; miniatura 1280 × 720 px (16:9)',
    ubicacion: 'Canal oficial de Fred. Olsen Express en YouTube; el tutorial de 45–60 s del plan de lanzamiento',
    publico: 'Turista y quien se informa antes de viajar',
    mensaje: 'Cómo pedir en tres pasos, con subtítulos en ES, EN y DE',
    momento: 'Lanzamiento (semana 1); versión EN y DE en la semana 3',
    kpi: 'Porcentaje de retención media del vídeo',
  },
  // ---- tierra
  {
    id: 'valla', ambito: 'tierra', nombre: 'Valla publicitaria de carretera', corto: 'Valla 8 × 3 m', porPersona: true,
    medidas: '8 × 3 m (8:3), horizontal. Se lee a distancia y en pocos segundos: máximo siete palabras de titular',
    ubicacion: 'Ubicación propuesta, no contratada: GC-2 en el tramo de acceso a Agaete, y TF-1 o autopista de acceso a Santa Cruz de Tenerife. Falta confirmar el soporte disponible',
    publico: 'Residente frecuente que conduce hacia el puerto y turista en coche de alquiler',
    mensaje: 'Titular de la persona, marca y una llamada corta. Sin QR: a esa velocidad no se escanea',
    momento: 'Lanzamiento (semana 1) y refuerzo hasta la semana 4',
    kpi: 'Búsquedas de la marca y visitas a On Board Club tras la campaña (medición indirecta)',
  },
  {
    id: 'lona', ambito: 'tierra', nombre: 'Lona o cartel de pared en la estación marítima', corto: 'Lona de pared', porPersona: true,
    medidas: 'Vertical 3:4; ejemplo de 3 × 4 m, medida final según la pared libre de la terminal',
    ubicacion: 'Estación marítima de Santa Cruz de Tenerife, pared de la sala de espera o del acceso al embarque (propuesta); misma pieza en la terminal de Agaete',
    publico: 'Pasajero que espera para embarcar, con tiempo de leer y escanear',
    mensaje: 'Titular de la persona, tres pasos y QR grande',
    momento: 'Lanzamiento (semana 1), antes del teaser de megafonía',
    kpi: 'Escaneos del QR en terminal sobre pasajeros embarcados',
  },
  {
    id: 'mupi', ambito: 'tierra', nombre: 'Mupi en terminal', corto: 'Mupi', porPersona: true,
    medidas: 'Proporción 2:3 en vertical; la medida real depende del soporte de la terminal',
    ubicacion: 'Terminal de Santa Cruz de Tenerife, sala de espera',
    publico: 'Residente y turista antes de embarcar',
    mensaje: 'Titular de la persona, avatar ilustrado y QR',
    momento: 'Lanzamiento (semana 1) y refuerzo',
    kpi: 'Escaneos del QR por pasajero embarcado',
  },
  {
    id: 'rampa', ambito: 'tierra', nombre: 'Vinilo en la rampa de embarque o en la pasarela', corto: 'Vinilo de rampa', porPersona: true,
    medidas: 'Banda panorámica 5:1; ejemplo de 5 × 1 m, adaptado a la altura de la barandilla o de la pared de la pasarela',
    ubicacion: 'Pasarela o rampa de embarque del Bajamar Express en Santa Cruz de Tenerife (propuesta; depende de la autorización del puerto)',
    publico: 'Pasajero que sube a pie, sin vehículo',
    mensaje: 'Titular de la persona y una llamada a lo que ya puede hacer a bordo. Se lee caminando, así que sin QR',
    momento: 'Lanzamiento (semana 1), fijo durante el piloto',
    kpi: 'Pasajeros que dicen haberlo visto en la encuesta posviaje',
  },
  // ---- barco
  {
    id: 'indicador', ambito: 'barco', nombre: 'Indicador de pasillo «Recogida FredOnBoard →»', corto: 'Indicador de pasillo', porPersona: false,
    medidas: 'Placa horizontal 5:2; ejemplo de 50 × 20 cm, colgada o a media altura',
    ubicacion: 'Pasillos y entradas del salón que llevan al punto de recogida FredOnBoard de la cafetería',
    publico: 'Todo pasajero con un pedido listo; no cambia por persona',
    mensaje: 'Flecha, nombre del punto y «La barra de siempre sigue atendiendo»',
    momento: 'Lanzamiento (semana 1); fijo',
    kpi: 'Tiempo desde «pedido listo» hasta la recogida',
  },
  {
    id: 'suelo', ambito: 'barco', nombre: 'Vinilo de suelo con flecha', corto: 'Vinilo de suelo', porPersona: false,
    medidas: 'Vinilo antideslizante; ejemplo de 40 × 80 cm, una flecha cada pocos metros',
    ubicacion: 'Suelo del recorrido hasta el punto de recogida (propuesta; debe cumplir normativa de seguridad y evacuación del barco)',
    publico: 'Todo pasajero; no cambia por persona',
    mensaje: 'Una flecha y «Recogida FredOnBoard»',
    momento: 'Lanzamiento (semana 1); fijo',
    kpi: 'Consultas de «dónde recojo» a la tripulación',
  },
  {
    id: 'mesa', ambito: 'barco', nombre: 'Tarjeta de mesa', corto: 'Tarjeta de mesa', porPersona: false,
    medidas: 'Tarjeta de sobremesa tipo díptico; proporción 4:5 por cara, ejemplo de 10 × 12,5 cm',
    ubicacion: 'Mesas del salón y de la cafetería. No hay asiento asignado, así que va en la mesa y nunca en el asiento',
    publico: 'Quien aún no ha pedido y está sentado en una mesa',
    mensaje: 'Pide sin levantarte y recoge sin colas, con QR; en español e inglés',
    momento: 'Lanzamiento (semana 1); fijo',
    kpi: 'Escaneos del QR por mesa',
  },
  {
    id: 'pantalla', ambito: 'barco', nombre: 'Pantalla de pedidos listos en la cafetería', corto: 'Pantalla de pedidos', porPersona: false,
    medidas: 'Pantalla horizontal 16:9; ejemplo de 1920 × 1080 px',
    ubicacion: 'Pantalla sobre el punto de recogida FredOnBoard, visible desde el salón (propuesta)',
    publico: 'Todo pasajero con un pedido; no cambia por persona',
    mensaje: 'Números de pedido en «Preparando» y «Listos». Los números de la maqueta son de ejemplo',
    momento: 'Lanzamiento (semana 1); activa durante todo el viaje',
    kpi: 'Pedidos recogidos sin consultar al personal',
  },
  {
    id: 'barra', ambito: 'barco', nombre: 'Cartel en barra', corto: 'Cartel de barra', porPersona: true,
    medidas: 'Horizontal 16:10; ejemplo de 40 × 25 cm',
    ubicacion: 'Punto de recogida FredOnBoard en la cafetería',
    publico: 'Pasajero con pedido y, sobre todo, quien prefiere la barra de siempre',
    mensaje: 'Recoge aquí tu pedido, con el mensaje de la persona. La barra sigue atendiendo igual',
    momento: 'Lanzamiento (semana 1); fijo',
    kpi: 'Pedidos recogidos en el punto FredOnBoard',
  },
  {
    id: 'mostrador', ambito: 'barco', nombre: 'Adhesivo para el mostrador de la tienda', corto: 'Adhesivo de mostrador', porPersona: true,
    medidas: 'Circular de 20 cm de diámetro, adhesivo para cristal o para el frente del mostrador',
    ubicacion: 'Mostrador de la tienda (a bordo o de la terminal, a confirmar con Fred. Olsen)',
    publico: 'Pasajero que compra producto canario y puede añadirlo al pedido',
    mensaje: 'Sello Elaborado en Canarias, «Hecho en Canarias, pedido en dos toques» y QR con la llamada a la acción de la persona',
    momento: 'Refuerzo (semanas 2 a 4), con el producto destacado de cada semana',
    kpi: 'Escaneos del QR en el mostrador',
  },
  {
    id: 'wifi', ambito: 'barco', nombre: 'Banner del portal wifi', corto: 'Portal wifi', porPersona: true,
    medidas: 'Banner horizontal adaptable al ancho del móvil',
    ubicacion: 'Portal de bienvenida de On Board Club',
    publico: 'Pasajero conectado al wifi gratuito del barco',
    mensaje: 'Titular de la persona y botón a FredOnBoard dentro de On Board Club',
    momento: 'Lanzamiento (semana 1); fijo',
    kpi: 'Clics en el botón sobre conexiones al portal',
  },
]

export type PiezaPersona = {
  /** Frase de apoyo (segunda línea). */
  linea: string
  lema?: string
  /** Llamada a la acción para piezas sin QR (valla, vinilo de rampa): remite a lo que se hace ya a bordo. */
  cta2: string
  /** Gancho de la escena 1 del vídeo vertical. */
  gancho: string
  /** Pie de foto del post de Instagram. */
  pie: string
}

export const PIEZA_PERSONA: Record<PersonaId, PiezaPersona> = {
  yaiza: { cta2: 'A bordo, pide desde tu mesa', linea: 'Pide sin levantarte, recoge sin colas.', lema: 'Lo nuestro viaja contigo', gancho: 'Son las 7:45 y tu café del barco ya está pedido.', pie: 'Tu café, listo cuando tú lo estés. Pide sin levantarte y recoge sin colas en el Bajamar Express. Enlace en la biografía.' },
  hugo: { cta2: 'Ya a bordo, abre On Board Club', linea: 'Viaja, pide y recoge sin colas, desde el móvil.', lema: 'La sonrisa que acompaña cada viaje', gancho: 'POV: pides desde el grupo y no pierdes el sitio.', pie: 'El viaje, a tu ritmo. Pide desde el móvil, dentro de On Board Club, y recoge cuando esté listo. Enlace en la biografía.' },
  anke: { cta2: 'On board: order from your table', linea: 'Order from your table. Taste the islands, no queue.', gancho: 'Taste the islands without queuing.', pie: 'Taste the islands. Order from your table and collect without queuing on the Bajamar Express. Link in bio. / Deutsch: Bestellen ohne Anstehen.' },
  manuel: { cta2: 'A bordo, pregunta a nuestro equipo', linea: 'La barra sigue atendiendo igual. Pedir desde el móvil es una opción más.', lema: 'Contigo desde siempre', gancho: 'La barra de siempre sigue aquí. Y ahora, una opción más.', pie: 'La barra, como siempre. Si prefieres, también puedes pedir desde el móvil. Pregunta a nuestro equipo a bordo.' },
  marta: { cta2: 'A bordo, pide sin interrumpirte', linea: 'Pide sin levantarte y sigue a lo tuyo.', lema: 'La sonrisa que acompaña cada viaje', gancho: 'Pide y sigue a lo tuyo.', pie: 'Tu tiempo, a bordo. Pide sin levantarte y recibe tu pedido sin interrumpirte. Enlace en la biografía.' },
}

// ---------------------------------------------------------------- email y SMS

/** Fuentes consultadas para verificar los canales de correo y SMS (consulta 22/10/2026). */
export const FUENTES_EMAIL_SMS = [
  {
    dato: 'Correo y teléfono en la reserva, y aviso de cambios',
    cita: 'Preguntas frecuentes: «debes indicar un correo electrónico y teléfono» para informarte de posibles cambios en tu reserva; y «recibirás un sms y/o email con un código» para verificar tu identidad.',
    url: 'https://www.fredolsen.es/es/preguntas-frecuentes',
  },
  {
    dato: 'Confirmación de compra',
    cita: 'Preguntas frecuentes: la documentación adicional se indica «en tu confirmación de compra», lo que confirma que existe ese envío.',
    url: 'https://www.fredolsen.es/es/preguntas-frecuentes',
  },
  {
    dato: 'Newsletter por email',
    cita: 'Pie de la web: «No te pierdas las novedades de Fred. Olsen» con «Newsletter: Apúntate por email».',
    url: 'https://www.fredolsen.es/es-es/mailing/mailing.aspx',
  },
  {
    dato: 'Comunicaciones con los datos de contacto',
    cita: 'Condiciones de transporte, apartado de protección de datos: uso de los datos de contacto «para posibles comunicaciones que se estimen oportunas».',
    url: 'https://www.fredolsen.es/es/condiciones-de-transporte',
  },
]

export const NO_VERIFICADO_EMAIL_SMS =
  'No se ha encontrado en fredolsen.es una descripción pública del email recordatorio previo al viaje, del SMS de recordatorio de salida ni del boletín de Fred. Olsen Plus. Se tratan como «canal ya existente según el equipo». Tampoco aparece qué proveedor hace los envíos, y no se supone ninguno.'
