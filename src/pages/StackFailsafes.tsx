import { useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

/** Datos de ejemplo: no son la carta real. */
type Prod = { id: string; n: string; p: number }
const PRODUCTOS: Prod[] = [
  { id: 'cafe', n: 'Café con leche', p: 180 },
  { id: 'bocq', n: 'Bocadillo de jamón y queso', p: 450 },
  { id: 'tort', n: 'Tortilla de patatas', p: 380 },
  { id: 'agua', n: 'Agua 50 cl', p: 120 },
  { id: 'cerv', n: 'Cerveza', p: 250 },
  { id: 'dulc', n: 'Dulce del día', p: 210 },
]

const URL_BASE = 'https://fredonboard.local'
const VALIDEZ_MIN = 30
const LIMITE_QR = 2953 // nivel L; con M son 2331

const eur = (c: number) => (c / 100).toFixed(2).replace('.', ',') + ' €'

function b64url(s: string) {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** CRC32 de demostración. En producción: firma HMAC-SHA256 con una clave del barco. */
function crc(s: string) {
  let c = ~0
  for (const b of new TextEncoder().encode(s)) {
    c ^= b
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ((~c) >>> 0).toString(16).padStart(8, '0')
}

function empaquetar(ruta: string, obj: unknown) {
  const json = JSON.stringify(obj)
  const d = b64url(json)
  return { json, texto: `${URL_BASE}/${ruta}#d=${d}.${crc(json)}` }
}

function fmt(json: string) {
  const o = JSON.parse(json) as Record<string, unknown>
  return '{\n' + Object.entries(o).map(([k, v]) => ` "${k}": ${JSON.stringify(v)}`).join(',\n') + '\n}'
}

function hora(ms: number) {
  return new Date(ms).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function Medidor({ texto, nivel }: { texto: string; nivel: string }) {
  const n = new TextEncoder().encode(texto).length
  return (
    <p className="tiny muted fs-size">
      {n} bytes de {(nivel === "L" ? LIMITE_QR : 2331).toLocaleString("es-ES")} posibles en un QR (nivel de corrección {nivel}). Con la carta completa se usa compresión deflate y cabe de sobra.
    </p>
  )
}

export default function StackFailsafes() {
  const [agotados, setAgotados] = useState<Record<string, boolean>>({ tort: true })
  const [version, setVersion] = useState(41)
  const [emitido, setEmitido] = useState(() => Date.now())
  const [edad, setEdad] = useState(0)
  const [qty, setQty] = useState<Record<string, number>>({ cafe: 1, bocq: 1 })
  const [franja, setFranja] = useState('15')
  const [clave] = useState(() => 'ord-' + Math.random().toString(36).slice(2, 10))
  const [creado] = useState(() => Date.now())

  const toggleAgotado = (id: string) => {
    setAgotados((a) => ({ ...a, [id]: !a[id] }))
    setVersion((v) => v + 1)
    setEmitido(Date.now())
  }
  const cambiaQty = (id: string, d: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(9, (q[id] ?? 0) + d)) }))

  const stock = useMemo(
    () =>
      empaquetar('s', {
        v: 1,
        t: 'stock',
        bq: 'BAJ',
        cf: 1,
        n: version,
        ts: Math.floor(emitido / 60000),
        ex: VALIDEZ_MIN,
        p: PRODUCTOS.map((x) => [x.id, x.p, agotados[x.id] ? 0 : 1]),
      }),
    [agotados, version, emitido],
  )

  const lineas = PRODUCTOS.filter((x) => (qty[x.id] ?? 0) > 0)
  const total = lineas.reduce((s, x) => s + x.p * (qty[x.id] ?? 0), 0)
  const loc = 'FOB-' + crc(clave).slice(0, 4).toUpperCase()

  const pedido = useMemo(
    () =>
      empaquetar('p', {
        v: 1,
        t: 'order',
        k: clave,
        loc,
        cf: 1,
        l: lineas.map((x) => [x.id, qty[x.id]]),
        tot: total,
        fr: Number(franja),
        sv: version,
        ts: Math.floor(creado / 60000),
      }),
    [lineas.length, qty, total, franja, version, clave, loc, creado], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const caducado = edad > VALIDEZ_MIN

  return (
    <div className="fs-demo">
      <div className="card fs-card">
        <div className="fs-head">
          <h4>Demo A · QR de stock en la barra</h4>
          <span className="tag">Datos de ejemplo</span>
        </div>
        <p className="small muted">Marca un producto como agotado en la «tablet de barra»: el QR cambia y su versión sube.</p>
        <ul className="fs-lista">
          {PRODUCTOS.map((x) => (
            <li key={x.id}>
              <label>
                <input type="checkbox" checked={!!agotados[x.id]} onChange={() => toggleAgotado(x.id)} />
                <span className="fs-n">{x.n}</span>
                <span className="muted">{eur(x.p)}</span>
                <span className={`tag ${agotados[x.id] ? 'red' : 'green'}`}>{agotados[x.id] ? 'Agotado' : 'Disponible'}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="fs-qrrow">
          <div className="fs-qr" aria-label="QR de stock de la barra">
            <QRCodeSVG value={stock.texto} size={196} level="L" marginSize={2} />
            <span className="tiny muted">Versión {version} · {hora(emitido)}</span>
          </div>
          <div className="fs-dec">
            <b className="small">Contenido decodificado</b>
            <pre>{fmt(stock.json)}</pre>
            <label className="small fs-edad">
              Edad del QR en el móvil:{' '}
              <select value={edad} onChange={(e) => setEdad(Number(e.target.value))}>
                <option value={0}>recién escaneado</option>
                <option value={20}>20 min</option>
                <option value={45}>45 min</option>
              </select>
            </label>
            <p className={`small fs-estado ${caducado ? 'mal' : 'bien'}`}>
              {caducado ? `Caducado (validez ${VALIDEZ_MIN} min): la web lo ignora y pide escanear el QR actual.` : `Válido: la web actualiza disponibilidad y precios.`}
            </p>
          </div>
        </div>
        <Medidor texto={stock.texto} nivel="L" />
      </div>

      <div className="card fs-card">
        <div className="fs-head">
          <h4>Demo B · QR del pedido en el móvil</h4>
          <span className="tag">Datos de ejemplo</span>
        </div>
        <p className="small muted">Sin red, el pasajero arma su pedido y la web genera el QR. Los productos agotados de la demo A salen bloqueados.</p>
        <ul className="fs-lista">
          {PRODUCTOS.map((x) => {
            const ag = !!agotados[x.id]
            return (
              <li key={x.id} className={ag ? 'off' : ''}>
                <div className="fs-fila">
                  <span className="fs-n">{x.n}</span>
                  <span className="muted">{eur(x.p)}</span>
                  <span className="fs-step">
                    <button type="button" aria-label={`Quitar ${x.n}`} disabled={ag || !(qty[x.id] ?? 0)} onClick={() => cambiaQty(x.id, -1)}>−</button>
                    <b>{ag ? 0 : qty[x.id] ?? 0}</b>
                    <button type="button" aria-label={`Añadir ${x.n}`} disabled={ag} onClick={() => cambiaQty(x.id, 1)}>+</button>
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
        <label className="small fs-edad">
          Franja de recogida:{' '}
          <select value={franja} onChange={(e) => setFranja(e.target.value)}>
            <option value="0">Lo antes posible</option>
            <option value="15">En 15 min</option>
            <option value="30">En 30 min</option>
          </select>
        </label>
        {lineas.some((x) => agotados[x.id]) && <p className="small fs-estado mal">Hay productos agotados en el pedido: la barra los sustituirá o devolverá esa línea.</p>}
        <div className="fs-qrrow">
          <div className="fs-qr" aria-label="QR del pedido del pasajero">
            <QRCodeSVG value={pedido.texto} size={196} level="M" marginSize={2} />
            <span className="tiny muted">Localizador {loc} · {eur(total)}</span>
          </div>
          <div className="fs-dec">
            <b className="small">Contenido decodificado</b>
            <pre>{fmt(pedido.json)}</pre>
            <p className="small muted">
              Clave de idempotencia <code>k</code>: si el pedido se sincroniza después con red, el servidor ve la misma clave y no lo duplica.
            </p>
          </div>
        </div>
        <Medidor texto={pedido.texto} nivel="M" />
      </div>
    </div>
  )
}
