import { useState } from 'react'
import { Link } from 'react-router-dom'

const KEY = 'baobab.notice.v1'

function alreadySeen() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return true
  }
}

// Bandeau d'information : Baobab n'utilise que le stockage nécessaire au fonctionnement.
export default function CookieNotice() {
  const [hidden, setHidden] = useState(alreadySeen)
  if (hidden) return null

  const accept = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* stockage indisponible */
    }
    setHidden(true)
  }

  return (
    <div className="cookie-notice" role="dialog" aria-label="Information sur le stockage">
      <p>
        Baobab utilise uniquement le stockage de votre navigateur nécessaire au fonctionnement (connexion, mode hors
        connexion). Aucun cookie publicitaire ni outil de suivi.{' '}
        <Link to="/confidentialite">En savoir plus</Link>
      </p>
      <button className="btn" onClick={accept}>Compris</button>
    </div>
  )
}