// User journey de FredOnBoard: compañero de viaje digital de Fred. Olsen Express.
// 3 perfiles (pasajero, barra, manager) × 6 momentos agrupados en 4 fases.
// MVP del piloto: sin cuenta para el cliente, identificación por billete, Click & Collect y pre-pedido.

export type PerfilId = 'pasajero' | 'barra' | 'manager'
export type Fase = 'Antes' | 'Embarque' | 'A bordo' | 'Llegada y después'

export type Pantalla = {
  titulo: string
  sub?: string
  items?: { l: string; r?: string; estado?: 'ok' | 'warn' | 'off' | 'info' }[]
  cta?: string
  nota?: string
  kpis?: { l: string; v: string }[]
}

/** Mensaje al cliente por un canal (WhatsApp, email, notificación push…) en ese momento del viaje. */
export type Canal = {
  tipo: 'whatsapp' | 'email' | 'push' | 'wifi'
  de: string
  asunto?: string
  hora: string
  lineas: string[] // párrafos; las líneas que empiezan por "→ " se pintan como enlace/botón FredOnBoard
  nuevo?: string // qué añade FredOnBoard al mensaje actual de Fred. Olsen
}

export type Paso = {
  fase: Fase
  /** posición en la ruta 0..1 para el barco de la barra de progreso */
  progreso: number
  hora: string
  titulo: string
  hace: string
  dolor: string
  solucion: string
  mvp: boolean
  pantalla: Pantalla
  canales?: Canal[]
}

export type Perfil = {
  id: PerfilId
  nombre: string
  quien: string
  dispositivo: 'movil' | 'tablet' | 'portatil'
  icono: string
  pasos: Paso[]
}

export const FASES: Fase[] = ['Antes', 'Embarque', 'A bordo', 'Llegada y después']

