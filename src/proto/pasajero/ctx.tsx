/** Contexto de la sesión del pasajero: billete, idioma, accesibilidad, carrito, navegación y chat. */
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Billete, Bono, CafeteriaId, ConsultaBono, LineaPedido, Pedido, ProtoState, bonosDeBillete, consultarBono, cotizar, disponible, estadoBono, pedidosAbiertos, useProtoState } from '../store'
import { Lang, TFn, makeT } from './i18n'
import { vibrar } from './ui'

export type Tab = 'viaje' | 'carta' | 'pedidos' | 'ayuda'
export const TABS: Tab[] = ['viaje', 'carta', 'pedidos', 'ayuda']
export type ChatMsg = { id: number; de: 'bot' | 'yo'; texto: string }
export type Flyer = { id: number; x: number; y: number; color: string }
export type SheetId = null | 'cart' | 'ajustes'

// almacenamiento tolerante a fallos (navegación privada, iframes sin permisos…)
export const ss = {
  get(k: string) {
    try {
      return sessionStorage.getItem(k)
    } catch {
      return null
    }
  },
  set(k: string, v: string) {
    try {
      sessionStorage.setItem(k, v)
    } catch {
      /* ignorar */
    }
  },
  del(k: string) {
    try {
      sessionStorage.removeItem(k)
    } catch {
      /* ignorar */
    }
  },
}
export const ls = {
  get(k: string) {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* ignorar */
    }
  },
}

type PJ = {
  s: ProtoState
  billete: Billete
  esOro: boolean
  mios: Pedido[]
  lang: Lang
  setLang: (l: Lang) => void
  t: TFn
  big: boolean
  setBig: (b: boolean) => void
  contrast: boolean
  setContrast: (b: boolean) => void
  tab: Tab
  dir: number
  goTab: (t: Tab) => void
  loadingTab: Tab | null
  cart: LineaPedido[]
  cartCount: number
  cartTotal: number
  add: (pid: string, origen?: HTMLElement | null) => boolean
  dec: (pid: string) => void
  removeLinea: (pid: string) => void
  clearCart: () => void
  caf: CafeteriaId
  setCaf: (c: CafeteriaId) => void
  franjaSel: number | null
  setFranjaSel: (n: number | null) => void
  bump: number
  flyers: Flyer[]
  endFlyer: (id: number) => void
  sheet: SheetId
  openSheet: (s: SheetId) => void
  chat: ChatMsg[]
  setChat: (fn: (c: ChatMsg[]) => ChatMsg[]) => void
  logout: () => void
  plusGanados: number
  /** Bonos que el pasajero puede usar: los comprados con su billete y los físicos que ha canjeado por código. */
  bonos: Bono[]
  /** Bono aplicado al carrito (null = ninguno). */
  bono: Bono | null
  usarBono: (codigo: string | null) => void
  /** Introduce un código (tecleado o escaneado): lo valida, lo añade a «mis bonos» y lo aplica al pedido. */
  canjearCodigo: (raw: string) => ConsultaBono
}

const Ctx = createContext<PJ>(null as unknown as PJ)
export const useP = () => useContext(Ctx)

function leerCarrito(): LineaPedido[] {
  try {
    const raw = ss.get('pj-cart')
    return raw ? (JSON.parse(raw) as LineaPedido[]) : []
  } catch {
    return []
  }
}

