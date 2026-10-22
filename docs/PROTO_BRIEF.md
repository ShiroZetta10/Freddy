# Brief común · Prototipo FredOnBoard (equipo Shiro, Zetta10 · reto Fred. Olsen Express)

## Contexto del producto
FredOnBoard es el **compañero de viaje digital** de Fred. Olsen Express (naviera canaria). Ruta del prototipo:
Bajamar Express, Santa Cruz de Tenerife → Agaete, 80 min, 3 cafeterías (Proa, Popa, Clase Oro), wifi Starlink.
Núcleo del reto: **Click & Collect** = pedir y pagar sin levantarse (no hay asiento asignado) y recoger en barra **sin colas y sin aumentar tripulación**.
Decisiones del equipo:
- Se usa **antes, durante y después** del viaje. Web sin instalar (QR en las mesas / portal wifi) y también dentro de la app.
- Personalidad **híbrida**: interfaz guiada + chat con IA opcional (ES/EN/DE).
- 3 perfiles: **pasajero/a**, **barra/cafetería** (tablet), **admin/manager** (escritorio).
- **MVP del piloto**: sin cuenta para el pasajero (se identifica con el localizador del billete), Click & Collect y pre-pedido.
- Cuestiones del reto que la UI debe demostrar: no crear otra cola (franjas + aviso + QR), picos (tope por franja, pausa), no vender agotados (stock en vivo + umbral), mala conexión (pedido idempotente, cola offline), integración TPV, convivencia con barra/pasajeros sin móvil, cancelaciones/errores, KPIs del piloto.
- Datos reales de línea base: venta por pasajero 1,37 €, ticket medio 5,90 €, ≈23 % de pasajeros compra, mañana = pico (38 % facturación).

## Estética (obligatoria)
Sobria y profesional, en línea con fredolsen.es: azul marino `#0b3478`, fondo `#f4f6f9`/blanco, **amarillo `#ffcc00` solo para la acción principal**, rojo solo para errores. Open Sans. Iconos de línea (`src/components/Icon.tsx`, nombres disponibles: clock, shield, check, search, wrench, megaphone, route, phone, flask, trend, box, wifi, plug, users, receipt, qr, bell, card, food, anchor — puedes añadir los tuyos como SVG inline en tu carpeta, NO edites Icon.tsx). **Nada de emojis**, nada de degradados chillones. Animaciones con `framer-motion` (ya instalado, v11): transiciones de pantalla, listas con layout animations, micro-interacciones, spring suaves. Respeta `prefers-reduced-motion`.

## Arquitectura (ya hecha — NO modificar)
- `src/proto/store.ts`: estado compartido (localStorage + BroadcastChannel, reloj de viaje simulado, bot que genera pedidos de otros pasajeros). LÉELO ENTERO antes de empezar. Lectura: `useProtoState()` + `useMemo` para derivar (NO uses `useProto` con selectores que devuelvan arrays nuevos). Escritura: acciones exportadas (`crearPedido`, `avanzarPedido`, `cancelarPedido`, `entregarPorQR`, `setAgotado`, `setStock`, `setPrecio`, `setPausa`, `setAjustes`, `setViaje`, `enviarMensaje`, `setOnline`, `irAFase`, `resetDemo`, `kpis`, `franjas`, `disponible`, `fase`, `progreso`, `horaDe`, `qrDe`, `login`…) o `update()` para casos propios.
- `src/proto/shared.tsx`: `ProtoChrome` (barra superior con botón pantalla completa), `ToastProvider/useToast` (notificaciones push simuladas), `DemoControls` (ya montado por el shell), `ProductoArt` (ilustración de producto), `useFullscreen`.
- `src/proto/proto.css`: tokens `--fob-*` y clases base (`.fob`, `.fob-root`, `.fob-btn primary|navy|ghost|block`, `.fob-card`, `.fob-pill green|amber|red`, `.fob-chrome`, `.fob-chip-btn`). Úsalos.
- `src/proto/ProtoShell.tsx` monta las rutas: `/#/app/pasajero/*`, `/#/app/barra/*`, `/#/app/manager/*` (HashRouter, react-router-dom v6; dentro de tu vista usa rutas relativas o estado interno). También `/#/app/demo` mete las tres vistas en iframes (con `?embed=1` en el hash) → tu vista debe verse bien a 336×716 (pasajero), ~900×400 (barra) y ~900×440 (manager) además de a pantalla completa.
- Librerías disponibles: react 18, react-router-dom 6, framer-motion 11, qrcode.react 4 (`import { QRCodeSVG } from 'qrcode.react'`), recharts 2.

