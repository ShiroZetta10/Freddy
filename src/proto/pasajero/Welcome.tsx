/** Acceso sin cuenta: localizador del billete, escaneo simulado de QR y billetes de demo. */
import { FormEvent, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BILLETES_DEMO, login, useProtoState } from '../store'
import { LANGS, Lang, makeT } from './i18n'
import { BarcoSVG, Olas, PI, vibrar } from './ui'
import { ss } from './ctx'

const DEMO_INFO: Record<string, string> = {
  FO7K2Q: 'Carmen · 42C · ES',
  FO9X4M: 'Tom · 17A · EN',
  FO3H8B: 'Greta · Oro 4 · DE · Clase Oro',
  FO2J5T: 'Yeray · 23B · ES · Tarifa Joven',
}

export default function Welcome({ onLogin }: { onLogin: (ticket: string) => void }) {
  useProtoState() // se suscribe para que login() vea los billetes actuales
  const [lang, setLang] = useState<Lang>(() => (ss.get('pj-lang') as Lang) || 'es')
  const idioma: Lang = ['es', 'en', 'de'].includes(lang) ? lang : 'es'
  const t = makeT(idioma)
  const [loc, setLoc] = useState('')
  const [error, setError] = useState(false)
  const [escaneando, setEscaneando] = useState(false)
  const [leido, setLeido] = useState(false)
  const [shake, setShake] = useState(0)
  const btnRef = useRef<HTMLButtonElement>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const entrar = (codigo: string) => {
    const b = login(codigo)
    if (!b) {
      setError(true)
      setShake((n) => n + 1)
      vibrar([40, 50, 40])
      return
    }
    vibrar(15)
    ss.set('pj-ticket', b.ticket)
    ss.set('pj-lang', b.idioma) // el idioma del billete manda al entrar
    onLogin(b.ticket)
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    entrar(loc)
  }

  const escanear = () => {
    if (escaneando) return
    setEscaneando(true)
    setLeido(false)
    setError(false)
    vibrar(10)
    timers.current.push(
      window.setTimeout(() => {
        setLoc('FO7K2Q')
        setLeido(true)
        vibrar([20, 30, 20])
      }, 1100),
      window.setTimeout(() => {
        setEscaneando(false)
        setLeido(false)
        btnRef.current?.focus()
      }, 1500),
    )
  }

  return (
    <div className="pj-welcome">
      <div className="pj-hero">
        <Olas className="pj-hero-waves" fondo="#f4f6f9" />
        <div className="pj-hero-lang" role="group" aria-label={t('w.lang')}>
          {LANGS.map((l) => (
            <button key={l.id} className={idioma === l.id ? 'on' : ''} onClick={() => setLang(l.id)} aria-pressed={idioma === l.id} aria-label={l.nombre}>
              {l.label}
            </button>
          ))}
        </div>
        <motion.div className="pj-hero-ship" animate={{ y: [0, -4, 0], rotate: [-1.5, 1.5, -1.5] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
          <BarcoSVG size={74} />
        </motion.div>
        <div className="pj-hero-text">
          <span className="pj-eyebrow">Fred. Olsen Express</span>
          <h1>{t('w.title')}</h1>
          <span className="pj-club-seal">
            <PI n="anchor" size={13} sw={2.2} />
            <b>FredOnBoard</b> {t('club.seal')}
          </span>
        </div>
      </div>

      <div className="pj-welcome-body">
        <motion.form
          className="pj-login fob-card"
          onSubmit={enviar}
          key={shake}
          animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <p className="pj-sub">{t('w.sub')}</p>
          <label htmlFor="pj-loc" className="pj-label">
            {t('w.loc')}
          </label>
          <input
            id="pj-loc"
            className={'pj-input' + (error ? ' bad' : '')}
            value={loc}
            onChange={(e) => {
              setLoc(e.target.value.toUpperCase())
              setError(false)
            }}
            placeholder={t('w.ph')}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={10}
            aria-invalid={error}
            aria-describedby={error ? 'pj-loc-err' : undefined}
            inputMode="text"
          />
          <AnimatePresence>
            {error && (
              <motion.p id="pj-loc-err" role="alert" className="pj-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                {t('w.err')}
              </motion.p>
            )}
          </AnimatePresence>
          <button ref={btnRef} type="submit" className="fob-btn primary block" disabled={!loc.trim()}>
            {t('w.go')}
          </button>
          <button type="button" className="fob-btn ghost block pj-scan-btn" onClick={escanear} disabled={escaneando}>
            <PI n="qr" size={19} />
            {t('w.scan')}
          </button>
        </motion.form>

        <div className="pj-demos">
          <span className="pj-label">{t('w.demo')}</span>
          <div className="pj-chips">
            {BILLETES_DEMO.map((b) => (
              <button
                key={b.ticket}
                className="pj-chip-ticket"
                onClick={() => {
                  setLoc(b.ticket)
                  setError(false)
                  vibrar(8)
                }}
                aria-label={`${b.ticket}, ${DEMO_INFO[b.ticket] ?? b.nombre}`}
              >
                <b>{b.ticket}</b>
                <span>{DEMO_INFO[b.ticket] ?? `${b.nombre} · ${b.asiento}`}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="pj-foot">{t('w.foot')}</p>
      </div>

      <AnimatePresence>
        {escaneando && (
          <motion.div className="pj-scanner" role="dialog" aria-modal="true" aria-label={t('w.scan')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="pj-scan-frame">
              <i className="c tl" />
              <i className="c tr" />
              <i className="c bl" />
              <i className="c br" />
              <div className="pj-scan-qr" aria-hidden>
                {Array.from({ length: 49 }).map((_, i) => (
                  <b key={i} style={{ opacity: [1, 0, 1, 1, 0, 1, 0][(i * 5 + (i >> 2)) % 7] }} />
                ))}
              </div>
              {!leido && <motion.div className="pj-scan-line" animate={{ top: ['6%', '90%', '6%'] }} transition={{ duration: 1.1, ease: 'easeInOut' }} />}
              <AnimatePresence>
                {leido && (
                  <motion.div className="pj-scan-ok" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
                    <PI n="check" size={30} sw={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p aria-live="polite">{leido ? `${t('w.scanOk')} · FO7K2Q` : t('w.scanHint')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
