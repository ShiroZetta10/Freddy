import { QRCodeSVG } from 'qrcode.react'
import { Emails, FuentesEmailSms, SmsList } from './EmailSms'

export const urlPrototipo = () => window.location.href.split('#')[0] + '#/app/pasajero'
/** Pantalla de elegir perfil del prototipo: es el destino de los QR de las piezas nuevas. */
export const urlInicio = () => window.location.href.split('#')[0] + '#/app/inicio'

function Cartel({ tipo }: { tipo: 'mesa' | 'barra' | 'salon' }) {
  const url = urlPrototipo()
  const t = {
    mesa: { cls: 'co-cartel-mesa', titulo: 'Pide sin levantarte', sub: 'Escanea y recoge sin colas.', pie: 'FredOnBoard · On Board Club' },
    barra: { cls: 'co-cartel-barra', titulo: 'Recoge aquí tu pedido', sub: 'Punto FredOnBoard · Enseña tu QR. La barra de siempre sigue igual.', pie: 'Sin cola, sin cobro' },
    salon: { cls: 'co-cartel-salon', titulo: 'Pide sin levantarte, recoge sin colas', sub: 'Escanea el código desde cualquier mesa o zona del salón. Sin cuenta ni descargas.', pie: 'FredOnBoard · On Board Club' },
  }[tipo]
  return (
    <div className="co-cartel-box"><div className={`co-cartel ${t.cls}`}>
      <div className="co-cartel-franja">Bajamar Express</div>
      <div className="co-cartel-cuerpo">
        <strong>{t.titulo}</strong>
        <span>{t.sub}</span>
        <div className="co-cartel-qr"><QRCodeSVG value={url} size={256} level="M" /></div>
        <em>{t.pie}</em>
      </div>
    </div></div>
  )
}

const RESUMEN = [
  { canal: 'WhatsApp de check-in', lleva: 'Una línea con el enlace al pre-pedido', estado: 'Ya existe según el equipo (se añade una línea a la plantilla actual)', medir: 'Aperturas y clics en el enlace' },
  { canal: 'Email de confirmación de compra', lleva: 'Bloque «Pide tu desayuno antes de embarcar» y botón con el localizador', estado: 'Verificado: la web oficial cita la confirmación de compra', medir: 'Clics en el botón sobre emails abiertos' },
  { canal: 'Email recordatorio previo al viaje', lleva: 'Banner y botón con el localizador', estado: 'Ya existe según el equipo; no verificado en la web', medir: 'Clics en el botón y pre-pedidos' },
  { canal: 'Newsletter de Fred. Olsen Plus', lleva: 'Pieza de lanzamiento con botón', estado: 'Verificado: newsletter por email en la web oficial; el boletín Plus lo indica el equipo', medir: 'Clics y bajas por envío' },
  { canal: 'SMS de recordatorio y de cambios de horario', lleva: 'Una línea con enlace corto (fobd.es/XXXX, dominio de ejemplo)', estado: 'Verificado: la web pide teléfono y correo para avisar de cambios; los recordatorios los indica el equipo', medir: 'Clics en el enlace corto y bajas' },
  { canal: 'SMS «tu pedido está listo»', lleva: 'Número de pedido y punto de recogida, sin enlace', estado: 'Nuevo; alternativa para quien no tiene datos', medir: 'Pedidos recogidos tras el SMS' },
  { canal: 'Cartelería con QR', lleva: 'QR en mesas, barra y salón', estado: 'Nuevo, dentro del barco', medir: 'Escaneos por zona' },
]

