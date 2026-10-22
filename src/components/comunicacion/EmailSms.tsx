import { FUENTES_EMAIL_SMS, NO_VERIFICADO_EMAIL_SMS } from '../../data/comunicacion'
import { Mar } from './Ilustraciones'

const LOGO = 'logos/fred-olsen-express.png'
const SELLO = 'logos/elaborado-en-canarias.png'

function CabEmail() {
  return (
    <div className="co-em-cab">
      <img src={LOGO} alt="Fred. Olsen Express" />
      <span>Fred. Olsen Express</span>
    </div>
  )
}

function Boton({ children }: { children: string }) {
  return <span className="co-em-btn">{children}</span>
}

function Sobre({ de, asunto, children, nuevo }: { de: string; asunto: string; children: React.ReactNode; nuevo: string }) {
  return (
    <figure className="co-em">
      <figcaption>
        <span className="msg-badge msg-badge-email">Email</span>
        <div className="co-em-meta">
          <span><b>De:</b> {de}</span>
          <span><b>Asunto:</b> {asunto}</span>
        </div>
      </figcaption>
      <div className="co-em-cuerpo">{children}</div>
      <div className="msg-nuevo">Novedad FredOnBoard: {nuevo}</div>
    </figure>
  )
}

function BloqueFob({ titulo, texto, boton, nota }: { titulo: string; texto: string; boton: string; nota: string }) {
  return (
    <div className="co-em-fob">
      <Mar barco={false} className="co-em-fob-mar" />
      <div className="co-em-fob-txt">
        <em>FredOnBoard · en On Board Club</em>
        <h5>{titulo}</h5>
        <p>{texto}</p>
        <Boton>{boton}</Boton>
        <small>{nota}</small>
      </div>
    </div>
  )
}

