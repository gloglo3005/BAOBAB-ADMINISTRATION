import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth, hasAdminAccess } from '../auth'
import { ErrorBox, Field, PasswordInput, useAction, usePageTitle } from '../ui'

export default function Login() {
  const { user, status, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { busy, error, run } = useAction()
  usePageTitle('Connexion')

  if (status === 'ready' && hasAdminAccess(user)) {
    return <Navigate to={user.must_change_password ? '/password' : '/'} replace />
  }

  const submit = async (e) => {
    e.preventDefault()
    const me = await run(() => login(email.trim(), password))
    if (me) navigate(me.must_change_password ? '/password' : '/')
  }

  return (
    <div className="auth-page auth-split">
      <form className="card auth-card" onSubmit={submit} aria-busy={busy}>
        <div className="auth-logo"><img src="/logo.png" alt="Baobab" /><small>Administration</small></div>
        <h2>Connexion</h2>
        <p className="muted">Réservé à l'administrateur global et au personnel des structures.</p>
        <ErrorBox>{error}</ErrorBox>
        <Field label="Email"><input type="email" name="email" autoComplete="username" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Mot de passe"><PasswordInput name="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <button className="btn" disabled={busy} style={{ width: '100%' }}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        <details className="auth-help">
          <summary>Mot de passe oublié ?</summary>
          <p className="muted">Demandez à un responsable de votre structure, ou à l'administrateur de la plateforme, de vous aider à retrouver l'accès à votre compte.</p>
        </details>
        <p className="auth-foot muted"><Link to="/">← Accueil</Link> · <Link to="/confidentialite">Confidentialité</Link></p>
      </form>
    </div>
  )
}
