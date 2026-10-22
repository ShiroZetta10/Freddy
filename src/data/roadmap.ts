// Hoja de ruta · ideas a futuro. Todo lo que aquí figura queda FUERA del MVP del piloto.
// Sin cifras inventadas: el esfuerzo y los umbrales son estimaciones del equipo, salvo que se indique otra cosa.

export type Horizonte = 'Tras el piloto' | 'Escalado' | 'Exploración'
export type Esfuerzo = 'Bajo' | 'Medio' | 'Alto'

export type Referencia = { t: string; url: string }

export type IdeaFutura = {
  id: string
  titulo: string
  icono: string
  problema: string
  idea: string
  comoFunciona: string[]
  valor: { pasajero: string; fredolsen: string }
  requisitos: string[]
  kpi: string
  horizonte: Horizonte
  esfuerzo: Esfuerzo // estimación del equipo, no medida
  referencias: Referencia[]
  tickets: string[]
}

export const HORIZONTES: { id: Horizonte; descripcion: string }[] = [
  { id: 'Tras el piloto', descripcion: 'Se pueden abordar en cuanto el piloto valide las hipótesis, sin integraciones externas pesadas.' },
  { id: 'Escalado', descripcion: 'Necesitan integrarse con sistemas de Fred. Olsen o desplegarse en más barcos y rutas.' },
  { id: 'Exploración', descripcion: 'Ideas que requieren más evidencia, datos de uso o decisiones de la naviera antes de comprometerse.' },
]

export const REF = {
  starbucks: { t: 'Starbucks Rewards: términos (Stars por compra y tramos de canje)', url: 'https://starbucks.com/rewards/terms' },
  mcdonalds: { t: "MyMcDonald's Rewards: términos (Reino Unido)", url: 'https://www.mcdonalds.com/gb/en-gb/terms-and-conditions/my-mcdonalds-rewards-terms.html' },
  appleWallet: { t: 'Apple Developer: Wallet (PassKit)', url: 'https://developer.apple.com/documentation/passkit/wallet' },
  googleLoyalty: { t: 'Google Wallet API: tarjetas de fidelización', url: 'https://developers.google.com/wallet/retail/loyalty-cards' },
  tgtg: { t: 'NYC Food Policy Center: Too Good To Go', url: 'https://www.nycfoodpolicy.org/community-spotlight-too-good-to-go/' },
}

export const REFERENCIAS_PAGINA: Referencia[] = [REF.starbucks, REF.mcdonalds, REF.appleWallet, REF.googleLoyalty, REF.tgtg]