## Reglas de trabajo
- Trabajas SOLO dentro de tu carpeta `src/proto/<vista>/` (puedes crear varios archivos). Tu `index.tsx` debe exportar por defecto el componente de la vista y debe envolver todo en `<div className="fob fob-root">` con `<ProtoChrome titulo="…" />` arriba. Tu CSS en `<vista>.css` (importado desde index.tsx), con clases prefijadas (`pj-`, `br-`, `mg-`) para no chocar con otras vistas.
- NO edites archivos fuera de tu carpeta. Otros agentes están trabajando en paralelo en las otras vistas.
- Texto de la interfaz en español (salvo el selector de idioma del pasajero). Todo con datos del store, nada hardcodeado que contradiga el estado.
- Mobile-first y responsive. Áreas táctiles ≥ 44 px. Contraste AA.
- Verificación: `cd /home/claude/shiro && npx tsc -b 2>&1 | grep 'src/proto/<vista>'` debe salir vacío (ignora errores de otras carpetas: son de otros agentes en curso). Después levanta tu propio servidor `npx vite --port <tu puerto> --strictPort &` y prueba con Playwright en Python (Chromium ya instalado; `from playwright.sync_api import sync_playwright`) navegando a `http://localhost:<puerto>/#/app/<vista>`: recorre los flujos clicando, captura pantallas en móvil (390×844) y escritorio (1366×860) a `/tmp/claude-0/-home-claude/1bc26fcc-4b1a-51b9-aedf-9c6c35b878c9/scratchpad/shots/<vista>_*.png`, MÍRALAS con la herramienta Read y corrige lo que se vea mal. Comprueba que no hay `pageerror`. Si el error viene de otra carpeta, espera 30 s y reintenta. Al terminar, mata tu servidor (`kill` del PID que lanzaste; no uses pkill con patrón).
- Respuesta final: ≤200 palabras con lo que hiciste, rutas/pantallas y cualquier limitación.

## Ampliación: INVENTARIO POR ESCANDALLO (datos reales facilitados por Fred. Olsen)
Respuestas de la empresa (úsalas en textos y ayudas de la UI, sin inventar más):
- Aprovisionamiento planificado: **compra semanal** de aguas, refrescos, café, snacks y no perecederos; **catering fresco recibido a diario**.
- Cada referencia de venta tiene un **escandallo**: al vender una unidad, el sistema descuenta los insumos y cantidades correspondientes.
- Hoy el equipo de cafetería se avisa de palabra cuando algo se agota. Su programa tiene una función (aún no activada) para registrar el inventario inicial de perecederos con la compra diaria e indicar cuándo se agotan → FredOnBoard la aprovecha/activa.
- No hay máquinas expendedoras (servicio externalizado y gestión de fallos técnicos).
- No tienen frecuencia cuantificada de roturas de stock. Los pedidos de catering se ajustan a la previsión de pasajeros, comportamiento de venta y preferencias, para reducir faltas y mermas.
- La cantidad a bordo depende de: previsión de pasajeros, expectativa de venta, top 10 de productos, duración del trayecto y **capacidad de almacenamiento, sobre todo el frío (limitado)**.
- No hay datos de edad de los pasajeros.

