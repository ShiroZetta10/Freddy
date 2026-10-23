import { Link } from 'react-router-dom'
import ValidadoDataX from '../components/ValidadoDataX'
import { STACK } from '../data/faq'
import {
  DISENO_PRINCIPAL,
  ESCENARIOS_AGORA,
  EVOLUCION_ERP,
  FLUJO_DESDE_AGORA,
  FLUJO_HACIA_AGORA,
  FUENTES_AGORA,
  MODO_DEGRADADO,
  NIVELES_RED,
  REFERENCIAS_RED,
  REQUISITOS_AGORA,
  REQUISITOS_RED,
  type Confirmado,
} from '../data/stack'
import StackFailsafes from './StackFailsafes'
import './stack.css'

/** Diagrama de la arquitectura propuesta (SVG en línea, colores de la web). */
function Arquitectura() {
  const box = (x: number, y: number, w: number, h: number, t: string, s: string, fill = '#fff', stroke = '#0b3478', color = '#0b3478') => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + h / 2 - 4} textAnchor="middle" fontSize={13} fontWeight={700} fill={color}>
        {t}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" fontSize={11} fill={color === '#fff' ? '#d6e0f2' : '#5d6779'}>
        {s}
      </text>
    </g>
  )
  return (
    <svg viewBox="0 0 900 400" role="img" aria-label="Arquitectura de FredOnBoard: móviles y tablets se conectan a la red local a bordo (punto de acceso wifi, portal cautivo y equipo de a bordo, nivel 0), que da paso al servidor de a bordo (nivel 1) con el conector de Ágora; Starlink une el barco con la nube y, si cae, todo lo de a bordo sigue funcionando por la red local" style={{ width: '100%', height: 'auto' }}>
      <defs>
        <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill="#0b3478" />
        </marker>
      </defs>
      {/* barco */}
      <rect x={10} y={10} width={580} height={380} rx={14} fill="#eef3fb" stroke="#c9d7f2" />
      <text x={26} y={34} fontSize={12} fontWeight={800} fill="#0b3478" letterSpacing=".06em">
        A BORDO · BAJAMAR EXPRESS
      </text>
      {box(30, 55, 140, 58, 'Pasajero', 'Web (PWA) · móvil')}
      {box(30, 135, 140, 58, 'Barra', 'Tablet por cafetería')}
      {/* Nivel 0: red local a bordo */}
      <rect x={200} y={50} width={175} height={205} rx={10} fill="#fff" stroke="#0b3478" strokeWidth={1.5} strokeDasharray="6 4" />
      <text x={287.5} y={72} textAnchor="middle" fontSize={13} fontWeight={800} fill="#0b3478">
        Red local a bordo
      </text>
      <text x={287.5} y={88} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#8a5a00">
        Nivel 0 · paso previo
      </text>
      {[
        ['Punto de acceso wifi', 'sin internet'],
        ['Portal cautivo', 'abre la PWA solo'],
        ['Mini equipo de a bordo', 'sirve web y pedidos'],
      ].map(([t, s], i) => (
        <g key={t}>
          <rect x={212} y={99 + i * 51} width={151} height={43} rx={6} fill="#eef3fb" stroke="#c9d7f2" />
          <text x={287.5} y={117 + i * 51} textAnchor="middle" fontSize={12} fontWeight={700} fill="#0b3478">
            {t}
          </text>
          <text x={287.5} y={132 + i * 51} textAnchor="middle" fontSize={10.5} fill="#5d6779">
            {s}
          </text>
        </g>
      ))}
      <line x1={172} y1={84} x2={198} y2={120} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      <line x1={172} y1={164} x2={198} y2={164} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      {/* Nivel 1: servidor de a bordo */}
      {box(410, 50, 165, 120, 'Servidor de a bordo', 'Nivel 1 · Node.js · BD', '#0b3478', '#0b3478', '#fff')}
      <text x={492} y={150} textAnchor="middle" fontSize={11} fill="#ffcc00">
        Conector Ágora · colas
      </text>
      <line x1={377} y1={110} x2={408} y2={110} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      {/* Ágora a bordo */}
      {box(410, 205, 165, 50, 'Ágora TPV', 'Carta · precios · stock · caja', '#fff8dc', '#e3a600')}
      <line x1={492} y1={172} x2={492} y2={203} stroke="#e3a600" strokeWidth={2.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      <text x={502} y={192} fontSize={10.5} fontWeight={700} fill="#8a5a00">
        API HTTP/JSON
      </text>
      {/* modo degradado y failsafes */}
      <rect x={30} y={278} width={275} height={96} rx={8} fill="#fff8dc" stroke="#e3a600" strokeWidth={1.5} strokeDasharray="5 4" />
      <text x={167.5} y={298} textAnchor="middle" fontSize={12} fontWeight={800} fill="#8a5a00">
        Sin Starlink: modo degradado
      </text>
      <text x={167.5} y={318} textAnchor="middle" fontSize={11} fill="#0b3478">
        Web, pedidos y barra siguen
      </text>
      <text x={167.5} y={334} textAnchor="middle" fontSize={11} fill="#0b3478">
        por la red local
      </text>
      <text x={167.5} y={355} textAnchor="middle" fontSize={11} fill="#5d6779">
        Se encola: cobro online y copia
      </text>
      <rect x={320} y={278} width={255} height={96} rx={8} fill="#fff" stroke="#0b3478" strokeWidth={1.5} />
      <text x={447.5} y={298} textAnchor="middle" fontSize={12} fontWeight={800} fill="#0b3478">
        Failsafes QR (sin red)
      </text>
      <text x={447.5} y={318} textAnchor="middle" fontSize={11} fill="#0b3478">
        QR de stock en la barra
      </text>
      <text x={447.5} y={334} textAnchor="middle" fontSize={11} fill="#0b3478">
        QR del pedido en el móvil
      </text>
      <text x={447.5} y={355} textAnchor="middle" fontSize={11} fill="#5d6779">
        La barra cobra con Ágora
      </text>
      {/* enlace */}
      <line x1={592} y1={110} x2={660} y2={110} stroke="#e3a600" strokeWidth={2.5} strokeDasharray="7 5" markerEnd="url(#ar)" markerStart="url(#ar)" />
      <text x={626} y={97} textAnchor="middle" fontSize={11} fontWeight={700} fill="#8a5a00">
        Starlink
      </text>
      <text x={626} y={131} textAnchor="middle" fontSize={10} fill="#5d6779">
        cola de salida
      </text>
      <text x={626} y={145} textAnchor="middle" fontSize={10} fill="#5d6779">
        (puede caer)
      </text>
      {/* tierra */}
      <rect x={665} y={10} width={225} height={380} rx={14} fill="#f4f6f9" stroke="#e2e7ef" />
      <text x={679} y={34} fontSize={12} fontWeight={800} fill="#0b3478" letterSpacing=".06em">
        EN TIERRA · NUBE (UE)
      </text>
      {box(680, 55, 195, 58, 'Panel del manager', 'Carta · reglas · analítica')}
      {box(680, 135, 195, 58, 'Servicio central', 'Node.js · PostgreSQL')}
      {box(680, 215, 92, 58, 'Pasarela', 'Pago tokenizado')}
      {/* Ágora en tierra o nube (alternativa según dónde esté instalado) */}
      <rect x={783} y={215} width={92} height={58} rx={8} fill="#fff8dc" stroke="#e3a600" strokeWidth={1.5} strokeDasharray="5 4" />
      <text x={829} y={240} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0b3478">
        Ágora TPV
      </text>
      <text x={829} y={257} textAnchor="middle" fontSize={10.5} fill="#5d6779">
        si está en tierra
      </text>
      <text x={777.5} y={296} textAnchor="middle" fontSize={10.5} fill="#8a5a00" fontWeight={700}>
        API HTTP/JSON
      </text>
      <text x={777.5} y={311} textAnchor="middle" fontSize={10.5} fill="#8a5a00" fontWeight={700}>
        módulo de integración
      </text>
      <text x={777.5} y={326} textAnchor="middle" fontSize={10} fill="#5d6779">
        (alternativa según dónde esté Ágora)
      </text>
      <line x1={777} y1={113} x2={777} y2={133} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      <line x1={726} y1={193} x2={726} y2={213} stroke="#0b3478" strokeWidth={1.5} markerEnd="url(#ar)" markerStart="url(#ar)" />
      <line x1={829} y1={193} x2={829} y2={213} stroke="#e3a600" strokeWidth={2} strokeDasharray="5 4" markerEnd="url(#ar)" markerStart="url(#ar)" />
    </svg>
  )
}

