// Entregables de la propuesta del equipo Shiro para el reto «Click & Collect a bordo».
export type Estado = 'listo' | 'borrador' | 'en-preparacion'

export type Entregable = {
  id: string
  ruta: string
  num: string
  icono: string
  titulo: string
  resumen: string
  estado: Estado
  /** Qué responde del reto de Fred. Olsen */
  respondeA: string
  /** Contenido previsto (para los que están en preparación) */
  incluira: string[]
}

export const ESTADO_LABEL: Record<Estado, string> = {
  listo: 'Listo',
  borrador: 'Borrador',
  'en-preparacion': 'En preparación',
}

export const ENTREGABLES: Entregable[] = [
  {
    id: 'benchmark',
    ruta: '/benchmark',
    num: '01',
    icono: 'search',
    titulo: 'Benchmark',
    resumen: '17 navieras y 39 referentes de Click & Collect analizados: qué funciona, qué no copiar y cómo lo trasladamos al Bajamar Express.',
    estado: 'listo',
    respondeA: 'Innovación y experiencia de usuario: decisiones de diseño apoyadas en evidencia.',
    incluira: [],
  },
  {
    id: 'implementacion',
    ruta: '/implementacion',
    num: '02',
    icono: 'wrench',
    titulo: 'Plan de implementación',
    resumen: 'Fases, integraciones (TPV, pagos, Tarjeta Plus), recursos, costes y beneficios estimados, y riesgos.',
    estado: 'en-preparacion',
    respondeA: 'Viabilidad técnica y económica, y escalabilidad (22 % de la valoración; preguntas 8, 9 y 11).',
    incluira: [
      'Fase 0, MVP del piloto: web FredOnBoard con acceso por billete, Click & Collect y pre-pedido; tablet de barra y panel de manager; conciliación diaria.',
      'Fase 1: integración por API con el TPV y la pasarela de pago.',
      'Fase 2: FredOnBoard completo dentro de la app (viaje en tiempo real, destino, valoración, Plus Points) y extensión al resto de la flota.',
      'Arquitectura local-first a bordo, requisitos de conectividad y supuestos a validar.',
      'Estimación razonada de costes y beneficios, con los supuestos explícitos.',
    ],
  },
  {
    id: 'comunicacion',
    ruta: '/comunicacion',
    num: '03',
    icono: 'megaphone',
    titulo: 'Plan de comunicación',
    resumen: 'Cómo damos a conocer FredOnBoard a pasajeros y tripulación para que se use desde el primer viaje sin perjudicar la barra.',
    estado: 'en-preparacion',
    respondeA: 'Adopción del servicio y convivencia de canales (pregunta 14).',
    incluira: [
      'Puntos de contacto: email de confirmación del billete, QR en el asiento, portal wifi, megafonía, cartelería y la app.',
      'Mensajes clave con tono cercano y canario («contigo desde siempre»): sin colas, producto KM0, pide sin levantarte.',
      'Formación y comunicación interna para la tripulación.',
      'Incentivos de lanzamiento (p. ej. Plus Points en el primer pedido) y KPIs de comunicación.',
    ],
  },
  {
    id: 'journey',
    ruta: '/journey',
    num: '04',
    icono: 'route',
    titulo: 'User journey',
    resumen: 'Recorrido interactivo de FredOnBoard antes, durante y después del viaje, desde tres perfiles: pasajera, barra y manager.',
    estado: 'listo',
    respondeA: '«Mostrar lo que hace el pasajero y lo que ocurre detrás» (pregunta 2 del reto).',
    incluira: [
      'Journey del pasajero: embarque → QR del asiento → pedido → pago → aviso «listo» → recogida → valoración.',
      'Journey de la tripulación: recepción en la tablet de barra → preparación → aviso → entrega con QR.',
      'Perfiles: pasajero frecuente, turista, familia, persona mayor sin móvil, Clase Oro.',
      'Casos difíciles: sin conexión, producto agotado, cancelación, pedido no recogido.',
    ],
  },
  {
    id: 'prototipo',
    ruta: '/prototipo',
    num: '05',
    icono: 'phone',
    titulo: 'Prototipo',
    resumen: 'FredOnBoard navegable: la web del pasajero (sin instalar, también dentro de la app), la tablet de barra y el panel del manager.',
    estado: 'borrador',
    respondeA: '«Un prototipo que nos permita entender el servicio completo» (pregunta 1 del reto).',
    incluira: [
      'Pasajero: acceso con el billete (sin cuenta), pre-pedido, carta con stock real, franja de recogida, pago, aviso y QR.',
      'Asistente híbrido: interfaz guiada con un chat de IA opcional (ES/EN/DE) para dudas.',
      'Barra: previsión por salida, cola por franjas, pausa de pedidos, agotados y entrega con QR.',
      'Manager: panel en vivo, carta/precios/stock, reglas de capacidad y analítica de KPIs.',
      'Funcionamiento sin conexión y protección contra pedidos duplicados.',
    ],
  },
  {
    id: 'piloto',
    ruta: '/piloto',
    num: '06',
    icono: 'flask',
    titulo: 'Piloto (PoC)',
    resumen: 'Cómo lo probaríamos en el barco: buque, duración, línea base, KPIs y criterios de éxito para decidir si escalar.',
    estado: 'en-preparacion',
    respondeA: '«Cómo demostramos que aumentan las ventas» y «en qué barco o ruta» (preguntas 12 y 13).',
    incluira: [
      'MVP: sin cuenta para el pasajero (identificación por billete), Click & Collect a bordo y pre-pedido antes de embarcar, con tablet de barra y panel de manager.',
      'Diseño de 6 semanas: 2 de línea base y 4 con el servicio, en el Bajamar Express (franja de mañana, 1 cafetería).',
      'Grupo de control: Bañaderos Express, mismo tipo de buque y ruta.',
      'KPIs: % de pasajeros que compran (hoy ≈ 23 %), venta por pasajero (1,37 €), ticket medio (5,90 €), espera y carga del equipo.',
      'Criterios de éxito y de parada, y plan de escalado a la flota.',
    ],
  },
]