export default function CanalesSolucion() {
  const url = urlPrototipo()
  return (
    <>
      <p className="lead">
        Canales propios de la solución, con ejemplo visual: WhatsApp, email, SMS y cartelería con QR. Todos llevan al mismo prototipo de pasajero, sin
        cuenta ni descargas.
      </p>

      <div className="matrix-wrap" style={{ maxHeight: 'none', marginBottom: 20 }}>
        <table className="co-table co-table-min">
          <thead><tr><th>Canal</th><th>Qué lleva de FredOnBoard</th><th>Estado</th><th>Qué se mide</th></tr></thead>
          <tbody>
            {RESUMEN.map((r) => (
              <tr key={r.canal}><td>{r.canal}</td><td>{r.lleva}</td><td>{r.estado}</td><td>{r.medir}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3>a) Aviso de WhatsApp en el check-in</h3>
          <p className="small muted">
            Se añade una línea al WhatsApp de recordatorio que Fred. Olsen ya envía, con su misma estructura. Se envía a primera hora, antes del cierre
            del pre-pedido.
          </p>
          <figure className="msg msg-whatsapp" style={{ maxWidth: 'none' }}>
            <figcaption>
              <span className="msg-badge msg-badge-whatsapp">WhatsApp</span>
              <b>Fred. Olsen Express</b>
              <span className="msg-hora">Jueves 06:30</span>
            </figcaption>
            <div className="msg-cuerpo">
              <p>Hola, Carmen: ya falta muy poco para tu viaje a Agaete. Estamos encantados de acompañarte en esta travesía.</p>
              <p>Datos de tu reserva: Localizador FO7K2Q · Trayecto Santa Cruz de Tenerife – Agaete · Salida 08:00.</p>
              <p>Embarque: al viajar sin vehículo, debes estar lista para embarcar al menos 20 minutos antes de la salida.</p>
              <p>Documentación: no es necesario imprimir tu billete. Solo debes presentar tu propia documentación.</p>
              <p><b>Pide sin colas desde FredOnBoard.</b> Tu desayuno #214 te espera a bordo de 08:15 a 08:20.</p>
              <span className="msg-link co-wrap">{url}</span>
              <p>Atención al cliente: 922 290 070 / 928 290 070. ¡Gracias por elegirnos!</p>
            </div>
            <div className="msg-nuevo">Novedad FredOnBoard: la línea «Pide sin colas desde FredOnBoard» y el enlace; el resto es la plantilla actual.</div>
          </figure>
        </div>

        <div className="card">
          <h3>b) Cartelería a bordo con QR</h3>
          <p className="small muted">
            En el barco no hay asiento asignado: los códigos van en las mesas, en la barra y en los paneles del salón, nunca en el asiento. Los QR de la
            maqueta son reales y abren el prototipo de pasajero.
          </p>
          <ul className="co-list">
            <li><b>Mesas:</b> tarjeta de sobremesa con el código y una frase.</li>
            <li><b>Barra:</b> cartel del punto de recogida, que recuerda que la barra tradicional sigue igual.</li>
            <li><b>Paneles del salón:</b> mupi grande con el mensaje central.</li>
          </ul>
          <p className="small muted" style={{ marginBottom: 0 }}>
            Propuesta: en producción cada código llevaría un parámetro de zona para medir los escaneos por ubicación.
          </p>
        </div>
      </div>

      <div className="co-carteles">
        <figure><Cartel tipo="mesa" /><figcaption>Tarjeta de mesa</figcaption></figure>
        <figure><Cartel tipo="barra" /><figcaption>Cartel de barra</figcaption></figure>
        <figure><Cartel tipo="salon" /><figcaption>Mupi del salón</figcaption></figure>
      </div>

      <h3 className="co-canal-t">c) Email</h3>
      <p className="small muted">
        Se apoya en los correos que Fred. Olsen ya envía: la confirmación de compra, el recordatorio previo al viaje y su newsletter. FredOnBoard añade un
        bloque con un botón, y el localizador permite entrar sin cuenta.
      </p>
      <Emails url={urlInicio()} />

      <h3 className="co-canal-t">d) Avisos por SMS</h3>
      <p className="small muted">
        Se añade una línea con enlace corto a los avisos que Fred. Olsen ya envía (recordatorio de salida y cambios de horario o incidencias). El dominio{' '}
        <b>fobd.es</b> y el código XXXX son <span className="co-supuesto">ejemplo</span>: hay que registrar un enlace corto real. En las incidencias no se
        hace promoción: el enlace solo sirve para mantener el pedido ya hecho. El SMS «tu pedido está listo» es una alternativa para quien no tiene datos
        móviles ni wifi: lleva el número de pedido y no necesita enlace.
      </p>
      <SmsList />
      <div className="callout navy" style={{ marginTop: 16 }}>
        <b>Cómo se envían.</b> Se apoyan en los envíos de correo y SMS que Fred. Olsen ya tiene en marcha. No se supone ningún proveedor ni plataforma: la
        integración se define con su equipo. El SMS de recordatorio y de cambios es un aviso de servicio ya existente; la línea de FredOnBoard, la newsletter y
        el SMS de pedido listo solo se envían a quien haya dado su consentimiento, con una baja sencilla en cada envío (enlace de baja en el email; en el SMS,
        el mecanismo que ya use Fred. Olsen). Para mantener los 160 caracteres, los SMS van sin tildes en á, í, ó y ú: con ellas el mensaje pasa a Unicode y el
        límite baja a 70.
      </div>
      <FuentesEmailSms />
    </>
  )
}
