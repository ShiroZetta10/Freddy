/**
 * Shell del prototipo: rutas a pantalla completa (sin la cabecera de la web).
 *   /#/app/pasajero  · /#/app/barra · /#/app/manager · /#/app/demo (las tres a la vez)
 */
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './proto.css'
import { arrancarMotor, pararMotor, resetDemo } from './store'
import { DemoControls, ProtoChrome, ToastProvider } from './shared'
import PasajeroApp from './pasajero'
import BarraApp from './barra'
import ManagerApp from './manager'
import ElegirPerfil from './ElegirPerfil'

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

/** true en móviles en vertical (ancho ≤ 900 px y más alto que ancho). */
function useVerticalEstrecho() {
  const q = '(orientation: portrait) and (max-width: 900px)'
  const [v, setV] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const f = () => setV(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return v
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
  // Barra y manager son vistas de tablet/escritorio. En un móvil en vertical se muestran giradas a horizontal:
  // se cargan en un iframe apaisado (para que su diseño responda al ancho horizontal) y el iframe se gira 90°.
  const { pathname } = useLocation()
  const vertical = useVerticalEstrecho()
  const apaisado = window.location.hash.includes('land=1')
  if (!embebido && !apaisado && vertical && /^\/app\/(barra|manager)/.test(pathname)) {
    return (
      <div className="fob-rotado">
        <iframe title="Vista en horizontal" src={`#${pathname}?land=1`} allow="fullscreen" />
      </div>
    )
  }
  return (
    <div>
    <ToastProvider>
      <Routes>
        <Route path="pasajero/*" element={<PasajeroApp />} />
        <Route path="barra/*" element={<BarraApp />} />
        <Route path="manager/*" element={<ManagerApp />} />
        <Route path="demo" element={<Demo />} />
        <Route path="inicio" element={<ElegirPerfil />} />
        <Route path="*" element={<Navigate to="/app/inicio" replace />} />
      </Routes>
      {!embebido && <DemoControls />}
    </ToastProvider>
    </div>
  )
}
