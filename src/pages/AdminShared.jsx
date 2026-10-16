import { useState } from 'react'
import { get, patch, post } from '../api'
import { useAuth } from '../auth'
import { Empty, ErrorBox, Field, Loading, Modal, Pager, dateTime, rows, useAction, useDebounced, useFetch } from '../ui'

const ORG_STATUS = {
  PENDING: ['En attente', 'warn'], ACTIVE: ['Active', 'ok'], SUSPENDED: ['Suspendue', 'bad'], REJECTED: ['Refusée', 'bad'],
}
export const ORG_STATUS_LABEL = (v) => ORG_STATUS[v]?.[0] || v

export function OrgStatus({ value }) {
  const [text, tone] = ORG_STATUS[value] || [value, 'neutral']
  return <span className={`badge badge-${tone}`}>{text}</span>
}

export function RoleBadge({ role }) {
  return role === 'ADMIN' ? <span className="badge badge-info">Responsable</span> : <span className="badge badge-neutral">Agent</span>
}

// Affiche une seule fois le mot de passe temporaire d'un compte créé ou réinitialisé.
export function CredentialsModal({ result, onClose }) {
  const [copied, setCopied] = useState(false)
  const m = result.member
  const copy = async () => {
    try { await navigator.clipboard.writeText(result.temporary_password); setCopied(true) } catch { /* copie indisponible */ }
  }
  return (
    <Modal title="Compte prêt" onClose={onClose}>
      <p><strong>{m.first_name} {m.last_name}</strong><br /><span className="muted">{m.email}</span></p>
      {result.temporary_password ? (
        <>
          <div className="alert alert-info">
            Mot de passe temporaire (affiché <strong>une seule fois</strong>) :
            <div style={{ fontFamily: 'monospace', fontSize: '1.25rem', margin: '.5rem 0' }}>{result.temporary_password}</div>
            À communiquer à la personne : il lui sera demandé de le changer à la première connexion.
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={copy}>{copied ? 'Copié ✓' : 'Copier'}</button>
            <button className="btn" onClick={onClose}>J'ai noté le mot de passe</button>
          </div>
        </>
      ) : (
        <>
          <div className="alert alert-info">Ce compte existait déjà : il a été rattaché à la structure, son mot de passe est inchangé.</div>
          <div className="form-actions"><button className="btn" onClick={onClose}>Fermer</button></div>
        </>
      )}
    </Modal>
  )
}

function StaffForm({ base, platform, onDone, onClose }) {
  const [f, setF] = useState({ email: '', first_name: '', last_name: '', phone: '', role: 'ADMIN' })
  const { busy, error, run } = useAction()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    const body = { email: f.email.trim(), first_name: f.first_name, last_name: f.last_name, phone: f.phone }
    if (platform) body.role = f.role
    const res = await run(() => post(base, body))
    if (res) onDone(res)
  }
  return (
    <Modal title={platform ? 'Nouveau compte pour cette structure' : 'Nouvel agent'} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <div className="form-grid">
          <Field label="Prénom"><input required value={f.first_name} onChange={set('first_name')} /></Field>
          <Field label="Nom"><input required value={f.last_name} onChange={set('last_name')} /></Field>
          <Field label="Email"><input type="email" required autoCapitalize="none" value={f.email} onChange={set('email')} /></Field>
          <Field label="Téléphone"><input inputMode="tel" value={f.phone} onChange={set('phone')} /></Field>
          {platform && (
            <Field label="Rôle" hint="Le responsable gère ensuite lui-même ses agents.">
              <select value={f.role} onChange={set('role')}><option value="ADMIN">Responsable de la structure</option><option value="STAFF">Agent</option></select>
            </Field>
          )}
        </div>
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button><button className="btn" disabled={busy}>Créer le compte</button></div>
      </form>
    </Modal>
  )
}

