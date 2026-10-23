/**
 * Ventajas por pedir con antelación (propuesta): menús exclusivos y descuentos únicos que solo existen en el pre-pedido, antes de zarpar.
 * Bloque destacado para Viaje y Carta, selector de menú y etiquetas de producto. Texto sin género. A bordo no se ofrecen.
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Producto, Ventaja, disponible, estadoVentaja, eur, pedidosAbiertos, productosConsumoProximo, ventajaDeProducto, ventajasIniciales } from '../store'
import { useToast } from '../shared'
import { PI, Sheet, vibrar } from './ui'
import { useP } from './ctx'
import type { TFn } from './i18n'

const NOMBRES_DEMO: Record<string, string> = Object.fromEntries(ventajasIniciales().map((v) => [v.id, v.nombre]))
/** Las ventajas de demo se traducen; si el responsable las renombra, se muestra su nombre tal cual (como los nombres de producto). */
export const nombreV = (t: TFn, v: Pick<Ventaja, 'id' | 'nombre'>) => (NOMBRES_DEMO[v.id] === v.nombre ? t('va.n.' + v.id) : v.nombre)
const etq = (t: TFn, e: string) => {
  const r = t('va.e.' + e)
  return r === 'va.e.' + e ? e : r
}

/** Una línea que explica a qué aplica la ventaja. */
function aplica(t: TFn, s: ReturnType<typeof useP>['s'], v: Ventaja, corto = false): string {
  if (v.tipo === 'menu-exclusivo') return t('va.includes', { c: v.menu.map((c) => etq(t, c.etiqueta)).join(' + ') })
  const a = v.aplica
  if (a.modo === 'productos') return t('va.ap.list', { c: a.pids.map((id) => s.productos.find((p) => p.id === id)?.nombre ?? id).join(', ') })
  if (a.modo === 'categorias') return t('va.ap.list', { c: a.cats.map((c) => t('cat.' + c)).join(', ') })
  if (a.regla === 'canario') return t('va.ap.canario')
  if (a.regla === 'preparar') return t('va.ap.preparar')
  const lista = productosConsumoProximo(s).map((x) => x.producto.nombre)
  if (corto && lista.length) return t('va.ap.proximo.s')
  return lista.length ? t('va.ap.proximo', { c: lista.join(', ') }) : t('va.ap.proximo0')
}

/** ¿Se puede armar el menú ahora? Cada parte necesita al menos una opción con stock. */
const menuPosible = (s: ReturnType<typeof useP>['s'], v: Ventaja) => v.menu.length > 0 && v.menu.every((c) => c.pids.some((id) => { const p = s.productos.find((x) => x.id === id); return !!p && disponible(s, p) >= c.qty }))

/** Suma a precio de carta de la combinación más barata del menú (para «Ahorras desde …»). */
function sumaMinima(s: ReturnType<typeof useP>['s'], v: Ventaja) {
  return v.menu.reduce((a, c) => {
    const precios = c.pids.map((id) => s.productos.find((p) => p.id === id)).filter((p): p is Producto => !!p && disponible(s, p) > 0).map((p) => p.precio)
    return a + (precios.length ? Math.min(...precios) : 0) * c.qty
  }, 0)
}