export const IDEAS: IdeaFutura[] = [
  {
    id: 'tarjeta-wallet',
    titulo: 'Tarjeta FredOnBoard en la wallet, conectada a Fred. Olsen Plus',
    icono: 'card',
    problema:
      'Fred. Olsen ya tiene un programa de fidelización, Fred. Olsen Plus (+397.000 socios, Plus Points), pero el pasajero no lo ve ni lo usa dentro del flujo de pedir a bordo. Y en el piloto el pasajero se identifica solo por el localizador del billete.',
    idea:
      'Una «Tarjeta FredOnBoard» que se añade a la wallet del smartphone (Apple Wallet / Google Wallet) o vive como tarjeta virtual en la app. No crea un programa paralelo: es la cara visible de Fred. Olsen Plus a bordo. Los puntos son Plus Points; FredOnBoard solo informa de cada compra y el sistema oficial suma o canjea.',
    comoFunciona: [
      'El pasajero vincula su número de socio Fred. Olsen Plus (opcional; sin él sigue pudiendo pedir con el localizador).',
      'La app genera la tarjeta con un QR/código de barras y la ofrece con «Añadir a la wallet».',
      'Cada compra enviada al sistema oficial suma Plus Points; la tarjeta muestra saldo y progreso hacia la siguiente recompensa.',
      'Un catálogo de premios por tramos (café, upgrade de menú, producto canario, descuento en billete) se desbloquea al alcanzar cada nivel.',
      'En barra o en el punto de recogida se muestra el QR para identificar al socio y aplicar el canje.',
    ],
    valor: {
      pasajero: 'Un único sitio para ver puntos y premios, sin crear otra cuenta ni tarjeta; el QR siempre a mano en el móvil.',
      fredolsen: 'Más uso de Fred. Olsen Plus a bordo, datos de recurrencia ligados a un socio y un motivo para volver a reservar.',
    },
    requisitos: [
      'Acuerdo y API (o fichero) con el sistema oficial de Fred. Olsen Plus: FredOnBoard no calcula ni guarda puntos por su cuenta.',
      'Cuenta de emisor de pases (Apple Wallet y Google Wallet) y diseño de la tarjeta con la marca de Fred. Olsen.',
      'Consentimiento del socio y política de datos acordada con la naviera.',
      'Decisión de negocio sobre qué premios se financian y con qué reglas de caducidad.',
    ],
    kpi: 'Porcentaje de pedidos asociados a un socio Fred. Olsen Plus y número de canjes por salida.',
    horizonte: 'Escalado',
    esfuerzo: 'Alto',
    referencias: [REF.starbucks, REF.mcdonalds, REF.appleWallet, REF.googleLoyalty],
    tickets: ['#4', '#7'],
  },
  {
    id: 'caducidad',
    titulo: 'Antes de que se acabe: productos que caducan pronto o rotan poco',
    icono: 'clock',
    problema:
      'Hoy los agotados se avisan de palabra, el catering fresco llega a diario y la compra de no perecederos es semanal. La función de perecederos del sistema no está activada, así que no hay visibilidad de qué caduca antes ni de qué se vende menos.',
    idea:
      'Controlar los productos que van a perecer pronto o que se consumen menos, y destacarlos en la carta con un precio especial para facilitar su consumo desde la app. Menos desperdicio y menos merma, en línea con «En Armonía con el Mar».',
    comoFunciona: [
      'Se activa la función de perecederos y se registra caducidad por lote sobre el inventario por escandallo.',
      'Una regla automática del manager cruza caducidad, stock restante y rotación (ejemplo: si caduca hoy y queda más de X, descuento Y).',
      'La carta muestra una sección «Antes de que se acabe» con el precio especial y la razón («caduca hoy»).',
      'Al agotarse el producto desaparece de la carta, en vez de avisarse de palabra en la barra.',
      'El panel del manager recoge cuánto se ha salvado y cuánto se ha dejado de desperdiciar.',
    ],
    valor: {
      pasajero: 'Un precio mejor en productos buenos y la certeza de que lo que pide está disponible.',
      fredolsen: 'Menos merma, mejor uso del catering fresco diario y un dato fiable de rotación para ajustar la compra semanal.',
    },
    requisitos: [
      'Activar la función de perecederos que hoy no está activada en el sistema de inventario.',
      'Escandallos completos y fechas de caducidad cargadas por lote.',
      'Reglas de descuento aprobadas por la naviera (umbrales X e Y son parámetros a definir, no cifras del equipo).',
      'Tener en cuenta alérgenos y normativa de venta de alimentos próximos a caducar.',
    ],
    kpi: 'Unidades salvadas de la merma frente a una línea base medida antes de activar la regla.',
    horizonte: 'Tras el piloto',
    esfuerzo: 'Medio',
    referencias: [REF.tgtg],
    tickets: ['#6'],
  },
  {
    id: 'valoracion',
    titulo: 'Valoración posviaje y email de cierre',
    icono: 'check',
    problema: 'Tras desembarcar, el pasajero no tiene un cierre: sin ticket digital, sin valoración y sin motivo para volver.',
    idea: 'Un email posviaje con el ticket, la opción de valorar el servicio y la propuesta del siguiente viaje.',
    comoFunciona: [
      'Al cerrar la salida se envía un mensaje a quien dio su contacto de forma voluntaria.',
      'Incluye el ticket de lo pedido y una valoración breve (producto, tiempo de recogida).',
      'Las valoraciones llegan al panel del manager agrupadas por salida.',
    ],
    valor: {
      pasajero: 'Un justificante de lo consumido y una vía sencilla para opinar.',
      fredolsen: 'Feedback estructurado por salida y un canal de recontacto con consentimiento.',
    },
    requisitos: ['Consentimiento y recogida opcional del email.', 'Servicio de envío de correo y texto legal.', 'Qué se pregunta y cómo se usa lo recogido, a definir con la naviera.'],
    kpi: 'Tasa de respuesta a la valoración y satisfacción media por salida.',
    horizonte: 'Tras el piloto',
    esfuerzo: 'Bajo',
    referencias: [],
    tickets: [],
  },
  {
    id: 'integracion-app',
    titulo: 'Integración en la app de Fred. Olsen / On Board Club',
    icono: 'phone',
    problema: 'En el piloto FredOnBoard funciona como web independiente, fuera de la app y del ecosistema digital a bordo de Fred. Olsen.',
    idea: 'Que FredOnBoard viva dentro de On Board Club y de la app de la naviera, reutilizando el billete y, si procede, el perfil del socio.',
    comoFunciona: [
      'El billete se recupera de la reserva sin teclear el localizador.',
      'FredOnBoard aparece como un módulo más de On Board Club.',
      'Las notificaciones de pedido listo salen por la app de la naviera.',
    ],
    valor: {
      pasajero: 'Un solo punto de entrada para todo lo del viaje.',
      fredolsen: 'Más uso de su ecosistema y menos fricción de descarga.',
    },
    requisitos: ['Acceso a la API de reservas y a la app.', 'Acuerdo técnico y de marca con Fred. Olsen.', 'Reglas de seguridad y privacidad de la naviera.'],
    kpi: 'Porcentaje de pedidos iniciados desde la app frente a la web.',
    horizonte: 'Escalado',
    esfuerzo: 'Alto',
    referencias: [],
    tickets: [],
  },
  {
    id: 'entrega-sitio',
    titulo: 'Entrega en tu sitio',
    icono: 'route',
    problema: 'En el barco no hay asiento asignado, por lo que hoy la entrega solo puede ser en el punto de recogida. Pasajeros con movilidad reducida o con niños lo notan más.',
    idea: 'Llevar el pedido a la zona donde está el pasajero.',
    comoFunciona: [
      'El pasajero indica una zona del barco (no un asiento).',
      'La tripulación recibe el pedido con la zona y lo entrega.',
      'Se prioriza movilidad reducida y familias con niños.',
    ],
    valor: {
      pasajero: 'Comodidad sin perder el sitio ni cargar bandejas.',
      fredolsen: 'Atención a quien más lo necesita, a cambio de un coste de servicio a evaluar.',
    },
    requisitos: ['Personal disponible y procedimiento de seguridad a bordo.', 'Mapa de zonas del barco.', 'Medir demanda real antes de comprometer tripulación.'],
    kpi: 'Pedidos con entrega en zona y tiempo desde que está listo hasta que se entrega.',
    horizonte: 'Exploración',
    esfuerzo: 'Alto',
    referencias: [],
    tickets: [],
  },
  {
    id: 'ofertas',
    titulo: 'Ofertas personalizadas',
    icono: 'megaphone',
    problema: 'Las promociones de hoy son iguales para todos y no tienen en cuenta qué ha comprado cada pasajero ni el tramo de la travesía.',
    idea: 'Ofertas a medida según histórico de compras, momento de la travesía y nivel en Fred. Olsen Plus.',
    comoFunciona: [
      'Reglas simples primero (por ejemplo, por franja horaria o ruta).',
      'Después, ofertas ligadas al nivel del socio, incluido el desbloqueo de «ofertas irrechazables» por niveles.',
      'El manager activa y mide cada oferta desde el panel.',
    ],
    valor: {
      pasajero: 'Ofertas útiles en lugar de ruido.',
      fredolsen: 'Más conversión y una forma de vaciar producto de baja rotación.',
    },
    requisitos: ['Datos de compra asociados a socios (con consentimiento).', 'Tarjeta en la wallet operativa.', 'Reglas de privacidad y límites de frecuencia.'],
    kpi: 'Conversión de la oferta frente a un grupo sin oferta.',
    horizonte: 'Exploración',
    esfuerzo: 'Medio',
    referencias: [REF.starbucks],
    tickets: [],
  },
]
