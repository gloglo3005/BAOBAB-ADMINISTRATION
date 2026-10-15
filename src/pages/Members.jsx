import { useState } from 'react'
import { get, post } from '../api'
import { useOrg } from '../org'
import { Badge, Empty, ErrorBox, Field, Loading, Modal, PageHeader, Pager, dateOnly, rows, useAction, useFetch } from '../ui'

const STATUSES = ['PENDING', 'ACCEPTED', 'SUSPENDED', 'REJECTED']
const ACTIONS = {
  PENDING: [['accept', 'Accepter'], ['reject', 'Refuser']],
  REJECTED: [['accept', 'Accepter']],
  ACCEPTED: [['suspend', 'Suspendre']],
  SUSPENDED: [['reactivate', 'Réactiver']],
}

function NewMember({ onDone, onClose }) {
  const { path } = useOrg()
  const [f, setF] = useState({ first_name: '', last_name: '', phone: '', member_number: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const { busy, error, run } = useAction()
  const submit = async (e) => {
    e.preventDefault()
    const ok = await run(() => post(path('/members/'), f))
    if (ok) onDone()
  }
  return (
    <Modal title="Inscrire un membre" onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <div className="form-grid">
          <Field label="Prénom"><input required value={f.first_name} onChange={set('first_name')} /></Field>
          <Field label="Nom"><input required value={f.last_name} onChange={set('last_name')} /></Field>
        </div>
        <Field label="Téléphone"><input value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Numéro de membre" hint="Laisser vide pour une numérotation automatique"><input value={f.member_number} onChange={set('member_number')} /></Field>
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button><button className="btn" disabled={busy}>Inscrire</button></div>
      </form>
    </Modal>
  )
}

export default function Members() {
  const { org, path } = useOrg()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [code, setCode] = useState(null)
  const action = useAction()
  const { data, loading, error, reload } = useFetch(() => get(path('/members/'), { q, status, page }), [org.id, q, status, page])
  const members = rows(data)

  const act = async (m, name) => {
    const ok = await action.run(() => post(path(`/members/${m.id}/${name}/`)))
    if (ok) reload()
  }
  const linkCode = async (m) => {
    const res = await action.run(() => post(path(`/members/${m.id}/link-code/`)))
    if (res) setCode({ ...res, name: `${m.first_name} ${m.last_name}` })
  }

  return (
    <>
      <PageHeader title="Membres" subtitle="Lecteurs inscrits à la bibliothèque">
        <button className="btn" onClick={() => setCreating(true)}>+ Inscrire</button>
      </PageHeader>
      <div className="toolbar">
        <input type="search" placeholder="Nom, numéro, téléphone…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Tous statuts</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'PENDING' ? 'En attente' : s === 'ACCEPTED' ? 'Acceptés' : s === 'SUSPENDED' ? 'Suspendus' : 'Refusés'}</option>)}
        </select>
      </div>
      <ErrorBox>{action.error || error}</ErrorBox>
      {loading && <Loading />}
      {data && (members.length === 0 ? <Empty /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>N°</th><th>Nom</th><th>Téléphone</th><th>Inscrit le</th><th>Prêts</th><th>Statut</th><th /></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.member_number}</td>
                  <td><strong>{m.first_name} {m.last_name}</strong></td>
                  <td>{m.phone || '—'}</td>
                  <td>{dateOnly(m.joined_at)}</td>
                  <td>{m.active_loans}</td>
                  <td><Badge value={m.status} /></td>
                  <td className="actions">
                    {(ACTIONS[m.status] || []).map(([name, text]) => (
                      <button key={name} className="btn btn-ghost btn-sm" disabled={action.busy} onClick={() => act(m, name)}>{text}</button>
                    ))}{' '}
                    <button className="btn btn-ghost btn-sm" disabled={action.busy} onClick={() => linkCode(m)}>Code de liaison</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <Pager page={page} count={data?.count || 0} onPage={setPage} />
      {creating && <NewMember onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload() }} />}
      {code && (
        <Modal title="Code de rattachement" onClose={() => setCode(null)}>
          <p>Pour <strong>{code.name}</strong>. À saisir par le lecteur dans l'application (usage unique).</p>
          <div className="code-box">{code.code}</div>
          <p className="muted">Valable jusqu'au {new Date(code.expires_at).toLocaleString('fr-FR')}.</p>
        </Modal>
      )}
    </>
  )
}
