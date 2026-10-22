/** Clase Estándar vs Clase Oro: tabla verificada con fredolsen.es, reglas de atención y ajustes mínimos editables. */
import { FUENTES_CLASES, PRESTACIONES, REGLAS_ATENCION, EstadoVerificacion, ProtoState, eur, setAjustes } from '../store'
import { Card, NumField, Switch, num } from './util'

const ETIQUETA: Record<EstadoVerificacion, string> = { verificado: 'Verificado', corregido: 'Corregido', 'a-confirmar': 'A confirmar con Fred. Olsen' }

export default function Clases({ s }: { s: ProtoState }) {
  const a = s.ajustes
  const oro = s.pedidos.filter((p) => p.clase === 'oro' && p.estado !== 'cancelado')
  const incluidas = oro.reduce((n, p) => n + (p.menuOro?.uds ?? 0), 0)
  const valor = oro.reduce((n, p) => n + (p.menuOro?.valor ?? 0), 0)
  const mesa = oro.filter((p) => p.servicio === 'mesa').length
  const soportes = s.alertas.filter((x) => x.texto.startsWith('Soporte prioritario Clase Oro')).length
  return (
    <div className="mg-sec">
      <div className="mg-grid2 even">
        <Card title="Ajustes de clase" sub="Se aplican en el momento a todos los pasajeros conectados">
          <div className="mg-reglas">
            <div className="mg-regla">
              <div className="mg-regla-h">
                <b>Tarjeta «Pásate a Clase Oro»</b>
                <Switch checked={a.upsellOro} onChange={(v) => setAjustes({ upsellOro: v })} label="Mostrar la tarjeta de mejora a Clase Oro al pasajero estándar" />
              </div>
              <p>Aparece de forma discreta en la pantalla de viaje del pasajero estándar, con lo que incluye y «Precio: consultar» (la tarifa no es pública en la web de Fred. Olsen).</p>
            </div>
            <div className="mg-regla">
              <div className="mg-regla-h">
                <b>Límite del menú Oro incluido</b>
                <NumField label="Límite del menú Oro incluido por persona" value={a.limiteMenuOro} min={1} max={20} suffix="uds." onCommit={(n) => setAjustes({ limiteMenuOro: n })} />
              </div>
              <p>Unidades a 0 € por pasajero Oro y travesía. Fred. Olsen no publica un límite: este número es una propuesta del equipo (a confirmar). Lo que exceda se cobra a precio de carta.</p>
            </div>
          </div>
        </Card>
        <Card title="Clase Oro en esta travesía" sub="Los pedidos Oro los atiende la cafetería Oro, sin sumar carga a Proa ni Popa">
          <div className="mg-kpis-mini" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
            <div>
              <b style={{ fontSize: 22, color: 'var(--fob-navy)' }}>{num(oro.length)}</b>
              <p style={{ fontSize: 12.5, color: 'var(--fob-muted)' }}>pedidos Clase Oro</p>
            </div>
            <div>
              <b style={{ fontSize: 22, color: 'var(--fob-navy)' }}>{num(incluidas)}</b>
              <p style={{ fontSize: 12.5, color: 'var(--fob-muted)' }}>unidades incluidas ({eur(valor)} a precio de carta)</p>
            </div>
            <div>
              <b style={{ fontSize: 22, color: 'var(--fob-navy)' }}>{num(mesa)}</b>
              <p style={{ fontSize: 12.5, color: 'var(--fob-muted)' }}>con servicio en mesa</p>
            </div>
            <div>
              <b style={{ fontSize: 22, color: 'var(--fob-navy)' }}>{num(soportes)}</b>
              <p style={{ fontSize: 12.5, color: 'var(--fob-muted)' }}>solicitudes de soporte prioritario</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Clase Estándar frente a Clase Oro" sub="Contrastado con fredolsen.es el 22/10/2026 (tarifas interinsulares; los servicios pueden variar según el buque)">
        <div className="mg-tabla-wrap">
          <table className="mg-tabla">
            <thead>
              <tr>
                <th scope="col">Característica</th>
                <th scope="col">Estándar (Básica / Óptima)</th>
                <th scope="col">Clase Oro (Confort Oro)</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {PRESTACIONES.map((p) => (
                <tr key={p.id}>
                  <td>{p.etiqueta}</td>
                  <td>{p.estandar}</td>
                  <td>
                    {p.oro}
                    <small>{p.nota}</small>
                  </td>
                  <td>
                    <span className={`mg-verif ${p.estado}`}>{ETIQUETA[p.estado]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mg-nota">Existe una tarifa intermedia, Priority (salón, embarque prioritario, comida y bebida; sin desembarque prioritario ni flexibilidad), que el prototipo no modela: a confirmar con Fred. Olsen cómo tratarla en la app.</p>
        <ul className="mg-fuentes">
          {FUENTES_CLASES.map((f) => (
            <li key={f.id}>
              <a href={f.url} target="_blank" rel="noreferrer">
                {f.titulo}
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mg-grid2 even">
        {(['estandar', 'oro'] as const).map((c) => (
          <Card key={c} title={REGLAS_ATENCION[c].nombre} sub={`Tono: ${REGLAS_ATENCION[c].tono}`}>
            <ul className="mg-reglas-at">
              {REGLAS_ATENCION[c].reglas.map((r) => (
                <li key={r.id}>
                  <span>{r.texto}</span>
                  <span className={`mg-verif ${r.estado === 'prototipo' ? 'verificado' : 'a-confirmar'}`}>{r.estado === 'prototipo' ? 'En el prototipo' : 'A confirmar'}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}
