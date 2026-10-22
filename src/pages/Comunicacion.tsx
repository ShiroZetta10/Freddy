import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { Canal, FASES, Fase, PERFILES } from '../data/journey'
import { BARRERAS, EJES_CANARIOS, FO_OFICIAL, LEMA } from '../data/canarias'
import './comunicacion.css'

const CANAL_LABEL: Record<Canal['tipo'], string> = { whatsapp: 'WhatsApp', email: 'Email', push: 'Notificación', wifi: 'Portal wifi' }

// Mismo patrón que Journey.tsx (MensajeCanal), con los estilos .msg-* globales.
function MensajeCanal({ c }: { c: Canal }) {
  return (
    <figure className={`msg msg-${c.tipo}`}>
      <figcaption>
        <span className={`msg-badge msg-badge-${c.tipo}`}>{CANAL_LABEL[c.tipo]}</span>
        <b>{c.de}</b>
        <span className="msg-hora">{c.hora}</span>
      </figcaption>
      {c.asunto && <div className="msg-asunto">{c.asunto}</div>}
      <div className="msg-cuerpo">
        {c.lineas.map((l) =>
          l.startsWith('→ ') ? (
            <span key={l} className="msg-link">
              {l.slice(2)}
            </span>
          ) : (
            <p key={l}>{l}</p>
          ),
        )}
      </div>
      {c.nuevo && <div className="msg-nuevo">Novedad FredOnBoard: {c.nuevo}</div>}
    </figure>
  )
}

// Mensajes reales del journey del pasajero, agrupados por fase (se reutilizan, no se duplican).
const CANALES_POR_FASE: Record<Fase, Canal[]> = { Antes: [], Embarque: [], 'A bordo': [], 'Llegada y después': [] }
PERFILES.find((p) => p.id === 'pasajero')?.pasos.forEach((s) => {
  s.canales?.forEach((c) => CANALES_POR_FASE[s.fase].push(c))
})

type Pieza = { icono: string; canal: string; texto: string }
type Texto = { titulo: string; lineas: string[] }

