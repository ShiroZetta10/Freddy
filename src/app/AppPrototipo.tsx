// Entregable 05 · Prototipo: lanzador de FredOnBoard (pasajero, barra, manager y demo en vivo).
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Icon from '../components/Icon'

const PERFILES = [
  {
    ruta: '/app/pasajero',
    icono: 'phone',
    titulo: 'Pasajero',
    disp: 'Móvil · web sin instalar',
    desc: 'Acceso con el billete, pre-pedido, carta con stock en vivo, franjas de recogida, pago, aviso «listo» con QR, asistente en ES/EN/DE y llegada.',
  },
  {
    ruta: '/app/barra',
    icono: 'food',
    titulo: 'Barra',
    disp: 'Tablet de cafetería',
    desc: 'Pedidos por franja (Recibido → Preparando → Listo), pausa de pedidos, agotados en un toque, entrega con QR, previsión y cierre de travesía.',
  },
  {
    ruta: '/app/manager',
    icono: 'trend',
    titulo: 'Manager',
    disp: 'Escritorio',
    desc: 'Flota en vivo, alertas de saturación con acciones, carta y precios, reglas de capacidad, avisos a pasajeros y analítica del piloto frente a la línea base.',
  },
]

export default function AppPrototipo() {
  const base = window.location.href.split('#')[0]
  const urlPasajero = `${base}#/app/pasajero`
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Entregable 05 · Prototipo</div>
        <h1>FredOnBoard, funcionando</h1>
        <p>
          Prototipo navegable de los tres perfiles. Comparten el mismo estado en tiempo real: lo que pide el pasajero aparece en la barra y en el panel del
          manager al instante, también entre pestañas o dispositivos del mismo navegador. El viaje avanza solo y otros pasajeros simulados van pidiendo.
        </p>
        <div className="hero-actions">
          <Link className="btn primary" to="/app/demo">
            Abrir la demo en vivo (3 perfiles)
          </Link>
          <Link className="btn ghost" to="/app/pasajero">
            Probar como pasajero
          </Link>
        </div>
      </div>

      <div className="grid g3">
        {PERFILES.map((p) => (
          <Link key={p.ruta} to={p.ruta} className="card hub-card">
            <div className="hub-top">
              <span className="hub-ico">
                <Icon name={p.icono} />
              </span>
              <span className="tag">{p.disp}</span>
            </div>
            <h3>{p.titulo}</h3>
            <p className="small muted">{p.desc}</p>
            <span className="hub-go">Abrir a pantalla completa</span>
          </Link>
        ))}
      </div>

      <div className="grid g2 section">
        <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', padding: 10, border: '1px solid var(--line)', borderRadius: 8 }}>
            <QRCodeSVG value={urlPasajero} size={132} fgColor="#0b3478" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3>Pruébalo en tu móvil</h3>
            <p className="small muted">
              Escanea el código, como haría el pasajero con el QR de su asiento. Usa el botón de pantalla completa o «Añadir a pantalla de inicio» para
              abrirlo como una app.
            </p>
            <p className="small">
              Billetes de prueba: <strong>FO7K2Q</strong> (Carmen), <strong>FO9X4M</strong> (Tom, inglés), <strong>FO3H8B</strong> (Greta, alemán, Clase Oro).
            </p>
          </div>
        </div>
        <div className="card">
          <h3>Guion de demo para el jurado</h3>
          <ol className="small" style={{ paddingLeft: 18, margin: '6px 0 0' }}>
            <li>Abre la demo en vivo. En el botón de ajustes (abajo a la derecha) elige la fase «Antes».</li>
            <li>Como pasajero, entra con FO7K2Q y pre-pide un desayuno. Mira cómo aparece en la barra y en el manager.</li>
            <li>Pasa a «Navegando»: en la barra, pulsa Empezar y Listo. El pasajero recibe el aviso y su QR.</li>
            <li>Corta la conexión del barco y haz otro pedido: se guarda y se envía solo, sin duplicarse.</li>
            <li>Marca un producto agotado o pausa una cafetería: el pasajero lo ve al momento.</li>
            <li>Cierra en la analítica del manager: venta por pasajero frente a la línea base.</li>
          </ol>
        </div>
      </div>
    </>
  )
}
