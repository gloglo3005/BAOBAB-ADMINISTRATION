import { useState } from 'react'
import { get, post } from '../api'
import { useOrg } from '../org'
import { ErrorBox, Field, Modal, Picker, dateTime, label, money, rows, useAction, useFetch } from '../ui'

export const METHODS = ['CASH', 'MOBILE_MONEY', 'BANK', 'OTHER']

// Sélecteurs de clients et de ressources (recherche avec liste).
export function usePickers(path) {
  return {
    customers: async (q) => rows(await get(path('/coworking/customers/'), { q, status: 'ACTIVE' })).map((c) => ({ id: c.id, label: `${c.customer_number} · ${c.first_name} ${c.last_name}` })),
    resources: async (q) => rows(await get(path('/coworking/resources/'), { q, active: 'true' })).map((x) => ({ id: x.id, label: `${x.code} · ${x.name}` })),
  }
}

// ISO (UTC) -> valeur d'un <input type="datetime-local">.
export const isoToLocal = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// Paiement : seul, ou rattaché à une réservation ou à une session (le solde s'en trouve mis à jour).
// initial = { customer: {id, label}, link: 'reservation:12' | 'session:3', amount }
export function NewPayment({ initial = {}, onDone, onClose }) {
  const { path } = useOrg()
  const pick = usePickers(path)
  const [customer, setCustomer] = useState(initial.customer || null)
  const [link, setLink] = useState(initial.link || '')
  const [amount, setAmount] = useState(initial.amount ? String(initial.amount) : '')
  const [method, setMethod] = useState('CASH')
  const [note, setNote] = useState('')
  const { busy, error, run } = useAction()

  // Ce que le client doit encore : réservations et sessions terminées avec un solde positif.
  const items = useFetch(async () => {
    if (!customer) return []
    const [res, ses] = await Promise.all([
      get(path('/coworking/reservations/'), { customer: customer.id, page_size: 50 }),
      get(path('/coworking/sessions/'), { customer: customer.id, page_size: 50 }),
    ])
    return [
      ...rows(res).filter((r) => r.status !== 'CANCELLED' && r.balance > 0).map((r) => ({
        key: `reservation:${r.id}`, balance: r.balance,
        text: `Réservation ${r.resource_code} · ${dateTime(r.starts_at)} · reste ${money(r.balance, r.currency)}`,
      })),
      ...rows(ses).filter((s) => s.balance > 0).map((s) => ({
        key: `session:${s.id}`, balance: s.balance,
        text: `Session ${s.resource_code} · ${dateTime(s.checked_in_at)} · reste ${money(s.balance, s.currency)}`,
      })),
    ]
  }, [customer?.id])

  const changeCustomer = (c) => { setCustomer(c); setLink(''); setAmount('') }
  const choose = (key) => {
    setLink(key)
    const it = (items.data || []).find((i) => i.key === key)
    if (it) setAmount(String(it.balance))
  }
  const submit = async (e) => {
    e.preventDefault()
    const [kind, id] = link ? link.split(':') : []
    const ok = await run(() => post(path('/coworking/payments/'), {
      customer: String(customer.id), amount: Number(amount), method, note,
      reservation: kind === 'reservation' ? id : null,
      session: kind === 'session' ? id : null,
    }))
    if (ok) onDone()
  }
  return (
    <Modal title="Enregistrer un paiement" onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <Picker label="Client" fetcher={pick.customers} value={customer} onChange={changeCustomer} />
        {customer && (
          <Field label="Rattacher à" hint={items.loading ? 'Chargement…' : 'Rattacher le paiement met à jour le solde de la réservation ou de la session.'}>
            <select value={link} onChange={(e) => choose(e.target.value)}>
              <option value="">Aucun (paiement libre)</option>
              {(items.data || []).map((i) => <option key={i.key} value={i.key}>{i.text}</option>)}
            </select>
          </Field>
        )}
        <div className="form-grid">
          <Field label="Montant (FCFA)"><input type="number" min="1" required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Moyen"><select value={method} onChange={(e) => setMethod(e.target.value)}>{METHODS.map((m) => <option key={m} value={m}>{label(m)}</option>)}</select></Field>
        </div>
        <Field label="Note"><input maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button><button className="btn" disabled={busy || !customer}>Enregistrer</button></div>
      </form>
    </Modal>
  )
}

// Petite fenêtre de modification : fields = [{ name, label, type?, options?, number? }], onSave(body) renvoie la ressource enregistrée.
export function EditModal({ title, fields, initial, onSave, onDone, onClose }) {
  const [f, setF] = useState(() => Object.fromEntries(fields.map((x) => [x.name, initial[x.name] ?? ''])))
  const { busy, error, run } = useAction()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    const body = {}
    fields.forEach((x) => { body[x.name] = x.type === 'number' || x.number ? Number(f[x.name]) : f[x.name] })
    const saved = await run(() => onSave(body))
    if (saved) onDone()
  }
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <div className="form-grid">
          {fields.map((x) => (
            <Field key={x.name} label={x.label}>
              {x.options ? (
                <select value={f[x.name]} onChange={set(x.name)}>{x.options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
              ) : x.type === 'textarea' ? (
                <textarea rows={3} value={f[x.name]} onChange={set(x.name)} />
              ) : (
                <input type={x.type || 'text'} required={x.required} min={x.type === 'number' ? 1 : undefined} value={f[x.name]} onChange={set(x.name)} />
              )}
            </Field>
          ))}
        </div>
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button><button className="btn" disabled={busy}>Enregistrer</button></div>
      </form>
    </Modal>
  )
}