const CONTACTOS: Record<Fase, { resumen: string; puntos: Pieza[]; textos: Texto[] }> = {
  Antes: {
    resumen: 'El pasajero decide cuándo y qué pedirá. Es el momento de mayor conversión del pre-pedido.',
    puntos: [
      { icono: 'receipt', canal: 'Email de confirmación del billete', texto: 'Bloque «Tu viaje con FredOnBoard» dentro del email que ya se envía. Sin cuenta: el localizador identifica al pasajero.' },
      { icono: 'phone', canal: 'WhatsApp de recordatorio', texto: 'Mensaje con la estructura de la plantilla actual de Fred. Olsen, con un enlace extra para pre-pedir antes del cierre.' },
      { icono: 'search', canal: 'Web, app y Fred. Olsen Plus', texto: 'Banner en «Mi reserva» y bloque en el área de socios Plus (397.000 socios) con los Plus Points del primer pedido.' },
      { icono: 'users', canal: 'Redes sociales', texto: 'Piezas cortas que explican el servicio en tres pasos, con producto canario como protagonista.' },
    ],
    textos: [
      { titulo: 'Texto para RRSS (propuesta)', lineas: ['Tu desayuno ya está pedido cuando subes a bordo.', 'Elige en FredOnBoard, paga y recoge en segundos. Sin colas, sin cuenta.'] },
    ],
  },
  Embarque: {
    resumen: 'El pasajero busca sitio y wifi. Hay que dar una sola pista clara y repetirla.',
    puntos: [
      { icono: 'wifi', canal: 'Portal wifi de On Board Club', texto: 'La página de bienvenida abre FredOnBoard con un botón. Funciona sin datos móviles.' },
      { icono: 'qr', canal: 'QR en mesas y zonas del salón', texto: 'Escanear abre la carta ya vinculada a la cafetería más cercana. Es la vía para quien no hizo pre-pedido.' },
      { icono: 'megaphone', canal: 'Megafonía de bienvenida', texto: 'Un guion de 15 segundos en español e inglés, tras el aviso de seguridad y sin interrumpirlo.' },
    ],
    textos: [
      { titulo: 'Guion de megafonía · ES (15 s)', lineas: ['«Bienvenidos a bordo del Bajamar Express. Pida sin levantarse: escanee el código de su mesa o abra On Board Club en el wifi. Recoja su pedido sin colas en el punto FredOnBoard de la barra. Buen viaje.»'] },
      { titulo: 'Megafonía · EN (15 s)', lineas: ['«Welcome aboard the Bajamar Express. Order without getting up: scan the code on your table or open On Board Club on the wifi. Collect your order at the FredOnBoard point at the bar, no queue. Enjoy the trip.»'] },
    ],
  },
  'A bordo': {
    resumen: 'La oferta compite con el sillón. Visibilidad constante y discreta, y la barra como respaldo.',
    puntos: [
      { icono: 'qr', canal: 'QR en reposacabezas y mesa', texto: 'Texto corto y un solo gesto: escanear.' },
      { icono: 'food', canal: 'Cartelería en la barra', texto: 'Cartel con el punto de recogida FredOnBoard y recordatorio de que la barra tradicional sigue igual.' },
      { icono: 'search', canal: 'Pantallas del barco', texto: 'Bucle con el QR, la carta del día y el producto canario destacado.' },
      { icono: 'bell', canal: 'Aviso «tu pedido está listo»', texto: 'Notificación o aviso dentro de la web con el QR de recogida.' },
    ],
    textos: [
      { titulo: 'Cartel en la barra', lineas: ['Recoge aquí tu pedido FredOnBoard.', 'Enseña tu QR. Sin cola, sin cobro.', '¿Prefieres pedir en la barra? Seguimos aquí, como siempre.'] },
      { titulo: 'Texto para el QR de las mesas', lineas: ['Pide sin levantarte.', 'Escanea y recoge sin colas.'] },
    ],
  },
  'Llegada y después': {
    resumen: 'Se cierra el viaje y se abre el siguiente. Aquí se mide la satisfacción y se prepara la repetición.',
    puntos: [
      { icono: 'bell', canal: 'Aviso de llegada', texto: 'Notificación 15 minutos antes de llegar, con información útil del destino.' },
      { icono: 'receipt', canal: 'Email posviaje', texto: 'Ticket digital, Plus Points ganados, valoración de 10 segundos y pre-pedido para la vuelta.' },
      { icono: 'users', canal: 'Redes sociales', texto: 'Historias de pasajeros y de equipo, con su permiso, y producto canario del mes.' },
    ],
    textos: [{ titulo: 'Texto de cierre (propuesta)', lineas: ['Gracias por viajar con nosotros. Hoy has pedido sin colas; mañana, también.'] }],
  },
}

const PUBLICOS = [
  { id: 'res', icono: 'route', nombre: 'Residente frecuente', oir: 'Ahorra tiempo en un trayecto que repite: pide sin levantarte y recoge cuando esté listo. Recomprar es un clic.', canal: 'WhatsApp y email del billete; Fred. Olsen Plus' },
  { id: 'tur', icono: 'search', nombre: 'Turista (ES / EN / DE)', oir: 'Pruebe producto canario sin hacer cola ni hablar con nadie. Todo en su idioma, sin instalar nada.', canal: 'Email de confirmación y QR de las mesas, trilingüe' },
  { id: 'jov', icono: 'phone', nombre: 'Joven 12–25 (Tarifa Joven)', oir: 'Se pide como se pide todo: desde el móvil, dentro de On Board Club. Con ventajas ligadas a su billete.', canal: 'On Board Club, wifi a bordo y redes sociales' },
  { id: 'oro', icono: 'shield', nombre: 'Clase Oro', oir: 'Servicio sin fricción, a su ritmo y con atención personal si la prefiere.', canal: 'Email y personal de sala' },
  { id: 'may', icono: 'users', nombre: 'Persona mayor o sin móvil', oir: 'La barra sigue igual, con el trato de siempre. El servicio digital solo quita cola a los demás.', canal: 'Megafonía y cartelería en barra; personal de sala' },
  { id: 'tri', icono: 'anchor', nombre: 'Tripulación', oir: 'Sabe qué se pide, cuándo y cómo se recoge. No es más trabajo: es trabajo ordenado antes del pico.', canal: 'Sesión presencial, chuleta y canal interno del barco' },
]

