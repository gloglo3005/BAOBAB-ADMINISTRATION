import { useState } from 'react'
import { get, post } from '../api'
import { useOrg } from '../org'
import { Badge, Empty, ErrorBox, Field, Loading, Modal, PageHeader, Pager, Picker, dateOnly, dateTime, rows, useAction, useFetch } from '../ui'

function NewLoan({ onDone, onClose }) {
  const { path } = useOrg()
  const [copy, setCopy] = useState(null)
  const [member, setMember] = useState(null)
  const [notes, setNotes] = useState('')
  const { busy, error, run } = useAction()

  const findCopies = async (q) => rows(await get(path('/copies/'), { q, status: 'AVAILABLE' })).map((c) => ({ id: c.id, label: `${c.inventory_code} · ${c.book.title}` }))
  const findMembers = async (q) => rows(await get(path('/members/'), { q, status: 'ACCEPTED' })).map((m) => ({ id: m.id, label: `${m.member_number} · ${m.first_name} ${m.last_name}` }))

  const submit = async (e) => {
    e.preventDefault()
    const ok = await run(() => post(path('/loans/'), { book_copy: String(copy.id), member: String(member.id), notes }))
    if (ok) onDone()
  }
  return (
    <Modal title="Enregistrer un prêt" onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <Picker label="Exemplaire disponible" fetcher={findCopies} value={copy} onChange={setCopy} placeholder="Code d'inventaire ou titre" />
        <Picker label="Membre" fetcher={findMembers} value={member} onChange={setMember} placeholder="Nom ou numéro" />
        <Field label="Note"><input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button><button className="btn" disabled={busy || !copy || !member}>Enregistrer le prêt</button></div>
      </form>
    </Modal>
  )
}

function ReturnLoan({ loan, onDone, onClose }) {
  const { path } = useOrg()
  const [outcome, setOutcome] = useState('GOOD')
  const [notes, setNotes] = useState('')
  const { busy, error, run } = useAction()
  const submit = async (e) => {
    e.preventDefault()
    if (outcome === 'LOST' && !window.confirm('Déclarer cet exemplaire perdu ? Le prêt sera clos sans retour.')) return
    const ok = await run(() => post(path(`/loans/${loan.id}/return/`), { outcome, notes }))
    if (ok) onDone()
  }
  return (
    <Modal title={`Retour · ${loan.book_title}`} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <p className="muted">{loan.inventory_code} · {loan.member_name}</p>
        <Field label="État au retour">
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            <option value="GOOD">Bon état</option>
            <option value="DAMAGED">Endommagé</option>
            <option value="LOST">Perdu</option>
          </select>
        </Field>
        <Field label="Note"><input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button><button className="btn" disabled={busy}>Valider le retour</button></div>
      </form>
    </Modal>
  )
}

export default function Loans() {
  const { org, path } = useOrg()
  const [status, setStatus] = useState('ACTIVE')
  const [overdue, setOverdue] = useState(false)
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [returning, setReturning] = useState(null)
  const { data, loading, error, reload } = useFetch(
    () => get(path('/loans/'), { status, overdue: overdue ? 'true' : undefined, page }),
    [org.id, status, overdue, page],
  )
  const loans = rows(data)
  return (
    <>
      <PageHeader title="Prêts" subtitle="Circulation des exemplaires">
        <button className="btn" onClick={() => setCreating(true)}>+ Nouveau prêt</button>
      </PageHeader>
      <div className="toolbar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="ACTIVE">En cours</option>
          <option value="RETURNED">Rendus</option>
          <option value="LOST">Perdus</option>
          <option value="">Tous</option>
        </select>
        <label className="check field" style={{ margin: 0 }}>
          <input type="checkbox" checked={overdue} onChange={(e) => { setOverdue(e.target.checked); setPage(1) }} /> En retard seulement
        </label>
      </div>
      <ErrorBox>{error}</ErrorBox>
      {loading && <Loading />}
      {data && (loans.length === 0 ? <Empty /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Livre</th><th>Exemplaire</th><th>Membre</th><th>Emprunté</th><th>Échéance</th><th>Statut</th><th /></tr></thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.book_title}</strong></td>
                  <td>{l.inventory_code}</td>
                  <td>{l.member_name} <span className="muted">({l.member_number})</span></td>
                  <td>{dateTime(l.borrowed_at)}</td>
                  <td>{dateOnly(l.due_date)}{l.is_overdue && <> <Badge value={`${l.days_overdue} j de retard`} tone="bad" /></>}</td>
                  <td><Badge value={l.status} /></td>
                  <td className="actions">
                    {l.status === 'ACTIVE' && <button className="btn btn-ghost btn-sm" onClick={() => setReturning(l)}>Retour</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <Pager page={page} count={data?.count || 0} onPage={setPage} />
      {creating && <NewLoan onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload() }} />}
      {returning && <ReturnLoan loan={returning} onClose={() => setReturning(null)} onDone={() => { setReturning(null); reload() }} />}
    </>
  )
}
