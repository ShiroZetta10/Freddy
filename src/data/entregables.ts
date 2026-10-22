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
    icono: '🔭',
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
    icono: '🛠',
    titulo: 'Plan de implementación',
    resumen: 'Fases, integraciones (TPV, pagos, Tarjeta Plus), recursos, costes y beneficios estimados, y riesgos.',
    estado: 'en-preparacion',
    respondeA: 'Viabilidad técnica y económica, y escalabilidad (22 % de la valoración; preguntas 8, 9 y 11).',
    incluira: [
      'Fase 0, piloto sin integración: tablet de barra y conciliación diaria.',
      'Fase 1: integración por API con el TPV y la pasarela de pago.',
      'Fase 2: Tarjeta Plus / Plus Points, previsión de demanda y extensión al resto de la flota.',
      'Arquitectura local-first a bordo, requisitos de conectividad y supuestos a validar.',
      'Estimación razonada de costes y beneficios, con los supuestos explícitos.',
    ],
  },
  {
    id: 'comunicacion',
    ruta: '/comunicacion',
    num: '03',
    icono: '📣',
    titulo: 'Plan de comunicación',
    resumen: 'Cómo lo damos a conocer a pasajeros y tripulación para que se use desde el primer viaje sin perjudicar la barra.',
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
    icono: '🧭',
    titulo: 'User journey',
    resumen: 'El recorrido completo del pasajero y de la tripulación: del embarque a la recogida, con los momentos de dolor y cómo los resolvemos.',
    estado: 'en-preparacion',
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
    icono: '📱',
    titulo: 'Prototipo',
    resumen: 'Web app (PWA) navegable: la vista del pasajero desde el asiento y la tablet de barra de la tripulación.',
    estado: 'borrador',
    respondeA: '«Un prototipo que nos permita entender el servicio completo» (pregunta 1 del reto).',
    incluira: [
      'Vista del pasajero: menú corto, franja de recogida, pago, estado del pedido y QR.',
      'Vista de barra: cola de pedidos por franja, pausa de pedidos e interruptor de agotados.',
      'Funcionamiento sin conexión y protección contra pedidos duplicados.',
    ],
  },
  {
    id: 'piloto',
    ruta: '/piloto',
    num: '06',
    icono: '🧪',
    titulo: 'Piloto (PoC)',
    resumen: 'Cómo lo probaríamos en el barco: buque, duración, línea base, KPIs y criterios de éxito para decidir si escalar.',
    estado: 'en-preparacion',
    respondeA: '«Cómo demostramos que aumentan las ventas» y «en qué barco o ruta» (preguntas 12 y 13).',
    incluira: [
      'Diseño de 6 semanas: 2 de línea base y 4 con el servicio, en el Bajamar Express (franja de mañana, 1 cafetería).',
      'Grupo de control: Bañaderos Express, mismo tipo de buque y ruta.',
      'KPIs: % de pasajeros que compran (hoy ≈ 23 %), venta por pasajero (1,37 €), ticket medio (5,90 €), espera y carga del equipo.',
      'Criterios de éxito y de parada, y plan de escalado a la flota.',
    ],
  },
]
