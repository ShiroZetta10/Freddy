/**
 * Manager > Ventajas del pre-pedido: ventajas por pedir con antelación (menús exclusivos y descuentos únicos) que solo existen antes de zarpar.
 * Crear/editar/activar, vista previa de a qué productos aplican ahora (consumo próximo calculado con el inventario) y contadores de la travesía.
 */
import { ReactNode, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AplicaVentaja,
  Categoria,
  ObjetivoVentaja,
  ProtoState,
  ReglaVentaja,
  TipoVentaja,
  Ventaja,
  actualizarVentaja,
  crearVentaja,
  eliminarVentaja,
  estadisticasVentajas,
  estadoVentaja,
  eur,
  horaDe,
  insumosConsumoProximo,
  previstoInsumo,
  productosConsumoProximo,
  productosDeVentaja,
  setCaducaHoy,
  setVentajasCfg,
  ventanaAbierta,
} from '../store'
import { Card, Counter, Ico, NumField, Switch, num } from './util'

const OBJETIVOS: { id: ObjetivoVentaja; t: string; d: string }[] = [
  { id: 'canario', t: 'Potenciar el producto canario', d: 'Menús y descuentos que empujan los productos km0 y «Elaborado en Canarias», comprados con antelación.' },
  { id: 'consumo-proximo', t: 'Dar salida al consumo próximo', d: 'Menos desperdicio (En Armonía con el Mar): baja el precio de lo que sobra o caduca hoy.' },
  { id: 'preparar-barco', t: 'Preparar mejor el barco', d: 'Saber antes qué cargar y preparar: bocadillos y sándwiches que conviene tener listos antes de zarpar.' },
]
const OBJ_CORTO: Record<ObjetivoVentaja, string> = { canario: 'Producto canario', 'consumo-proximo': 'Consumo próximo', 'preparar-barco': 'Preparar el barco' }
const REGLAS: { id: ReglaVentaja; t: string; d: string }[] = [
  { id: 'canario', t: 'Producto canario', d: 'Productos km0 o elaborados en Canarias.' },
  { id: 'consumo-proximo', t: 'Consumo próximo', d: 'Productos cuyo insumo principal perecedero tiene más stock del previsto o caduca hoy (se calcula con el inventario).' },
  { id: 'preparar', t: 'Conviene preparar con antelación', d: 'Bocadillos y sándwiches.' },
]
const CATS: Categoria[] = ['Desayunos', 'Bocadillos', 'Sándwiches', 'Bebidas', 'Snacks', 'Tienda']

const pct = (n: number) => `${num(n * 100)} %`

