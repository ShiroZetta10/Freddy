import { NavLink, Navigate, Route, Routes, Link, useLocation } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import Hub from './pages/Hub'
import BenchmarkHome from './pages/BenchmarkHome'
import Datos from './pages/Datos'
import BenchmarkPage from './pages/BenchmarkPage'
import Ranking from './pages/Ranking'
import Retos from './pages/Retos'
import Simulador from './pages/Simulador'
import Metodologia from './pages/Metodologia'
import Implementacion from './pages/Implementacion'
import Comunicacion from './pages/Comunicacion'
import Piloto from './pages/Piloto'
import Roadmap from './pages/Roadmap'
import Journey from './pages/Journey'
import Stack from './pages/Stack'
import AppPrototipo from './app/AppPrototipo'
// El prototipo se carga aparte para que la web de entregables siga siendo ligera
const ProtoShell = lazy(() => import('./proto/ProtoShell'))
import { ENTREGABLES } from './data/entregables'
import Icon from './components/Icon'

// Subnavegación del entregable «Benchmark»
const BENCH_LINKS = [
  ['/benchmark', 'Resumen'],
  ['/datos', 'Datos Bajamar'],
  ['/benchmark/A', 'A · Navieras'],
  ['/benchmark/B', 'B · Click & Collect'],
  ['/ranking', 'Ranking y radar'],
  ['/retos', 'Del benchmark a la solución'],
  ['/simulador', 'Simulador'],
  ['/metodologia', 'Metodología'],
] as const
/** Botón flotante para volver arriba: aparece al bajar un poco por la página. */
function VolverArriba() {
  const [ver, setVer] = useState(false)
  useEffect(() => {
    const f = () => setVer(window.scrollY > 600)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  const subir = () => {
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reducir ? 'auto' : 'smooth' })
  }
  return (
    <button type="button" className={`to-top${ver ? ' on' : ''}`} onClick={subir} aria-label="Volver arriba" title="Volver arriba" tabIndex={ver ? 0 : -1}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  )
}

const BENCH_PATHS = ['/benchmark', '/datos', '/ranking', '/retos', '/simulador', '/metodologia']

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  const enBenchmark = BENCH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))

  // El prototipo se ejecuta a pantalla completa, sin la cabecera ni el pie de la web
  if (pathname.startsWith('/app/')) {
    return (
      <Routes>
        <Route
          path="/app/*"
          element={
            <Suspense fallback={<div style={{ padding: 40, fontFamily: 'Open Sans, sans-serif', color: '#0b3478' }}>Cargando FredOnBoard…</div>}>
              <ProtoShell />
            </Suspense>
          }
        />
      </Routes>
    )
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <Icon name="anchor" size={18} />
            </span>
            <span>
              Shiro<small>FredOnBoard · Zetta10</small>
            </span>
          </Link>
          <nav className="nav">
            <NavLink to="/" end>
              Inicio
            </NavLink>
            {ENTREGABLES.filter((e) => e.id !== 'prototipo').map((e) => (
              <NavLink key={e.id} to={e.ruta} className={({ isActive }) => [isActive || (e.id === 'benchmark' && enBenchmark) ? 'active' : '', e.id === 'prototipo' ? 'nav-proto' : ''].join(' ')}>
                {e.titulo.replace('Plan de ', '')}
              </NavLink>
            ))}
            <NavLink to="/futuro">Futuro</NavLink>
            <NavLink to="/stack">Stack</NavLink>
            <NavLink to="/prototipo" className={({ isActive }) => `nav-proto${isActive ? ' active' : ''}`}>
              Prototipo
            </NavLink>
          </nav>
        </div>
        {enBenchmark && (
          <div className="subnav">
            <div className="subnav-inner">
              {BENCH_LINKS.map(([to, label]) => (
                <NavLink key={to} to={to} end>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/benchmark" element={<BenchmarkHome />} />
          <Route path="/benchmark/:key" element={<BenchmarkPage />} />
          <Route path="/datos" element={<Datos />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/retos" element={<Retos />} />
          <Route path="/simulador" element={<Simulador />} />
          <Route path="/metodologia" element={<Metodologia />} />
          <Route path="/implementacion" element={<Implementacion />} />
          <Route path="/comunicacion" element={<Comunicacion />} />
          <Route path="/journey" element={<Journey />} />
          <Route path="/prototipo/*" element={<AppPrototipo />} />
          <Route path="/piloto" element={<Piloto />} />
          <Route path="/futuro" element={<Roadmap />} />
          <Route path="/stack" element={<Stack />} />
          <Route path="/faq" element={<Navigate to="/stack" replace />} />
          <Route path="*" element={<Hub />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="footer-logos">
          <span>Reto propuesto por</span>
          <img src="logos/fred-olsen-express.png" alt="Fred. Olsen Express" height={44} />
          <span>en el marco de</span>
          <img src="logos/talento-canario.png" alt="Talento Canario" height={34} />
        </div>
        Equipo Shiro · Zetta10 Hackathon Talento Canario · Reto «Click & Collect a bordo» propuesto por Fred. Olsen Express.
        <br />
        Benchmark elaborado con fuentes públicas (octubre 2026) y datos facilitados por la organización. Las cifras de proveedores se indican como tales.
      </footer>
      <VolverArriba />
    </>
  )
}
