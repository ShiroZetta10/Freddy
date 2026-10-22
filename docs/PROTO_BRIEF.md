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
