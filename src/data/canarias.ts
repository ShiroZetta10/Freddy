// Conexión canaria: datos oficiales de la presentación del reto (Fred. Olsen Express, Hackathon Talento Canario).
// Úsalo en planes, journey y prototipo para que lo canario sea un hilo visible, no una sección aparte.

export const FO_OFICIAL = {
  anios: '+50 años (desde 1974, Ferry Gomera San Sebastián–Los Cristianos)',
  buques: 14,
  flota: '8 alta velocidad, 1 ferry convencional, 2 miniferris y 3 de carga',
  rutas: 11,
  viajesAnio: 26000,
  islas: 7,
  profesionales: 1000,
  satisfaccion: 8.81,
  nps: 63.8,
  sociosPlus: 397000,
  visitasWebMes: 450000,
  seguidoresRRSS: 178000,
}

/** Los cuatro ejes con los que Fred. Olsen se presenta, y cómo responde FredOnBoard. */
export const EJES_CANARIOS = [
  {
    id: 'identidad',
    icono: 'anchor',
    titulo: 'Identidad local',
    suyo: '«Con Corazón Canario», «Elaborado en Canarias», «Lo nuestro viaja contigo», «Contigo desde siempre».',
    nuestro: 'Producto canario y KM0 destacado y filtrable en la carta, proveedores locales con nombre, y tienda a bordo con producto de las islas.',
  },
  {
    id: 'sostenibilidad',
    icono: 'trend',
    titulo: 'En Armonía con el Mar',
    suyo: '+90 medidas medioambientales: papel cero, menos plásticos, ODS Agenda 2030.',
    nuestro: 'Ticket y recibo digitales (cero papel), opción «sin cubiertos ni bolsa» y menos desperdicio gracias a la previsión por escandallo.',
  },
  {
    id: 'talento',
    icono: 'users',
    titulo: 'Talento canario',
    suyo: 'Alianza con el Gobierno de Canarias y Zetta10 para impulsar el desarrollo profesional joven en el archipiélago.',
    nuestro: 'Diseñado y construido por el equipo Shiro, talento canario, con stack abierto que puede mantener un equipo local.',
  },
  {
    id: 'joven',
    icono: 'phone',
    titulo: 'Público joven y 100 % digital',
    suyo: 'Tarifa Joven (12–25 años, hasta −25 %), app, check-in digital, wifi a bordo y On Board Club.',
    nuestro: 'FredOnBoard vive dentro de On Board Club: pedir sin levantarse y sin instalar nada, con ventajas para billetes de Tarifa Joven.',
  },
]

/** Las 4 barreras de compra que identifica Fred. Olsen y qué hace FredOnBoard con cada una. */
export const BARRERAS = [
  { id: 'desplazamiento', titulo: 'Desplazamiento', suyo: 'Para comprar hay que levantarse e ir a la cafetería.', nuestro: 'Pides y pagas desde donde estés sentado; solo te levantas cuando está listo.' },
  { id: 'espera', titulo: 'Espera', suyo: 'Colas y tiempos de atención desaniman.', nuestro: 'Franjas de recogida con tope y aviso «listo» con QR: recoger es cosa de segundos.' },
  { id: 'visibilidad', titulo: 'Visibilidad', suyo: 'Al acomodarse, la oferta deja de estar presente.', nuestro: 'Carta en On Board Club, portal wifi y QR en las mesas del salón; avisos en el momento oportuno.' },
  { id: 'momento', titulo: 'Momento de compra', suyo: 'El deseo se aplaza y se pierde.', nuestro: 'Pre-pedido antes de embarcar y recordatorio antes del cierre de pedidos.' },
]

/** Hipótesis oficiales del reto («las hipótesis no son resultados»). */
export const HIPOTESIS_OFICIALES = [
  'El pasajero utilizará su móvil para realizar pedidos durante el viaje.',
  'La recogida podrá organizarse sin generar nuevas colas.',
  'El sistema podrá impulsar compras adicionales y elevar el ticket medio.',
  'La operativa podrá integrarse sin ampliar inicialmente la dotación.',
]

/** Tipos de travesía de la red para razonar el escalado (rutas de la presentación). */
export const TIPOS_TRAVESIA = [
  { tipo: 'Miniferri / costera', ejemplo: 'Playa Blanca–Corralejo (25 min), costera de La Gomera (30–40 min)', modo: 'Solo pre-pedido y recogida al embarcar; carta corta.' },
  { tipo: 'Fast ferry corto', ejemplo: 'Los Cristianos–San Sebastián (50 min)', modo: 'Click & Collect con cierre temprano de pedidos.' },
  { tipo: 'Fast ferry medio', ejemplo: 'Santa Cruz–Agaete (1 h 20, Bajamar Express: piloto)', modo: 'Modelo completo: pre-pedido, franjas, aviso y QR.' },
  { tipo: 'Fast ferry largo', ejemplo: 'Las Palmas–Morro Jable (2 h), Los Cristianos–Valverde (2 h 20), Los Cristianos–Santa Cruz de La Palma (2 h 30)', modo: 'Dos servicios (ida y llegada), más tienda a bordo.' },
  { tipo: 'Ferry convencional', ejemplo: 'Canarias–Huelva (33 h)', modo: 'Pedidos por comidas, reserva de mesa en restaurante y tienda.' },
]

export const LEMA = 'La sonrisa que acompaña cada viaje'
