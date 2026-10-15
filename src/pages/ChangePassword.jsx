import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { ErrorBox, Field, useAction } from '../ui'

export default function ChangePassword() {
  const { user, status, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const [oldPassword, setOld] = useState('')
  const [newPassword, setNew] = useState('')
  const { busy, error, run } = useAction()

  if (status === 'loading') return null
  if (!user) return <Navigate to="/login" replace />

  const submit = async (e) => {
    e.preventDefault()
    const ok = await run(async () => {
      await changePassword(oldPassword, newPassword)
      return true
    })
    if (ok) navigate('/')
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <h2>Changer le mot de passe</h2>
        {user.must_change_password && (
          <div className="alert alert-info">Un nouveau mot de passe est obligatoire avant de continuer.</div>
        )}
        <ErrorBox>{error}</ErrorBox>
        <Field label="Mot de passe actuel"><input type="password" required value={oldPassword} onChange={(e) => setOld(e.target.value)} /></Field>
        <Field label="Nouveau mot de passe"><input type="password" required value={newPassword} onChange={(e) => setNew(e.target.value)} /></Field>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={logout}>Annuler</button>
          <button className="btn" disabled={busy}>Enregistrer</button>
        </div>
      </form>
    </div>
  )
}