API nueva en `src/proto/store.ts` (léela): tipos `Insumo`, `LineaEscandallo`, `Movimiento`; estado `insumos`, `escandallos`, `movimientos`, `almacen.frioLitros`, `aprovisionamiento`; funciones `porciones(s,pid)`, `insumoLimitante(s,pid)`, `costeProducto(s,pid)`, `consumo(s,lineas)`, `movimientoInventario(iid,delta,'entrada'|'merma'|'ajuste',ref)`, `contarInsumo(iid,contado)`, `setMinimoInsumo`, `setEscandallo(pid,lineas)`, `recibirCatering(cant?)`, `recibirCompraSemanal(cant?)`, `planAprovisionamiento(s,pasajeros,margen,tipo)`, `ocupacionFrio(s)`, constante `CONSUMO_POR_PASAJERO` (real del Bajamar para el top 10, `fuente:'real'|'est.'`). `p.stock` de cada producto es ahora una **caché derivada** = porciones según insumos (el insumo más escaso manda); `setStock(pid,n)` ajusta el insumo limitante. Vender o cancelar ya mueve el inventario automáticamente (con movimientos `venta`/`cancelacion`). El tick genera alertas «Inventario: X bajo mínimo».

## Ampliación: IDENTIDAD CANARIA (presentación oficial del reto)
Estado v3 (`fredonboard-proto-v3`, `version: 3`; los estados v2 se descartan al cargar).
- **On Board Club**: FredOnBoard se presenta «en On Board Club» (sello de texto en la bienvenida y en la cabecera del pasajero; ES/EN/DE). Sin logos.
- **Producto canario**: `Producto.km0` + nuevo `Producto.origen?` (nombres genéricos, sin marcas). Distintivo «Producto canario» y línea «KM0 · origen» en la carta, filtro rápido «Canario». Marcados: café cortado (leche canaria), bocadillo serrano y queso, agua, cerveza, plátano IGP y los productos de tienda alimentarios.
- **Tienda a bordo**: categoría `'Tienda'` con 6 referencias (mojo picón, gofio, miel, dulces típicos, camiseta Fred. Olsen, juego de cartas infantil). Escandallo = la propia unidad (insumos `ti-*`, no perecedero, seco, compra semanal, sin frío); consumo por pasajero estimado en `CONSUMO_POR_PASAJERO`. Recogida en barra como el resto.
- **En Armonía con el Mar**: `Pedido.sinPlastico?`. Checkout con «Sin cubiertos ni bolsa» (activado por defecto si el pedido son solo bebidas: `soloBebidas`) y «Ticket digital: cero papel». Barra: indicador «Sin cubiertos». Manager > Analítica: tarjeta con tickets de papel evitados (= pedidos), pedidos sin cubiertos/bolsa y % de venta canario/KM0 (`sostenibilidad(s)`).
- **Tarifa Joven**: billete demo `FO2J5T` (Yeray, 23B, ES, `tarifaJoven: true`). **Ventaja PROPUESTA** (`VENTAJA_JOVEN`): café o refresco −20 % (la unidad elegible más cara del pedido; `descuentoJoven`, `totalPedido`). Se aplica en carrito, pago y `Pedido.total` (`Pedido.tarifaJoven`, `Pedido.descuentoJoven`); etiqueta «Tarifa Joven» en barra y manager (actividad y analítica). No es una condición vigente de Fred. Olsen: hay que validarla con ellos.
- El bot genera pedidos con tienda (~14 %), producto canario (~35 %), `sinPlastico` (80 % en bebidas solas, 30 % en el resto) y Tarifa Joven (~20 %).