const ETIQUETA: Record<Confirmado, { t: string; c: string }> = {
  publico: { t: 'En fuentes públicas', c: 'green' },
  validar: { t: 'A validar con Fred. Olsen / Ágora', c: 'yellow' },
  propio: { t: 'Diseño nuestro', c: '' },
}

function Estado({ e }: { e: Confirmado }) {
  return <span className={`tag ${ETIQUETA[e].c}`}>{ETIQUETA[e].t}</span>
}

export default function Stack() {
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Stack técnico</div>
        <h1>Stack técnico propuesto</h1>
        <p>
          FredOnBoard funciona primero a bordo: una red local en el barco (wifi con portal cautivo, como el entretenimiento de los aviones) y un servidor de a bordo atienden los pedidos y siguen funcionando sin internet. Se integra con Ágora, el TPV de
          Fred. Olsen, desde el piloto: Ágora es la fuente de verdad de la carta, los precios, el stock y la caja. Solo el cobro y la copia en la nube necesitan conexión. Todo se construye con
          estándares abiertos (React, TypeScript, Node.js, PostgreSQL, API HTTP/JSON), así que cualquier equipo de IT puede mantenerlo.
        </p>
      </div>
      <ValidadoDataX que="Este stack técnico" />

      <section className="section">
        <div className="section-title">
          <h2>Arquitectura</h2>
          <p>
            Los móviles y la tablet de barra entran por la red local a bordo (nivel 0) y el servidor de a bordo (nivel 1) habla con Ágora. La nube recibe una copia por Starlink con cola de salida y sin pedidos duplicados; si Starlink cae, a bordo todo sigue.
            Dónde corre Ágora (a bordo o en tierra) decide por dónde va la conexión: se muestran las dos.
          </p>
        </div>
        <div className="card faq-diagram">
          <div>
            <Arquitectura />
          </div>
        </div>
      </section>

      <section className="section" id="red-local">
        <div className="section-title">
          <h2>Red local a bordo: wifi y portal sin internet</h2>
          <p>
            Es el mismo principio del entretenimiento a bordo de los aviones: el pasajero se conecta al wifi y el portal se sirve desde un equipo del propio vehículo, sin salir a internet. Lo aplicamos a pedir comida y bebida en el barco.
          </p>
        </div>
        <div className="fs-niveles">
          {NIVELES_RED.map((n) => (
            <div key={n.id} className={`card fs-niv ${n.id}`}>
              <div className="st-cuando">{n.etiqueta}</div>
              <h4>{n.nombre}</h4>
              <p className="small">{n.resumen}</p>
              <ul className="clean small">
                {n.incluye.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <b className="small">Límites</b>
              <ul className="clean small">
                {n.limites.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="card fs-deg">
          <h4>{MODO_DEGRADADO.titulo}</h4>
          <p className="small">{MODO_DEGRADADO.resumen}</p>
          <div className="fs-deg-cols">
            <div>
              <b className="small">Sigue funcionando a bordo</b>
              <ul className="clean small">
                {MODO_DEGRADADO.sigue.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <b className="small">Se encola hasta que vuelva Starlink</b>
              <ul className="clean small">
                {MODO_DEGRADADO.seEncola.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <p className="tiny muted" style={{ marginTop: 10 }}>
          Referencias sobre cómo funciona el portal a bordo sin conexión a tierra:
        </p>
        <ul className="tiny muted fs-refs">
          {REFERENCIAS_RED.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.t}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" id="failsafes">
        <div className="section-title">
          <h2>Failsafes: si falla la red</h2>
          <p>
            Si el móvil del pasajero no consigue red (o no la hay en un rincón del salón), dos códigos QR cubren el hueco sin depender de internet ni del wifi del barco. Pruébalos abajo: se generan con los datos de ejemplo.
          </p>
        </div>
        <div className="fs-mech">
          <div className="card">
            <h3>A. QR en la barra que actualiza el stock</h3>
            <p className="small">La tablet o una pantalla de la barra muestra un QR con la carta y el stock del momento.</p>
            <ol className="small">
              <li>La barra marca un producto agotado (o Ágora cambia el stock) y el QR se regenera.</li>
              <li>El pasajero sin red lo escanea con la cámara; su PWA ya instalada o en caché lee el fragmento de la URL.</li>
              <li>La web comprueba la firma y la hora, y actualiza disponibilidad y precios sin conexión.</li>
            </ol>
            <h5>Formato</h5>
            <p className="small">
              URL con los datos en el fragmento (lo que va tras <code>#</code> no sale del móvil): versión, hora de emisión, validez, y lista compacta de productos con precio y disponible o agotado. Va en JSON, comprimido con deflate y en base64url, con una firma (HMAC con clave del barco) para que nadie fabrique un QR falso. Un QR admite hasta 2.953 bytes; una carta de tres cafeterías cabe si se envían solo identificador, precio y estado.
            </p>
            <h5>Cuándo se refresca</h5>
            <p className="small">En cada cambio de stock y como mínimo cada pocos minutos. Validez de 30 minutos: la web rechaza un QR más viejo que el que ya conoce.</p>
          </div>
          <div className="card">
            <h3>B. QR del pedido en el móvil del pasajero</h3>
            <p className="small">Si no hay red para enviar el pedido o pagar, el pedido viaja en un QR hasta la barra.</p>
            <ol className="small">
              <li>El pasajero arma el pedido en la web, que funciona sin conexión con la carta que ya tiene.</li>
              <li>Sin red, la web muestra un QR con localizador, productos, cantidades, total y franja.</li>
              <li>El camarero lo escanea con la tablet y el pedido entra en la cola de la barra.</li>
              <li>Se cobra en el mostrador con el TPV Ágora, y el pasajero recoge con el localizador.</li>
            </ol>
            <h5>Idempotencia</h5>
            <p className="small">
              Cada pedido lleva una clave única generada en el móvil. Si después vuelve la red y la web sincroniza el mismo pedido, el servidor reconoce la clave y no lo duplica ni cobra dos veces. El pedido del QR no lleva datos de tarjeta.
            </p>
          </div>
        </div>
        <StackFailsafes />
        <p className="tiny muted" style={{ marginTop: 10 }}>
          La demo usa un control CRC solo para ilustrar la verificación y no comprime. En producción: deflate y firma HMAC con una clave del barco, que se rota por viaje.
        </p>
      </section>

      <section className="section">
        <div className="section-title">
          <h2>Capas: prototipo hoy y producción</h2>
          <p>Qué hay ya construido en el prototipo y qué proponemos para producción.</p>
        </div>
        <div className="matrix-wrap" style={{ maxHeight: 'none' }}>
          <table className="faq-stack">
            <thead>
              <tr>
                <th>Capa</th>
                <th>Prototipo (hoy)</th>
                <th>Producción (propuesta)</th>
              </tr>
            </thead>
            <tbody>
              {STACK.map((s) => (
                <tr key={s.capa}>
                  <th>{s.capa}</th>
                  <td>{s.prototipo}</td>
                  <td>{s.produccion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" id="agora">
        <div className="section-title">
          <h2>Cómo nos integramos con Ágora</h2>
          <p>
            La decisión del equipo es integrarnos con Ágora desde el piloto. No elegimos si integrar, sino cómo: un diseño principal y alternativas técnicas según dónde esté instalado Ágora y si su módulo de integración está activo.
          </p>
        </div>

        <div className="card st-principal">
          <div className="st-top">
            <h3>Diseño principal · {DISENO_PRINCIPAL.titulo}</h3>
            <span className="tag yellow">Desde el piloto</span>
          </div>
          <p className="small">{DISENO_PRINCIPAL.resumen}</p>
          <ol className="st-pasos">
            {DISENO_PRINCIPAL.pasos.map((p) => (
              <li key={p.n}>
                <span className="st-n" aria-hidden="true">{p.n}</span>
                <div>
                  <strong>{p.titulo}</strong>
                  <p className="small">{p.texto}</p>
                  <Estado e={p.estado} />
                </div>
              </li>
            ))}
          </ol>
        </div>

        <h3 className="st-sub">Alternativas técnicas según dónde esté Ágora</h3>
        <div className="grid g3 st-escenarios">
          {ESCENARIOS_AGORA.map((e) => (
            <div key={e.id} className="card st-esc">
              <div className="st-cuando">Si {e.cuando.charAt(0).toLowerCase() + e.cuando.slice(1)}</div>
              <h4>{e.nombre}</h4>
              <p className="small">{e.resumen}</p>
              <ul className="clean small">
                {e.como.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <b className="small">Límites</b>
              <ul className="clean small">
                {e.limites.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              {e.ruta && <p className="tiny muted st-ruta">{e.ruta}</p>}
            </div>
          ))}
        </div>

        <div className="card st-erp">
          <h4>{EVOLUCION_ERP.nombre}</h4>
          <p className="small">{EVOLUCION_ERP.resumen}</p>
          <p className="small st-ruta">
            <strong>Cuándo:</strong> {EVOLUCION_ERP.cuando}
          </p>
        </div>
      </section>

      <section className="section" id="flujo-agora">
        <div className="section-title">
          <h2>Qué datos viajan entre Ágora y FredOnBoard</h2>
          <p>Ágora manda en lo que se vende y a qué precio; FredOnBoard devuelve lo que se ha vendido y cobrado.</p>
        </div>
        <div className="st-flujo">
          <div className="card">
            <h4>De Ágora a FredOnBoard</h4>
            <ul className="st-flist">
              {FLUJO_DESDE_AGORA.map((f) => (
                <li key={f.dato}>
                  <div>
                    <strong>{f.dato}</strong>
                    <span className="small muted">{f.detalle}</span>
                  </div>
                  <Estado e={f.estado} />
                </li>
              ))}
            </ul>
          </div>
          <div className="st-flecha" aria-hidden="true">
            <span>⇄</span>
            <span className="tiny muted">API HTTP/JSON</span>
          </div>
          <div className="card">
            <h4>De FredOnBoard a Ágora</h4>
            <ul className="st-flist">
              {FLUJO_HACIA_AGORA.map((f) => (
                <li key={f.dato}>
                  <div>
                    <strong>{f.dato}</strong>
                    <span className="small muted">{f.detalle}</span>
                  </div>
                  <Estado e={f.estado} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="requisitos-agora">
        <div className="section-title">
          <h2>Requisitos y supuestos a validar</h2>
          <p>Lo que necesitamos de Fred. Olsen y de Ágora, y lo que hay que medir en la red local del barco, antes del piloto. No damos por hecho nada que las fuentes públicas no confirmen.</p>
        </div>
        <div className="matrix-wrap" style={{ maxHeight: 'none' }}>
          <table className="st-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Qué</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {[...REQUISITOS_AGORA, ...REQUISITOS_RED].map((r) => (
                <tr key={r.texto}>
                  <th>
                    <span className={`tag ${r.tipo === 'Supuesto' ? 'yellow' : ''}`}>{r.tipo === 'Supuesto' ? 'Supuesto a validar' : 'Requisito'}</span>
                  </th>
                  <td>
                    <strong>{r.texto}</strong>
                  </td>
                  <td>{r.detalle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="tiny muted section">
        Sobre Ágora, de fuentes públicas:{' '}
        {FUENTES_AGORA.map((f, i) => (
          <span key={f.url}>
            {i > 0 && ' · '}
            <a href={f.url} target="_blank" rel="noreferrer">
              {f.t}
            </a>
          </span>
        ))}
        . Más detalle en el <Link to="/implementacion">plan de implementación</Link>.
      </p>
    </>
  )
}
