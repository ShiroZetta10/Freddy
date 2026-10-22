/** Pestaña Ayuda: asistente híbrido (chips guiados + chat con respuestas por palabras clave y datos del store). */
import { FormEvent, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { horaDe } from '../store'
import { LANGS } from './i18n'
import { PI, vibrar } from './ui'
import { ChatMsg, useP } from './ctx'

const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const QUICK = ['a.q1', 'a.q2', 'a.q3', 'a.q4', 'a.q5', 'a.q6']

export default function Ayuda() {
  const P = useP()
  const { s, t, lang, setLang, chat, setChat, billete } = P
  const [txt, setTxt] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const timer = useRef<number>()
  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    const sc = raiz.current?.closest('.pj-scroll') as HTMLElement | null
    if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' })
  }, [chat.length, escribiendo])

  const responder = (q: string): string => {
    const n = norm(q)
    const mios = P.mios.filter((p) => p.estado !== 'cancelado')
    const ultimo = [...mios].sort((a, b) => b.id - a.id)[0]
    const caf = (id: keyof typeof s.cafeterias) => s.cafeterias[id]
    const min = Math.max(0, Math.round(s.viaje.duracionMin - s.viaje.minuto))

    if (/cancel|anular|stornier|storno/.test(n)) {
      if (!ultimo) return t('bot.cancel.none')
      const cancelable = mios.find((p) => p.estado === 'recibido')
      if (cancelable) return t('bot.cancel.ok', { id: cancelable.id })
      if (ultimo.estado === 'entregado') return t('bot.cancel.none')
      return t('bot.cancel.late', { id: ultimo.id, st: t('o.st.' + ultimo.estado) })
    }
    if (/accesib|accessib|movilidad|mobilit|silla de ruedas|wheelchair|rollstuhl|barrierefrei|behinder|discapac/.test(n)) return t('bot.access')
    if (/\bbus\b|guagua|autobus|las palmas/.test(n)) return t('bot.bus')
    if (/km ?0|kilometro cero|\blocal(es)?\b|regional/.test(n)) {
      const lista = s.productos.filter((p) => p.km0 && !p.agotado).map((p) => p.nombre).join(', ')
      return t('bot.km0', { list: lista })
    }
    if (/pedido|order|bestell/.test(n)) {
      if (!ultimo) return t('bot.order.none')
      return t('bot.order', { id: ultimo.id, st: t('o.st.' + ultimo.estado) })
    }
    if (/cuando|llegamos|llegada|llegar|arriv|\bwhen\b|\beta\b|ankunft|wann|ankomm|\bhora\b/.test(n)) {
      const h = horaDe(s, s.viaje.duracionMin)
      const now = horaDe(s, s.viaje.minuto)
      if (s.viaje.minuto >= s.viaje.duracionMin) return t('bot.arrive.done', { h })
      if (s.viaje.minuto < 0) return t('bot.arrive.before', { dep: s.viaje.salida, h, now })
      return t('bot.arrive', { h, now, min })
    }
    if (/donde|cafeter|barra|\bbar\b|recog|where|cafe|pick|\bwo\b|abhol|theke|collect/.test(n)) {
      const activo = [...mios].filter((p) => p.estado !== 'entregado').sort((a, b) => b.id - a.id)[0] ?? ultimo
      if (activo) {
        const c = caf(activo.cafeteria)
        return t('bot.where.order', { id: activo.id, caf: c.nombre, cub: c.cubierta, h: horaDe(s, activo.franja * s.ajustes.franjaMin) })
      }
      const list = (['proa', 'popa', 'oro'] as const).map((c) => `${caf(c).nombre} (${caf(c).cubierta})`).join(', ')
      return t('bot.where', { list }) + (P.esOro ? t('bot.where.gold') : '')
    }
    if (/^(hola|hi|hello|hallo|buenas|hey)\b/.test(n)) return t('bot.hello')
    return t('bot.fallback')
  }

  const enviar = (texto: string) => {
    const q = texto.trim()
    if (!q) return
    vibrar(8)
    setTxt('')
    const idq = Date.now()
    setChat((c) => [...c, { id: idq, de: 'yo', texto: q }])
    setEscribiendo(true)
    const r = responder(q)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setEscribiendo(false)
      setChat((c) => [...c, { id: idq + 1, de: 'bot', texto: r }])
      vibrar(10)
    }, Math.min(1500, 650 + r.length * 4))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    enviar(txt)
  }

  const burbuja = (m: Pick<ChatMsg, 'de' | 'texto'> & { id: number | string }) => (
    <motion.div key={m.id} className={'pj-bub ' + m.de} initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
      {m.texto}
    </motion.div>
  )

  return (
    <div className="pj-tab pj-ayuda" ref={raiz}>
      <div className="pj-sec-h">
        <div>
          <h2>{t('a.title')}</h2>
          <span className="pj-muted">{t('a.sub')}</span>
        </div>
        <div className="pj-seg" role="group" aria-label={t('x.lang')}>
          {LANGS.map((l) => (
            <button key={l.id} className={lang === l.id ? 'on' : ''} aria-pressed={lang === l.id} aria-label={l.nombre} onClick={() => setLang(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pj-chat" aria-live="polite" aria-label={t('a.title')}>
        {burbuja({ id: 'hello', de: 'bot', texto: t('a.hello', { n: billete.nombre }) })}
        <AnimatePresence initial={false}>{chat.map((m) => burbuja(m))}</AnimatePresence>
        <AnimatePresence>
          {escribiendo && (
            <motion.div key="typing" className="pj-bub bot typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" aria-label={t('a.typing')}>
              {[0, 1, 2].map((i) => (
                <motion.i key={i} animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pj-composer">
        <div className="pj-quick" role="group" aria-label={t('a.title')}>
          {QUICK.map((k) => (
            <button key={k} className="pj-qchip" onClick={() => enviar(t(k))} disabled={escribiendo}>
              {t(k)}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="pj-msgform">
          <input className="pj-input" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={t('a.ph')} aria-label={t('a.ph')} enterKeyHint="send" />
          <button type="submit" className="pj-send" disabled={!txt.trim() || escribiendo} aria-label={t('a.send')}>
            <PI n="send" size={20} />
          </button>
        </form>
      </div>
    </div>
  )
}
