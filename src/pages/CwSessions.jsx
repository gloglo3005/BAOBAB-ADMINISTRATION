import { useState } from 'react'
import { get, post } from '../api'
import { useOrg } from '../org'
import { Badge, Empty, ErrorBox, Field, Loading, Modal, PageHeader, Pager, Picker, dateTime, localToIso, money, rows, useAction, useFetch } from '../ui'
import { NewPayment, isoToLocal, usePickers } from './CwShared'

function CheckIn({ onDone, onClose }) {
  const { path } = useOrg()
  const pick = usePickers(path)
  const [customer, setCustomer] = useState(null)
  const [resource, setResource] = useState(null)
  const { busy, error, run } = useAction()
  const submit = async (e) => {
    e.preventDefault()
    const ok = await run(() => post(path('/coworking/sessions/check-in/'), { customer: String(customer.id), resource: String(resource.id) }))
    if (ok) onDone()
  }
  return (
    <Modal title="Enregistrer une arrivée" onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <Picker label="Client" fetcher={pick.customers} value={customer} onChange={setCustomer} />
        <Picker label="Ressource" fetcher={pick.resources} value={resource} onChange={setResource} />
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button><button className="btn" disabled={busy || !customer || !resource}>Arrivée</button></div>
      </form>
    </Modal>
  )
}

// Correction d'une session (heures ou montant) : un motif est obligatoire, la correction est tracée.
function CorrectSession({ session, onDone, onClose }) {
  const { path } = useOrg()
  const [inAt, setInAt] = useState(isoToLocal(session.checked_in_at))
  const [outAt, setOutAt] = useState(isoToLocal(session.checked_out_at))
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const { busy, error, run } = useAction()
  const submit = async (e) => {
    e.preventDefault()
    const ok = await run(() => post(path(`/coworking/sessions/${session.id}/correct/`), {
      reason,
      checked_in_at: inAt && inAt !== isoToLocal(session.checked_in_at) ? localToIso(inAt) : null,
      checked_out_at: outAt && outAt !== isoToLocal(session.checked_out_at) ? localToIso(outAt) : null,
      amount: amount !== '' ? Number(amount) : null,
    }))
    if (ok) onDone()
  }
  return (
    <Modal title={`Corriger la session de ${session.customer_name}`} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <div className="form-grid">
          <Field label="Arrivée"><input type="datetime-local" value={inAt} onChange={(e) => setInAt(e.target.value)} /></Field>
          <Field label="Sortie"><input type="datetime-local" value={outAt} onChange={(e) => setOutAt(e.target.value)} /></Field>
          <Field label="Montant forcé (FCFA)" hint={`Laisser vide pour recalculer. Montant actuel : ${money(session.amount, session.currency)}`}><input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        </div>
        <Field label="Motif (obligatoire)"><input required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button><button className="btn" disabled={busy}>Corriger</button></div>
      </form>
    </Modal>
  )
}

export default function CwSessions() {
  const { org, path } = useOrg()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [paying, setPaying] = useState(null)
  const [correcting, setCorrecting] = useState(null)
  const action = useAction()
  const { data, loading, error, reload } = useFetch(() => get(path('/coworking/sessions/'), { status, page }), [org.id, status, page])
  const list = rows(data)
  const checkOut = async (s) => { if (await action.run(() => post(path(`/coworking/sessions/${s.id}/check-out/`)))) reload() }
  return (
    <>
      <PageHeader title="Arrivées / sorties"><button className="btn" onClick={() => setCreating(true)}>+ Arrivée</button></PageHeader>
      <div className="toolbar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Toutes</option><option value="OPEN">En cours</option><option value="CLOSED">Terminées</option>
        </select>
      </div>
      <ErrorBox>{action.error || error}</ErrorBox>
      {loading && <Loading />}
      {data && (list.length === 0 ? <Empty /> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Client</th><th>Ressource</th><th>Arrivée</th><th>Sortie</th><th>Montant</th><th>Statut</th><th /></tr></thead>
          <tbody>{list.map((s) => (
            <tr key={s.id}>
              <td><strong>{s.customer_name}</strong></td><td>{s.resource_code}</td>
              <td>{dateTime(s.checked_in_at)}</td><td>{dateTime(s.checked_out_at)}</td>
              <td>{s.status === 'OPEN' ? '—' : <>{money(s.amount, s.currency)}<div className="muted">solde {money(s.balance, s.currency)}</div></>}</td>
              <td><Badge value={s.status} /></td>
              <td className="actions">
                {s.status === 'OPEN' && <button className="btn btn-sm" disabled={action.busy} onClick={() => checkOut(s)}>Sortie</button>}
                {s.status === 'CLOSED' && <>
                  {s.balance > 0 && <button className="btn btn-sm" onClick={() => setPaying(s)}>Encaisser</button>}{' '}
                  <button className="btn btn-ghost btn-sm" onClick={() => setCorrecting(s)}>Corriger</button>
                </>}
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      ))}
      <Pager page={page} count={data?.count || 0} onPage={setPage} />
      {paying && <NewPayment initial={{ customer: { id: paying.customer, label: `${paying.customer_number} · ${paying.customer_name}` }, link: `session:${paying.id}`, amount: paying.balance }} onClose={() => setPaying(null)} onDone={() => { setPaying(null); reload() }} />}
      {correcting && <CorrectSession session={correcting} onClose={() => setCorrecting(null)} onDone={() => { setCorrecting(null); reload() }} />}
      {creating && <CheckIn onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload() }} />}
    </>
  )
}
