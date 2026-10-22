/** Entrada del prototipo en el móvil (QR y app instalada): elegir con qué perfil probar FredOnBoard. */
import { Link } from 'react-router-dom'
import { ProtoChrome } from './shared'
import { resetDemo } from './store'

const PERFILES = [
  { ruta: '/app/pasajero', titulo: 'Pasajero', disp: 'Móvil', desc: 'Pide sin levantarte, paga y recoge sin colas con tu código.' },
  { ruta: '/app/barra', titulo: 'Barra', disp: 'Tablet de cafetería', desc: 'Pedidos por franja, avisos de «listo», entrega con QR y bonos.' },
  { ruta: '/app/manager', titulo: 'Manager', disp: 'Escritorio', desc: 'Panel en vivo, alertas, carta y stock, Clase Oro y analítica.' },
  { ruta: '/app/demo', titulo: 'Demo de los 3 perfiles', disp: 'Mejor en pantalla grande', desc: 'Pasajero, barra y manager a la vez, compartiendo el mismo estado.' },
]

export default function ElegirPerfil() {
  return (
    <div className="fob fob-root fob-elegir">
      <ProtoChrome titulo="Elige perfil" />
      <main className="fob-elegir-main">
        <h1>¿Con qué perfil quieres probar FredOnBoard?</h1>
        <p>Los tres comparten el mismo viaje simulado: lo que pides como pasajero aparece en la barra y en el panel del manager.</p>
        <div className="fob-elegir-grid">
          {PERFILES.map((p) => (
            <Link key={p.ruta} to={p.ruta} className="fob-elegir-card">
              <span className="fob-elegir-disp">{p.disp}</span>
              <b>{p.titulo}</b>
              <span>{p.desc}</span>
            </Link>
          ))}
        </div>
        <button className="fob-elegir-reset" onClick={() => resetDemo()}>
          Empezar una travesía nueva
        </button>
      </main>
    </div>
  )
}