// Équipe d'une structure. platform = true : l'admin global gère tout ; sinon c'est le responsable (agents seulement).
export function TeamPanel({ base, platform = false }) {
  const { user } = useAuth()
  const { busy, error, run } = useAction()
  const { data, loading, error: loadError, reload } = useFetch(() => get(base), [base])
  const [creating, setCreating] = useState(false)
  const [credentials, setCredentials] = useState(null)
  const list = rows(data)
  const manageable = (m) => platform || (m.role === 'STAFF' && m.email !== user.email)

  const toggle = async (m) => {
    const text = m.active ? `Désactiver le compte de ${m.first_name} ${m.last_name} ? Il ne pourra plus se connecter à cette structure.` : `Réactiver le compte de ${m.first_name} ${m.last_name} ?`
    if (window.confirm(text) && (await run(() => patch(`${base}${m.id}/`, { active: !m.active })))) reload()
  }
  const reset = async (m) => {
    if (!window.confirm(`Réinitialiser le mot de passe de ${m.first_name} ${m.last_name} ? L'ancien mot de passe ne fonctionnera plus.`)) return
    const res = await run(() => post(`${base}${m.id}/reset-password/`, {}))
    if (res) { setCredentials(res); reload() }
  }
  const changeRole = async (m, role) => { if (await run(() => patch(`${base}${m.id}/`, { role }))) reload() }

  return (
    <div className="card">
      <div className="page-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{platform ? 'Comptes du personnel' : 'Équipe'}</h2>
        <button className="btn" onClick={() => setCreating(true)}>{platform ? '+ Compte' : '+ Agent'}</button>
      </div>
      <ErrorBox>{error || loadError}</ErrorBox>
      {loading && <Loading />}
      {data && (list.length === 0 ? <Empty>Aucun compte.</Empty> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Nom</th><th>Rôle</th><th>Dernière connexion</th><th>Statut</th><th /></tr></thead>
          <tbody>{list.map((m) => (
            <tr key={m.id}>
              <td><strong>{m.first_name} {m.last_name}</strong><div className="muted">{m.email}{m.phone ? ` · ${m.phone}` : ''}</div></td>
              <td>{platform ? (
                <select value={m.role} disabled={busy} onChange={(e) => changeRole(m, e.target.value)}><option value="ADMIN">Responsable</option><option value="STAFF">Agent</option></select>
              ) : <RoleBadge role={m.role} />}</td>
              <td>{m.last_login ? dateTime(m.last_login) : 'Jamais'}{m.must_change_password && <div className="muted">Mot de passe temporaire</div>}</td>
              <td>{m.active ? <span className="badge badge-ok">Actif</span> : <span className="badge badge-neutral">Désactivé</span>}</td>
              <td className="actions">{manageable(m) && <>
                <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => reset(m)}>Mot de passe</button>{' '}
                <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => toggle(m)}>{m.active ? 'Désactiver' : 'Réactiver'}</button>
              </>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      ))}
      {creating && <StaffForm base={base} platform={platform} onClose={() => setCreating(false)} onDone={(res) => { setCreating(false); setCredentials(res); reload() }} />}
      {credentials && <CredentialsModal result={credentials} onClose={() => setCredentials(null)} />}
    </div>
  )
}

const ACTIONS = [
  ['', 'Toutes les actions'], ['ORGANIZATION_CREATED', 'Structure créée'], ['ORGANIZATION_UPDATED', 'Structure modifiée'],
  ['ORGANIZATION_STATUS_CHANGED', 'Statut de structure'], ['LOAN_POLICY_UPDATED', 'Politique de prêt'], ['STAFF_CREATED', 'Compte créé'],
  ['STAFF_UPDATED', 'Compte modifié'], ['STAFF_PASSWORD_RESET', 'Mot de passe réinitialisé'], ['LOAN_CREATED', 'Prêt créé'],
  ['LOAN_RETURNED', 'Prêt retourné'], ['PAYMENT_RECORDED', 'Paiement enregistré'], ['PAYMENT_VOIDED', 'Paiement annulé'],
]

// Journal d'audit (lecture seule) : url = route à interroger ; showOrg = colonne « Structure ».
export function AuditTable({ url, showOrg = false, extra }) {
  const [q, setQ] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const dq = useDebounced(q)
  const { data, loading, error } = useFetch(() => get(url, { ...extra, q: dq, action, date_from: from, date_to: to, page }), [url, dq, action, from, to, page, extra?.organization])
  const list = rows(data)
  const reset = (setter) => (e) => { setter(e.target.value); setPage(1) }
  return (
    <>
      <div className="toolbar">
        <input type="search" placeholder="Rechercher (description, auteur)…" value={q} onChange={reset(setQ)} />
        <select value={action} onChange={reset(setAction)}>{ACTIONS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
        <input type="date" value={from} onChange={reset(setFrom)} aria-label="Du" />
        <input type="date" value={to} onChange={reset(setTo)} aria-label="Au" />
      </div>
      <ErrorBox>{error}</ErrorBox>
      {loading && <Loading />}
      {data && (list.length === 0 ? <Empty>Aucune ligne dans le journal.</Empty> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Date</th>{showOrg && <th>Structure</th>}<th>Action</th><th>Description</th><th>Auteur</th></tr></thead>
          <tbody>{list.map((l) => (
            <tr key={l.id}>
              <td>{dateTime(l.created_at)}</td>{showOrg && <td>{l.organization_name}</td>}
              <td><strong>{l.action_label}</strong><div className="muted">{l.entity_type} n° {l.entity_id}</div></td>
              <td>{l.description || '—'}</td><td>{l.user_email || 'Système'}</td>
            </tr>
          ))}</tbody>
        </table></div>
      ))}
      <Pager page={page} count={data?.count || 0} pageSize={25} onPage={setPage} />
    </>
  )
}
