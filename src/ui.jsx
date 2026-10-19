import { Component, useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from './api'

// Charge des données et expose {data, loading, error, reload}.
export function useFetch(fn, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const fnRef = useRef(fn)
  fnRef.current = fn
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.resolve()
      .then(() => fnRef.current())
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((err) => alive && setState({ data: null, loading: false, error: errorMessage(err) }))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}

// Exécute une action asynchrone avec état d'occupation et message d'erreur.
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const run = useCallback(async (fn) => {
    setBusy(true)
    setError('')
    try {
      return await fn()
    } catch (err) {
      setError(errorMessage(err))
      return undefined
    } finally {
      setBusy(false)
    }
  }, [])
  return { busy, error, setError, run }
}

export function Loading({ label = 'Chargement…' }) {
  return (
    <p className="muted loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" /> {label}
    </p>
  )
}

export function ErrorBox({ children }) {
  if (!children) return null
  return <div className="alert alert-error" role="alert">{children}</div>
}

export function Empty({ children = 'Aucun résultat.' }) {
  return <p className="empty">{children}</p>
}

// Titre de l'onglet du navigateur : « Page · Baobab ».
export function usePageTitle(title) {
  useEffect(() => {
    if (typeof title !== 'string' || !title) return undefined
    const previous = document.title
    document.title = `${title} · Baobab`
    return () => {
      document.title = previous
    }
  }, [title])
}

export function PageHeader({ title, subtitle, children }) {
  usePageTitle(title)
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      <div className="page-actions">{children}</div>
    </header>
  )
}

const TONES = {
  AVAILABLE: 'ok', ACCEPTED: 'ok', ACTIVE: 'ok', RETURNED: 'ok', CONFIRMED: 'info', COMPLETED: 'ok',
  CLOSED: 'neutral', RECORDED: 'ok', OPEN: 'info', BORROWED: 'info',
  PENDING: 'warn', DAMAGED: 'warn', UNAVAILABLE: 'neutral', NO_SHOW: 'warn',
  REJECTED: 'bad', SUSPENDED: 'bad', LOST: 'bad', CANCELLED: 'bad', VOIDED: 'bad',
}
const LABELS = {
  AVAILABLE: 'Disponible', BORROWED: 'Emprunté', LOST: 'Perdu', DAMAGED: 'Endommagé', UNAVAILABLE: 'Indisponible',
  PENDING: 'En attente', ACCEPTED: 'Accepté', REJECTED: 'Refusé', SUSPENDED: 'Suspendu',
  ACTIVE: 'En cours', RETURNED: 'Rendu', CONFIRMED: 'Confirmée', CANCELLED: 'Annulée', NO_SHOW: 'Absence',
  COMPLETED: 'Terminée', OPEN: 'En cours', CLOSED: 'Terminée', RECORDED: 'Enregistré', VOIDED: 'Annulé',
  NEW: 'Neuf', GOOD: 'Bon', FAIR: 'Passable', POOR: 'Mauvais',
  DESK: 'Poste', ROOM: 'Salle', OTHER: 'Autre',
  CASH: 'Espèces', MOBILE_MONEY: 'Mobile Money', BANK: 'Banque',
}
export const label = (v) => LABELS[v] || v

export function Badge({ value, tone }) {
  return <span className={`badge badge-${tone || TONES[value] || 'neutral'}`}>{label(value)}</span>
}

export function Pager({ page, count, pageSize = 25, onPage }) {
  const pages = Math.max(1, Math.ceil(count / pageSize))
  if (count <= pageSize) return null
  return (
    <nav className="pager" aria-label="Pagination">
      <button className="btn btn-ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Précédent</button>
      <span className="muted">Page {page} / {pages} · {count} éléments</span>
      <button className="btn btn-ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Suivant →</button>
    </nav>
  )
}

export function Modal({ title, onClose, children, wide }) {
  const ref = useRef(null)
  // Le focus entre dans la fenêtre à l'ouverture et revient au bouton d'origine à la fermeture.
  useEffect(() => {
    const previous = document.activeElement
    const node = ref.current
    if (node && !node.contains(document.activeElement)) {
      ;(node.querySelector('input, select, textarea') || node).focus()
    }
    return () => {
      if (previous && typeof previous.focus === 'function') previous.focus()
    }
  }, [])
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const items = ref.current.querySelectorAll(
        'a[href], button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled)',
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label: text, hint, children }) {
  return (
    <label className="field">
      <span>{text}</span>
      {children}
      {hint && <small className="muted">{hint}</small>}
    </label>
  )
}

