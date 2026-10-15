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
  return <p className="muted">{label}</p>
}

export function ErrorBox({ children }) {
  if (!children) return null
  return <div className="alert alert-error">{children}</div>
}

export function Empty({ children = 'Aucun résultat.' }) {
  return <p className="empty">{children}</p>
}

export function PageHeader({ title, subtitle, children }) {
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
    <div className="pager">
      <button className="btn btn-ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Précédent</button>
      <span className="muted">Page {page} / {pages} · {count} éléments</span>
      <button className="btn btn-ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Suivant →</button>
    </div>
  )
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
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

// Évite la page blanche : une erreur d'affichage montre un message et un bouton pour recharger.
export class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="auth-page">
        <div className="card auth-card">
          <h2>Une erreur est survenue</h2>
          <p className="muted">L'affichage a rencontré un problème. Rechargez la page ; si cela continue, contactez le support.</p>
          <button className="btn" onClick={() => window.location.reload()}>Recharger</button>
        </div>
      </div>
    )
  }
}

export function NotFound({ home = '/' }) {
  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Page introuvable</h2>
        <p className="muted">Cette adresse n'existe pas ou a été déplacée.</p>
        <a className="btn" href={home}>Retour à l'accueil</a>
      </div>
    </div>
  )
}
