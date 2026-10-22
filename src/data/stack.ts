// Opciones de integración de FredOnBoard con Ágora (TPV de Fred. Olsen) y fuentes públicas sobre Ágora.
// Lo que sabemos de Ágora sale de fuentes públicas (web del producto y guías de integración); el resto se valida con la empresa.

export type OpcionStack = {
  id: string
  nombre: string
  resumen: string
  como: string[]
  pros: string[]
  contras: string[]
  esfuerzo: 'Bajo' | 'Medio' | 'Alto'
  cuando: string
  recomendada?: boolean
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
    recomendada: true,
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
    contras: ['Más dependencias y plazos de IT', 'Requiere conocer su stack corporativo'],
    esfuerzo: 'Alto',
    cuando: 'Escalado a la flota, si así lo pide IT.',
  },
]

export const FUENTES_AGORA = [
  { t: 'Ágora: ficha del producto (softwaredoit.es)', url: 'https://www.softwaredoit.es/agora/agora.html' },
  { t: 'Ágora POS API: guía de integración (chift.eu)', url: 'https://www.chift.eu/blog/agora-pos-api-integration-how-to-connect-set-up-and-follow-best-practices' },
  { t: 'Integración de Ágora con Recipok (token y URL del TPV)', url: 'https://recipok.com/wp-content/uploads/2024/05/Integracion-de-Agora-con-Recipok-Presentacion-1.pdf' },
]