// ---------------------------------------------------------------- selector de menú exclusivo
function MenuSheet({ v, open, onClose }: { v: Ventaja; open: boolean; onClose: () => void }) {
  const { s, t, add, cart } = useP()
  const toast = useToast()
  const [sel, setSel] = useState<Record<number, string>>({})
  const [aviso, setAviso] = useState('')
  // opciones con stock para cada parte del menú; por defecto, la primera disponible
  const partes = v.menu.map((c, i) => {
    const opciones = c.pids.map((id) => s.productos.find((p) => p.id === id)).filter((p): p is Producto => !!p && disponible(s, p) >= c.qty)
    const elegido = opciones.find((p) => p.id === sel[i]) ?? opciones[0]
    return { c, i, opciones, elegido }
  })
  const completo = partes.length > 0 && partes.every((x) => x.elegido)
  const suma = partes.reduce((a, x) => a + (x.elegido ? x.elegido.precio * x.c.qty : 0), 0)

  const anadir = () => {
    setAviso('')
    // se comprueba antes de tocar el carrito: o entra el menú entero o no entra nada
    for (const x of partes) {
      if (!x.elegido) return setAviso(t('va.pick.nostock'))
      const enCarrito = cart.find((l) => l.pid === x.elegido!.id)?.qty ?? 0
      const mismo = partes.filter((y) => y.elegido?.id === x.elegido!.id).reduce((a, y) => a + y.c.qty, 0)
      if (enCarrito + mismo > disponible(s, x.elegido)) return setAviso(t('va.pick.nostock'))
    }
    for (const x of partes) for (let k = 0; k < x.c.qty; k++) add(x.elegido!.id)
    vibrar([12, 20, 12])
    toast({ titulo: t('va.pick.added'), texto: `${nombreV(t, v)} · ${eur(v.valor)}`, icono: 'check' })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} label={t('va.pick.t')}>
      <div className="pj-sh-head">
        <span style={{ width: 44 }} />
        <h2>{t('va.pick.t')}</h2>
        <button className="pj-icon-btn" onClick={onClose} aria-label={t('close')}>
          <PI n="close" size={20} />
        </button>
      </div>
      <div className="pj-sh-body">
        <p className="pj-va-sheet-n">
          <span className="pj-va-only">{t('va.only')}</span> {nombreV(t, v)}
        </p>
        {partes.map((x) => (
          <fieldset key={x.i} className="pj-va-part">
            <legend>{etq(t, x.c.etiqueta)}</legend>
            <div className="opts" role="radiogroup" aria-label={etq(t, x.c.etiqueta)}>
              {x.opciones.length === 0 && <span className="pj-note">{t('va.pick.nostock')}</span>}
              {x.opciones.map((p) => {
                const on = x.elegido?.id === p.id
                return (
                  <button key={p.id} role="radio" aria-checked={on} className={'pj-va-opt' + (on ? ' on' : '')} onClick={() => setSel((m) => ({ ...m, [x.i]: p.id }))}>
                    <span className="n">{p.nombre}</span>
                    <span className="p">{eur(p.precio)}</span>
                    <span className="r" aria-hidden />
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}
        {aviso && (
          <p className="pj-banner bad" role="alert">
            <PI n="alert" size={16} /> {aviso}
          </p>
        )}
      </div>
      <div className="pj-sh-foot">
        <div className="pj-va-sum">
          <span>{t('va.pick.sum', { p: eur(suma) })}</span>
          <b>{eur(v.valor)}</b>
        </div>
        <button className="fob-btn primary block" disabled={!completo} onClick={anadir}>
          {t('va.pick.add', { p: eur(v.valor) })}
        </button>
      </div>
    </Sheet>
  )
}

// ---------------------------------------------------------------- bloque destacado (Viaje y Carta)
export function BloqueVentajas({ donde }: { donde: 'viaje' | 'carta' }) {
  const { s, t, billete, goTab } = useP()
  const [menuId, setMenuId] = useState<string | null>(null)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuV = s.ventajas.find((x) => x.id === menuId)
  const abiertos = pedidosAbiertos(s)
  const items = useMemo(() => s.ventajas.map((v) => ({ v, e: estadoVentaja(s, v, billete.ticket) })), [s, billete.ticket])
  // se muestran las activas con la ventana abierta (también las agotadas, atenuadas); si todas cerraron por hora, un aviso suave un rato
  const visibles = items.filter((x) => x.v.activa && x.e.motivo !== 'cerrada')
  const cerradas = items.some((x) => x.v.activa && x.e.motivo === 'cerrada')
  const vigentes = visibles.filter((x) => x.e.vigente)

  if (visibles.length === 0) {
    if (!cerradas || s.viaje.minuto >= 20) return null
    return (
      <motion.section className="pj-va soft" role="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} aria-label={t('va.off.t')}>
        <PI n="clock" size={18} />
        <div>
          <b>{t('va.off.t')}</b>
          <span>{t('va.off.b')}</span>
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section className="pj-va" aria-label={t('va.eyebrow')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <p className="pj-va-eyebrow">{t('va.eyebrow')}</p>
      <h2 className="pj-va-t">{t('va.t')}</h2>
      <ul className="pj-va-list">
        <AnimatePresence initial={false}>
          {visibles.map(({ v, e }) => {
            const menu = v.tipo === 'menu-exclusivo'
            const ahorro = menu ? Math.max(0, Math.round((sumaMinima(s, v) - v.valor) * 100) / 100) : 0
            const sinStock = menu && !menuPosible(s, v)
            const apagada = !e.vigente || sinStock
            return (
              <motion.li key={v.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={'pj-va-item' + (apagada ? ' off' : '')}>
                <div className="row">
                  <span className="pj-va-only">{t('va.only')}</span>
                  {v.limitePasajero != null && <span className="lim">{t('va.limit', { n: v.limitePasajero })}</span>}
                </div>
                <div className="main">
                  <div className="tx">
                    <b>{nombreV(t, v)}</b>
                    <span>{aplica(t, s, v, donde === 'carta')}</span>
                  </div>
                  <div className="pr">
                    <strong>{menu ? eur(v.valor) : `−${String(v.valor).replace('.', ',')} %`}</strong>
                    {menu && ahorro > 0 && <small>{t('va.save', { a: eur(ahorro) })}</small>}
                  </div>
                </div>
                <div className="foot">
                  <span className="until">
                    <PI n="clock" size={13} /> {t('va.until', { n: v.ventanaMin, h: e.hasta })}
                    {e.vigente && e.minutosHasta <= 10 && <em>{t('va.closes', { n: e.minutosHasta })}</em>}
                  </span>
                </div>
                {!e.vigente && <p className="pj-note">{e.motivo === 'agotada-pasajero' ? t('va.exhausted.pas') : t('va.exhausted')}</p>}
                {e.vigente && abiertos && menu && !sinStock && (
                  <button className="fob-btn navy" onClick={() => (donde === 'carta' ? (setMenuId(v.id), setMenuAbierto(true)) : goTab('carta'))}>
                    {donde === 'carta' ? t('va.pick') : t('va.cta')}
                    <PI n="chevR" size={16} sw={2.4} />
                  </button>
                )}
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
      {visibles.some((x) => x.v.propuesta) && <p className="pj-va-prop">{t('va.proposal')}</p>}
      {donde === 'viaje' && vigentes.some((x) => x.v.tipo === 'descuento') && abiertos && (
        <button className="fob-btn ghost pj-va-go" onClick={() => goTab('carta')}>
          {t('va.cta')}
          <PI n="chevR" size={16} sw={2.4} />
        </button>
      )}
      {menuV && <MenuSheet v={menuV} open={menuAbierto} onClose={() => setMenuAbierto(false)} />}
    </motion.section>
  )
}

// ---------------------------------------------------------------- etiqueta y precio en la carta
/** Mapa producto → mejor ventaja de descuento aplicable ahora a este billete (para tachar el precio en la carta). */
export function useVentajasProducto() {
  const { s, billete } = useP()
  return useMemo(() => {
    const m = new Map<string, { ventaja: Ventaja; precio: number }>()
    if (s.viaje.minuto >= 0) return m
    const proximo = new Set(productosConsumoProximo(s).map((x) => x.producto.id))
    for (const p of s.productos) {
      const r = ventajaDeProducto(s, billete.ticket, p, proximo)
      if (r) m.set(p.id, r)
    }
    return m
  }, [s, billete.ticket])
}
