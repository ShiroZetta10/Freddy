import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Icon from '../components/Icon'
import { HORIZONTES, IDEAS, REFERENCIAS_PAGINA, type Horizonte } from '../data/roadmap'
import './roadmap.css'

/* ------------------------------------------------------------------ maqueta: tarjeta + Plus Points */

// Propuesta y valores ilustrativos: no son condiciones reales de Fred. Olsen Plus.
const PREMIOS = [
  { pts: 100, nombre: 'Café gratis', nota: 'En cualquier cafetería a bordo' },
  { pts: 250, nombre: 'Upgrade de menú', nota: 'Del menú básico al completo' },
  { pts: 500, nombre: 'Producto canario de la tienda', nota: 'A elegir entre la selección local' },
  { pts: 1000, nombre: 'Descuento en tu próximo billete', nota: 'Propuesta: depende de Fred. Olsen' },
]
const MAX_PTS = PREMIOS[PREMIOS.length - 1].pts

function MaquetaWallet() {
  const [pts, setPts] = useState(180)
  const [wallet, setWallet] = useState(false)
  const siguiente = PREMIOS.find((p) => p.pts > pts)
  const previo = [...PREMIOS].reverse().find((p) => p.pts <= pts)
  const base = previo ? previo.pts : 0
  const progreso = siguiente ? ((pts - base) / (siguiente.pts - base)) * 100 : 100
  const add = (n: number) => setPts((v) => Math.min(MAX_PTS + 200, v + n))

  return (
    <div className="rm-wallet">
      <div className="rm-wallet-left">
        <div className="rm-pass" role="img" aria-label={`Tarjeta FredOnBoard de demostración con ${pts} Plus Points`}>
          <div className="rm-pass-top">
            <div>
              <div className="rm-pass-brand">FredOnBoard</div>
              <div className="rm-pass-sub">Fred. Olsen Plus</div>
            </div>
            <span className="rm-pass-demo">DEMO</span>
          </div>
          <div className="rm-pass-pts">
            <span className="rm-pass-num">{pts}</span>
            <span className="rm-pass-unit">Plus Points</span>
          </div>
          <div className="rm-bar" aria-hidden>
            <div className="rm-bar-fill" style={{ width: `${progreso}%` }} />
          </div>
          <div className="rm-pass-next">
            {siguiente ? `Te faltan ${siguiente.pts - pts} para: ${siguiente.nombre}` : 'Has desbloqueado todos los premios de la demo'}
          </div>
          <div className="rm-pass-bottom">
            <div>
              <div className="rm-pass-lbl">Socio</div>
              <div className="rm-pass-name">Pasajero Demo</div>
              <div className="rm-pass-lbl rm-mt">Nº socio</div>
              <div className="rm-pass-name">FOP-000000</div>
            </div>
            <div className="rm-qr">
              <QRCodeSVG value="FREDONBOARD-DEMO-NO-VALIDO" size={84} level="M" />
            </div>
          </div>
        </div>
        <button type="button" className="btn primary rm-addw" onClick={() => setWallet(true)}>
          <Icon name="card" size={18} /> Añadir a la wallet
        </button>
        <p className="small muted rm-note" aria-live="polite">
          {wallet
            ? 'Demostración: no se genera ningún pase real. En producción se emitiría un pase para Apple Wallet y otro para Google Wallet.'
            : 'El QR es de demostración y no identifica a ningún socio.'}
        </p>
      </div>

      <div className="rm-wallet-right">
        <div className="rm-sim">
          <div className="small"><b>Simular compras a bordo</b> <span className="muted">(los puntos que sumaría el sistema de Fred. Olsen Plus)</span></div>
          <div className="chips">
            <button type="button" className="chip" onClick={() => add(25)}>+25</button>
            <button type="button" className="chip" onClick={() => add(75)}>+75</button>
            <button type="button" className="chip" onClick={() => add(150)}>+150</button>
            <button type="button" className="chip" onClick={() => setPts(0)}>Reiniciar</button>
          </div>
        </div>
        <ol className="rm-tiers" aria-label="Catálogo de recompensas por tramos">
          {PREMIOS.map((p, i) => {
            const ok = pts >= p.pts
            return (
              <li key={p.pts} className={'rm-tier' + (ok ? ' on' : '')}>
                <span className="rm-tier-n">{i + 1}</span>
                <span className="rm-tier-body">
                  <b>{p.nombre}</b>
                  <span className="small muted">{p.nota}</span>
                </span>
                <span className="rm-tier-pts">
                  {ok ? <span className="tag green">Desbloqueado</span> : <span className="tag">{p.pts} pts</span>}
                </span>
              </li>
            )
          })}
        </ol>
        <p className="small muted">
          Premios, tramos y puntos son ilustrativos y una propuesta del equipo. Los Plus Points son los de Fred. Olsen Plus: FredOnBoard solo muestra el saldo y registra la compra; suma y canje los hace el sistema oficial.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ maqueta: «Antes de que se acabe» */

type Prod = { id: string; nombre: string; precio: number; caduca: number; stock: number; rot: 'Alta' | 'Media' | 'Baja' }
// Datos y precios de demostración (inventados para la maqueta).
const PRODS: Prod[] = [
  { id: 'a', nombre: 'Bocadillo de queso fresco', precio: 4.5, caduca: 20, stock: 9, rot: 'Baja' },
  { id: 'b', nombre: 'Ensalada de la casa', precio: 5.2, caduca: 17, stock: 6, rot: 'Media' },
  { id: 'c', nombre: 'Tarta del día', precio: 3.8, caduca: 23, stock: 12, rot: 'Media' },
  { id: 'd', nombre: 'Fruta cortada', precio: 3.0, caduca: 14, stock: 4, rot: 'Alta' },
]

// Descuento escalonado ilustrativo según horas que quedan hasta la caducidad.
function descTramo(horas: number, rot: Prod['rot']) {
  if (horas <= 0) return -1
  let d = horas <= 3 ? 40 : horas <= 6 ? 25 : horas <= 12 ? 10 : 0
  if (d > 0 && rot === 'Baja') d += 5
  if (d > 0 && rot === 'Alta') d -= 5
  return d
}
const eur = (n: number) => n.toFixed(2).replace('.', ',') + ' €'

function MaquetaCaducidad() {
  const [hora, setHora] = useState(12)
  const [x, setX] = useState(5)
  const [y, setY] = useState(30)

  const filas = useMemo(
    () =>
      PRODS.map((p) => {
        const horas = p.caduca - hora
        const tramo = descTramo(horas, p.rot)
        const regla = horas > 0 && p.stock > x
        const desc = tramo < 0 ? -1 : Math.max(tramo, regla ? y : 0)
        return { ...p, horas, tramo, regla, desc }
      }),
    [hora, x, y],
  )
  const enOferta = filas.filter((f) => f.desc > 0)
  const retirados = filas.filter((f) => f.desc < 0)

  return (
    <div className="rm-exp">
      <div className="rm-exp-col">
        <div className="rm-ctl">
          <label htmlFor="rm-hora" className="small"><b>Hora simulada:</b> {hora}:00 h</label>
          <input id="rm-hora" type="range" min={9} max={22} value={hora} onChange={(e) => setHora(Number(e.target.value))} />
        </div>
        <div className="rm-phone" aria-label="Maqueta de la carta en el móvil del pasajero">
          <div className="rm-phone-head">Carta · Cafetería</div>
          <div className="rm-phone-sec">
            <Icon name="clock" size={16} /> Antes de que se acabe
          </div>
          {enOferta.length === 0 && <div className="small muted rm-phone-empty">Ahora mismo no hay productos con precio especial.</div>}
          {enOferta.map((f) => (
            <div key={f.id} className="rm-item">
              <div>
                <b>{f.nombre}</b>
                <div className="small muted">{f.horas <= 3 ? `Se retira en ${f.horas} h` : f.horas <= 6 ? 'Caduca hoy' : 'Precio especial hoy'}</div>
              </div>
              <div className="rm-price">
                <s className="muted small">{eur(f.precio)}</s>
                <b>{eur(f.precio * (1 - f.desc / 100))}</b>
                <span className="tag yellow">-{f.desc}%</span>
              </div>
            </div>
          ))}
          {retirados.length > 0 && <div className="small muted rm-phone-empty">Retirados de la carta por caducidad: {retirados.map((r) => r.nombre).join(', ')}.</div>}
        </div>
        <p className="small muted">Precios, horas y tramos de descuento de demostración (-40 / -25 / -10 % según las horas que quedan, ±5 puntos por rotación). Son una propuesta, no cifras de Fred. Olsen.</p>
      </div>

      <div className="rm-exp-col">
        <div className="card flat rm-mgr">
          <h3><Icon name="wrench" size={16} /> Vista del manager: regla automática</h3>
          <p className="small">
            Si el producto <b>caduca hoy</b> y quedan más de{' '}
            <input className="rm-num" type="number" min={0} max={50} value={x} onChange={(e) => setX(Math.max(0, Number(e.target.value) || 0))} aria-label="Unidades mínimas X" />{' '}
            unidades, aplicar un descuento del{' '}
            <input className="rm-num" type="number" min={0} max={70} value={y} onChange={(e) => setY(Math.min(70, Math.max(0, Number(e.target.value) || 0)))} aria-label="Descuento Y en porcentaje" />{' '}
            %.
          </p>
          <div className="rm-table" role="table" aria-label="Estado del inventario perecedero">
            <div className="rm-tr rm-th" role="row">
              <span role="columnheader">Producto</span><span role="columnheader">Caduca</span><span role="columnheader">Stock</span><span role="columnheader">Rotación</span><span role="columnheader">Precio hoy</span>
            </div>
            {filas.map((f) => (
              <div key={f.id} className="rm-tr" role="row">
                <span role="cell">{f.nombre}</span>
                <span role="cell">{f.caduca}:00 h</span>
                <span role="cell">{f.stock}</span>
                <span role="cell">{f.rot}</span>
                <span role="cell">
                  {f.desc < 0 ? <span className="tag red">Retirado</span> : f.desc === 0 ? <span className="tag">Normal</span> : <span className="tag yellow">-{f.desc}%{f.regla && f.desc === y ? ' (regla)' : ''}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="callout navy small">
          Conecta con <b>En Armonía con el Mar</b> (menos desperdicio) y con el inventario por escandallo. Requiere <b>activar la función de perecederos</b>, que hoy no está activada en el sistema.
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ maqueta: catálogo de la tienda */

type Cat = 'Producto canario' | 'Recuerdos' | 'Temporada'
type Temp = 'Navidad' | 'Carnaval' | 'Verano'
type Art = { id: string; nombre: string; precio: number; stock: number; cat: Cat[]; temp?: Temp[]; nota: string }
// Productos genéricos, precios y stock ilustrativos (no son los de Ágora ni de Fred. Olsen).
const ARTS: Art[] = [
  { id: 'mojo', nombre: 'Mojo picón (frasco)', precio: 4.5, stock: 24, cat: ['Producto canario'], nota: 'Elaborado en Canarias' },
  { id: 'gofio', nombre: 'Gofio de trigo (1 kg)', precio: 3.2, stock: 18, cat: ['Producto canario'], nota: 'Elaborado en Canarias' },
  { id: 'miel', nombre: 'Miel de palma', precio: 8.9, stock: 3, cat: ['Producto canario'], temp: ['Navidad'], nota: 'Elaborado en Canarias' },
  { id: 'queso', nombre: 'Queso curado', precio: 9.5, stock: 7, cat: ['Producto canario'], temp: ['Navidad'], nota: 'Elaborado en Canarias' },
  { id: 'vino', nombre: 'Vino canario (botella)', precio: 12.0, stock: 10, cat: ['Producto canario'], temp: ['Navidad'], nota: 'Elaborado en Canarias' },
  { id: 'camiseta', nombre: 'Camiseta Fred. Olsen', precio: 14.9, stock: 15, cat: ['Recuerdos'], temp: ['Verano'], nota: 'Recuerdo' },
  { id: 'gorra', nombre: 'Gorra Fred. Olsen', precio: 11.5, stock: 9, cat: ['Recuerdos'], temp: ['Verano'], nota: 'Recuerdo' },
  { id: 'peluche', nombre: 'Peluche del barco', precio: 9.9, stock: 12, cat: ['Recuerdos'], temp: ['Navidad'], nota: 'Regalo' },
  { id: 'iman', nombre: 'Imán de las islas', precio: 3.0, stock: 40, cat: ['Recuerdos'], nota: 'Recuerdo' },
  { id: 'guia', nombre: 'Guía de las islas', precio: 7.5, stock: 6, cat: ['Recuerdos'], nota: 'Novedad' },
  { id: 'crema', nombre: 'Crema solar', precio: 10.9, stock: 14, cat: ['Temporada'], temp: ['Verano'], nota: 'De temporada' },
  { id: 'antifaz', nombre: 'Antifaz y confeti de Carnaval', precio: 2.9, stock: 30, cat: ['Temporada'], temp: ['Carnaval'], nota: 'De temporada' },
  { id: 'turron', nombre: 'Surtido de dulces navideños', precio: 6.8, stock: 0, cat: ['Temporada', 'Producto canario'], temp: ['Navidad'], nota: 'De temporada' },
]
const CATS: (Cat | 'Todo')[] = ['Todo', 'Producto canario', 'Recuerdos', 'Temporada']
const TEMPS: Temp[] = ['Navidad', 'Carnaval', 'Verano']
const LLEGADA = '09:15' // llegada ilustrativa

/** Maqueta de la vista de flota (solo a futuro: en el piloto el manager es de un barco). */
const FLOTA = [
  { n: 'Bajamar Express', r: 'Santa Cruz → Agaete', p: 0.62, pedidos: 31, venta: '1,58 €', adop: '19 %', estado: 'Piloto activo', tono: 'green' },
  { n: 'Bañaderos Express', r: 'Agaete → Santa Cruz', p: 0.25, pedidos: 24, venta: '1,51 €', adop: '16 %', estado: 'En ruta', tono: '' },
  { n: 'Benchijigua Express', r: 'Los Cristianos → San Sebastián de La Gomera', p: 0.8, pedidos: 12, venta: '1,44 €', adop: '13 %', estado: 'Saturación en Proa', tono: 'yellow' },
]
function MaquetaFlota() {
  const [grupo, setGrupo] = useState<'todos' | 'fast' | 'uno'>('todos')
  const [publicado, setPublicado] = useState(false)
  const destino = grupo === 'todos' ? 'los 3 buques' : grupo === 'fast' ? 'los fast ferries de la ruta Tenerife–Gran Canaria' : 'el Bajamar Express'
  return (
    <div className="rm-flota">
      <div className="rm-flota-top">
        <div>
          <div className="eyebrow">Dirección de restauración · flota</div>
          <strong>Buques en ruta ahora</strong>
        </div>
        <span className="tag yellow">Ilustrativo · fase de escalado</span>
      </div>
      <div className="matrix-wrap" style={{ maxHeight: 'none' }}>
        <table className="rm-flota-t">
          <thead>
            <tr>
              <th>Buque</th>
              <th>Travesía</th>
              <th>Pedidos</th>
              <th>Venta por pasajero</th>
              <th>Adopción</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {FLOTA.map((b) => (
              <tr key={b.n}>
                <th>{b.n}</th>
                <td>
                  <div className="small">{b.r}</div>
                  <div className="rm-flota-bar"><span style={{ width: `${b.p * 100}%` }} /></div>
                </td>
                <td>{b.pedidos}</td>
                <td>{b.venta}</td>
                <td>{b.adop}</td>
                <td><span className={`tag ${b.tono}`}>{b.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rm-flota-pub">
        <span className="small"><b>Carta maestra:</b> publicar en</span>
        <div className="chips">
          {([['todos', 'Toda la flota'], ['fast', 'Fast ferries TF–GC'], ['uno', 'Solo el Bajamar']] as const).map(([id, t]) => (
            <button key={id} className={`chip${grupo === id ? ' on' : ''}`} onClick={() => { setGrupo(id); setPublicado(false) }}>
              {t}
            </button>
          ))}
        </div>
        <button className="btn primary sm" onClick={() => setPublicado(true)}>Publicar carta</button>
        {publicado && <span className="small">Publicada en {destino}. Cada barco mantiene su stock y sus ajustes locales.</span>}
      </div>
      <p className="small muted" style={{ marginTop: 10 }}>
        Datos de ejemplo. En el piloto el panel del manager es del Bajamar Express; esta vista llega al desplegar FredOnBoard en más barcos.
      </p>
    </div>
  )
}

function MaquetaTienda() {
  const [cat, setCat] = useState<Cat | 'Todo'>('Todo')
  const [temp, setTemp] = useState<Temp>('Navidad')
  const [sel, setSel] = useState<string | null>(null)
  const [pago, setPago] = useState<'app' | 'mostrador'>('app')
  const [res, setRes] = useState<{ id: string; pago: 'app' | 'mostrador' } | null>(null)

  const lista = ARTS.filter((a) => cat === 'Todo' || a.cat.includes(cat))
  const reco = ARTS.filter((a) => a.temp?.includes(temp) && a.stock > 0).slice(0, 3)
  const art = ARTS.find((a) => a.id === (res ? res.id : sel))
  const stockDe = (a: Art) => (res && res.id === a.id ? a.stock - 1 : a.stock)

  return (
    <div className="rm-exp">
      <div className="rm-exp-col">
        <div className="rm-ctl">
          <label htmlFor="rm-temp" className="small"><b>Temporada simulada</b></label>
          <select id="rm-temp" className="rm-sel" value={temp} onChange={(e) => setTemp(e.target.value as Temp)}>
            {TEMPS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="rm-phone" aria-label="Maqueta del catálogo de la tienda en el móvil del pasajero">
          <div className="rm-phone-head">Tienda a bordo</div>
          <div className="rm-phone-sec"><Icon name="megaphone" size={16} /> Recomendado ahora · {temp}</div>
          <div className="rm-reco">
            {reco.map((a) => (
              <button key={a.id} type="button" className="rm-reco-i" onClick={() => { if (!res) setSel(a.id) }}>
                <b>{a.nombre}</b>
                <span className="small muted">{eur(a.precio)}</span>
              </button>
            ))}
          </div>
          <div className="chips rm-cats" role="group" aria-label="Filtrar el catálogo">
            {CATS.map((c) => (
              <button key={c} type="button" className={'chip' + (cat === c ? ' on' : '')} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <div className="rm-lista">
            {lista.map((a) => {
              const st = stockDe(a)
              const on = (res ? res.id : sel) === a.id
              return (
                <button key={a.id} type="button" disabled={st <= 0 || !!res} className={'rm-art' + (on ? ' on' : '')} aria-pressed={on} onClick={() => setSel(a.id)}>
                  <span className="rm-art-img" aria-hidden><Icon name="box" size={20} /></span>
                  <span className="rm-art-body">
                    <b>{a.nombre}</b>
                    <span className="small muted">{a.nota}</span>
                  </span>
                  <span className="rm-price">
                    <b>{eur(a.precio)}</b>
                    {st <= 0 ? <span className="tag red">Agotado</span> : st <= 5 ? <span className="tag yellow">Quedan {st}</span> : <span className="tag">En stock</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <p className="small muted">Productos, precios y stock ilustrativos: en producción vendrían de Ágora (u otro sistema), que sigue siendo la fuente de verdad.</p>
      </div>

      <div className="rm-exp-col">
        <div className="card flat rm-mgr">
          <h3><Icon name="receipt" size={16} /> {res ? 'Tu reserva' : 'Reservar un artículo'}</h3>
          {!art && <p className="small muted">Elige un artículo del catálogo para reservarlo.</p>}
          {art && !res && (
            <>
              <p className="small"><b>{art.nombre}</b> · {eur(art.precio)} <span className="muted">(precio ilustrativo)</span></p>
              <fieldset className="rm-pago">
                <legend className="small"><b>¿Cómo prefieres pagar?</b></legend>
                <label className={'rm-opt' + (pago === 'app' ? ' on' : '')}>
                  <input type="radio" name="rm-pago" checked={pago === 'app'} onChange={() => setPago('app')} /> Pagar ahora en la app
                </label>
                <label className={'rm-opt' + (pago === 'mostrador' ? ' on' : '')}>
                  <input type="radio" name="rm-pago" checked={pago === 'mostrador'} onChange={() => setPago('mostrador')} /> Pagar en el mostrador
                </label>
              </fieldset>
              <button type="button" className="btn primary rm-addw" onClick={() => setRes({ id: art.id, pago })}>Reservar</button>
            </>
          )}
          {art && res && (
            <>
              <div className="callout navy small" aria-live="polite">
                Reservado · recoge en la tienda antes de las 09:05 · se libera a las 09:10 si no lo recoges
              </div>
              <div className="rm-res">
                <div className="rm-qr"><QRCodeSVG value={`FREDONBOARD-TIENDA-DEMO-${art.id}`} size={104} level="M" /></div>
                <div className="small">
                  <b>{art.nombre}</b><br />
                  {res.pago === 'app' ? <span className="tag green">Pagado en la app</span> : <span className="tag yellow">Pago pendiente en el mostrador</span>}
                  <div className="muted rm-mt">Llegada ilustrativa: {LLEGADA}. Muestra este QR en el mostrador de la tienda. QR de demostración, no válido.</div>
                </div>
              </div>
              <button type="button" className="btn light sm" onClick={() => { setRes(null); setSel(null) }}>Cancelar y liberar la reserva</button>
            </>
          )}
        </div>
        <div className="callout navy small">
          Es un catálogo <b>separado de la carta de restauración</b>, con su propio mostrador. Las reservas se preparan en momentos valle y la retención se libera sola: cualquier artículo sin pagar ni recoger vuelve al stock antes de la llegada.
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ página */

export default function Roadmap() {
  const [filtro, setFiltro] = useState<Horizonte | 'Todas'>('Todas')
  const [abierta, setAbierta] = useState<string | null>(null)
  const visibles = IDEAS.filter((i) => filtro === 'Todas' || i.horizonte === filtro)
  const grupos = HORIZONTES.filter((h) => visibles.some((i) => i.horizonte === h.id))

  return (
    <div className="rm">
      <header className="page-head">
        <div className="eyebrow">Hoja de ruta · Ideas a futuro</div>
        <h1>Lo que FredOnBoard podría ser después del piloto</h1>
        <p>
          El MVP del piloto se limita a lo esencial: pedir sin cuenta (identificación por el localizador del billete), Click &amp; Collect y pre-pedido. Todo lo demás queda fuera a propósito: depende de integraciones con sistemas de Fred. Olsen distintos de Ágora (que ya está integrada desde el piloto), necesita datos que solo dará el piloto o exige decisiones de la naviera. Estas ideas están ordenadas por horizonte y ninguna incluye cifras que no se hayan medido: el esfuerzo es una estimación del equipo.
        </p>
      </header>

      <section className="section">
        <div className="section-title">
          <h2>Ideas por horizonte</h2>
          <p>Filtra por horizonte y abre una tarjeta para ver cómo funcionaría, qué necesita y cómo se mediría.</p>
        </div>
        <div className="chips rm-filter" role="group" aria-label="Filtrar por horizonte">
          {(['Todas', ...HORIZONTES.map((h) => h.id)] as const).map((h) => (
            <button key={h} type="button" className={'chip' + (filtro === h ? ' on' : '')} aria-pressed={filtro === h} onClick={() => setFiltro(h)}>
              {h}
            </button>
          ))}
        </div>

        {grupos.map((g) => (
          <div key={g.id} className="rm-group">
            <h3 className="rm-group-h">{g.id}</h3>
            <p className="small muted">{g.descripcion}</p>
            <div className="grid g2">
              {visibles.filter((i) => i.horizonte === g.id).map((i) => {
                const open = abierta === i.id
                return (
                  <article key={i.id} className="card rm-idea" id={i.id}>
                    <div className="rm-idea-head">
                      <span className="rm-ico"><Icon name={i.icono} size={20} /></span>
                      <div>
                        <h3>{i.titulo}</h3>
                        <div className="chips">
                          <span className="tag green">{i.horizonte}</span>
                          <span className="tag">Esfuerzo {i.esfuerzo.toLowerCase()} (est.)</span>
                          {i.tickets.map((t) => <span key={t} className="tag yellow">Ticket {t}</span>)}
                        </div>
                      </div>
                    </div>
                    <p className="small"><b>Problema.</b> {i.problema}</p>
                    <p className="small"><b>Idea.</b> {i.idea}</p>
                    <button type="button" className="btn light sm" aria-expanded={open} onClick={() => setAbierta(open ? null : i.id)}>
                      {open ? 'Ocultar detalle' : 'Ver detalle'}
                    </button>
                    {open && (
                      <div className="rm-detail">
                        <h4>Cómo funciona</h4>
                        <ol className="small">{i.comoFunciona.map((c) => <li key={c}>{c}</li>)}</ol>
                        <div className="grid g2 rm-val">
                          <div><h4>Valor para el pasajero</h4><p className="small">{i.valor.pasajero}</p></div>
                          <div><h4>Valor para Fred. Olsen</h4><p className="small">{i.valor.fredolsen}</p></div>
                        </div>
                        <h4>Requisitos y dependencias</h4>
                        <ul className="small">{i.requisitos.map((r) => <li key={r}>{r}</li>)}</ul>
                        <h4>KPI</h4>
                        <p className="small">{i.kpi}</p>
                        {i.referencias.length > 0 && (
                          <>
                            <h4>Referencias</h4>
                            <ul className="small">{i.referencias.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.t}</a></li>)}</ul>
                          </>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="section" id="wallet">
        <div className="section-title">
          <h2>Maqueta: Tarjeta FredOnBoard en la wallet</h2>
          <p>Una sola idea (tickets #4 y #7): la tarjeta en la wallet del móvil, conectada a Fred. Olsen Plus. No se crea un programa paralelo: se usan los Plus Points del programa existente, que ya tiene más de 397.000 socios.</p>
        </div>
        <div className="card">
          <MaquetaWallet />
        </div>
        <div className="callout navy small rm-mt">
          Inspirada en el modelo de acumulación y canje por tramos de Starbucks Rewards y MyMcDonald's Rewards. Sin logos ni marcas de Apple o Google en la maqueta.
        </div>
      </section>

      <section className="section" id="caducidad">
        <div className="section-title">
          <h2>Maqueta: Antes de que se acabe</h2>
          <p>Ticket #6. Mueve la hora y cambia la regla para ver cómo cambia la carta del pasajero y el criterio del manager.</p>
        </div>
        <div className="card">
          <MaquetaCaducidad />
        </div>
      </section>

      <section className="section" id="maqueta-tienda">
        <div className="section-title">
          <h2>Maqueta: Catálogo de la tienda a bordo</h2>
          <p>Ticket #22. Filtra el catálogo, cambia la temporada simulada, reserva un artículo y elige cómo pagar.</p>
        </div>
        <div className="card">
          <MaquetaTienda />
        </div>
      </section>

      <section className="section" id="maqueta-flota">
        <div className="section-title">
          <h2>Maqueta: Panel de flota para la dirección</h2>
          <p>Cuando FredOnBoard llegue a más barcos: comparar buques y publicar la carta en toda la flota, en un grupo o en uno solo.</p>
        </div>
        <div className="card">
          <MaquetaFlota />
        </div>
      </section>

      <section className="section" id="referencias">
        <div className="section-title">
          <h2>Referencias e inspiración</h2>
          <p>Fuentes públicas consultadas para las ideas. Las condiciones de cada programa son las de cada empresa y no se trasladan tal cual.</p>
        </div>
        <ul className="rm-refs">
          {REFERENCIAS_PAGINA.map((r) => (
            <li key={r.url} className="card flat">
              <a href={r.url} target="_blank" rel="noopener noreferrer">{r.t}</a>
              <div className="small muted">{new URL(r.url).hostname}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <div className="callout navy rm-links">
          <div><b>Sigue leyendo</b><div className="small muted">Cómo se implantaría el piloto y qué prototipo hay hoy.</div></div>
          <div className="chips">
            <Link className="btn ghost sm" to="/implementacion">Implementación</Link>
            <Link className="btn ghost sm" to="/piloto">Piloto</Link>
            <Link className="btn primary sm" to="/prototipo">Prototipo</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
