import { useState } from 'react'
import { get, post } from '../api'
import { useOrg } from '../org'
import { Badge, Empty, ErrorBox, Field, Loading, Modal, PageHeader, Pager, dateTime, label, money, rows, useAction, useFetch } from '../ui'
import { NewPayment } from './CwShared'

export default function CwPayments() {
  const { org, path } = useOrg()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [voiding, setVoiding] = useState(null)
  const [reason, setReason] = useState('')
  const action = useAction()
  const { data, loading, error, reload } = useFetch(() => get(path('/coworking/payments/'), { status, page }), [org.id, status, page])
  const list = rows(data)
  const voidPayment = async (e) => {
    e.preventDefault()
    if (await action.run(() => post(path(`/coworking/payments/${voiding.id}/void/`), { reason }))) { setVoiding(null); setReason(''); reload() }
  }
  return (
    <>
      <PageHeader title="Paiements"><button className="btn" onClick={() => setCreating(true)}>+ Paiement</button></PageHeader>
      <div className="toolbar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Tous</option><option value="RECORDED">Enregistrés</option><option value="VOIDED">Annulés</option>
        </select>
      </div>
      <ErrorBox>{error}</ErrorBox>
      {loading && <Loading />}
      {data && (list.length === 0 ? <Empty /> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Reçu</th><th>Client</th><th>Montant</th><th>Moyen</th><th>Date</th><th>Rattaché à</th><th>Statut</th><th /></tr></thead>
          <tbody>{list.map((p) => (
            <tr key={p.id}>
              <td>{p.receipt_number}</td><td>{p.customer_number}</td><td><strong>{money(p.amount, p.currency)}</strong></td>
              <td>{label(p.method)}</td><td>{dateTime(p.paid_at)}</td><td>{p.reservation ? `Réservation n° ${p.reservation}` : p.session ? `Session n° ${p.session}` : '—'}</td><td><Badge value={p.status} /></td>
              <td className="actions">{p.status === 'RECORDED' && <button className="btn btn-ghost btn-sm" onClick={() => setVoiding(p)}>Annuler</button>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      ))}
      <Pager page={page} count={data?.count || 0} onPage={setPage} />
      {creating && <NewPayment onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload() }} />}
      {voiding && (
        <Modal title={`Annuler le reçu ${voiding.receipt_number}`} onClose={() => setVoiding(null)}>
          <form onSubmit={voidPayment}>
            <ErrorBox>{action.error}</ErrorBox>
            <Field label="Motif (obligatoire)"><input required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
            <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setVoiding(null)}>Retour</button><button className="btn btn-danger" disabled={action.busy}>Annuler le paiement</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