## Ampliación: BONOS DE CONSUMO (ticket #2 · ShiroZetta10/Freddy)
Estado v5 (`fredonboard-proto-v5`, `version: 5`; los estados v4 se descartan al cargar). Nuevo `ProtoState.bonos: Bono[]`.
- **Modelo** (`store.ts`): `Bono { codigo, tipo: 'billete'|'fisico', tipoId, nombre, contenido: CoberturaBono[], precio (referencia), estado: 'disponible'|'canjeado'|'caducado', ticket?, canjeadoEn?: {pedido, t, hora, valor} }`. Catálogo `TIPOS_BONO`: «Menú desayuno» (1 bebida caliente + 1 bollería, 3,90 €), «Menú bocadillo + bebida» (1 bocadillo/sándwich + 1 agua o refresco, 6,90 €), «Menú café y snack» (3,20 €). Precios de referencia = propuesta, por validar con Fred. Olsen.
- **Código de un solo uso** `BN-XXXX-C` (4 caracteres sin I/O/0/1 + letra de control que detecta erratas): `codigoBono`, `normalizarCodigoBono` (acepta minúsculas, espacios, sin guiones). Un bono caduca al llegar a puerto (`estadoBono`).
- **Bonos de billete**: llevan `ticket`; solo ese localizador puede usarlos. Demo: Carmen FO7K2Q y Yeray FO2J5T (Tarifa Joven) con «Menú desayuno», Tom FO9X4M con «Menú bocadillo + bebida». El pasajero los ve en Viaje («Tienes un bono: …»), en Pedidos («Mis bonos») y los usa desde la Carta o el checkout.
- **Bonos físicos de prueba** (también en la bienvenida, tocar copia el código y lo precarga en «Canjear código de bono»): `BN-7K2Q-T` desayuno, `BN-4M9D-V` bocadillo + bebida, `BN-X3TB-S` café y snack, `BN-H8N5-F` desayuno. Canjeables en Pedidos o en el checkout (campo + escaneo simulado) y en barra.
- **Canje** (`crearPedido({ bono })`, `planBono`, `cotizar`): el carrito debe contener todo lo que cubre; por cada parte se toman las unidades elegibles más baratas del carrito, que pasan a 0 €. Si falta algo, el panel de bono sugiere los productos que lo completan, con un toque. Se rechaza con `bono-invalido | bono-ajeno | bono-usado | bono-caducado | bono-incompleto`. **Un solo uso**: se revalida dentro de la transacción y se relee localStorage (otra pestaña), y el reintento con la misma `clientKey` es idempotente. El bono queda canjeado también si el pedido se guarda offline. `cancelarPedido` devuelve el bono a `disponible`.
- **Tarifa Joven**: el bono se aplica primero; la ventaja −20 % solo recae en unidades que el bono no cubre (sin doble descuento).
- **Inventario**: igual que una venta (movimiento `venta`, ref `#id · bono CODIGO`); la cancelación lo devuelve. Si el bono cubre todo, `pago = 'bono'`, total 0 € y no hay paso de pago.
- **Barra**: etiqueta «Bono CODIGO · pagado con bono» en la tarjeta del pedido y en el escáner de entrega. Botón «Canjear bono» (para quien no usa móvil): código → elige producto de cada parte → crea el pedido en la franja libre más próxima (`canjearBonoEnBarra`, `canal: 'barra'`), sin pasos extra de la tripulación. Los bonos de billete solo se canjean desde el móvil con su localizador.
- **Manager**: tarjeta «Bonos» en Analítica (emitidos, canjeados, % canje, ingresos anticipados = vendidos con el billete, valor canjeado a precio de carta, vendidos en físico) vía `estadisticasBonos`; «Tipos de bono de consumo» (solo lectura) en Carta y stock; CSV con código y valor del bono; «Bono» en el mix de pago. Las ventas del piloto (`kpis`) no incluyen el valor del bono (ya cobrado antes).
- **Bot**: ~12 % de los pedidos simulados pagan con bono (de billete o físico) y ~20 % emiten además un bono de billete sin usar, para un % de canje verosímil.
- **i18n**: claves `b.*`, `e.bono*`, `w.bonos*`, `o.bonos` en ES/EN/DE (los nombres de producto y de bono siguen en español, como la carta).

