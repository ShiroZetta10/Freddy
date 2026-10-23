/** Pestaña Carta: selector de cafetería, filtros, productos con stock en vivo y upselling. */
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CafeteriaId, Categoria, Producto, disponible, eur, pedidosAbiertos, planMenuOro } from '../store'
import { ElaboradoLogo, ProductoArt } from '../shared'
import { PI } from './ui'
import { BonoAplicadoPanel } from './Bonos'
import { BloqueVentajas, useVentajasProducto } from './Ventajas'
import { useP } from './ctx'

const CATS: Categoria[] = ['Desayunos', 'Bocadillos', 'Sándwiches', 'Bebidas', 'Snacks', 'Tienda']
const TAGS = ['canario', 'sin gluten', 'vegetariano', 'combo', 'oro'] as const
type Tag = (typeof TAGS)[number]
const CAFS: CafeteriaId[] = ['proa', 'popa', 'oro']
const CAF_CORTO: Record<CafeteriaId, string> = { proa: 'Proa', popa: 'Popa', oro: 'Oro' }

const tieneTag = (p: Producto, t: Tag) => (t === 'canario' ? !!p.km0 : t === 'oro' ? !!p.incluidoOro : !!p.tags?.includes(t))

export function SelectorCafeteria({ compacto }: { compacto?: boolean }) {
  const { s, t, caf, setCaf, esOro } = useP()
  return (
    <div className={'pj-cafsel' + (compacto ? ' compact' : '')} role="radiogroup" aria-label={t('c.where')}>
      {CAFS.map((c) => {
        const bloqueada = c === 'oro' && !esOro
        const pausa = s.ajustes.pausa[c]
        const on = caf === c
        return (
          <button key={c} role="radio" aria-checked={on} disabled={bloqueada} className={'pj-caf' + (on ? ' on' : '') + (pausa ? ' paused' : '')} onClick={() => setCaf(c)}>
            {on && <motion.span layoutId={compacto ? 'cafpill-c' : 'cafpill'} className="bg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="n">{CAF_CORTO[c]}</span>
            <span className="d">{bloqueada ? t('c.gold') : pausa ? t('c.pause') : s.cafeterias[c].cubierta.replace('Cubierta ', 'Cub. ')}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function Carta() {
  const { s, t, caf, setCaf, cart, add, dec, esOro, billete, bono } = useP()
  const [cat, setCat] = useState<Categoria | 'todo'>('todo')
  const [tags, setTags] = useState<Tag[]>([])
  const abiertos = pedidosAbiertos(s)
  const pausa = s.ajustes.pausa[caf]

  // Clase Oro: en la cafetería Oro el menú incluido va a 0 € hasta el límite por persona
  const oroMode = esOro && caf === 'oro'
  const oro = planMenuOro(s, billete, caf, cart)
  const oroQuedan = Math.max(0, oro.restantes - oro.uds) // incluidos que aún caben tras lo que ya hay en el carrito
  const lista = useMemo(
    () => s.productos.filter((p) => (!p.soloOro || oroMode) && (cat === 'todo' || p.cat === cat) && tags.every((x) => tieneTag(p, x))),
    [s.productos, cat, tags, oroMode],
  )
  const qtyDe = (pid: string) => cart.find((l) => l.pid === pid)?.qty ?? 0
  const ventajasProd = useVentajasProducto() // precio con ventaja por pedir con antelación (solo antes de zarpar)

  const hayCafe = cart.some((l) => l.pid === 'cortado' || l.pid === 'solo')
  const hayBolleria = cart.some((l) => l.pid === 'croissant' || l.pid === 'oferta-bolleria')
  const combo = s.productos.find((p) => p.id === 'oferta-bolleria')
  const upsell = hayCafe && !hayBolleria && combo && disponible(s, combo) > 0 && abiertos
  const promo = !esOro && !upsell && abiertos && combo && disponible(s, combo) > 0 && !pausa ? combo : null

  return (
    <div className="pj-tab pj-carta">
      <div className="pj-sec-h">
        <h2>{t('c.title')}</h2>
        <span className="pj-muted">{t('c.where')}</span>
      </div>
      <SelectorCafeteria />

      <AnimatePresence initial={false}>
        {!abiertos && (
          <motion.div key="cerrado" className="pj-banner warn" role="status" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <PI n="clock" size={18} /> {t('c.closedbanner')}
          </motion.div>
        )}
        {abiertos && pausa && (
          <motion.div key="pausa" className="pj-banner warn" role="status" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <PI n="alert" size={18} /> {t('c.pausebanner', { n: s.cafeterias[caf].nombre })}
          </motion.div>
        )}
      </AnimatePresence>

      <BloqueVentajas donde="carta" />

      {esOro && (
        <section className="pj-oro-menu" aria-label={t('or.menu.t')}>
          <div className="h">
            <PI n="star" size={18} sw={2} />
            <b>{t('or.menu.t')}</b>
          </div>
          {oroMode ? (
            <>
              <p>{oro.restantes > 0 ? t('or.menu.b', { n: oroQuedan, max: oro.limite }) : t('or.menu.full', { max: oro.limite })}</p>
              <p className="note">{t('or.menu.note')}</p>
            </>
          ) : (
            <>
              <p>{t('or.menu.other')}</p>
              <button className="fob-btn navy" onClick={() => setCaf('oro')}>
                {t('or.menu.go')}
              </button>
            </>
          )}
        </section>
      )}

      {bono && <BonoAplicadoPanel cart={cart} />}

      <div className="pj-filters" role="group" aria-label={t('c.filters')}>
        <div className="pj-chiprow">
          <button className={'pj-fchip' + (cat === 'todo' ? ' on' : '')} aria-pressed={cat === 'todo'} onClick={() => setCat('todo')}>
            {t('c.all')}
          </button>
          {CATS.map((c) => (
            <button key={c} className={'pj-fchip' + (cat === c ? ' on' : '')} aria-pressed={cat === c} onClick={() => setCat(c)}>
              {t('cat.' + c)}
            </button>
          ))}
        </div>
        <div className="pj-chiprow tags">
          {TAGS.filter((x) => x !== 'oro' || oroMode).map((x) => {
            const on = tags.includes(x)
            return (
              <button key={x} className={'pj-fchip tag' + (on ? ' on' : '')} aria-pressed={on} onClick={() => setTags((a) => (on ? a.filter((y) => y !== x) : [...a, x]))}>
                {x === 'canario' ? t('c.canonly') : x === 'oro' ? t('or.chip') : t('tag.' + x)}
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {billete.tarifaJoven && (
          <motion.div key="joven" className="pj-joven" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div>
              <span className="fob-pill">{t('j.tag')}</span>
              <b>{t('j.perk')}</b>
              <em>{t('j.proposal')}</em>
            </div>
          </motion.div>
        )}
        {cat === 'Tienda' && (
          <motion.p key="shop" className="pj-note pj-shopnote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {t('c.shopnote')}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {promo && (
          <motion.div key="promo" className="pj-upsell promo" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ProductoArt nombre={promo.nombre} color={promo.color} size={44} />
            <div className="tx">
              <b>{t('pm.t')}</b>
              <span>
                {t('pm.b')} · {eur(promo.precio)}
              </span>
            </div>
            <button className="fob-btn navy" onClick={(e) => add(promo.id, e.currentTarget)}>
              {t('u.add')}
            </button>
          </motion.div>
        )}
        {upsell && combo && (
          <motion.div key="up" className="pj-upsell" initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
            <ProductoArt nombre={combo.nombre} color={combo.color} size={44} />
            <div className="tx">
              <b>{t('u.t')}</b>
              <span>
                {t('u.b')} · {eur(combo.precio)}
              </span>
            </div>
            <button className="fob-btn navy" onClick={(e) => add(combo.id, e.currentTarget)}>
              {t('u.add')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.ul className="pj-prods" layout>
        <AnimatePresence initial={false} mode="popLayout">
          {lista.map((p) => {
            const disp = disponible(s, p)
            const agotado = disp <= 0
            const pocas = !agotado && disp <= 6
            const q = qtyDe(p.id)
            const llegaAlTope = q >= disp
            const vp = oroMode && p.incluidoOro && oro.restantes > 0 ? undefined : ventajasProd.get(p.id)
            return (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className={'pj-prod' + (agotado ? ' out' : '')}
              >
                <ProductoArt nombre={p.nombre} color={p.color} size={56} />
                <div className="pj-prod-tx">
                  <b>{p.nombre}</b>
                  <span className="desc">{p.desc}</span>
                  {p.km0 && p.origen && <span className="origen">{t('c.origin', { o: p.origen })}</span>}
                  <span className="tags">
                    {p.km0 && (p.elaboradoCanarias ? <ElaboradoLogo height={32} fallback={<span className="fob-pill green">{t('tag.canario')}</span>} /> : <span className="fob-pill green">{t('tag.canario')}</span>)}
                    {p.tags?.map((x) => (
                      <span key={x} className="fob-pill">
                        {t('tag.' + x)}
                      </span>
                    ))}
                    {vp && !agotado && <span className="pj-va-only">{t('va.only')}</span>}
                    {agotado && <span className="fob-pill red">{t('c.out')}</span>}
                    {pocas && <span className="fob-pill amber">{t('c.last')}</span>}
                  </span>
                </div>
                <div className="pj-prod-act">
                  {oroMode && p.incluidoOro && oro.restantes > 0 ? (
                    <span className="price incl">
                      {t('or.incl')}
                      <s>{eur(p.precio)}</s>
                    </span>
                  ) : vp ? (
                    <span className="price va" aria-label={`${eur(vp.precio)}, ${t('va.only')}`}>
                      <s>{eur(p.precio)}</s>
                      {eur(vp.precio)}
                    </span>
                  ) : (
                    <span className="price">{eur(p.precio)}</span>
                  )}
                  {q === 0 ? (
                    <motion.button
                      className="pj-add"
                      whileTap={{ scale: 0.86 }}
                      disabled={agotado || !abiertos}
                      aria-label={agotado ? `${p.nombre}: ${t('c.out')}` : t('c.add', { n: p.nombre })}
                      onClick={(e) => add(p.id, e.currentTarget)}
                    >
                      <PI n="plus" size={20} sw={2.4} />
                    </motion.button>
                  ) : (
                    <div className="pj-qty" role="group" aria-label={p.nombre}>
                      <button aria-label={t('k.less', { n: p.nombre })} onClick={() => dec(p.id)}>
                        <PI n="minus" size={16} sw={2.6} />
                      </button>
                      <motion.b key={q} initial={{ scale: 1.4 }} animate={{ scale: 1 }}>
                        {q}
                      </motion.b>
                      <button aria-label={t('k.more', { n: p.nombre })} disabled={llegaAlTope || !abiertos} onClick={(e) => add(p.id, e.currentTarget)}>
                        <PI n="plus" size={16} sw={2.6} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.li>
            )
          })}
        </AnimatePresence>
        {lista.length === 0 && <li className="pj-empty-s">{t('c.none')}</li>}
      </motion.ul>
    </div>
  )
}