export function Emails({ url }: { url: string }) {
  return (
    <div className="co-em-grid">
      <Sobre
        de="Fred. Olsen Express"
        asunto="Confirmación de tu compra · Santa Cruz de Tenerife – Agaete"
        nuevo="el bloque azul con el botón; el resto es la estructura de la confirmación actual (maqueta ilustrativa, no es su texto real)."
      >
        <CabEmail />
        <h5 className="co-em-t">Confirmación de tu compra</h5>
        <dl className="co-em-datos">
          <div><dt>Localizador</dt><dd>FO7K2Q</dd></div>
          <div><dt>Trayecto</dt><dd>Santa Cruz de Tenerife – Agaete</dd></div>
          <div><dt>Salida</dt><dd>Jueves, 08:00</dd></div>
        </dl>
        <div className="co-em-hueco">Resto de la confirmación actual: pasajeros, importe, documentación y condiciones</div>
        <BloqueFob
          titulo="Pide tu desayuno antes de embarcar"
          texto="Elige ahora y recógelo a bordo, sin colas. Entra con tu localizador FO7K2Q: sin cuenta ni descargas."
          boton="Pedir mi desayuno"
          nota="La barra de siempre sigue atendiendo igual."
        />
      </Sobre>

      <Sobre
        de="Fred. Olsen Express"
        asunto="Mañana viajas a Agaete: tu billete y tu desayuno"
        nuevo="el banner «Pide tu desayuno antes de embarcar» y el botón con el localizador; el recordatorio es el que el equipo indica que ya se envía."
      >
        <CabEmail />
        <p className="co-em-p">Hola, Carmen: mañana sales de Santa Cruz de Tenerife a las 08:00. Estamos encantados de acompañarte en esta travesía.</p>
        <ul className="co-em-lista">
          <li>Localizador FO7K2Q</li>
          <li>Si viajas sin vehículo, estate lista para embarcar al menos 20 minutos antes.</li>
          <li>No hace falta imprimir tu billete.</li>
        </ul>
        <BloqueFob
          titulo="Pide tu desayuno antes de embarcar"
          texto="Tu pedido te espera a bordo cuando quieras recogerlo. Sin colas y sin instalar nada."
          boton="Pedir con mi localizador"
          nota="Si prefieres la barra, sigue como siempre."
        />
        <p className="co-em-pie">Atención al cliente: 922 290 070 / 928 290 070.</p>
      </Sobre>

      <Sobre
        de="Fred. Olsen Plus"
        asunto="Novedad en el Bajamar Express: pide sin colas a bordo"
        nuevo="una pieza de lanzamiento dentro de la newsletter de Fred. Olsen Plus; la cabecera y el pie son los de una newsletter habitual."
      >
        <CabEmail />
        <div className="co-em-news-top">Fred. Olsen Plus · Novedades</div>
        <div className="co-em-hero">
          <Mar barco={false} className="co-em-fob-mar" />
          <div className="co-em-fob-txt">
            <em>Lo nuestro viaja contigo</em>
            <h5>Ya puedes pedir sin colas a bordo del Bajamar Express</h5>
            <p>FredOnBoard, dentro de On Board Club. Pide desde tu mesa y recoge cuando esté listo.</p>
            <Boton>Probar FredOnBoard</Boton>
          </div>
        </div>
        <div className="co-em-tres">
          <div><b>Sin cuenta</b><span>Entra con tu localizador.</span></div>
          <div><b>Producto canario</b><span>Con nombre de proveedor.</span><img src={SELLO} alt="Elaborado en Canarias" /></div>
          <div><b>Plus Points</b><span>Extra en tu primer pedido <i className="co-supuesto">propuesta</i></span></div>
        </div>
        <p className="co-em-pie">Recibes este correo porque estás suscrito a la newsletter de Fred. Olsen. Puedes darte de baja cuando quieras.</p>
      </Sobre>

      <div className="co-em-nota small muted">
        En producción el botón llevaría un enlace con el localizador para entrar sin cuenta (propuesta). En esta maqueta, el destino de prueba es{' '}
        <span className="co-wrap">{url}</span>.
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- SMS

// Alfabeto básico GSM-7: con otros caracteres (por ejemplo á, í, ó, ú) el SMS pasa a Unicode y el límite baja a 70.
const GSM = /^[A-Za-z0-9 @£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà\n]*$/

type Sms = { titulo: string; origen: string; idioma: string; texto: string }

const SMS: Sms[] = [
  { titulo: 'Recordatorio de salida', origen: 'Aviso existente con una línea nueva', idioma: 'ES', texto: 'Fred. Olsen: tu salida a Agaete es mañana a las 08:00. Embarca 20 min antes. Pide sin colas: fobd.es/XXXX' },
  { titulo: 'Recordatorio de salida', origen: 'Aviso existente con una línea nueva', idioma: 'EN', texto: 'Fred. Olsen: your Agaete sailing is tomorrow at 08:00. Board 20 min early. Order ahead, no queue: fobd.es/XXXX' },
  { titulo: 'Cambio de horario o incidencia', origen: 'Aviso existente; sin promoción', idioma: 'ES', texto: 'Fred. Olsen: tu salida de las 08:00 pasa a las 08:45. Si ya pediste, tu pedido FredOnBoard se ajusta: fobd.es/XXXX' },
  { titulo: 'Cambio de horario o incidencia', origen: 'Aviso existente; sin promoción', idioma: 'EN', texto: 'Fred. Olsen: your 08:00 sailing is now 08:45. If you already ordered, your FredOnBoard order adjusts: fobd.es/XXXX' },
  { titulo: 'Tu pedido está listo', origen: 'Nuevo; para quien no tiene datos', idioma: 'ES', texto: 'FredOnBoard: pedido 214 listo para recoger en el punto FredOnBoard de la barra. Indica el 214 al personal. Gracias.' },
  { titulo: 'Tu pedido está listo', origen: 'Nuevo; para quien no tiene datos', idioma: 'EN', texto: 'FredOnBoard: order 214 is ready to collect at the FredOnBoard point at the bar. Tell the crew 214. Thank you.' },
]

export function SmsList() {
  return (
    <div className="co-sms-grid">
      {SMS.map((s) => {
        const n = s.texto.length
        const gsm = GSM.test(s.texto)
        const limite = gsm ? 160 : 70
        return (
          <figure key={s.titulo + s.idioma} className="co-sms">
            <figcaption>
              <span className="msg-badge msg-badge-push">SMS · {s.idioma}</span>
              <b>{s.titulo}</b>
            </figcaption>
            <div className="co-sms-burbuja">{s.texto}</div>
            <div className={`co-sms-cuenta ${n <= limite ? 'ok' : 'mal'}`}>
              {n} de {limite} caracteres · {gsm ? 'alfabeto estándar (GSM-7)' : 'Unicode'}
            </div>
            <div className="msg-nuevo">{s.origen}</div>
          </figure>
        )
      })}
    </div>
  )
}

export function FuentesEmailSms() {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3>Qué se ha comprobado en la web oficial</h3>
      <p className="small muted">Consulta del 22/10/2026 en fredolsen.es.</p>
      <ul className="co-list">
        {FUENTES_EMAIL_SMS.map((f) => (
          <li key={f.dato}>
            <b>{f.dato}.</b> {f.cita}{' '}
            <a href={f.url} target="_blank" rel="noreferrer" className="co-wrap">{f.url}</a>
          </li>
        ))}
      </ul>
      <p className="small" style={{ marginBottom: 0 }}><span className="co-supuesto">No verificado</span> {NO_VERIFICADO_EMAIL_SMS}</p>
    </div>
  )
}