export function PJProvider({ ticket, onLogout, children }: { ticket: string; onLogout: () => void; children: ReactNode }) {
  const s = useProtoState()
  const billete = s.billetes.find((b) => b.ticket === ticket) as Billete
  const esOro = billete.clase === 'oro'

  const [lang, setLangState] = useState<Lang>(() => (ss.get('pj-lang') as Lang) || billete.idioma)
  const [big, setBigState] = useState(() => ls.get('pj-big') === '1')
  const [contrast, setContrastState] = useState(() => ls.get('pj-hc') === '1')
  const [tab, setTab] = useState<Tab>('viaje')
  const [dir, setDir] = useState(1)
  const [loadingTab, setLoadingTab] = useState<Tab | null>('viaje')
  const [cart, setCart] = useState<LineaPedido[]>(leerCarrito)
  const [caf, setCafState] = useState<CafeteriaId>(() => (esOro ? 'oro' : 'proa'))
  const [franjaSel, setFranjaSel] = useState<number | null>(null)
  const [bump, setBump] = useState(0)
  const [flyers, setFlyers] = useState<Flyer[]>([])
  const [sheet, setSheet] = useState<SheetId>(null)
  const [chat, setChatState] = useState<ChatMsg[]>([])
  const [bonoSel, setBonoSel] = useState<string | null>(() => ss.get('pj-bono'))
  const [fisicos, setFisicos] = useState<string[]>(() => {
    try {
      return JSON.parse(ss.get('pj-bonos-fis') || '[]') as string[]
    } catch {
      return []
    }
  })
  const tabRef = useRef(tab)
  tabRef.current = tab

  const t = useMemo(() => makeT(lang), [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    ss.set('pj-lang', l)
  }, [])
  const setBig = useCallback((b: boolean) => {
    setBigState(b)
    ls.set('pj-big', b ? '1' : '0')
  }, [])
  const setContrast = useCallback((b: boolean) => {
    setContrastState(b)
    ls.set('pj-hc', b ? '1' : '0')
  }, [])

  // salida del esqueleto inicial
  useEffect(() => {
    const id = window.setTimeout(() => setLoadingTab(null), 380)
    return () => window.clearTimeout(id)
  }, [])

  const loadTimer = useRef<number>()
  const goTab = useCallback((nuevo: Tab) => {
    if (nuevo === tabRef.current) return
    setDir(TABS.indexOf(nuevo) > TABS.indexOf(tabRef.current) ? 1 : -1)
    setTab(nuevo)
    setLoadingTab(nuevo)
    window.clearTimeout(loadTimer.current)
    loadTimer.current = window.setTimeout(() => setLoadingTab(null), 240)
    vibrar(8)
  }, [])

  const sRef = useRef(s)
  sRef.current = s
  const cartRef = useRef(cart)
  const setCartNow = useCallback((c: LineaPedido[]) => {
    cartRef.current = c
    ss.set('pj-cart', JSON.stringify(c))
    setCart(c)
  }, [])

  const add = useCallback(
    (pid: string, origen?: HTMLElement | null) => {
      const st = sRef.current
      const c = cartRef.current
      const p = st.productos.find((x) => x.id === pid)
      const actual = c.find((l) => l.pid === pid)?.qty ?? 0
      if (!p || actual + 1 > disponible(st, p) || !pedidosAbiertos(st)) {
        vibrar([30, 40, 30])
        return false
      }
      setCartNow(actual ? c.map((l) => (l.pid === pid ? { ...l, qty: l.qty + 1 } : l)) : [...c, { pid, qty: 1 }])
      setBump((b) => b + 1)
      vibrar(12)
      if (origen) {
        const r = origen.getBoundingClientRect()
        setFlyers((f) => [...f, { id: Date.now() + Math.random(), x: r.left + r.width / 2, y: r.top + r.height / 2, color: p.color }])
      }
      return true
    },
    [setCartNow],
  )

  const dec = useCallback(
    (pid: string) => {
      setCartNow(cartRef.current.flatMap((l) => (l.pid === pid ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l])))
      vibrar(8)
    },
    [setCartNow],
  )
  const removeLinea = useCallback((pid: string) => setCartNow(cartRef.current.filter((l) => l.pid !== pid)), [setCartNow])
  const clearCart = useCallback(() => setCartNow([]), [setCartNow])
  const setCaf = useCallback((c: CafeteriaId) => {
    setCafState(c)
    setFranjaSel(null)
  }, [])
  const endFlyer = useCallback((id: number) => setFlyers((f) => f.filter((x) => x.id !== id)), [])
  const setChat = useCallback((fn: (c: ChatMsg[]) => ChatMsg[]) => setChatState(fn), [])

  // purga de líneas cuyo producto ya no se puede vender (agotado desde la barra)
  useEffect(() => {
    const c = cartRef.current
    const filtrado = c.flatMap((l) => {
      const p = s.productos.find((x) => x.id === l.pid)
      if (!p) return []
      const max = disponible(s, p)
      return max <= 0 ? [] : [{ ...l, qty: Math.min(l.qty, max) }]
    })
    const igual = filtrado.length === c.length && filtrado.every((l, i) => l.qty === c[i].qty)
    if (!igual) setCartNow(filtrado)
  }, [s, setCartNow])

  // bonos del pasajero: los de su billete + los físicos que ha introducido (siempre contrastados con el estado compartido)
  const bonos = useMemo(() => {
    const propios = bonosDeBillete(s, ticket)
    const fis = fisicos.flatMap((c) => s.bonos.filter((b) => b.codigo === c && b.tipo === 'fisico' && estadoBono(s, b) === 'disponible'))
    return [...propios, ...fis]
  }, [s, ticket, fisicos])
  const bono = useMemo(() => bonos.find((b) => b.codigo === bonoSel) ?? null, [bonos, bonoSel])
  // si el bono aplicado se canjea en otro sitio (otra pestaña, barra) o caduca, se quita solo
  useEffect(() => {
    if (bonoSel && !bono) {
      setBonoSel(null)
      ss.del('pj-bono')
    }
  }, [bonoSel, bono])
  const usarBono = useCallback((codigo: string | null) => {
    setBonoSel(codigo)
    if (codigo) ss.set('pj-bono', codigo)
    else ss.del('pj-bono')
  }, [])
  const canjearCodigo = useCallback(
    (raw: string): ConsultaBono => {
      const r = consultarBono(sRef.current, raw, ticket)
      if (r.ok) {
        if (r.bono.tipo === 'fisico') {
          const nuevos = fisicos.includes(r.bono.codigo) ? fisicos : [...fisicos, r.bono.codigo]
          setFisicos(nuevos)
          ss.set('pj-bonos-fis', JSON.stringify(nuevos))
        }
        usarBono(r.bono.codigo)
        vibrar(15)
      } else vibrar([40, 50, 40])
      return r
    },
    [fisicos, ticket, usarBono],
  )

  const cartCount = cart.reduce((a, l) => a + l.qty, 0)
  const cartTotal = cotizar(s, billete, cart.filter((l) => s.productos.some((p) => p.id === l.pid)), bono, caf).total
  const mios = useMemo(() => s.pedidos.filter((p) => p.ticket === ticket), [s.pedidos, ticket])
  const plusGanados = Math.floor(mios.filter((p) => p.estado !== 'cancelado').reduce((a, p) => a + p.total, 0))

  const logout = useCallback(() => {
    ss.del('pj-ticket')
    ss.del('pj-cart')
    ss.del('pj-lang')
    ss.del('pj-bono')
    ss.del('pj-bonos-fis')
    onLogout()
  }, [onLogout])

  const value: PJ = {
    s,
    billete,
    esOro,
    mios,
    lang,
    setLang,
    t,
    big,
    setBig,
    contrast,
    setContrast,
    tab,
    dir,
    goTab,
    loadingTab,
    cart,
    cartCount,
    cartTotal,
    add,
    dec,
    removeLinea,
    clearCart,
    caf,
    setCaf,
    franjaSel,
    setFranjaSel,
    bump,
    flyers,
    endFlyer,
    sheet,
    openSheet: setSheet,
    chat,
    setChat,
    logout,
    plusGanados,
    bonos,
    bono,
    usarBono,
    canjearCodigo,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
