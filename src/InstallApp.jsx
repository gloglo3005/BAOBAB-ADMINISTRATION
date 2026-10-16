import { useState, useSyncExternalStore } from 'react'
import { canInstall, isIos, isStandalone, promptInstall, subscribe } from './pwa'

// Bouton « Installer l'application » : invisible si l'application est déjà installée ou non installable.
export default function InstallApp({ className = 'btn btn-ghost btn-sm' }) {
  const available = useSyncExternalStore(subscribe, canInstall)
  const [help, setHelp] = useState(false)
  if (isStandalone()) return null
  const ios = isIos()
  if (!available && !ios) return null
  const install = () => (available ? promptInstall() : setHelp(true))
  return (
    <>
      <button type="button" className={className} onClick={install} aria-label="Installer l'application">Installer<span className="hide-sm"> l'application</span></button>
      {help && (
        <div className="alert alert-info" role="dialog" aria-label="Installer sur iPhone ou iPad" style={{ marginTop: '.5rem' }}>
          Dans Safari, appuyez sur le bouton Partager, puis sur « Sur l'écran d'accueil ».{' '}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHelp(false)}>OK</button>
        </div>
      )}
    </>
  )
}
