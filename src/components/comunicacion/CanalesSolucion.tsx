import { QRCodeSVG } from 'qrcode.react'

export const urlPrototipo = () => window.location.href.split('#')[0] + '#/app/pasajero'

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

export default function CanalesSolucion() {
  const url = urlPrototipo()
  return (
    <>
      <p className="lead">
        Dos canales propios de la solución, con ejemplo visual. Los dos llevan al mismo prototipo de pasajero, sin cuenta ni descargas.
      </p>

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
    </>
  )
}
