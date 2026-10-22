/**
 * Shell del prototipo: rutas a pantalla completa (sin la cabecera de la web).
 *   /#/app/pasajero  · /#/app/barra · /#/app/manager · /#/app/demo (las tres a la vez)
 */
import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './proto.css'
import { arrancarMotor, pararMotor, resetDemo } from './store'
import { DemoControls, ProtoChrome, ToastProvider } from './shared'
import PasajeroApp from './pasajero'
import BarraApp from './barra'
import ManagerApp from './manager'

function Demo() {
  // Vista "show-off": las tres apps en vivo, una al lado de otra, compartiendo el mismo estado.
  return (
    <div className="fob fob-root">
      <ProtoChrome titulo="Demo en vivo · 3 perfiles">
        <button className="fob-chip-btn" style={{ marginRight: 8 }} onClick={() => resetDemo()} title="Vuelve al puerto de salida y borra los pedidos">
          Nueva travesía
        </button>
      </ProtoChrome>
      <div className="fob-demo-grid">
        <section>
          <div className="fob-demo-label">Pasajero · móvil</div>
          <div className="fob-demo-phone">
            <iframe title="Pasajero" src="#/app/pasajero?embed=1" />
          </div>
        </section>
        <section>
          <div className="fob-demo-label">Barra · tablet</div>
          <div className="fob-demo-tablet">
            <iframe title="Barra" src="#/app/barra?embed=1" />
          </div>
        </section>
        <section>
          <div className="fob-demo-label">Manager · escritorio</div>
          <div className="fob-demo-desk">
            <iframe title="Manager" src="#/app/manager?embed=1" />
          </div>
        </section>
      </div>
    </div>
  )
}

export default function ProtoShell() {
  useEffect(() => {
    // ?reset=1 (desde el lanzador) empieza una travesía nueva
    if (window.location.hash.includes('reset=1')) {
      resetDemo()
      window.history.replaceState(null, '', window.location.href.replace(/[?&]reset=1/, ''))
    }
    arrancarMotor()
    document.body.classList.add('fob-body')
    return () => {
      pararMotor()
      document.body.classList.remove('fob-body')
    }
  }, [])
  const embebido = window.location.hash.includes('embed=1')
  return (
    <ToastProvider>
      <Routes>
        <Route path="pasajero/*" element={<PasajeroApp />} />
        <Route path="barra/*" element={<BarraApp />} />
        <Route path="manager/*" element={<ManagerApp />} />
        <Route path="demo" element={<Demo />} />
        <Route path="*" element={<Navigate to="/prototipo" replace />} />
      </Routes>
      {!embebido && <DemoControls />}
    </ToastProvider>
  )
}