## Ampliación: LOGO «Elaborado en Canarias» y «guagua» (ticket #9 · ShiroZetta10/Freddy)
- **Terminología**: en los textos en español del prototipo (`pasajero/i18n.ts`, `src/data/journey.ts`) «bus» pasa a «guagua» («Guagua gratuita Agaete – Las Palmas»). En inglés se mantiene «bus» (la primera aparición es «Free bus (guagua)») y en alemán «Bus». El asistente reconoce «bus», «guagua» y «autobús».
- **Distintivo «Elaborado en Canarias»**: es una marca oficial con su propio programa de adhesión: no se redibuja ni se imita. El componente `ElaboradoLogo` (`src/proto/shared.tsx`) muestra `public/logos/elaborado-en-canarias.png` y, si el archivo no existe o no carga (`onError`), cae a la etiqueta de texto «Producto canario». Alt: «Elaborado en Canarias». Se ve en las tarjetas de producto de la carta del pasajero (incluida la pestaña Tienda).
- **Estado del archivo**: la web de la marca (elaboradoencanarias.com) no ofrece una descarga pública del logotipo; su artículo sobre el nuevo logo indica que las empresas adheridas lo solicitan por correo a web@elaboradoencanarias.com. Por eso el archivo **no está incluido**: solo hay que dejarlo en `public/logos/elaborado-en-canarias.png` (altura de trabajo ~20 px) cuando lo faciliten, sin tocar código.
- **Condiciones de uso (a confirmar con la marca)**: requiere autorización de uso del distintivo y solo puede acompañar a productos certificados. En el prototipo solo llevan `elaboradoCanarias: true` los elaborados en Canarias: agua, cerveza canaria, mojo, gofio, miel y dulces. No lo llevan el café, el plátano (IGP, otra marca), ni los bocadillos preparados a bordo, aunque sean producto canario/km0 y mantengan la etiqueta «Producto canario». Antes del piloto real, Fred. Olsen debe comprobar que cada proveedor está adherido.

## Ampliación: Clase Estándar vs Clase Oro (ticket #12 · ShiroZetta10/Freddy)
Estado v6 (`fredonboard-proto-v6`, `version: 6`; los estados v5 se descartan al cargar).

### Tabla verificada (fredolsen.es, consulta del 22/10/2026; tarifas interinsulares, los servicios pueden variar según el buque)
| Característica | Estándar (Básica / Óptima) | Clase Oro (Confort Oro) | Estado |
|---|---|---|---|
| Salón | Salón general, butacas estándar | Salón Clase Oro: aforo reducido, butacas extra confort, mesas de reunión | Verificado. El salón solo está en las tarifas Priority y Oro |
| Embarque | General en Básica; **prioritario en Óptima Web+** | Prioritario | Corregido: la propuesta decía «general» para todo Estándar |
| Desembarque con vehículo | Orden general | Prioritario **solo si viajas con vehículo** | Corregido: se añade la condición |
| Comida y bebida | De pago en cafetería (Óptima Web+: menú a bordo en cafeterías «Web Plus») | Servicio gastronómico incluido en la travesía: bebidas, platos, snacks y postres | Corregido: platos fríos y calientes de lunes a viernes; fines de semana y festivos solo selección fría; consumo a bordo; menús especiales con 48 h. Alcohol y límite por persona: a confirmar |
| Terraza | Zonas exteriores generales | Terraza exclusiva dentro del salón | Oro verificado. Terrazas de Estándar: a confirmar con Fred. Olsen |
| Atención | General en cafetería o recepción | Servicio en el asiento y trato personalizado (pocos pasajeros) | Verificado. «Personal dedicado» no figura literalmente: a confirmar |
| Trabajo y wifi | Wifi general | Mesas de reunión, enchufes y wifi en el salón | Corregido: «mejor conectividad» no figura en fuentes oficiales y se retira. Enchufes en Estándar: a confirmar |
| Flexibilidad | Cambios según disponibilidad; sin vuelta abierta, Puntos Plus ni reembolso (salvo Óptima Flexible) | Cambios + vuelta abierta, pago con Puntos Plus y reembolso | Corregido: todas las tarifas permiten cambios (billete válido 1 año); lo demás es de Óptima Flexible y Oro. No aplica a Canarias–Huelva |