const CALENDARIO = [
  { fase: 'Pre-lanzamiento', cuando: 'Semanas −3 a 0', pasos: ['Sesión de 30 min con la tripulación del Bajamar Express', 'Chuleta de una página en la barra', 'Prueba de QR y wifi con el barco amarrado', 'Textos revisados en ES, EN y DE'] },
  { fase: 'Lanzamiento', cuando: 'Semana 1', pasos: ['Bloque en email de confirmación y WhatsApp', 'Megafonía y cartelería activas', 'QR en reposacabezas y mesas', 'Incentivo de lanzamiento (propuesta)'] },
  { fase: 'Refuerzo', cuando: 'Semanas 2 a 4', pasos: ['Recordatorio de pre-pedido antes del cierre', 'Piezas en RRSS con producto canario', 'Ajuste de textos con los primeros datos', 'Escucha a la tripulación en reunión semanal'] },
  { fase: 'Consolidación', cuando: 'Semanas 5 a 8', pasos: ['El incentivo se retira o se transforma en Plus Points regulares', 'Valoración tras el viaje', 'Informe de resultados y decisión de escalar a otras rutas'] },
]

const KPIS = [
  { k: 'Alcance', def: 'Pasajeros que ven al menos un mensaje del plan', meta: '70 % de los pasajeros del piloto' },
  { k: '% que escanea el QR', def: 'Escaneos únicos / pasajeros a bordo', meta: '15 %' },
  { k: '% que abre email / WhatsApp', def: 'Aperturas del bloque FredOnBoard', meta: '45 % email · 70 % WhatsApp' },
  { k: 'Conversión a pedido', def: 'Pasajeros con pedido / pasajeros que abren FredOnBoard', meta: '20 %' },
  { k: '% primeros pedidos con incentivo', def: 'Primeros pedidos que usan los Plus Points de lanzamiento', meta: '50 % en la semana 1' },
  { k: 'Satisfacción', def: 'Valoración del servicio tras el viaje (referencia: 8,81 / 10, NPS 63,8 %)', meta: 'Igual o superior a 8,8 / 10' },
]

