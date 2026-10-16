import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get, patch, post } from '../api'
import { ErrorBox, Field, Loading, PageHeader, useAction, useFetch } from '../ui'
import { OrgStatus, TeamPanel } from './AdminShared'

const FIELDS = [['name', 'Nom'], ['city', 'Ville'], ['country', 'Pays'], ['address', 'Adresse'], ['phone', 'Téléphone'], ['email', 'Email'], ['website', 'Site web']]
const NEXT = {
  PENDING: [['ACTIVE', 'Valider', 'btn'], ['REJECTED', 'Refuser', 'btn btn-ghost']],
  ACTIVE: [['SUSPENDED', 'Suspendre', 'btn btn-ghost']],
  SUSPENDED: [['ACTIVE', 'Réactiver', 'btn']],
  REJECTED: [['PENDING', 'Remettre en attente', 'btn btn-ghost']],
}

function InfoForm({ org, onSaved }) {
  const [f, setF] = useState(() => ({ ...Object.fromEntries(FIELDS.map(([k]) => [k, org[k] || ''])), description: org.description || '', library_module: org.library_module, coworking_module: org.coworking_module }))
  const [saved, setSaved] = useState(false)
  const { busy, error, run } = useAction()
  const set = (k) => (e) => { setSaved(false); setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }) }
  const submit = async (e) => {
    e.preventDefault()
    if (await run(() => patch(`/platform/organizations/${org.id}/`, f))) { setSaved(true); onSaved() }
  }
  return (
    <form className="card" onSubmit={submit}>
      <h2>Informations et modules</h2>
      <ErrorBox>{error}</ErrorBox>
      {saved && <div className="alert alert-ok">Enregistré.</div>}
      <div className="form-grid">{FIELDS.map(([k, text]) => <Field key={k} label={text}><input required={k === 'name'} value={f[k]} onChange={set(k)} /></Field>)}</div>
      <Field label="Description"><textarea rows={3} value={f.description} onChange={set('description')} /></Field>
      <label className="check field"><input type="checkbox" checked={f.library_module} onChange={set('library_module')} /> Module bibliothèque</label>
      <label className="check field"><input type="checkbox" checked={f.coworking_module} onChange={set('coworking_module')} /> Module coworking</label>
      <div className="form-actions"><button className="btn" disabled={busy}>Enregistrer</button></div>
    </form>
  )
}

export default function PlatformOrg() {
  const { id } = useParams()
  const { data: org, loading, error, reload } = useFetch(() => get(`/platform/organizations/${id}/`), [id])
  const action = useAction()
  const setStatus = async (status, text) => {
    if (window.confirm(`${text} cette structure ?`) && (await action.run(() => post(`/platform/organizations/${id}/status/`, { status })))) reload()
  }
  if (loading && !org) return <Loading />
  if (error) return <ErrorBox>{error}</ErrorBox>
  return (
    <>
      <PageHeader title={org.name} subtitle={`Identifiant : ${org.slug}`}>
        <OrgStatus value={org.status} />
        {(NEXT[org.status] || []).map(([s, text, cls]) => <button key={s} className={cls} disabled={action.busy} onClick={() => setStatus(s, text)}>{text}</button>)}
        <Link className="btn btn-ghost" to="/platform">← Structures</Link>
      </PageHeader>
      <ErrorBox>{action.error}</ErrorBox>
      {org.status === 'ACTIVE' && org.admin_count === 0 && <div className="alert alert-info">Cette structure n'a pas encore de responsable : créez son compte ci-dessous. C'est lui qui créera ensuite les comptes des agents.</div>}
      {org.status !== 'ACTIVE' && <div className="alert alert-info">Structure non active : son personnel ne peut pas s'y connecter.</div>}
      <InfoForm key={org.updated_at || org.id} org={org} onSaved={reload} />
      <div className="section"><TeamPanel base={`/platform/organizations/${org.id}/staff/`} platform /></div>
      <p><Link to={`/platform/audit?organization=${org.id}`} className="muted">Voir le journal de cette structure</Link></p>
    </>
  )
}
