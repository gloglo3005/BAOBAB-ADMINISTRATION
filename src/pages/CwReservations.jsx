import { useState } from 'react'
import { get, post } from '../api'
import { useOrg } from '../org'
import { Badge, Empty, ErrorBox, Field, Loading, Modal, PageHeader, Pager, Picker, dateTime, localToIso, money, rows, useAction, useFetch } from '../ui'

export function usePickers(path) {
  return {
    customers: async (q) => rows(await get(path('/coworking/customers/'), { q, status: 'ACTIVE' })).map((c) => ({ id: c.id, label: `${c.customer_number} · ${c.first_name} ${c.last_name}` })),
    resources: async (q) => rows(await get(path('/coworking/resources/'), { q, active: 'true' })).map((x) => ({ id: x.id, label: `${x.code} · ${x.name}` })),
  }
}

function NewReservation({ onDone, onClose }) {
  const { path } = useOrg()
  const pick = usePickers(path)
  const [customer, setCustomer] = useState(null)
  const [resource, setResource] = useState(null)
  const [starts, setStarts] = useState('')
  const [ends, setEnds] = useState('')
  const [notes, setNotes] = useState('')
  const { busy, error, run } = useAction()
  const submit = async (e) => {
    e.preventDefault()
    const ok = await run(() => post(path('/coworking/reservations/'), {
      customer: String(customer.id), resource: String(resource.id), starts_at: localToIso(starts), ends_at: localToIso(ends), notes,
    }))
    if (ok) onDone()
  }
  return (
    <Modal title="Nouvelle réservation" onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <Picker label="Client" fetcher={pick.customers} value={customer} onChange={setCustomer} />
        <Picker label="Ressource" fetcher={pick.resources} value={resource} onChange={setResource} />
        <div className="form-grid">
          <Field label="Début"><input type="datetime-local" required value={starts} onChange={(e) => setStarts(e.target.value)} /></Field>
          <Field label="Fin"><input type="datetime-local" required value={ends} onChange={(e) => setEnds(e.target.value)} /></Field>
        </div>
        <Field label="Note"><input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button><button className="btn" disabled={busy || !customer || !resource}>Réserver</button></div>
      </form>
    </Modal>
  )
}

export default function CwReservations() {
  const { org, path } = useOrg()
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [cancelling, setCancelling] = useState(null)
  const [reason, setReason] = useState('')
  const action = useAction()
  const { data, loading, error, reload } = useFetch(() => get(path('/coworking/reservations/'), { status, date, page }), [org.id, status, date, page])
  const list = rows(data)

  const noShow = async (r) => { if (await action.run(() => post(path(`/coworking/reservations/${r.id}/no-show/`)))) reload() }
  const cancel = async (e) => {
    e.preventDefault()
    if (await action.run(() => post(path(`/coworking/reservations/${cancelling.id}/cancel/`), { reason }))) { setCancelling(null); setReason(''); reload() }
  }
  return (
    <>
      <PageHeader title="Réservations"><button className="btn" onClick={() => setCreating(true)}>+ Réserver</button></PageHeader>
      <div className="toolbar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Tous statuts</option><option value="CONFIRMED">Confirmées</option><option value="COMPLETED">Terminées</option><option value="CANCELLED">Annulées</option><option value="NO_SHOW">Absences</option>
        </select>
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1) }} />
      </div>
      <ErrorBox>{action.error || error}</ErrorBox>
      {loading && <Loading />}
      {data && (list.length === 0 ? <Empty /> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Client</th><th>Ressource</th><th>Début</th><th>Fin</th><th>Montant</th><th>Statut</th><th /></tr></thead>
          <tbody>{list.map((r) => (
            <tr key={r.id}>
              <td><strong>{r.customer_name}</strong></td><td>{r.resource_code} · {r.resource_name}</td>
              <td>{dateTime(r.starts_at)}</td><td>{dateTime(r.ends_at)}</td>
              <td>{money(r.quoted_amount, r.currency)}<div className="muted">payé {money(r.amount_paid, r.currency)}</div></td>
              <td><Badge value={r.status} /></td>
              <td className="actions">{r.status === 'CONFIRMED' && (<>
                <button className="btn btn-ghost btn-sm" disabled={action.busy} onClick={() => noShow(r)}>Absent</button>{' '}
                <button className="btn btn-ghost btn-sm" onClick={() => setCancelling(r)}>Annuler</button>
              </>)}</td>
            </tr>
          ))}</tbody>
        </table></div>
      ))}
      <Pager page={page} count={data?.count || 0} onPage={setPage} />
      {creating && <NewReservation onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload() }} />}
      {cancelling && (
        <Modal title="Annuler la réservation" onClose={() => setCancelling(null)}>
          <form onSubmit={cancel}>
            <ErrorBox>{action.error}</ErrorBox>
            <Field label="Motif (facultatif)"><input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
            <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setCancelling(null)}>Retour</button><button className="btn btn-danger" disabled={action.busy}>Annuler la réservation</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
