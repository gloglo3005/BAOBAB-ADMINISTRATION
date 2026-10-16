import { useState } from 'react'
import { get, patch } from '../api'
import { useOrg } from '../org'
import { ErrorBox, Field, Loading, PageHeader, useAction, useFetch } from '../ui'

const INFO = [['address', 'Adresse'], ['city', 'Ville'], ['country', 'Pays'], ['phone', 'Téléphone'], ['email', 'Email'], ['website', 'Site web']]

function InfoCard({ org, url, onSaved }) {
  const [f, setF] = useState(() => ({ description: org.description || '', ...Object.fromEntries(INFO.map(([k]) => [k, org[k] || ''])) }))
  const [saved, setSaved] = useState(false)
  const { busy, error, run } = useAction()
  const set = (k) => (e) => { setSaved(false); setF({ ...f, [k]: e.target.value }) }
  const submit = async (e) => { e.preventDefault(); if (await run(() => patch(url, f))) { setSaved(true); onSaved() } }
  return (
    <form className="card" onSubmit={submit}>
      <h2>Informations de la structure</h2>
      <p className="muted">Le nom, les modules et le statut sont gérés par l'administrateur de la plateforme.</p>
      <ErrorBox>{error}</ErrorBox>
      {saved && <div className="alert alert-ok">Enregistré.</div>}
      <Field label="Description"><textarea rows={3} value={f.description} onChange={set('description')} /></Field>
      <div className="form-grid">{INFO.map(([k, text]) => <Field key={k} label={text}><input value={f[k]} onChange={set(k)} /></Field>)}</div>
      <div className="form-actions"><button className="btn" disabled={busy}>Enregistrer</button></div>
    </form>
  )
}

const POLICY = [['loan_duration_days', 'Durée d\'un prêt (jours)', 1], ['max_active_loans', 'Prêts en cours par membre (maximum)', 1], ['max_renewals', 'Renouvellements (maximum)', 0]]

function PolicyCard({ policy, url, onSaved }) {
  const [f, setF] = useState(() => ({ ...Object.fromEntries(POLICY.map(([k]) => [k, policy[k]])), allow_renewal: !!policy.allow_renewal }))
  const [saved, setSaved] = useState(false)
  const { busy, error, run } = useAction()
  const set = (k) => (e) => { setSaved(false); setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }) }
  const submit = async (e) => {
    e.preventDefault()
    const body = { allow_renewal: f.allow_renewal }
    POLICY.forEach(([k]) => { body[k] = Number(f[k]) })
    if (await run(() => patch(url, body))) { setSaved(true); onSaved() }
  }
  return (
    <form className="card" onSubmit={submit}>
      <h2>Politique de prêt</h2>
      <p className="muted">S'applique aux nouveaux prêts. Les prêts en cours gardent leur date de retour.</p>
      <ErrorBox>{error}</ErrorBox>
      {saved && <div className="alert alert-ok">Enregistré.</div>}
      <div className="form-grid">{POLICY.map(([k, text, min]) => <Field key={k} label={text}><input type="number" min={min} required value={f[k]} onChange={set(k)} /></Field>)}</div>
      <label className="check field"><input type="checkbox" checked={f.allow_renewal} onChange={set('allow_renewal')} /> Renouvellement autorisé</label>
      <p className="muted">Le renouvellement par les lecteurs et le personnel arrive dans une prochaine version ; ces réglages sont déjà conservés.</p>
      <div className="form-actions"><button className="btn" disabled={busy}>Enregistrer</button></div>
    </form>
  )
}

export default function StructureSettings() {
  const { org, path } = useOrg()
  const info = useFetch(() => get(path('/organization/')), [org.id])
  const policy = useFetch(() => (org.library_module ? get(path('/loan-policy/')) : Promise.resolve(null)), [org.id])
  return (
    <>
      <PageHeader title="Paramètres" subtitle={org.name} />
      <ErrorBox>{info.error || policy.error}</ErrorBox>
      {info.loading && <Loading />}
      {info.data && <InfoCard key={JSON.stringify(info.data)} org={info.data} url={path('/organization/')} onSaved={info.reload} />}
      {policy.data && <div className="section"><PolicyCard key={policy.data.updated_at} policy={policy.data} url={path('/loan-policy/')} onSaved={policy.reload} /></div>}
    </>
  )
}
