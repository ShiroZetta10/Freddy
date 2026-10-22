/**
 * Shell del prototipo: rutas a pantalla completa (sin la cabecera de la web).
 *   /#/app/pasajero  · /#/app/barra · /#/app/manager · /#/app/demo (las tres a la vez)
 */
import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './proto.css'
import { arrancarMotor, pararMotor, resetDemo } from './store'
import { DemoControls, ProtoChrome, ToastProvider } from './shared'
import PasajeroApp from './pasajero'
import BarraApp from './barra'
import ManagerApp from './manager'
import ElegirPerfil from './ElegirPerfil'

/**
 * iframe a tamaño "real" (ancho × alto virtuales) escalado para caber en pantalla.
 * Con `girar`, la vista se gira 90° para aprovechar el alto del móvil en vertical (barra y manager son apaisados).
 */
function Escalado({ titulo, src, ancho, alto, girar }: { titulo: string; src: string; ancho: number; alto: number; girar?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(1)
  useEffect(() => {
    // se mide la sección (no el marco, que en modo girado se ajusta a su contenido); 16 px = bordes del marco
    const el = (ref.current?.closest('section') as HTMLElement | null) ?? ref.current?.parentElement
    if (!el) return
    const medir = () => {
      const w = el.clientWidth - 16
      if (w <= 0) return
      if (girar) {
        const disponible = Math.max(320, window.innerHeight - el.getBoundingClientRect().top - 28)
        setEscala(Math.min(1, disponible / ancho, w / alto))
      } else setEscala(Math.min(1, w / ancho))
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    window.addEventListener('resize', medir)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', medir)
    }
  }, [ancho, alto, girar])
  if (girar) {
    return (
      <div ref={ref} className="fob-escalado" style={{ width: alto * escala, height: ancho * escala }}>
        <iframe
          title={titulo}
          src={src}
          style={{ width: ancho, height: alto, transform: `translate(${alto * escala}px, 0) rotate(90deg) scale(${escala})` }}
        />
      </div>
    )
  }
  return (
    <div ref={ref} className="fob-escalado" style={{ height: alto * escala }}>
      <iframe title={titulo} src={src} style={{ width: ancho, height: alto, transform: `scale(${escala})` }} />
    </div>
  )
}

const PERFILES_DEMO = [
  { id: 'pasajero', nombre: 'Pasajero', disp: 'móvil', ancho: 390, alto: 780, marco: 'fob-demo-phone' },
  { id: 'barra', nombre: 'Barra', disp: 'tablet', ancho: 1024, alto: 700, marco: 'fob-demo-tablet' },
  { id: 'manager', nombre: 'Manager', disp: 'escritorio', ancho: 1280, alto: 800, marco: 'fob-demo-desk' },
] as const

function useAncho(max: number) {
  const q = `(max-width: ${max}px)`
  const [v, setV] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const f = () => setV(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [q])
  return v
}

function Demo() {
  // Vista "show-off": las tres apps en vivo compartiendo el mismo estado.
  // En pantallas anchas, una al lado de otra; en móvil, pestañas y cada vista a su tamaño real escalado.
  const movil = useAncho(1000)
  const vertical = useVerticalEstrecho()
  const [activo, setActivo] = useState<(typeof PERFILES_DEMO)[number]['id']>('pasajero')
  const chrome = (
    <ProtoChrome titulo={movil ? 'Demo' : 'Demo en vivo · 3 perfiles'}>
      <button className="fob-chip-btn" style={{ marginRight: 8 }} onClick={() => resetDemo()} title="Vuelve al puerto de salida y borra los pedidos">
        {movil ? 'Reiniciar' : 'Nueva travesía'}
      </button>
    </ProtoChrome>
  )
  if (movil) {
    return (
      <div className="fob fob-root">
        {chrome}
        <div className="fob-demo-tabs" role="tablist" aria-label="Perfil">
          {PERFILES_DEMO.map((p) => (
            <button key={p.id} role="tab" aria-selected={activo === p.id} className={activo === p.id ? 'on' : ''} onClick={() => setActivo(p.id)}>
              {p.nombre}
              <small>{p.disp}</small>
            </button>
          ))}
        </div>
        <p className="fob-demo-tip">Lo que hagas en un perfil aparece al instante en los otros dos: cambia de pestaña para verlo.</p>
        <div className="fob-demo-movil">
          {PERFILES_DEMO.map((p) => (
            <section key={p.id} hidden={activo !== p.id}>
              <div className={`${p.marco} fob-demo-marco${vertical && p.id !== 'pasajero' ? ' girado' : ''}`}>
                <Escalado titulo={p.nombre} src={`#/app/${p.id}?embed=1`} ancho={p.ancho} alto={p.alto} girar={vertical && p.id !== 'pasajero'} />
              </div>
            </section>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="fob fob-root">
      {chrome}
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
