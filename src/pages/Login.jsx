import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth, hasAdminAccess } from '../auth'
import { ErrorBox, Field, useAction } from '../ui'

export default function Login() {
  const { user, status, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { busy, error, run } = useAction()

  if (status === 'ready' && hasAdminAccess(user)) {
    return <Navigate to={user.must_change_password ? '/password' : '/'} replace />
  }

  const submit = async (e) => {
    e.preventDefault()
    const me = await run(() => login(email.trim(), password))
    if (me) navigate(me.must_change_password ? '/password' : '/')
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <div className="auth-logo"><img src="/logo.png" alt="Baobab" /><small>Administration</small></div>
        <h2>Connexion</h2>
        <p className="muted">RÃ©servÃ© Ã  l'administrateur global et au personnel des structures.</p>
        <ErrorBox>{error}</ErrorBox>
        <Field label="Email"><input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Mot de passe"><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <button className="btn" disabled={busy} style={{ width: '100%' }}>{busy ? 'Connexionâ€¦' : 'Se connecter'}</button>
      </form>
    </div>
  )
}