Matiz importante: existe una tarifa **Priority** (salón, embarque prioritario, comida y bebida; sin desembarque prioritario con vehículo ni flexibilidad) que la tabla original no recogía. El prototipo no la modela (a confirmar con Fred. Olsen cómo tratarla en la app).

Fuentes (oficiales): https://www.fredolsen.es/en/gold-class · https://www.fredolsen.es/en/rates · https://www.fredolsen.es/en/faqs. Contraste secundario (no oficial, solo orientativo): https://www.ferryhopper.com/es/blog/ferry-news/fred-olsen-vip-ferry-tickets-benefits.
No verificado y por tanto «a confirmar con Fred. Olsen»: precio de la Clase Oro y cómo se contrata/mejora a bordo, límite de consumo por pasajero, si incluye alcohol, carril físico de embarque/desembarque prioritario, terrazas de Estándar y enchufes fuera del salón Oro.

### Qué implementa el prototipo
- **Datos** (`store.ts`): `ClaseId = 'estandar' | 'oro'`; `PRESTACIONES`, `REGLAS_ATENCION` y `FUENTES_CLASES` (la tabla y las reglas, con su estado); `Billete.clase` y `Billete.vehiculo`. Demo: Greta (FO3H8B) es Oro **y viaja con vehículo**; Carmen, Tom y Yeray son estándar. `ajustes.upsellOro` y `ajustes.limiteMenuOro` (6 unidades por persona y travesía: propuesta del equipo).
- **Menú Clase Oro incluido**: `Producto.incluidoOro` (café, bollería, bocadillos y sándwiches, agua, refresco, papas, plátano) y 4 platos fríos `soloOro` (tabla de quesos y embutidos canarios, sándwich gourmet frío, ensalada fría de pollo, postre del día), con escandallo e inventario. No incluidos: cerveza (alcohol, a confirmar) y tienda. `planMenuOro` pone a 0 € las unidades elegibles del carrito hasta el límite (`oroUsadas` lo deriva de los pedidos, así que cancelar devuelve unidades); solo para billete Oro y cafetería Oro. Orden de descuentos en `cotizar`: menú Oro, después bono, después Tarifa Joven (sin doble descuento). `Pedido.pago = 'incluido'` si el total queda en 0 €.
- **Servicio en mesa**: `crearPedido({ mesa, mesaRef })` solo para Oro en la cafetería Oro (`Pedido.servicio = 'mesa'`). No hay asiento asignado: la mesa es una referencia libre opcional. Lo atiende la cafetería Oro, no Proa/Popa. La carta Oro se rechaza (`solo-oro`) para billetes estándar o desde otras cafeterías.
- **Pasajero Oro**: distintivo en cabecera y tarjeta «Tu Clase Oro» en Viaje (prioridad de embarque, de desembarque si hay vehículo), avisos push de embarque/desembarque prioritario (`Tracker`), carta con «Menú Clase Oro incluido» y contador, opción «Servir en mi mesa del salón Oro» en el pedido, botón de soporte prioritario en Ayuda (`solicitarSoporteOro` crea una alerta para el manager). Textos en ES/EN/DE (`or.*`).
- **Pasajero estándar**: tarjeta discreta y desplegable «Pásate a Clase Oro» (precio: consultar), promoción de cafetería en la carta y avisos estándar de embarque/llegada.
- **Barra**: los pedidos Oro llevan etiqueta «Clase Oro», borde destacado, prioridad a igual franja y, si aplica, «Servicio en mesa» y «Menú Oro incluido ×n».
- **Manager** > «Clase Estándar y Clase Oro»: tabla comparativa con estado de verificación, reglas de atención, interruptor de la tarjeta de mejora, límite del menú incluido y contadores de la travesía.
- **Bot**: no genera pedidos con productos `soloOro`.
