import { useEffect } from 'react'
import { useNetState, warmUp } from './offline'

// Bandeau d'état du réseau + réveil du serveur à l'ouverture.
export default function NetStatus() {
  const net = useNetState()

  useEffect(() => {
    warmUp()
    const onVisible = () => {
      if (document.visibilityState === 'visible') warmUp()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  if (!net.online) {
    return (
      <div className="net-banner" role="status">
        Hors connexion : vous consultez les dernières données enregistrées. Les modifications sont désactivées.
      </div>
    )
  }
  if (net.fromCache && net.restored) {
    return (
      <div className="net-banner" role="status">
        Connexion rétablie. Actualisez pour voir les données à jour.
        <button className="btn secondary" onClick={() => window.location.reload()}>Actualiser</button>
      </div>
    )
  }
  if (net.fromCache) {
    return (
      <div className="net-banner" role="status">
        Serveur injoignable pour le moment : données enregistrées affichées.
        <button className="btn secondary" onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    )
  }
  if (net.slow > 0) {
    return (
      <div className="net-banner" role="status">
        Le serveur démarre, cela peut prendre jusqu'à une minute après une période d'inactivité. Merci de patienter…
      </div>
    )
  }
  return null
}