export default function Comunicacion() {
  const [fase, setFase] = useState<Fase>('Antes')
  const datos = CONTACTOS[fase]
  const canales = CANALES_POR_FASE[fase]

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Entregable 03 · Plan de comunicación</div>
        <h1>Cómo dar a conocer FredOnBoard al pasajero</h1>
        <p>
          Un plan para explicar el servicio en pocos segundos, en el momento justo del viaje y sin ruido. FredOnBoard vive dentro de On Board Club: no
          pedimos instalar nada ni abrir cuenta, y la barra de siempre sigue funcionando. Piloto en el Bajamar Express, Santa Cruz de Tenerife – Agaete.
        </p>
      </div>

      <section className="section">
        <h2 className="section-title">1. Objetivos y mensaje central</h2>
        <div className="callout navy">
          <div className="eyebrow">Mensaje central</div>
          <strong style={{ fontSize: 22, color: 'var(--navy)' }}>Pide sin levantarte, recoge sin colas.</strong>
        </div>
        <div className="grid g3" style={{ marginTop: 16 }}>
          <div className="card"><h3>Sin instalar nada</h3><p className="small muted">Se abre con el billete o el QR de la mesa. Sin cuenta ni descargas.</p></div>
          <div className="card"><h3>Tú decides cuándo</h3><p className="small muted">Pide antes de embarcar o a bordo, y levántate solo cuando esté listo.</p></div>
          <div className="card"><h3>Producto de aquí</h3><p className="small muted">La carta destaca lo elaborado en Canarias, con nombre de proveedor.</p></div>
        </div>
        <div className="grid g2" style={{ marginTop: 16 }}>
          <div className="card">
            <h3>Objetivos del plan</h3>
            <ul className="co-list">
              <li>Que el pasajero sepa que existe y entienda cómo se usa en menos de 10 segundos.</li>
              <li>Convertir esa información en primeros pedidos durante el piloto.</li>
              <li>Que la tripulación lo explique con seguridad y sin carga extra.</li>
              <li>Medir qué pieza funciona para decidir el escalado.</li>
            </ul>
          </div>
          <div className="card">
            <h3>Cómo encaja en On Board Club y en los valores</h3>
            <p className="small">
              Se comunica como una función más de On Board Club, junto a películas, series, juegos, carta digital y wifi: nunca como una app aparte. El tono
              conecta con <b>Con Corazón Canario</b>, <b>Lo nuestro viaja contigo</b>, <b>Contigo desde siempre</b> y con el lema <i>«{LEMA}»</i>. Solo texto,
              sin logos de terceros.
            </p>
            <p className="small muted">Barreras que el mensaje responde: {BARRERAS.map((b) => b.titulo.toLowerCase()).join(', ')}.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">2. Públicos</h2>
        <div className="matrix-wrap" style={{ maxHeight: 'none' }}>
          <table className="co-table">
            <thead><tr><th>Público</th><th>Qué necesita oír</th><th>Canal principal</th></tr></thead>
            <tbody>
              {PUBLICOS.map((p) => (
                <tr key={p.id}>
                  <td><Icon name={p.icono} size={16} /> {p.nombre}</td>
                  <td>{p.oir}</td>
                  <td>{p.canal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">3. Puntos de contacto a lo largo del viaje</h2>
        <p className="lead">Elige una fase para ver qué canales entran en juego y ejemplos de las piezas.</p>
        <div className="toolbar">
          <div className="tabs" role="tablist">
            {FASES.map((f) => (
              <button key={f} role="tab" aria-selected={f === fase} className={f === fase ? 'on' : ''} onClick={() => setFase(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <p className="small muted">{datos.resumen}</p>
        <div className="grid g2">
          <div className="card">
            <h3>Canales en esta fase</h3>
            {datos.puntos.map((p) => (
              <div key={p.canal} className="co-touch">
                <span className="co-ico"><Icon name={p.icono} size={16} /></span>
                <div>
                  <b>{p.canal}</b>
                  <div className="small muted">{p.texto}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="co-piece">
            {datos.textos.map((t) => (
              <div key={t.titulo} className="co-script">
                <b>{t.titulo}</b>
                {t.lineas.map((l) => <p key={l}>{l}</p>)}
              </div>
            ))}
            {fase === 'Embarque' && (
              <div className="co-qrcard">
                <div className="co-qrbox"><Icon name="qr" size={34} /></div>
                <div><b>Pide sin levantarte.</b><div className="small muted">Escanea y recoge sin colas.</div></div>
              </div>
            )}
            {fase === 'A bordo' && (
              <div className="co-poster">
                <strong>Recoge aquí tu pedido</strong>
                <span>Punto FredOnBoard · Enseña tu QR</span>
              </div>
            )}
          </div>
        </div>
        {canales.length > 0 && (
          <>
            <h3 style={{ marginTop: 20 }}>Mensajes de ejemplo del journey</h3>
            <div className="co-piece-list">
              {canales.map((c, i) => <MensajeCanal key={i} c={c} />)}
            </div>
          </>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">4. Calendario de lanzamiento del piloto</h2>
        <div className="co-timeline">
          {CALENDARIO.map((c) => (
            <div key={c.fase} className="card">
              <span className="tag">{c.cuando}</span>
              <h3 style={{ marginTop: 8 }}>{c.fase}</h3>
              <ul>{c.pasos.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          ))}
        </div>
        <div className="callout navy" style={{ marginTop: 16 }}>
          <span className="co-supuesto">Propuesta</span>{' '}
          <b>Incentivo de lanzamiento:</b> Plus Points extra en el primer pedido FredOnBoard con billete asociado a Fred. Olsen Plus. Cuantía y condiciones
          por definir con Fred. Olsen; se plantea solo para el piloto.
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">5. Comunicación interna y formación de la tripulación</h2>
        <div className="grid g2">
          <div className="card">
            <h3>Sesión de 30 minutos</h3>
            <ul className="co-list">
              <li>5 min: qué es FredOnBoard y por qué se hace.</li>
              <li>10 min: el pedido paso a paso, con un móvil de prueba.</li>
              <li>10 min: recogida con QR y gestión de franjas.</li>
              <li>5 min: preguntas y casos difíciles.</li>
            </ul>
            <h3 style={{ marginTop: 14 }}>Chuleta de una página</h3>
            <p className="small muted">Pasos de recogida, frases para explicar el servicio en 10 segundos, qué hacer si algo falla y a quién avisar.</p>
          </div>
          <div className="card">
            <h3>Qué hacer si…</h3>
            <ul className="co-list">
              <li><b>El pasajero no tiene móvil:</b> se le atiende en la barra como siempre.</li>
              <li><b>El QR no carga:</b> se busca el pedido por número o localizador.</li>
              <li><b>El pedido se retrasa:</b> se avisa desde el panel de barra y se ofrece alternativa.</li>
              <li><b>Hay mucha cola:</b> se pausa el cierre de franjas desde el panel.</li>
            </ul>
            <h3 style={{ marginTop: 14 }}>Cómo se mide su carga</h3>
            <p className="small muted">
              Pedidos por franja, tiempo de preparación y breve encuesta semanal a la tripulación. Si la carga sube, se ajustan los topes de franja antes de
              pedir más personal. Hipótesis oficial: la operativa debe integrarse sin ampliar inicialmente la dotación.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">6. El hilo canario, visible</h2>
        <div className="grid g2">
          {EJES_CANARIOS.map((e) => (
            <div key={e.id} className="card">
              <h3><Icon name={e.icono} size={18} /> {e.titulo}</h3>
              <p className="small">{e.nuestro}</p>
            </div>
          ))}
        </div>
        <div className="grid g2" style={{ marginTop: 16 }}>
          <div className="card">
            <h3>Cómo se dice a bordo</h3>
            <ul className="co-list">
              <li>«Elaborado en Canarias» junto al producto y filtro KM0 en la carta.</li>
              <li>«Sin cubiertos ni bolsa» como opción al pedir: papel cero, en la línea de En Armonía con el Mar.</li>
              <li>Ventajas de Tarifa Joven visibles dentro de On Board Club.</li>
            </ul>
          </div>
          <div className="card">
            <h3>Quién está detrás</h3>
            <p className="small">
              Un servicio pensado y construido por talento canario (equipo Shiro, con Zetta10 y el Gobierno de Canarias) para una compañía con más de
              50 años uniendo las islas.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">7. KPIs de comunicación</h2>
        <p className="lead">
          Punto de partida de Fred. Olsen: {FO_OFICIAL.sociosPlus.toLocaleString('es-ES')} socios Plus, {FO_OFICIAL.visitasWebMes.toLocaleString('es-ES')} visitas
          mensuales a la web y {FO_OFICIAL.seguidoresRRSS.toLocaleString('es-ES')} seguidores en redes. Las metas son <span className="co-supuesto">supuestos</span> a validar
          con las primeras semanas del piloto.
        </p>
        <div className="matrix-wrap" style={{ maxHeight: 'none' }}>
          <table className="co-table">
            <thead><tr><th>Indicador</th><th>Definición</th><th>Meta propuesta (supuesto)</th></tr></thead>
            <tbody>
              {KPIS.map((k) => (
                <tr key={k.k}>
                  <td>{k.k}</td>
                  <td>{k.def}</td>
                  <td>{k.meta} <span className="co-supuesto">supuesto</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <nav className="co-nav" aria-label="Navegación entre entregables">
        <Link className="btn ghost" to="/implementacion">← Implementación</Link>
        <Link className="btn light" to="/">Todos los entregables</Link>
        <Link className="btn ghost" to="/journey">User journey →</Link>
      </nav>
    </>
  )
}
