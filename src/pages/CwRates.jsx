import { useState } from 'react'
import { get, patch, post } from '../api'
import { useOrg } from '../org'
import { Badge, Empty, ErrorBox, Field, Loading, Modal, PageHeader, dateOnly, label, money, rows, useAction, useFetch } from '../ui'

const UNITS = [['HOUR', 'Heure'], ['HALF_DAY', 'Demi-journée (4 h)'], ['DAY', 'Journée (8 h)']]
const TYPES = ['DESK', 'ROOM', 'OTHER']
const unitLabel = (u) => UNITS.find(([v]) => v === u)?.[1] || u

function RateForm({ initial, resources, onDone, onClose }) {
  const { path } = useOrg()
  const [scope, setScope] = useState(initial?.resource ? 'resource' : 'type')
  const [resource, setResource] = useState(initial?.resource ?? resources[0]?.id ?? '')
  const [type, setType] = useState(initial?.resource_type || 'DESK')
  const [unit, setUnit] = useState(initial?.unit || 'HOUR')
  const [amount, setAmount] = useState(initial?.amount ?? '')
  const [from, setFrom] = useState(initial?.valid_from || '')
  const [until, setUntil] = useState(initial?.valid_until || '')
  const { busy, error, run } = useAction()
  const submit = async (e) => {
    e.preventDefault()
    const body = {
      resource: scope === 'resource' ? Number(resource) : null,
      resource_type: scope === 'type' ? type : '',
      unit, amount: Number(amount), valid_from: from || null, valid_until: until || null,
    }
    const ok = await run(() => (initial ? patch(path(`/coworking/rates/${initial.id}/`), body) : post(path('/coworking/rates/'), body)))
    if (ok) onDone()
  }
  return (
    <Modal title={initial ? 'Modifier le tarif' : 'Nouveau tarif'} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <Field label="S'applique à" hint="Un tarif de ressource précise l'emporte sur le tarif de son type.">
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="type">Tout un type de ressource</option>
            <option value="resource" disabled={resources.length === 0}>Une ressource précise</option>
          </select>
        </Field>
        {scope === 'type' ? (
          <Field label="Type"><select value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select></Field>
        ) : (
          <Field label="Ressource"><select value={resource} onChange={(e) => setResource(e.target.value)}>{resources.map((r) => <option key={r.id} value={r.id}>{r.code} · {r.name}</option>)}</select></Field>
        )}
        <div className="form-grid">
          <Field label="Unité"><select value={unit} onChange={(e) => setUnit(e.target.value)}>{UNITS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></Field>
          <Field label="Montant (FCFA)"><input type="number" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Valable à partir du"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="Valable jusqu'au"><input type="date" value={until} onChange={(e) => setUntil(e.target.value)} /></Field>
        </div>
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button><button className="btn" disabled={busy}>Enregistrer</button></div>
      </form>
    </Modal>
  )
}

export default function CwRates() {
  const { org, path } = useOrg()
  const [form, setForm] = useState(null) // null | { initial }
  const action = useAction()
  const rates = useFetch(() => get(path('/coworking/rates/'), { page_size: 100 }), [org.id])
  const resources = useFetch(() => get(path('/coworking/resources/'), { page_size: 100, active: 'true' }), [org.id])
  const resList = rows(resources.data)
  const nameOf = (id) => { const r = rows(resources.data).find((x) => x.id === id); return r ? `${r.code} · ${r.name}` : `Ressource n° ${id}` }
  const toggle = async (r) => { if (await action.run(() => patch(path(`/coworking/rates/${r.id}/`), { active: !r.active }))) rates.reload() }
  const list = rows(rates.data)
  return (
    <>
      <PageHeader title="Tarifs" subtitle="Prix des ressources : sans tarif, les montants des réservations et des sessions ne peuvent pas être calculés">
        <button className="btn" onClick={() => setForm({ initial: null })}>+ Tarif</button>
      </PageHeader>
      <ErrorBox>{action.error || rates.error}</ErrorBox>
      {rates.loading && <Loading />}
      {rates.data && (list.length === 0 ? <Empty>Aucun tarif. Ajoutez au moins un tarif par type de ressource.</Empty> : (
        <div className="table-wrap"><table>
          <thead><tr><th>S'applique à</th><th>Unité</th><th>Montant</th><th>Validité</th><th>Statut</th><th /></tr></thead>
          <tbody>{list.map((r) => (
            <tr key={r.id}>
              <td><strong>{r.resource ? nameOf(r.resource) : `Type : ${label(r.resource_type)}`}</strong></td>
              <td>{unitLabel(r.unit)}</td><td>{money(r.amount, r.currency)}</td>
              <td>{r.valid_from || r.valid_until ? `${r.valid_from ? dateOnly(r.valid_from) : '…'} → ${r.valid_until ? dateOnly(r.valid_until) : '…'}` : 'Toujours'}</td>
              <td>{r.active ? <Badge value="ACTIVE" /> : <Badge value="inactif" tone="neutral" />}</td>
              <td className="actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setForm({ initial: r })}>Modifier</button>{' '}
                <button className="btn btn-ghost btn-sm" disabled={action.busy} onClick={() => toggle(r)}>{r.active ? 'Désactiver' : 'Activer'}</button>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      ))}
      {form && <RateForm initial={form.initial} resources={resList} onClose={() => setForm(null)} onDone={() => { setForm(null); rates.reload() }} />}
    </>
  )
}
