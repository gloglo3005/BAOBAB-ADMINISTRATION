import { useState } from 'react'
import { get, post } from '../api'
import { useOrg } from '../org'
import { Badge, Empty, ErrorBox, Field, Loading, Modal, PageHeader, Pager, rows, useAction, useFetch } from '../ui'

export default function CwCustomers() {
  const { org, path } = useOrg()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState({ first_name: '', last_name: '', phone: '', email: '' })
  const action = useAction()
  const { data, loading, error, reload } = useFetch(() => get(path('/coworking/customers/'), { q, page }), [org.id, q, page])
  const list = rows(data)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    const ok = await action.run(() => post(path('/coworking/customers/'), f))
    if (ok) { setCreating(false); setF({ first_name: '', last_name: '', phone: '', email: '' }); reload() }
  }
  return (
    <>
      <PageHeader title="Clients" subtitle="Clients du coworking"><button className="btn" onClick={() => setCreating(true)}>+ Nouveau client</button></PageHeader>
      <div className="toolbar"><input type="search" placeholder="Nom, numéro, téléphone, email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} /></div>
      <ErrorBox>{error}</ErrorBox>
      {loading && <Loading />}
      {data && (list.length === 0 ? <Empty /> : (
        <div className="table-wrap"><table>
          <thead><tr><th>N°</th><th>Nom</th><th>Téléphone</th><th>Email</th><th>Statut</th></tr></thead>
          <tbody>{list.map((c) => (
            <tr key={c.id}><td>{c.customer_number}</td><td><strong>{c.first_name} {c.last_name}</strong></td><td>{c.phone || '—'}</td><td>{c.email || '—'}</td><td><Badge value={c.status} /></td></tr>
          ))}</tbody>
        </table></div>
      ))}
      <Pager page={page} count={data?.count || 0} onPage={setPage} />
      {creating && (
        <Modal title="Nouveau client" onClose={() => setCreating(false)}>
          <form onSubmit={submit}>
            <ErrorBox>{action.error}</ErrorBox>
            <div className="form-grid">
              <Field label="Prénom"><input required value={f.first_name} onChange={set('first_name')} /></Field>
              <Field label="Nom"><input required value={f.last_name} onChange={set('last_name')} /></Field>
              <Field label="Téléphone"><input value={f.phone} onChange={set('phone')} /></Field>
              <Field label="Email"><input type="email" value={f.email} onChange={set('email')} /></Field>
            </div>
            <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>Annuler</button><button className="btn" disabled={action.busy}>Créer</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
