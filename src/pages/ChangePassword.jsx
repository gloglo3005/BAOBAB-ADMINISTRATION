import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { ErrorBox, Field, PasswordInput, useAction, usePageTitle } from '../ui'

export default function ChangePassword() {
  const { user, status, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const [oldPassword, setOld] = useState('')
  const [newPassword, setNew] = useState('')
  const [confirm, setConfirm] = useState('')
  const [mismatch, setMismatch] = useState('')
  const { busy, error, run } = useAction()
  usePageTitle('Changer le mot de passe')

  if (status === 'loading') return null
  if (!user) return <Navigate to="/login" replace />

  const submit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirm) {
      setMismatch('Les deux mots de passe ne correspondent pas.')
      return
    }
    setMismatch('')
    const ok = await run(async () => {
      await changePassword(oldPassword, newPassword)
      return true
    })
    if (ok) navigate('/')
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit} aria-busy={busy}>
        <h2>Changer le mot de passe</h2>
        {user.must_change_password && (
          <div className="alert alert-info">Un nouveau mot de passe est obligatoire avant de continuer.</div>
        )}
        <ErrorBox>{error || mismatch}</ErrorBox>
        <Field label="Mot de passe actuel"><PasswordInput required autoFocus value={oldPassword} onChange={(e) => setOld(e.target.value)} /></Field>
        <Field label="Nouveau mot de passe" hint="8 caractères minimum, pas trop courant, pas uniquement des chiffres."><PasswordInput required autoComplete="new-password" value={newPassword} onChange={(e) => setNew(e.target.value)} /></Field>
        <Field label="Confirmer le nouveau mot de passe"><PasswordInput required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={user.must_change_password ? logout : () => navigate(-1)}>Annuler</button>
          <button className="btn" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </div>
  )
}
