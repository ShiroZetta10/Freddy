import { QRCodeSVG } from 'qrcode.react'
import { FORMATOS, PERSONAS, Persona, PersonaId } from '../../data/comunicacion'
import { SelectorPersona } from './Personas'
import AvatarSvg from './Avatar'
import { urlPrototipo } from './CanalesSolucion'

const LOGO = 'logos/fred-olsen-express.png'

function Logo() {
  return <span className="co-pn-logo"><img src={LOGO} alt="Fred. Olsen Express" /></span>
}

function Mupi({ p, url }: { p: Persona; url: string }) {
  return (
    <div className="co-pn co-pn-mupi">
      <Logo />
      <div className="co-pn-av"><AvatarSvg a={p.avatar} size={90} /></div>
      <h4>{p.panel.titular}</h4>
      <p>{p.panel.sub}</p>
      <div className="co-pn-qrrow">
        <div className="co-pn-qr"><QRCodeSVG value={url} size={128} level="M" /></div>
        <span>{p.panel.cta}</span>
      </div>
      <em>FredOnBoard · On Board Club</em>
    </div>
  )
}

function Barra({ p, url }: { p: Persona; url: string }) {
  return (
    <div className="co-pn co-pn-barra">
      <div className="co-pn-barra-txt">
        <Logo />
        <h4>{p.panel.barra}</h4>
        <p>{p.panel.sub}</p>
        <em>{p.mensaje}</em>
      </div>
      <div className="co-pn-qr"><QRCodeSVG value={url} size={128} level="M" /></div>
    </div>
  )
}

function Story({ p }: { p: Persona }) {
  return (
    <div className="co-pn co-pn-story">
      <div className="co-pn-story-top"><Logo /><span>fredolsenexpress</span></div>
      <div className="co-pn-av"><AvatarSvg a={p.avatar} size={110} /></div>
      <h4>{p.panel.story}</h4>
      <p>{p.panel.titular}</p>
      <div className="co-pn-cta">{p.panel.cta}</div>
      <em>Desliza hacia arriba</em>
    </div>
  )
}

function Wifi({ p }: { p: Persona }) {
  return (
    <div className="co-pn co-pn-wifi">
      <div className="co-pn-wifi-bar"><span>On Board Club</span><span>Wifi gratuito</span></div>
      <div className="co-pn-wifi-body">
        <div className="co-pn-av"><AvatarSvg a={p.avatar} size={64} /></div>
        <div>
          <h4>{p.panel.wifi}</h4>
          <p>{p.panel.sub}</p>
        </div>
        <div className="co-pn-cta">{p.panel.cta}</div>
      </div>
    </div>
  )
}

export default function Paneles({ id, onChange }: { id: PersonaId; onChange: (id: PersonaId) => void }) {
  const p = PERSONAS.find((x) => x.id === id)!
  const url = urlPrototipo()
  return (
    <>
      <p className="lead">
        Una creatividad por persona en cuatro formatos. Elige una persona y los paneles cambian de titular, ilustración y llamada a la acción. Los
        códigos QR son reales.
      </p>
      <SelectorPersona id={id} onChange={onChange} />
      <p className="small"><b>{p.nombre} · {p.etiqueta}.</b> Mensaje clave: {p.mensaje}</p>
      <div className="co-paneles">
        {FORMATOS.map((f) => (
          <figure key={f.id} className={`co-fmt co-fmt-${f.id}`}>
            <div className="co-pn-box">
              {f.id === 'mupi' && <Mupi p={p} url={url} />}
              {f.id === 'barra' && <Barra p={p} url={url} />}
              {f.id === 'story' && <Story p={p} />}
              {f.id === 'wifi' && <Wifi p={p} />}
            </div>
            <figcaption><b>{f.nombre}</b><span>{f.donde}</span></figcaption>
          </figure>
        ))}
      </div>
    </>
  )
}
