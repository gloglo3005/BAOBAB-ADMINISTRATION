import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { useOrg } from '../org'
import PageBanner from '../PageBanner'

export default function Home() {
  const { user } = useAuth()
  const { org } = useOrg()
  return (
    <>
      <PageBanner title={`Bonjour ${user.first_name || ''}`.trim()} subtitle={user.email} image="/images/baobab-grove.webp" position="center 60%" />
      {user.is_platform_admin && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2>Administrateur global</h2>
          <p className="muted">Gestion de la plateforme : structures, comptes, journaux.</p>
          <p><Link className="btn" to="/platform">Ouvrir l'administration globale</Link></p>
        </div>
      )}
      {org ? (
        <div className="card">
          <h2>{org.name}</h2>
          <p className="muted">Structure active : choisissez un module.</p>
          <div className="page-actions" style={{ marginTop: '.8rem' }}>
            {org.library_module && <Link className="btn" to="/library">Bibliothèque</Link>}
            {org.coworking_module && <Link className="btn btn-ochre" to="/coworking">Coworking</Link>}
          </div>
        </div>
      ) : (
        !user.is_platform_admin && <div className="alert alert-info">Aucune structure active n'est rattachée à ce compte.</div>
      )}
    </>
  )
}