export const PERFILES: Perfil[] = [
  {
    id: 'pasajero',
    nombre: 'Pasajera',
    quien: 'Carmen, 38 años. Viaja de Santa Cruz a Agaete por trabajo un par de veces al mes. Sale temprano y no desayuna en casa.',
    dispositivo: 'movil',
    icono: 'users',
    pasos: [
      {
        fase: 'Antes',
        progreso: 0,
        hora: 'Día anterior · 21:10',
        titulo: 'Compra el billete y descubre FredOnBoard',
        hace: 'En el email de confirmación aparece «Tu viaje con FredOnBoard». Lo abre sin descargar nada ni crear una cuenta: su localizador de billete la identifica.',
        dolor: 'Hoy no sabe qué hay a bordo ni a qué hora conviene ir a la cafetería.',
        solucion: 'Un único enlace con su viaje, su asiento y lo que puede pedir. Sin registro.',
        mvp: true,
        canales: [
          {
            tipo: 'email',
            de: 'Fred. Olsen Express',
            asunto: 'Confirmación de tu reserva FO7K2Q · Santa Cruz → Agaete',
            hora: 'Miércoles 21:10',
            lineas: [
              'Hola, Carmen: tu reserva está confirmada.',
              'Localizador: FO7K2Q · Trayecto: Santa Cruz de Tenerife – Agaete · Salida: jueves 08:00 · Asiento 42C.',
              'No es necesario imprimir tu billete. Solo debes presentar tu propia documentación.',
              '→ Tu viaje con FredOnBoard: pide tu desayuno y recógelo sin colas',
            ],
            nuevo: 'Bloque FredOnBoard en el email de confirmación que ya se envía.',
          },
        ],
        pantalla: {
          titulo: 'Hola, Carmen',
          sub: 'Santa Cruz → Agaete · jueves 08:00 · Asiento 42C',
          items: [
            { l: 'Bajamar Express', r: '80 min' },
            { l: 'Embarque desde', r: '07:30' },
            { l: 'Desayuno a bordo', r: 'Pídelo ya', estado: 'info' },
          ],
          cta: 'Pide tu desayuno',
          nota: 'Identificada con tu billete · sin cuenta',
        },
      },
      {
        fase: 'Antes',
        progreso: 0.04,
        hora: 'Día anterior · 21:12',
        titulo: 'Pre-pide el desayuno',
        hace: 'Elige un café cortado y un bocadillo de pollo gourmet, escoge la franja de recogida 08:15–08:20 y paga con Apple Pay. El pedido se cierra antes de zarpar.',
        dolor: 'Al zarpar, toda la mañana se concentra en la barra: es la franja de más ventas (38 % de la facturación).',
        solucion: 'Pre-pedido con franja: la barra sabe lo que tiene que preparar antes del pico.',
        mvp: true,
        canales: [
          {
            tipo: 'email',
            de: 'FredOnBoard · Fred. Olsen Express',
            asunto: 'Tu pedido #214 para el jueves está confirmado',
            hora: 'Miércoles 21:12',
            lineas: [
              'Café cortado y bocadillo de pollo gourmet · 7,62 € (pagado).',
              'Recógelo de 08:15 a 08:20 en la Cafetería Proa (cubierta 5), en el punto FredOnBoard.',
              'Puedes cancelarlo gratis hasta que empiece tu franja.',
              '→ Ver o cambiar mi pedido',
            ],
            nuevo: 'Confirmación con ticket, franja y política de cancelación.',
          },
        ],
        pantalla: {
          titulo: 'Tu desayuno',
          items: [
            { l: 'Café cortado', r: '1,90 €' },
            { l: 'Bocadillo pollo gourmet', r: '5,72 €' },
            { l: 'Recogida 08:15–08:20', r: 'Cafetería Proa', estado: 'info' },
          ],
          cta: 'Pagar 7,62 € con Apple Pay',
          nota: 'Puedes cancelar hasta que empiece tu franja',
        },
      },
      {
        fase: 'Embarque',
        progreso: 0.12,
        hora: 'Jueves · 07:45',
        titulo: 'Embarca y FredOnBoard se activa',
        hace: 'Se conecta al wifi del barco o escanea el QR de su asiento. FredOnBoard reconoce su billete y le muestra el estado del viaje y su pedido.',
        dolor: 'Hoy hay incertidumbre: dónde está la cafetería, cuándo llegamos, si hay cola.',
        solucion: 'Estado del viaje en vivo y mapa sencillo del barco, aunque falle la conexión: la web se sirve a bordo.',
        mvp: true,
        canales: [
          {
            tipo: 'whatsapp',
            de: 'Fred. Olsen Express',
            hora: 'Jueves 06:30',
            lineas: [
              'Hola, Carmen: ya falta muy poco para tu viaje a Agaete. Estamos encantados de acompañarte en esta travesía.',
              'Datos de tu reserva: Localizador FO7K2Q · Trayecto Santa Cruz de Tenerife – Agaete · Salida 08:00.',
              'Embarque: al viajar sin vehículo, debes estar lista para embarcar al menos 20 minutos antes de la salida.',
              'Documentación: no es necesario imprimir tu billete. Solo debes presentar tu propia documentación.',
              '→ Tu desayuno #214 te espera a bordo de 08:15 a 08:20. Sigue tu viaje con FredOnBoard',
              'Atención al cliente: 922 290 070 / 928 290 070. ¡Gracias por elegirnos!',
            ],
            nuevo: 'El WhatsApp de recordatorio que Fred. Olsen ya envía, con una línea FredOnBoard: el pedido y el enlace al viaje.',
          },
          {
            tipo: 'wifi',
            de: 'Wifi a bordo · Bajamar Express',
            hora: 'Jueves 07:45',
            lineas: ['Bienvenida a bordo. Conectada al wifi gratuito.', '→ Abrir FredOnBoard (no necesitas datos móviles)'],
            nuevo: 'Página de bienvenida del portal wifi que abre FredOnBoard.',
          },
        ],
        pantalla: {
          titulo: 'A bordo del Bajamar Express',
          sub: 'Llegada estimada 09:20 · Mar en calma',
          items: [
            { l: 'Tu pedido #214', r: 'Recibido', estado: 'ok' },
            { l: 'Cafetería Proa', r: 'Cubierta 5' },
            { l: 'Wifi del barco', r: 'Conectado', estado: 'ok' },
          ],
          cta: 'Ver la carta',
        },
      },
      {
        fase: 'A bordo',
        progreso: 0.45,
        hora: 'Jueves · 08:40',
        titulo: 'Pide desde el asiento',
        hace: 'A mitad de travesía le apetece un agua. La pide en dos toques. Solo ve productos disponibles y la siguiente franja libre.',
        dolor: 'Levantarse, hacer cola y descubrir que algo se ha agotado. Muchos pasajeros no compran por eso.',
        solucion: 'Stock real, franjas con capacidad y pedido que no se duplica aunque se corte la conexión.',
        mvp: true,
        pantalla: {
          titulo: 'Carta · Cafetería Proa',
          items: [
            { l: 'Agua sin gas 1/2', r: '1,75 €' },
            { l: 'Sándwich mixto', r: '5,70 €' },
            { l: 'Croissant', r: 'Agotado', estado: 'off' },
          ],
          cta: 'Pedir · franja 08:50–08:55',
          nota: 'Sin conexión: tu pedido se enviará en cuanto vuelva',
        },
      },
      {
        fase: 'A bordo',
        progreso: 0.7,
        hora: 'Jueves · 08:52',
        titulo: 'Aviso y recogida en segundos',
        hace: 'Recibe el aviso «Tu pedido está listo». Va al punto FredOnBoard de la barra, enseña el QR y se lo llevan. ¿Dónde está la cafetería? Lo pregunta en el chat.',
        dolor: 'Esperar de pie sin saber cuándo estará listo.',
        solucion: 'Solo se levanta cuando toca. Recoger es enseñar un QR: sin cobro ni preguntas.',
        mvp: true,
        canales: [
          {
            tipo: 'push',
            de: 'FredOnBoard',
            hora: 'Jueves 08:52',
            lineas: ['Tu pedido #231 está listo', 'Recógelo en el punto FredOnBoard de la Cafetería Proa. Enseña tu QR.'],
            nuevo: 'Notificación del navegador o de la app; si no hay permiso, aviso dentro de la web.',
          },
        ],
        pantalla: {
          titulo: 'Tu pedido #231 está listo',
          sub: 'Punto FredOnBoard · Cafetería Proa',
          items: [{ l: 'Agua sin gas 1/2', r: 'Listo', estado: 'ok' }],
          cta: 'Mostrar QR de recogida',
          nota: 'Asistente: «La cafetería está en la cubierta 5, a la izquierda de la escalera»',
        },
      },
      {
        fase: 'Llegada y después',
        progreso: 1,
        hora: 'Jueves · 09:05 y después',
        titulo: 'Llegada, valoración y próximo viaje',
        hace: 'FredOnBoard le avisa 15 minutos antes de llegar, le recuerda el bus gratuito a Las Palmas y después le pide valorar el servicio. Recibe su ticket y Plus Points.',
        dolor: 'Hoy la relación termina al desembarcar: no hay valoración ni motivo para repetir.',
        solucion: 'Cierre del viaje y vínculo con el siguiente: valoración, Plus Points y oferta de desayuno para la vuelta.',
        mvp: false,
        canales: [
          {
            tipo: 'push',
            de: 'FredOnBoard',
            hora: 'Jueves 09:05',
            lineas: ['Llegamos a Agaete en 15 minutos', 'Bus gratuito a Las Palmas a la salida de la terminal.'],
          },
          {
            tipo: 'email',
            de: 'Fred. Olsen Express',
            asunto: '¿Qué tal tu viaje, Carmen?',
            hora: 'Jueves 11:00',
            lineas: [
              'Gracias por viajar con nosotros. Aquí tienes el ticket de tus consumos a bordo (9,37 €).',
              'Has ganado 9 Plus Points con tus pedidos FredOnBoard.',
              '→ Valora tu experiencia en 10 segundos',
              '→ Pre-pide tu desayuno para el viaje de vuelta',
            ],
            nuevo: 'Email posviaje: ticket, puntos, valoración y siguiente viaje (hoja de ruta).',
          },
        ],
        pantalla: {
          titulo: 'Llegamos en 15 min',
          sub: 'Agaete · Bus gratuito a Las Palmas 09:30',
          items: [
            { l: '¿Qué tal tu pedido?', r: '★★★★★', estado: 'info' },
            { l: 'Plus Points ganados', r: '+9' },
          ],
          cta: 'Pre-pedir para la vuelta',
          nota: 'Fuera del MVP: valoración, puntos y ofertas',
        },
      },
    ],
  },
  {
    id: 'barra',
    nombre: 'Barra',
    quien: 'Javi, camarero de la Cafetería Proa. Atiende la barra con una compañera en el turno de mañana.',
    dispositivo: 'tablet',
    icono: 'food',
    pasos: [
      {
        fase: 'Antes',
        progreso: 0,
        hora: 'Jueves · 07:00',
        titulo: 'Recibe la previsión del viaje',
        hace: 'Al empezar el turno, la tablet de barra muestra cuántos pre-pedidos hay para la salida de las 8:00 y qué productos piden.',
        dolor: 'Hoy el pico llega de golpe al zarpar, sin saber qué se va a pedir.',
        solucion: 'Previsión por salida: puede adelantar bocadillos y cafés antes del pico.',
        mvp: true,
        pantalla: {
          titulo: 'Salida 08:00 · Cafetería Proa',
          kpis: [
            { l: 'Pre-pedidos', v: '34' },
            { l: 'Franja más llena', v: '08:15' },
          ],
          items: [
            { l: 'Bocadillo pollo gourmet', r: '14' },
            { l: 'Café cortado', r: '21' },
            { l: 'Oferta bollería + café', r: '9' },
          ],
        },
      },
      {
        fase: 'Antes',
        progreso: 0.04,
        hora: 'Jueves · 07:20',
        titulo: 'Prepara por franjas',
        hace: 'Los pre-pedidos aparecen agrupados por franja de 5 minutos, con el tope de capacidad de la barra. Prepara lo que no se estropea.',
        dolor: 'Sin orden, los pedidos digitales compiten con la cola presencial.',
        solucion: 'Franjas con tope: nunca entran más pedidos de los que la barra puede servir.',
        mvp: true,
        pantalla: {
          titulo: 'Pedidos por franja',
          items: [
            { l: '08:10–08:15', r: '8 / 10', estado: 'ok' },
            { l: '08:15–08:20', r: '10 / 10', estado: 'warn' },
            { l: '08:20–08:25', r: '6 / 10', estado: 'ok' },
          ],
          nota: 'Franja llena: los pasajeros ven la siguiente libre',
        },
      },
      {
        fase: 'Embarque',
        progreso: 0.12,
        hora: 'Jueves · 07:40',
        titulo: 'Abre el servicio y revisa el stock',
        hace: 'Confirma el stock inicial de la travesía y marca con un toque lo que no hay hoy. La carta del pasajero se actualiza al instante.',
        dolor: 'Hoy se venden productos que luego no hay.',
        solucion: 'Interruptor de agotado en un toque; el producto se oculta antes de llegar a cero.',
        mvp: true,
        pantalla: {
          titulo: 'Stock de la travesía',
          items: [
            { l: 'Bocadillo pollo gourmet', r: '22' },
            { l: 'Croissant', r: 'Agotado', estado: 'off' },
            { l: 'Agua sin gas 1/2', r: '60' },
          ],
          cta: 'Abrir pedidos',
        },
      },
      {
        fase: 'A bordo',
        progreso: 0.45,
        hora: 'Jueves · 08:40',
        titulo: 'Prepara sin interrupciones',
        hace: 'Los pedidos entran en la tablet con su franja. Los pasa de «Recibido» a «Preparando» y «Listo» con un toque. Si se satura, pulsa «Pausar».',
        dolor: 'Tomar nota, cobrar y preparar a la vez alarga la cola.',
        solucion: 'El pedido ya llega pagado y ordenado: la barra solo prepara y entrega.',
        mvp: true,
        pantalla: {
          titulo: 'Cola de pedidos',
          items: [
            { l: '#229 · 2 cafés', r: 'Preparando', estado: 'warn' },
            { l: '#230 · Sándwich mixto', r: 'Recibido', estado: 'info' },
            { l: '#231 · Agua', r: 'Listo', estado: 'ok' },
          ],
          cta: 'Pausar pedidos 5 min',
        },
      },
      {
        fase: 'A bordo',
        progreso: 0.7,
        hora: 'Jueves · 08:52',
        titulo: 'Entrega con QR',
        hace: 'El pasajero llega al punto FredOnBoard y enseña su QR. Javi lo escanea y entrega. No hay cobro: ya está pagado.',
        dolor: 'Hoy cada entrega implica cobrar y dar cambio.',
        solucion: 'Entrega en 5 segundos y sin errores de pedido.',
        mvp: true,
        pantalla: {
          titulo: 'Entregar pedido',
          sub: 'QR escaneado · #231',
          items: [{ l: 'Agua sin gas 1/2', r: 'Pagado', estado: 'ok' }],
          cta: 'Marcar como entregado',
        },
      },
      {
        fase: 'Llegada y después',
        progreso: 1,
        hora: 'Jueves · 09:00',
        titulo: 'Cierre de pedidos y de caja',
        hace: 'Los pedidos se cierran 20 minutos antes de atracar. La tablet avisa de pedidos sin recoger y las ventas digitales se cuadran solas con el TPV.',
        dolor: 'Hoy se cuadra a mano al final del día.',
        solucion: 'Cierre automático y lista de incidencias para resolver antes de desembarcar.',
        mvp: true,
        pantalla: {
          titulo: 'Cierre de travesía',
          kpis: [
            { l: 'Pedidos FredOnBoard', v: '58' },
            { l: 'Sin recoger', v: '1' },
          ],
          items: [{ l: 'Conciliación con TPV', r: 'Correcta', estado: 'ok' }],
        },
      },
    ],
  },
  {
    id: 'manager',
    nombre: 'Manager',
    quien: 'Responsable de restauración a bordo de Fred. Olsen. Gestiona la carta, la capacidad y los resultados de toda la flota.',
    dispositivo: 'portatil',
    icono: 'trend',
    pasos: [
      {
        fase: 'Antes',
        progreso: 0,
        hora: 'Lunes · oficina',
        titulo: 'Configura carta, precios y stock',
        hace: 'Define la carta de FredOnBoard por buque y franja, los combos KM0 y el stock inicial de cada travesía.',
        dolor: 'Hoy cada buque gestiona su oferta por separado.',
        solucion: 'Una sola carta digital que se adapta por buque y momento del día.',
        mvp: true,
        pantalla: {
          titulo: 'Carta · Bajamar Express · Mañana',
          items: [
            { l: 'Oferta bollería + café', r: '4,20 €', estado: 'ok' },
            { l: 'Bocadillo pollo gourmet', r: '5,72 €', estado: 'ok' },
            { l: 'Combo KM0 desayuno', r: 'Nuevo', estado: 'info' },
          ],
          cta: 'Publicar en la flota',
        },
      },
      {
        fase: 'Antes',
        progreso: 0.04,
        hora: 'Jueves · 06:30',
        titulo: 'Ajusta la capacidad a la demanda',
        hace: 'Ve la previsión de la salida (pre-pedidos e histórico) y ajusta el tope de pedidos por franja y el horario de apertura y cierre.',
        dolor: 'Sin datos, la capacidad se adivina.',
        solucion: 'Reglas de capacidad configurables por buque, franja y cafetería.',
        mvp: true,
        pantalla: {
          titulo: 'Reglas de capacidad',
          items: [
            { l: 'Tope por franja de 5 min', r: '10 pedidos' },
            { l: 'Abrir pedidos', r: 'Al comprar el billete' },
            { l: 'Cerrar pedidos', r: '20 min antes de atracar' },
          ],
        },
      },
      {
        fase: 'Embarque',
        progreso: 0.12,
        hora: 'Jueves · 07:45',
        titulo: 'Sigue la flota en vivo',
        hace: 'El panel muestra los buques en ruta, los pasajeros conectados a FredOnBoard y los pre-pedidos de cada salida.',
        dolor: 'Hoy no hay visibilidad de lo que pasa a bordo hasta el cierre.',
        solucion: 'Panel en vivo de toda la flota.',
        mvp: true,
        pantalla: {
          titulo: 'Panel en vivo',
          kpis: [
            { l: 'Buques en ruta', v: '4' },
            { l: 'Pasajeros conectados', v: '612' },
            { l: 'Pre-pedidos', v: '118' },
          ],
        },
      },
      {
        fase: 'A bordo',
        progreso: 0.45,
        hora: 'Jueves · 08:40',
        titulo: 'Detecta saturación y actúa',
        hace: 'Una alerta indica que la Cafetería Proa supera el tiempo objetivo. Redirige pedidos a la cafetería de popa o envía un mensaje a los pasajeros.',
        dolor: 'Hoy los picos se descubren por las quejas.',
        solucion: 'Alertas con tiempos reales y acciones en un clic.',
        mvp: true,
        pantalla: {
          titulo: 'Alertas',
          items: [
            { l: 'Proa · espera 7 min', r: 'Objetivo 5', estado: 'warn' },
            { l: 'Popa · espera 2 min', r: 'OK', estado: 'ok' },
          ],
          cta: 'Sugerir Cafetería Popa',
        },
      },
      {
        fase: 'A bordo',
        progreso: 0.7,
        hora: 'Jueves · 08:55',
        titulo: 'Controla la recogida',
        hace: 'Revisa el tiempo desde «listo» hasta la recogida y las incidencias (pagos, agotados, cancelaciones).',
        dolor: 'Sin registro de incidencias no se puede mejorar.',
        solucion: 'Cada incidencia queda registrada con su causa.',
        mvp: true,
        pantalla: {
          titulo: 'Recogida e incidencias',
          kpis: [
            { l: 'Listo → recogido', v: '1:40' },
            { l: 'Incidencias', v: '2' },
          ],
          items: [{ l: 'Pago duplicado evitado', r: '1', estado: 'ok' }],
        },
      },
      {
        fase: 'Llegada y después',
        progreso: 1,
        hora: 'Viernes · informe',
        titulo: 'Mide el impacto',
        hace: 'Compara la venta por pasajero, la adopción y el ticket medio con la línea base del piloto y entre buques.',
        dolor: 'Hoy no se puede demostrar el efecto de un cambio.',
        solucion: 'KPIs del piloto listos para decidir si escalar.',
        mvp: true,
        pantalla: {
          titulo: 'Analítica del piloto',
          kpis: [
            { l: 'Venta por pasajero', v: '1,61 €' },
            { l: 'Base', v: '1,37 €' },
            { l: 'Adopción', v: '18 %' },
          ],
          nota: 'Cifras ilustrativas para el prototipo',
        },
      },
    ],
  },
]
