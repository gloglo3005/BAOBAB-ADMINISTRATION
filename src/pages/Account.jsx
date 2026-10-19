import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import InstallApp from '../InstallApp'
import { cacheClear, useNetState } from '../offline'
import { PageHeader } from '../ui'
import { getTheme, setTheme } from '../theme'

const THEME_CHOICES = [
  ['auto', 'Automatique', "Suit le réglage de votre appareil"],
  ['light', 'Clair', 'Fond clair, texte sombre'],
  ['dark', 'Sombre', 'Fond sombre, reposant le soir'],
]

const ROLES = { ADMIN: 'Responsable', STAFF: 'Personnel' }

// Paramètres du compte : profil, apparence, sécurité, données gardées dans le navigateur.
export default function Account() {
  const { user, logout } = useAuth()
  const { online } = useNetState()
  const [theme, setThemeState] = useState(getTheme)
  const [cleared, setCleared] = useState(false)

  const chooseTheme = (value) => {
    setTheme(value)
    setThemeState(value)
  }
  const clearOffline = () => {
    cacheClear()
    setCleared(true)
  }
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ')
  const staff = user.staff_organizations || []
  const memberships = user.memberships || []

  return (
    <>
      <PageHeader title="Compte et paramètres" subtitle="Votre profil, l'apparence de l'application et vos données" />

      <div className="settings-grid">
        <section className="card" aria-labelledby="set-profile">
          <h2 id="set-profile">Profil</h2>
          <dl className="kv">
            <dt>Nom</dt><dd>{name || '—'}</dd>
            <dt>E-mail</dt><dd>{user.email}</dd>
            <dt>Téléphone</dt><dd>{user.phone || '—'}</dd>
            {user.is_platform_admin && (<><dt>Rôle</dt><dd>Administrateur de la plateforme</dd></>)}
            {staff.length > 0 && (
              <>
                <dt>Structures</dt>
                <dd>{staff.map((o) => `${o.name} (${ROLES[o.role] || o.role})`).join(', ')}</dd>
              </>
            )}
            {memberships.length > 0 && (
              <>
                <dt>Inscriptions</dt>
                <dd>{memberships.map((m) => m.organization?.name).filter(Boolean).join(', ')}</dd>
              </>
            )}
          </dl>
          <p className="muted settings-note">Pour modifier ces informations, contactez votre structure.</p>
        </section>

        <section className="card" aria-labelledby="set-theme">
          <h2 id="set-theme">Apparence</h2>
          <div className="theme-choices" role="radiogroup" aria-labelledby="set-theme">
            {THEME_CHOICES.map(([value, text, hint]) => (
              <label key={value} className={`theme-choice ${theme === value ? 'on' : ''}`}>
                <input type="radio" name="theme" value={value} checked={theme === value} onChange={() => chooseTheme(value)} />
                <span><strong>{text}</strong><small className="muted">{hint}</small></span>
              </label>
            ))}
          </div>
        </section>

        <section className="card" aria-labelledby="set-security">
          <h2 id="set-security">Sécurité</h2>
          <p className="muted">Changez régulièrement votre mot de passe, surtout si vous l'avez partagé.</p>
          <div className="settings-actions">
            <Link className="btn" to="/password">Changer le mot de passe</Link>
            <button type="button" className="btn btn-ghost" onClick={logout}>Se déconnecter</button>
          </div>
        </section>

        <section className="card" aria-labelledby="set-offline">
          <h2 id="set-offline">Données sur cet appareil</h2>
          <p className="muted">
            Pour fonctionner sans réseau, Baobab garde pendant 7 jours une copie des pages que vous avez consultées.
            Vous êtes actuellement <strong>{online ? 'en ligne' : 'hors connexion'}</strong>.
          </p>
          <div className="settings-actions">
            <button type="button" className="btn btn-ghost" onClick={clearOffline}>Effacer les copies hors connexion</button>
          </div>
          {cleared && <div className="alert alert-ok" role="status">Les copies hors connexion ont été effacées.</div>}
        </section>

        <section className="card" aria-labelledby="set-app">
          <h2 id="set-app">Application</h2>
          <p className="muted">Installez Baobab sur l'écran d'accueil pour l'ouvrir comme une application.</p>
          <div className="settings-actions">
            <InstallApp className="btn" />
            <Link className="btn btn-ghost" to="/confidentialite">Politique de confidentialité</Link>
          </div>
        </section>
      </div>
    </>
  )
}
