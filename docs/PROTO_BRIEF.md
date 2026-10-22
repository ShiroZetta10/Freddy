# Brief común · Prototipo FredOnBoard (equipo Shiro, Zetta10 · reto Fred. Olsen Express)

## Contexto del producto
FredOnBoard es el **compañero de viaje digital** de Fred. Olsen Express (naviera canaria). Ruta del prototipo:
Bajamar Express, Santa Cruz de Tenerife → Agaete, 80 min, 3 cafeterías (Proa, Popa, Clase Oro), wifi Starlink.
Núcleo del reto: **Click & Collect** = pedir y pagar desde el asiento y recoger en barra **sin colas y sin aumentar tripulación**.
Decisiones del equipo:
- Se usa **antes, durante y después** del viaje. Web sin instalar (QR asiento / portal wifi) y también dentro de la app.
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
