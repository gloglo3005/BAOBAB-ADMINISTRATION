import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get, post } from '../api'
import { useAuth } from '../auth'
import { Empty, ErrorBox, Field, Loading, Modal, PageHeader, Pager, rows, useAction, useDebounced, useFetch } from '../ui'
import { OrgStatus, ORG_STATUS_LABEL } from './AdminShared'

function NewOrganization({ onClose }) {
  const navigate = useNavigate()
  const [f, setF] = useState({ name: '', city: '', country: 'Togo', phone: '', email: '', library_module: true, coworking_module: false })
  const { busy, error, run } = useAction()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    const org = await run(() => post('/platform/organizations/', f))
    if (org) navigate(`/platform/organizations/${org.id}`)
  }
  return (
    <Modal title="Nouvelle structure" onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <div className="form-grid">
          <Field label="Nom"><input required value={f.name} onChange={set('name')} /></Field>
          <Field label="Ville"><input value={f.city} onChange={set('city')} /></Field>
          <Field label="Pays"><input value={f.country} onChange={set('country')} /></Field>
          <Field label="Téléphone"><input value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Email"><input type="email" value={f.email} onChange={set('email')} /></Field>
        </div>
        <label className="check field"><input type="checkbox" checked={f.library_module} onChange={set('library_module')} /> Module bibliothèque</label>
        <label className="check field"><input type="checkbox" checked={f.coworking_module} onChange={set('coworking_module')} /> Module coworking</label>
        <p className="muted">Étape suivante : créer le compte du responsable de la structure.</p>
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button><button className="btn" disabled={busy}>Créer la structure</button></div>
      </form>
    </Modal>
  )
}

export default function Platform() {
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [module, setModule] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const dq = useDebounced(q)
  const dash = useFetch(() => get('/platform/dashboard/'), [])
  const orgs = useFetch(() => get('/platform/organizations/', { q: dq, status, module, page }), [dq, status, module, page])
  const list = rows(orgs.data)
  const reset = (setter) => (e) => { setter(e.target.value); setPage(1) }
  const d = dash.data?.organizations
  return (
    <>
      <PageHeader title="Administration globale" subtitle={`Connecté en tant que ${user.email}`}>
        <Link className="btn btn-ghost" to="/platform/audit">Journal d'audit</Link>
        <button className="btn" onClick={() => setCreating(true)}>+ Structure</button>
      </PageHeader>
      <ErrorBox>{dash.error}</ErrorBox>
      {d && (
        <div className="cards">
          {[['Structures', d.total], ['Actives', d.active], ['En attente', d.pending], ['Suspendues', d.suspended], ['Avec bibliothèque', d.with_library], ['Avec coworking', d.with_coworking]].map(([t, n]) => (
            <div key={t} className="card stat"><div className="num">{n}</div><div className="lbl">{t}</div></div>
          ))}
        </div>
      )}
      {dash.data?.without_admin.length > 0 && (
        <div className="alert alert-info" style={{ marginTop: '1rem' }}>
          Structures actives sans responsable :{' '}
          {dash.data.without_admin.map((o, i) => <span key={o.id}>{i > 0 && ', '}<Link to={`/platform/organizations/${o.id}`}>{o.name}</Link></span>)}.
        </div>
      )}
      <div className="toolbar" style={{ marginTop: '1rem' }}>
        <input type="search" placeholder="Nom, ville ou identifiant…" value={q} onChange={reset(setQ)} />
        <select value={status} onChange={reset(setStatus)}><option value="">Tous les statuts</option>{['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'].map((s) => <option key={s} value={s}>{ORG_STATUS_LABEL(s)}</option>)}</select>
        <select value={module} onChange={reset(setModule)}><option value="">Tous les modules</option><option value="LIBRARY">Bibliothèque</option><option value="COWORKING">Coworking</option></select>
      </div>
      <ErrorBox>{orgs.error}</ErrorBox>
      {orgs.loading && <Loading />}
      {orgs.data && (list.length === 0 ? <Empty>Aucune structure.</Empty> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Structure</th><th>Modules</th><th>Équipe</th><th>Statut</th></tr></thead>
          <tbody>{list.map((o) => (
            <tr key={o.id}>
              <td><Link to={`/platform/organizations/${o.id}`}><strong>{o.name}</strong></Link><div className="muted">{[o.city, o.country].filter(Boolean).join(', ')}</div></td>
              <td>{o.library_module && 'Bibliothèque'}{o.library_module && o.coworking_module && ' · '}{o.coworking_module && 'Coworking'}</td>
              <td>{o.admin_count} responsable(s) · {o.staff_count - o.admin_count} agent(s){o.admin_count === 0 && o.status === 'ACTIVE' && <div className="muted">⚠ Aucun responsable</div>}</td>
              <td><OrgStatus value={o.status} /></td>
            </tr>
          ))}</tbody>
        </table></div>
      ))}
      <Pager page={page} count={orgs.data?.count || 0} pageSize={25} onPage={setPage} />
      {creating && <NewOrganization onClose={() => setCreating(false)} />}
    </>
  )
}
