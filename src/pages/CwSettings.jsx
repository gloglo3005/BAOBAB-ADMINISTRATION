import { useState } from 'react'
import { get, patch } from '../api'
import { useOrg } from '../org'
import { ErrorBox, Field, Loading, PageHeader, useAction, useFetch } from '../ui'

const DAYS = [['mon', 'Lundi'], ['tue', 'Mardi'], ['wed', 'Mercredi'], ['thu', 'Jeudi'], ['fri', 'Vendredi'], ['sat', 'Samedi'], ['sun', 'Dimanche']]
const NUMBERS = [
  ['min_booking_minutes', 'Durée minimale d\'une réservation (min)'],
  ['max_booking_minutes', 'Durée maximale d\'une réservation (min)'],
  ['cancellation_deadline_hours', 'Annulation possible jusqu\'à (heures avant)'],
  ['no_show_grace_minutes', 'Tolérance avant « absence » (min)'],
  ['walk_in_buffer_minutes', 'Marge avant une réservation suivante, sans réservation (min)'],
  ['check_in_early_minutes', 'Arrivée possible avant l\'heure (min)'],
  ['max_upcoming_reservations', 'Réservations à venir par lecteur (0 = illimité)'],
]

function Form({ profile, onSaved }) {
  const { path } = useOrg()
  const hours = profile.opening_hours || {}
  const [f, setF] = useState(() => ({
    public_description: profile.public_description || '',
    booking_enabled: !!profile.booking_enabled,
    walk_in_enabled: !!profile.walk_in_enabled,
    ...Object.fromEntries(NUMBERS.map(([k]) => [k, profile[k] ?? 0])),
  }))
  const [limit, setLimit] = useState(Object.keys(hours).length > 0)
  const [days, setDays] = useState(() => Object.fromEntries(DAYS.map(([k]) => {
    const h = hours[k]
    return [k, h ? { open: true, from: h[0], to: h[1] } : { open: false, from: '08:00', to: '18:00' }]
  })))
  const [saved, setSaved] = useState(false)
  const { busy, error, run } = useAction()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const setDay = (k, part) => (e) => setDays({ ...days, [k]: { ...days[k], [part]: part === 'open' ? e.target.checked : e.target.value } })

  const submit = async (e) => {
    e.preventDefault()
    setSaved(false)
    const opening_hours = limit ? Object.fromEntries(DAYS.map(([k]) => [k, days[k].open ? [days[k].from, days[k].to] : null])) : {}
    const body = { ...f, opening_hours }
    NUMBERS.forEach(([k]) => { body[k] = Number(f[k]) })
    const res = await run(() => patch(path('/coworking/profile/'), body))
    if (res) { setSaved(true); onSaved() }
  }
  return (
    <form className="card" onSubmit={submit} style={{ maxWidth: 760 }}>
      <ErrorBox>{error}</ErrorBox>
      {saved && <div className="alert alert-ok">Réglages enregistrés.</div>}
      <Field label="Présentation du lieu"><textarea rows={3} value={f.public_description} onChange={set('public_description')} /></Field>
      <div className="form-grid">
        <label className="check field"><input type="checkbox" checked={f.booking_enabled} onChange={set('booking_enabled')} /> Réservation à l'avance</label>
        <label className="check field"><input type="checkbox" checked={f.walk_in_enabled} onChange={set('walk_in_enabled')} /> Accueil sans réservation</label>
      </div>
      <div className="form-grid">
        {NUMBERS.map(([k, text]) => <Field key={k} label={text}><input type="number" min="0" required value={f[k]} onChange={set(k)} /></Field>)}
      </div>
      <h2 style={{ marginTop: '1rem' }}>Horaires d'ouverture</h2>
      <label className="check field"><input type="checkbox" checked={limit} onChange={(e) => setLimit(e.target.checked)} /> Limiter les réservations à ces horaires (sinon : aucune limite)</label>
      {limit && DAYS.map(([k, text]) => (
        <div key={k} className="toolbar" style={{ alignItems: 'center' }}>
          <label className="check" style={{ minWidth: 130 }}><input type="checkbox" checked={days[k].open} onChange={setDay(k, 'open')} /> {text}</label>
          {days[k].open ? (<><input type="time" value={days[k].from} onChange={setDay(k, 'from')} /> → <input type="time" value={days[k].to} onChange={setDay(k, 'to')} /></>) : <span className="muted">Fermé</span>}
        </div>
      ))}
      <div className="form-actions"><button className="btn" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
    </form>
  )
}

export default function CwSettings() {
  const { org, path } = useOrg()
  const { data, loading, error, reload } = useFetch(() => get(path('/coworking/profile/')), [org.id])
  return (
    <>
      <PageHeader title="Réglages du coworking" subtitle="Règles de réservation, d'annulation et horaires" />
      {loading && <Loading />}
      <ErrorBox>{error}</ErrorBox>
      {data && <Form key={JSON.stringify(data)} profile={data} onSaved={reload} />}
    </>
  )
}