function Chips({ children }: { children: ReactNode }) {
  return <div className="mg-va-chips">{children}</div>
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={'mg-va-chip' + (on ? ' on' : '')} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  )
}
function Seg<T extends string>({ value, opciones, onChange, label }: { value: T; opciones: { id: T; t: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="fob-seg mg-seg" role="group" aria-label={label}>
      {opciones.map((o) => (
        <button key={o.id} className={value === o.id ? 'on' : ''} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.t}
        </button>
      ))}
    </div>
  )
}
/** Campo de texto que confirma al salir del campo o con Enter. */
function Texto({ value, onCommit, label }: { value: string; onCommit: (v: string) => void; label: string }) {
  const [d, setD] = useState<string | null>(null)
  const fin = (v: string) => {
    setD(null)
    const t = v.trim()
    if (t && t !== value) onCommit(t.slice(0, 90))
  }
  return <input className="mg-in" aria-label={label} value={d ?? value} maxLength={90} onChange={(e) => setD(e.target.value)} onBlur={(e) => fin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
}
/** Límite opcional: sin límite o un número de unidades. */
function Limite({ value, onChange, label, min = 1 }: { value: number | null; onChange: (n: number | null) => void; label: string; min?: number }) {
  return (
    <div className="mg-va-lim">
      <label className="mg-va-sw">
        <Switch checked={value == null} onChange={(v) => onChange(v ? null : 10)} label={`${label}: sin límite`} />
        <span>Sin límite</span>
      </label>
      {value != null && <NumField label={label} value={value} min={min} max={9999} step={1} suffix="uds." onCommit={(n) => onChange(n)} />}
    </div>
  )
}
function Campo({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: ReactNode }) {
  return (
    <div className="mg-va-f">
      <p className="mg-lbl">{titulo}</p>
      {children}
      {ayuda && <small>{ayuda}</small>}
    </div>
  )
}

// ---------------------------------------------------------------- vista previa de una ventaja
function Previa({ s, v }: { s: ProtoState; v: Ventaja }) {
  if (v.tipo === 'menu-exclusivo') {
    const partes = v.menu.map((c) => ({ c, ps: c.pids.map((id) => s.productos.find((p) => p.id === id)).filter((p) => !!p) as ProtoState['productos'] }))
    const suma = partes.reduce((a, x) => a + (x.ps.length ? Math.min(...x.ps.map((p) => p.precio)) * x.c.qty : 0), 0)
    return (
      <div className="mg-va-prev">
        <p className="mg-lbl">Así lo ve el pasajero ahora</p>
        {partes.length === 0 && <p className="mg-empty">El menú no tiene partes: añade al menos una.</p>}
        <ul>
          {partes.map((x, i) => (
            <li key={i}>
              <b>{x.c.etiqueta || 'Parte sin nombre'}</b>
              <span>
                {x.ps.length === 0
                  ? 'Sin productos'
                  : x.ps.map((p) => `${p.nombre} (${eur(p.precio)})${p.stock - s.ajustes.umbralStock <= 0 || p.agotado ? ' · agotado' : ''}`).join(' · ')}
              </span>
            </li>
          ))}
        </ul>
        {partes.length > 0 && (
          <p className="mg-va-total">
            Menú a <b>{eur(v.valor)}</b>
            {suma > v.valor ? <> frente a {eur(suma)} a precio de carta (combinación más barata): ahorra desde {eur(suma - v.valor)}</> : <span className="mg-va-bad"> · el precio del menú no es menor que el de carta: no se aplicará</span>}
          </p>
        )}
      </div>
    )
  }
  const ps = productosDeVentaja(s, v)
  const prox = new Map(productosConsumoProximo(s).map((x) => [x.producto.id, x] as const))
  const esProx = v.aplica.modo === 'regla' && v.aplica.regla === 'consumo-proximo'
  return (
    <div className="mg-va-prev">
      <p className="mg-lbl">Aplica ahora a {ps.length} {ps.length === 1 ? 'producto' : 'productos'}</p>
      {ps.length === 0 ? (
        <p className="mg-empty">{esProx ? 'Ahora no hay ningún perecedero con exceso ni que caduque hoy: no se ofrecerá nada hasta que el inventario cambie.' : 'Ningún producto disponible cumple la regla.'}</p>
      ) : (
        <ul className="mg-va-plist">
          {ps.map((p) => {
            const x = prox.get(p.id)
            const nuevo = Math.round((p.precio - Math.round(p.precio * v.valor) / 100) * 100) / 100
            return (
              <li key={p.id}>
                <b>{p.nombre}</b>
                <span>
                  <s>{eur(p.precio)}</s> {eur(nuevo)}
                </span>
                {esProx && x && (
                  <em>
                    {x.insumo.nombre}: {x.motivo === 'caduca-hoy' ? 'caduca hoy' : Number.isFinite(x.ratio) ? `stock +${num((x.ratio - 1) * 100)} % sobre lo previsto` : 'sin consumo previsto'}
                  </em>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- una ventaja
function VentajaCard({ s, v, abierta, onToggle }: { s: ProtoState; v: Ventaja; abierta: boolean; onToggle: () => void }) {
  const e = estadoVentaja(s, v)
  const [conf, setConf] = useState(false)
  const act = (patch: Partial<Omit<Ventaja, 'id'>>) => actualizarVentaja(v.id, patch)
  const menu = v.tipo === 'menu-exclusivo'
  const a = v.aplica

  const setTipo = (tipo: TipoVentaja) => {
    if (tipo === v.tipo) return
    act(tipo === 'menu-exclusivo' ? { tipo, valor: 4.5, menu: v.menu.length ? v.menu : [{ etiqueta: 'Bebida', pids: [], qty: 1 }, { etiqueta: 'Para comer', pids: [], qty: 1 }] } : { tipo, valor: 15 })
  }
  const setModo = (modo: AplicaVentaja['modo']) => {
    if (modo === a.modo) return
    act({ aplica: modo === 'productos' ? { modo, pids: [] } : modo === 'categorias' ? { modo, cats: [] } : { modo, regla: 'canario' } })
  }
  const alternar = <T,>(lista: T[], x: T) => (lista.includes(x) ? lista.filter((y) => y !== x) : [...lista, x])
  const estado = e.vigente ? { t: 'Vigente', c: 'green' } : e.motivo === 'inactiva' ? { t: 'Desactivada', c: '' } : e.motivo === 'cerrada' ? { t: 'Ventana cerrada', c: 'amber' } : { t: 'Cupo agotado', c: 'amber' }

  return (
    <motion.li layout className={'mg-va-card' + (v.activa ? '' : ' off')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
      <div className="mg-va-head">
        <Switch checked={v.activa} onChange={(on) => act({ activa: on })} label={`${v.activa ? 'Desactivar' : 'Activar'} ${v.nombre}`} />
        <div className="mg-va-title">
          <b>{v.nombre}</b>
          <span>
            {menu ? 'Menú exclusivo' : 'Descuento'} · {OBJ_CORTO[v.objetivo]} · <b>{menu ? eur(v.valor) : `−${num(v.valor)} %`}</b>
            {v.propuesta && <i className="mg-va-prop">propuesta</i>}
          </span>
        </div>
        <div className="mg-va-side">
          <span className={`fob-pill ${estado.c}`}>{estado.t}</span>
          <span className="mg-va-uso">
            {e.usadasTravesia}
            {v.limiteTravesia != null ? ` de ${v.limiteTravesia}` : ''} {menu ? (e.usadasTravesia === 1 ? 'menú' : 'menús') : e.usadasTravesia === 1 ? 'unidad' : 'unidades'}
          </span>
        </div>
        <button className="mg-btn sm" aria-expanded={abierta} onClick={onToggle}>
          {abierta ? 'Cerrar' : 'Editar'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {abierta && (
          <motion.div className="mg-va-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div className="mg-va-grid">
              <div className="mg-va-col">
                <Campo titulo="Nombre (lo ve el pasajero)">
                  <Texto label="Nombre de la ventaja" value={v.nombre} onCommit={(t) => act({ nombre: t })} />
                </Campo>
                <Campo titulo="Tipo">
                  <Seg label="Tipo de ventaja" value={v.tipo} onChange={setTipo} opciones={[{ id: 'menu-exclusivo', t: 'Menú exclusivo' }, { id: 'descuento', t: 'Descuento' }]} />
                </Campo>
                <Campo titulo="Objetivo" ayuda={OBJETIVOS.find((o) => o.id === v.objetivo)!.d}>
                  <Seg label="Objetivo" value={v.objetivo} onChange={(objetivo) => act({ objetivo })} opciones={OBJETIVOS.map((o) => ({ id: o.id, t: OBJ_CORTO[o.id] }))} />
                </Campo>
                <Campo titulo={menu ? 'Precio cerrado del menú' : 'Descuento'} ayuda={menu ? 'Se cobra este precio por cada menú completo, solo si es menor que la suma a precio de carta.' : 'Porcentaje sobre el precio de carta de cada unidad a la que aplica.'}>
                  {menu ? <NumField label="Precio del menú" value={v.valor} min={0.5} max={50} step={0.1} decimals={2} suffix="€" onCommit={(n) => act({ valor: n })} /> : <NumField label="Descuento" value={v.valor} min={1} max={90} step={5} suffix="%" onCommit={(n) => act({ valor: n })} />}
                </Campo>
                <Campo titulo="Límite por travesía" ayuda={menu ? 'Menús que se pueden vender con esta ventaja entre todos los pasajeros.' : 'Unidades con descuento entre todos los pasajeros.'}>
                  <Limite label="Límite por travesía" value={v.limiteTravesia} onChange={(n) => act({ limiteTravesia: n })} />
                </Campo>
                <Campo titulo="Límite por pasajero" ayuda="Por billete y travesía. Al cancelar un pedido se devuelve el cupo.">
                  <Limite label="Límite por pasajero" value={v.limitePasajero} onChange={(n) => act({ limitePasajero: n })} />
                </Campo>
                <Campo titulo="Ventana" ayuda={`Desde la compra del billete hasta ${v.ventanaMin} min antes de zarpar (${horaDe(s, -v.ventanaMin)}). Después se retira con un aviso suave. A bordo no se ofrece.`}>
                  <NumField label="Minutos antes de zarpar en que se cierra" value={v.ventanaMin} min={0} max={120} step={5} suffix="min" onCommit={(n) => act({ ventanaMin: n })} />
                </Campo>
                <label className="mg-va-sw">
                  <Switch checked={v.propuesta} onChange={(on) => act({ propuesta: on })} label="Marcar como propuesta por validar" />
                  <span>Marcar como propuesta (precio por validar con Fred. Olsen)</span>
                </label>
              </div>

              <div className="mg-va-col">
                {menu ? (
                  <Campo titulo="Partes del menú" ayuda="Cada parte admite alternativas: el pasajero elige una. El menú se aplica cuando el carrito contiene una opción de cada parte.">
                    {v.menu.map((c, i) => (
                      <div key={i} className="mg-va-parte">
                        <div className="mg-va-parte-h">
                          <Texto label={`Nombre de la parte ${i + 1}`} value={c.etiqueta} onCommit={(t) => act({ menu: v.menu.map((x, k) => (k === i ? { ...x, etiqueta: t } : x)) })} />
                          <NumField label={`Unidades de la parte ${i + 1}`} value={c.qty} min={1} max={6} onCommit={(n) => act({ menu: v.menu.map((x, k) => (k === i ? { ...x, qty: n } : x)) })} suffix="ud." />
                          <button className="mg-btn sm" onClick={() => act({ menu: v.menu.filter((_, k) => k !== i) })} aria-label={`Quitar la parte ${c.etiqueta}`}>
                            Quitar
                          </button>
                        </div>
                        <Chips>
                          {s.productos.filter((p) => !p.soloOro).map((p) => (
                            <Chip key={p.id} on={c.pids.includes(p.id)} onClick={() => act({ menu: v.menu.map((x, k) => (k === i ? { ...x, pids: alternar(x.pids, p.id) } : x)) })}>
                              {p.nombre}
                            </Chip>
                          ))}
                        </Chips>
                      </div>
                    ))}
                    <button className="mg-btn sm" onClick={() => act({ menu: [...v.menu, { etiqueta: `Parte ${v.menu.length + 1}`, pids: [], qty: 1 }] })}>
                      Añadir parte
                    </button>
                  </Campo>
                ) : (
                  <>
                    <Campo titulo="A qué aplica">
                      <Seg
                        label="A qué aplica"
                        value={a.modo}
                        onChange={setModo}
                        opciones={[
                          { id: 'regla', t: 'Regla' },
                          { id: 'categorias', t: 'Categorías' },
                          { id: 'productos', t: 'Productos' },
                        ]}
                      />
                    </Campo>
                    {a.modo === 'regla' && (
                      <Campo titulo="Regla" ayuda={REGLAS.find((r) => r.id === a.regla)!.d}>
                        <Seg label="Regla" value={a.regla} onChange={(regla) => act({ aplica: { modo: 'regla', regla } })} opciones={REGLAS.map((r) => ({ id: r.id, t: r.t }))} />
                      </Campo>
                    )}
                    {a.modo === 'categorias' && (
                      <Campo titulo="Categorías">
                        <Chips>
                          {CATS.map((c) => (
                            <Chip key={c} on={a.cats.includes(c)} onClick={() => act({ aplica: { modo: 'categorias', cats: alternar(a.cats, c) } })}>
                              {c}
                            </Chip>
                          ))}
                        </Chips>
                      </Campo>
                    )}
                    {a.modo === 'productos' && (
                      <Campo titulo="Productos">
                        <Chips>
                          {s.productos.filter((p) => !p.soloOro).map((p) => (
                            <Chip key={p.id} on={a.pids.includes(p.id)} onClick={() => act({ aplica: { modo: 'productos', pids: alternar(a.pids, p.id) } })}>
                              {p.nombre}
                            </Chip>
                          ))}
                        </Chips>
                      </Campo>
                    )}
                  </>
                )}
                <Previa s={s} v={v} />
              </div>
            </div>
            <div className="mg-va-foot">
              {conf ? (
                <>
                  <span>¿Eliminar esta ventaja? Los pedidos ya hechos conservan su descuento.</span>
                  <button className="mg-btn sm" onClick={() => setConf(false)}>
                    Cancelar
                  </button>
                  <button className="mg-btn sm solid" onClick={() => eliminarVentaja(v.id)}>
                    Sí, eliminar
                  </button>
                </>
              ) : (
                <button className="mg-btn sm" onClick={() => setConf(true)}>
                  Eliminar ventaja
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

// ---------------------------------------------------------------- sección
export default function Ventajas({ s }: { s: ProtoState }) {
  const [abierta, setAbierta] = useState<string | null>(null)
  const st = estadisticasVentajas(s)
  const activas = s.ventajas.filter((v) => v.activa)
  const abiertas = activas.filter((v) => ventanaAbierta(s, v))
  const cfg = s.ventajasCfg
  const prox = insumosConsumoProximo(s)
  const productosProx = productosConsumoProximo(s)
  const perecederos = s.insumos.filter((i) => i.tipo === 'perecedero')
  const marca = new Map(prox.map((x) => [x.insumo.id, x] as const))
  const nueva = () => setAbierta(crearVentaja().id)

  return (
    <div className="mg-sec">
      <Card title="Ventajas por pedir con antelación" sub="Solo para pre-pedidos, antes de zarpar. A bordo no se ofrecen. Precios y porcentajes: propuesta del equipo, por validar con Fred. Olsen.">
        <div className="mg-va-obj">
          {OBJETIVOS.map((o) => (
            <div key={o.id}>
              <b>{o.t}</b>
              <span>{o.d}</span>
            </div>
          ))}
        </div>
        <p className={'mg-va-estado' + (abiertas.length ? ' on' : '')} role="status">
          <Ico name="star" size={15} />
          {activas.length === 0
            ? 'No hay ventajas activas.'
            : abiertas.length
              ? `Ahora se ofrecen ${abiertas.length} ${abiertas.length === 1 ? 'ventaja' : 'ventajas'} a los pasajeros que pre-piden (la última ventana cierra a las ${horaDe(s, -Math.min(...abiertas.map((v) => v.ventanaMin)))}).`
              : 'La ventana de las ventajas está cerrada: a bordo se aplican los precios de la carta.'}
        </p>
        <p className="mg-nota">
          <Ico name="alert" size={14} />
          <span>
            Convivencia sin doble descuento: cada unidad recibe un solo beneficio. Orden: menú Clase Oro, después bono, después estas ventajas y por último Tarifa Joven. Primero los menús exclusivos; si varios descuentos aplican a una unidad, gana el de mayor ahorro.
          </span>
        </p>
      </Card>

      <Card title="Contadores de la travesía" sub="Pre-pedidos con ventaja, unidades, importe descontado y su efecto en producto canario y en merma">
        <div className="mg-bonos">
          <div>
            <b>
              <Counter value={st.pedidos} />
            </b>
            <span>Pre-pedidos con ventaja</span>
            <small>{st.prepedidos ? `${pct(st.pctPrepedidos)} de ${st.prepedidos} pre-pedidos` : 'sin pre-pedidos todavía'}</small>
          </div>
          <div>
            <b>
              <Counter value={st.uds} />
            </b>
            <span>Unidades con ventaja</span>
            <small>menús y unidades con descuento</small>
          </div>
          <div>
            <b>
              <Counter value={st.descuento} decimals={2} suffix=" €" />
            </b>
            <span>Importe descontado</span>
            <small>ya restado del cobro · facturado con ventaja {eur(st.importe)}</small>
          </div>
          <div>
            <b>
              <Counter value={st.udsCanariasConVentaja} />
            </b>
            <span>Producto canario con ventaja</span>
            <small>
              {st.pedidos ? `${pct(st.pctCanarioCon)} de las unidades con ventaja, frente a ${st.prepedidos > st.pedidos ? pct(st.pctCanarioSin) : '—'} sin ventaja` : 'sin datos'}
            </small>
          </div>
          <div>
            <b>
              <Counter value={st.udsProximo} />
            </b>
            <span>Consumo próximo con salida</span>
            <small>
              {eur(st.costeProximo)} de merma potencial evitada (a coste) · aún sobran {eur(st.sobranteCoste)}
            </small>
          </div>
          <div>
            <b>
              <Counter value={st.preparar.uds} />
            </b>
            <span>Preparación anticipada</span>
            <small>{st.preparar.pedidos} {st.preparar.pedidos === 1 ? 'pedido' : 'pedidos'} que la barra conoce antes de zarpar</small>
          </div>
        </div>
        {st.porVentaja.length > 0 && (
          <div className="mg-tabla-wrap">
            <table className="mg-tabla mg-va-tabla">
              <thead>
                <tr>
                  <th scope="col">Ventaja</th>
                  <th scope="col">Pedidos</th>
                  <th scope="col">Unidades</th>
                  <th scope="col">Descontado</th>
                </tr>
              </thead>
              <tbody>
                {st.porVentaja.map((r) => (
                  <tr key={r.id}>
                    <td>{s.ventajas.find((v) => v.id === r.id)?.nombre}</td>
                    <td>{r.pedidos}</td>
                    <td>{r.uds}</td>
                    <td>{eur(r.descuento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Ventajas configuradas"
        sub={`${s.ventajas.length} ${s.ventajas.length === 1 ? 'ventaja' : 'ventajas'} · los cambios llegan al momento a los pasajeros conectados`}
        right={
          <button className="mg-btn solid" onClick={nueva}>
            Nueva ventaja
          </button>
        }
      >
        {s.ventajas.length === 0 && <p className="mg-empty">No hay ventajas. Crea una para empezar.</p>}
        <ul className="mg-va-list">
          <AnimatePresence initial={false}>
            {s.ventajas.map((v) => (
              <VentajaCard key={v.id} s={s} v={v} abierta={abierta === v.id} onToggle={() => setAbierta(abierta === v.id ? null : v.id)} />
            ))}
          </AnimatePresence>
        </ul>
      </Card>

      <Card title="Consumo próximo, calculado con el inventario" sub="Perecederos con más stock del previsto para el día o que caducan hoy: de ahí salen los productos de la regla «Consumo próximo»">
        <div className="mg-va-cfg">
          <Campo titulo="Exceso para considerarlo consumo próximo" ayuda="Stock por encima de lo previsto a partir del cual un perecedero se considera en exceso.">
            <NumField label="Umbral de exceso" value={Math.round(cfg.umbralExceso * 100)} min={0} max={500} step={5} suffix="%" onCommit={(n) => setVentajasCfg({ umbralExceso: n / 100 })} />
          </Campo>
          <Campo titulo="Pasajeros previstos del día" ayuda="Hipótesis del equipo (8 salidas × ≈ 290), la misma del plan de aprovisionamiento. Ajústala a la previsión real.">
            <NumField label="Pasajeros previstos del día" value={cfg.pasajerosDia} min={100} max={20000} step={100} onCommit={(n) => setVentajasCfg({ pasajerosDia: n })} />
          </Campo>
        </div>
        <div className="mg-tabla-wrap">
          <table className="mg-tabla mg-va-tabla">
            <thead>
              <tr>
                <th scope="col">Perecedero</th>
                <th scope="col">Stock</th>
                <th scope="col">Previsto hoy</th>
                <th scope="col">Estado</th>
                <th scope="col">Caduca hoy</th>
              </tr>
            </thead>
            <tbody>
              {perecederos.map((i) => {
                const x = marca.get(i.id)
                const previsto = previstoInsumo(s, i.id)
                return (
                  <tr key={i.id}>
                    <td>{i.nombre}</td>
                    <td>
                      {num(i.stock)} {i.unidad}
                    </td>
                    <td>{previsto > 0 ? `${num(previsto)} ${i.unidad}` : 'sin consumo previsto'}</td>
                    <td>
                      {x ? <span className={'mg-verif ' + (x.motivo === 'caduca-hoy' ? 'a-confirmar' : 'corregido')}>{x.motivo === 'caduca-hoy' ? 'Caduca hoy' : Number.isFinite(x.ratio) ? `Exceso +${num((x.ratio - 1) * 100)} %` : 'Exceso'}</span> : <span className="mg-nd">Normal</span>}
                    </td>
                    <td>
                      <Switch checked={cfg.caducaHoy.includes(i.id)} onChange={(on) => setCaducaHoy(i.id, on)} label={`${i.nombre}: caduca hoy`} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mg-lbl">Productos de consumo próximo ahora</p>
        {productosProx.length === 0 ? (
          <p className="mg-empty">Ninguno: el inventario no tiene excesos ni lotes marcados.</p>
        ) : (
          <ul className="mg-va-plist">
            {productosProx.map((x) => (
              <li key={x.producto.id}>
                <b>{x.producto.nombre}</b>
                <span>{eur(x.producto.precio)}</span>
                <em>
                  {x.insumo.nombre} · {x.motivo === 'caduca-hoy' ? 'caduca hoy' : 'exceso de stock'}
                </em>
              </li>
            ))}
          </ul>
        )}
        <p className="mg-nota">
          <Ico name="alert" size={14} />
          <span>Un producto entra aquí si su insumo principal (el de mayor coste en el escandallo) es perecedero y está en exceso o caduca hoy. Al vender, el stock baja y la lista se recalcula sola.</span>
        </p>
      </Card>
    </div>
  )
}
