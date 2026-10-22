// Puente benchmark → solución: cada cuestión abierta del reto (documento "Preguntas y respuestas")
// con lo que hacen los referentes y la decisión que proponemos para el Bajamar Express.

export type Reto = {
  id: string
  icono: string
  pregunta: string
  queDiceFredOlsen: string
  referentes: { id: string; nombre: string; aprendizaje: string }[]
  propuesta: string[]
  kpi: string
  criterio: 'ux' | 'innovacion' | 'viabilidad' | 'escalabilidad'
}

export const RETOS: Reto[] = [
  {
    id: 'colas',
    icono: '⏱',
    pregunta: '¿Cómo evitamos crear otra cola para recoger?',
    queDiceFredOlsen: 'Franjas de recogida, avisos o un punto de entrega, explicando cómo encaja en el espacio del barco y cómo se validaría.',
    referentes: [
      { id: 'chipotle', nombre: 'Chipotle', aprendizaje: 'Una línea de preparación digital separada y estanterías de recogida: el pedido móvil no compite con la cola física.' },
      { id: 'starbucks', nombre: 'Starbucks', aprendizaje: 'Su éxito creó cuellos de botella en la recogida. Ahora el barista puede pausar los pedidos móviles en hora punta.' },
      { id: 'avanti-west-coast-at-seat-order', nombre: 'Avanti West Coast', aprendizaje: 'Recogida con aviso por SMS, o entrega en el asiento. En su prueba la gente prefirió la entrega.' },
      { id: 'dominos-tracker', nombre: "Domino's", aprendizaje: 'El seguimiento del estado del pedido convierte la espera en algo previsible.' },
    ],
    propuesta: [
      'Punto «Pedidos móvil» en un tramo de barra de cada cafetería, con cartel y numeración propios.',
      'Pantalla de 3 estados (Recibido → Preparando → Listo) y aviso push en la web: el pasajero solo se levanta cuando está listo.',
      'Recoger es enseñar un QR o un número de 3 cifras en 5 segundos, sin cobro ni preguntas en la barra.',
    ],
    kpi: 'Tiempo desde «Listo» hasta la recogida (< 2 min) · Longitud de cola en barra antes y después',
    criterio: 'ux',
  },
  {
    id: 'picos',
    icono: '📈',
    pregunta: '¿Qué pasa si entran muchos pedidos a la vez?',
    queDiceFredOlsen: 'Contemplar la capacidad real del equipo: limitar los pedidos simultáneos o ajustar los tiempos de recogida, de forma justificada.',
    referentes: [
      { id: 'ouigo-espana-smartbar', nombre: 'OUIGO SMARTBAR', aprendizaje: 'Ventana de pedido desde 15 min antes de salir hasta 20 min antes de llegar, con franjas de entrega elegibles.' },
      { id: 'skippio-southampton', nombre: 'Skippio', aprendizaje: 'Franjas de recogida con capacidad limitada durante el descanso del partido.' },
      { id: 'starbucks', nombre: 'Starbucks', aprendizaje: 'Botón de pausa para el barista y tiempos estimados realistas.' },
    ],
    propuesta: [
      'Franjas de 5 minutos con un tope de pedidos por cafetería, calculado a partir de la capacidad real de la barra (supuesto a validar en el piloto).',
      'Pedidos abiertos desde el embarque y cerrados ~20 min antes de atracar: la carga se reparte durante los 80 minutos.',
      'Botón «Pausar pedidos» en la tablet de barra. Si una franja se llena, se ofrece la siguiente en lugar de rechazar el pedido.',
    ],
    kpi: 'Pedidos por franja vs. capacidad · % de franjas saturadas · Pedidos servidos tarde',
    criterio: 'innovacion',
  },
  {
    id: 'stock',
    icono: '📦',
    pregunta: '¿Cómo sabemos qué productos están disponibles?',
    queDiceFredOlsen: 'Evitar vender agotados y explicar cómo se mantiene la disponibilidad actualizada.',
    referentes: [
      { id: 'airfi', nombre: 'AirFi', aprendizaje: 'Stock en tiempo real desde el propio carrito, con aviso de agotado, en más de 500 aviones.' },
      { id: 'immfly-iberia-express', nombre: 'Immfly + Iberia Express', aprendizaje: 'El pedido está conectado al TPV y al stock de cada vuelo.' },
      { id: 'ouigo-espana-smartbar', nombre: 'OUIGO', aprendizaje: 'Si falta un producto se cancela el pedido entero. Un fallo de experiencia que no debemos copiar.' },
    ],
    propuesta: [
      'Stock inicial por travesía cargado desde el TPV o a mano. Cada venta (móvil o barra) lo descuenta.',
      'El producto se oculta al llegar a un umbral bajo, no a cero, para no vender lo último que se está despachando en barra.',
      'Interruptor de agotado en un toque en la tablet. Si algo falla después de pagar, se ofrece sustituirlo o devolver solo esa línea.',
    ],
    kpi: 'Pedidos con producto agotado (objetivo: 0) · Sustituciones aceptadas',
    criterio: 'innovacion',
  },
  {
    id: 'conexion',
    icono: '📶',
    pregunta: '¿Qué pasa si el barco tiene mala conexión?',
    queDiceFredOlsen: 'Describir la experiencia del pasajero y cómo se evitan los pedidos o pagos duplicados. La conectividad real hay que confirmarla.',
    referentes: [
      { id: 'wizz-air-bluetooth-ordering', nombre: 'Wizz Air', aprendizaje: 'Pedido por Bluetooth sin internet en más de 260 aviones.' },
      { id: 'swipestation-uk', nombre: 'SwipeStation', aprendizaje: 'QR validado sin conexión y cola de menos de 15 segundos.' },
      { id: 'airfi', nombre: 'AirFi', aprendizaje: 'Una caja con red local a bordo que sincroniza con la nube cuando hay conexión.' },
    ],
    propuesta: [
      'Arquitectura «local-first»: un servidor ligero a bordo sirve la web por el wifi del barco aunque Starlink caiga.',
      'Cada pedido lleva un ID único generado en el móvil (clave de idempotencia): reintentar nunca crea un segundo pedido ni un segundo cobro.',
      'Pago pre-autorizado y cobrado al entregar. Si el estado es dudoso, se muestra «Comprobando pago» y se bloquea el doble cobro.',
    ],
    kpi: 'Pedidos duplicados (objetivo: 0) · Pedidos completados durante cortes de enlace',
    criterio: 'innovacion',
  },
  {
    id: 'integracion',
    icono: '🔌',
    pregunta: '¿Hay que integrarlo con el TPV o los sistemas actuales?',
    queDiceFredOlsen: 'Identificar las integraciones necesarias, sin dar por hecho que habrá integración durante el hackathon.',
    referentes: [
      { id: 'immfly-iberia-express', nombre: 'Immfly + Iberia Express', aprendizaje: 'El mayor incremento publicado (+42 % de ticket medio) llega con el pedido conectado al TPV.' },
      { id: 'tampa-bay-rays-shift4', nombre: 'Tampa Bay Rays · Shift4', aprendizaje: 'El pedido móvil va sobre el mismo TPV del recinto.' },
      { id: 'qamarero', nombre: 'Qamarero', aprendizaje: 'Una plataforma QR española que se integra con los TPV de hostelería más comunes.' },
    ],
    propuesta: [
      'Fase 0 (piloto): funciona sin integración, con tablet de barra y conciliación diaria por exportación.',
      'Fase 1: integración por API con el TPV (catálogo, precios, stock y ventas) y con la pasarela de pago.',
      'Fase 2: Tarjeta Plus / Plus Points y datos para la previsión de demanda.',
    ],
    kpi: 'Horas de conciliación manual · Diferencias entre ventas web y TPV',
    criterio: 'escalabilidad',
  },
  {
    id: 'convivencia',
    icono: '🤝',
    pregunta: '¿Cómo atendemos a quien no quiera usar el móvil?',
    queDiceFredOlsen: 'Contemplar a distintos perfiles de pasajero y evitar que un canal perjudique al otro.',
    referentes: [
      { id: 'airfi', nombre: 'AirFi', aprendizaje: 'La tripulación cobra con el mismo sistema, también en efectivo: un único stock para los dos canales.' },
      { id: 'chipotle', nombre: 'Chipotle', aprendizaje: 'Dos líneas de preparación: lo digital no le quita turno al cliente presencial.' },
      { id: 'mashgin-ut-austin', nombre: 'Mashgin', aprendizaje: 'El autocobro rápido descongestiona sin sustituir la atención.' },
    ],
    propuesta: [
      'La barra tradicional sigue igual. El canal móvil solo le quita gente a la cola.',
      'Regla de convivencia: como máximo 1 pedido móvil por cada N clientes presenciales en los picos (N a calibrar).',
      'Web accesible (letra grande, alto contraste, ES/EN/DE) y la opción de que un acompañante pida por otro.',
    ],
    kpi: 'Espera en la cola presencial (no debe empeorar) · Satisfacción por canal',
    criterio: 'ux',
  },
  {
    id: 'errores',
    icono: '🧾',
    pregunta: '¿Qué hacemos con errores, cancelaciones o problemas de pago?',
    queDiceFredOlsen: 'Cubrir los casos principales con una forma sencilla de resolverlos. Las condiciones de devolución se validan con la empresa.',
    referentes: [
      { id: 'ouigo-espana-smartbar', nombre: 'OUIGO', aprendizaje: 'Cancelación gratuita hasta que empieza la franja. Pre-autorización y cobro tras la entrega.' },
      { id: 'starbucks', nombre: 'Starbucks', aprendizaje: 'Prepago obligatorio y pago en un toque con wallet.' },
    ],
    propuesta: [
      'Cancelar con un toque mientras el pedido esté «Recibido». Al pasar a «Preparando» ya no se puede cancelar.',
      'Pedido no recogido al atracar: aviso final y política a definir con Fred. Olsen (devolución o vale).',
      'Apple Pay / Google Pay / tarjeta sin registro. Bizum y Plus Points según lo que valide la empresa.',
    ],
    kpi: '% de incidencias resueltas sin intervención de la tripulación · Pedidos no recogidos',
    criterio: 'viabilidad',
  },
  {
    id: 'piloto',
    icono: '🧪',
    pregunta: '¿Cómo demostramos que aumentan las ventas?',
    queDiceFredOlsen: 'Un piloto comparado con una situación de referencia: uso, venta por pasajero, importe de pedidos, tiempos de espera y efecto sobre el equipo.',
    referentes: [
      { id: 'immfly-iberia-express', nombre: 'Iberia Express', aprendizaje: '+41 % de pedidos, +42 % de ticket medio y +29 % de gasto por pasajero a 4 meses (dato del proveedor).' },
      { id: 'tampa-bay-rays-shift4', nombre: 'Tampa Bay Rays', aprendizaje: '+44 % de gasto por asistente en los puestos con pedido móvil (dato del proveedor).' },
      { id: 'molslinjen', nombre: 'Molslinjen', aprendizaje: 'Pre-pedido en un ferry de 80-90 minutos: el comparable más cercano a nuestra ruta.' },
    ],
    propuesta: [
      'Piloto de 6 semanas en el Bajamar Express: 2 de línea base, 4 con el servicio, empezando por una cafetería y la franja de mañana.',
      'Comparación con las mismas salidas de la línea base y con el Bañaderos Express como control (mismo tipo de buque y ruta).',
      'Cuadro de mando en vivo: adopción, venta por pasajero (hoy 1,37 €), ticket medio (hoy 5,90 €), espera, incidencias y carga del equipo.',
    ],
    kpi: 'Venta por pasajero · Ticket medio · % pasajeros que compran (hoy ≈ 23 %)',
    criterio: 'viabilidad',
  },
]