// Champ mot de passe avec bouton Afficher / Masquer et alerte de verrouillage des majuscules.
export function PasswordInput({ value, onChange, autoComplete = 'current-password', ...rest }) {
  const [shown, setShown] = useState(false)
  const [caps, setCaps] = useState(false)
  return (
    <>
      <div className="pw-field">
        <input
          {...rest}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          onKeyUp={(e) => setCaps(Boolean(e.getModifierState && e.getModifierState('CapsLock')))}
          onBlur={() => setCaps(false)}
        />
        <button
          type="button"
          className="pw-toggle"
          onClick={() => setShown((v) => !v)}
          aria-pressed={shown}
          aria-label={shown ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {shown ? 'Masquer' : 'Afficher'}
        </button>
      </div>
      {caps && <small className="caps-hint" role="status">Verrouillage des majuscules activé</small>}
    </>
  )
}

// Champ de recherche avec sélection : `fetcher(q)` renvoie une liste d'options {id, label}.
export function Picker({ label: text, fetcher, value, onChange, placeholder = 'Rechercher…' }) {
  const [q, setQ] = useState('')
  const [options, setOptions] = useState([])
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return undefined
    let alive = true
    const t = setTimeout(() => {
      Promise.resolve(fetcher(q))
        .then((opts) => alive && setOptions(opts))
        .catch(() => alive && setOptions([]))
    }, 200)
    return () => {
      alive = false
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open])
  return (
    <div className="field picker">
      <span>{text}</span>
      {value ? (
        <div className="picked">
          <strong>{value.label}</strong>
          <button type="button" className="btn btn-ghost" onClick={() => onChange(null)}>Changer</button>
        </div>
      ) : (
        <>
          <input value={q} placeholder={placeholder} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true) }} />
          {open && (
            <ul className="picker-list">
              {options.length === 0 && <li className="muted">Aucune option</li>}
              {options.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => { onChange(o); setOpen(false); setQ('') }}>{o.label}</button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

export const money = (n, currency = 'XOF') => `${Number(n || 0).toLocaleString('fr-FR')} ${currency === 'XOF' ? 'FCFA' : currency}`
export const dateTime = (iso) => (iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—')
export const dateOnly = (iso) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—')
// <input type="datetime-local"> -> ISO avec fuseau
export const localToIso = (v) => (v ? new Date(v).toISOString() : null)

// Liste paginée DRF : renvoie {results, count} qu'il s'agisse d'une page ou d'un tableau simple.
export const rows = (data) => (Array.isArray(data) ? data : data?.results || [])

// Valeur « retardée » : sert à ne pas interroger l'API à chaque frappe.
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// Évite la page blanche : une erreur d'affichage montre un message et des boutons pour continuer.
function ErrorPage({ code, title, text, children, alert }) {
  usePageTitle(`${code} · ${title}`)
  return (
    <div className="error-page">
      <div className="error-card" role={alert ? 'alert' : undefined}>
        <img className="error-logo" src="/favicon.png" alt="" />
        <p className="error-code" aria-hidden="true">{code}</p>
        <h1>{title}</h1>
        <p className="muted">{text}</p>
        <div className="error-actions">{children}</div>
        <p className="error-help muted">
          Besoin d'aide ? Contactez votre structure (bibliothèque ou espace de coworking) en précisant la page concernée.
        </p>
      </div>
    </div>
  )
}

export class ErrorBoundary extends Component {
  state = { failed: false, error: null }
  static getDerivedStateFromError(error) {
    return { failed: true, error }
  }
  componentDidCatch(error) {
    console.error(error)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <ErrorPage
        alert
        code="Oups"
        title="Une erreur est survenue"
        text="L'affichage a rencontré un problème. Vos données ne sont pas perdues : réessayez, ou rechargez la page."
      >
        {import.meta.env.DEV && this.state.error && <code className="error-path">{String(this.state.error.message || this.state.error)}</code>}
        <button className="btn secondary" onClick={() => this.setState({ failed: false, error: null })}>Réessayer</button>
        <button className="btn" onClick={() => window.location.reload()}>Recharger la page</button>
        <a className="btn secondary" href="/">Retour à l'accueil</a>
      </ErrorPage>
    )
  }
}

export function NotFound({ home = '/' }) {
  return (
    <ErrorPage
      code="404"
      title="Page introuvable"
      text="Cette adresse n'existe pas ou a été déplacée. Vérifiez l'adresse saisie ou revenez à l'accueil."
    >
      <code className="error-path">{window.location.pathname}</code>
      <button className="btn secondary" onClick={() => window.history.back()}>Page précédente</button>
      <a className="btn" href={home}>Retour à l'accueil</a>
    </ErrorPage>
  )
}
