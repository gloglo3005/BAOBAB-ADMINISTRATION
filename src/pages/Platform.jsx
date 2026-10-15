import { useAuth } from '../auth'
import { PageHeader } from '../ui'

const DJANGO_ADMIN = import.meta.env.VITE_DJANGO_ADMIN_URL || 'http://localhost:8000/global/'

// Le backend n'expose pas encore d'API pour l'administration globale :
// cette page est un point d'entrée en attendant ces routes.
export default function Platform() {
  const { user } = useAuth()
  return (
    <>
      <PageHeader title="Administration globale" subtitle={`Connecté en tant que ${user.email}`} />
      <div className="alert alert-info">
        Le backend ne fournit pas encore de routes API pour l'administrateur global (structures, comptes, journal d'audit).
        Ces actions se font pour l'instant dans l'admin Django.
      </div>
      <div className="card">
        <h2>Admin Django</h2>
        <p className="muted">Structures, comptes, membres du personnel, journal d'audit.</p>
        <p><a className="btn" href={DJANGO_ADMIN} target="_blank" rel="noreferrer">Ouvrir /global/</a></p>
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h2>À construire ici</h2>
        <ul className="muted">
          <li>Liste et validation des structures (PENDING → ACTIVE)</li>
          <li>Activation des modules bibliothèque / coworking</li>
          <li>Gestion des comptes du personnel</li>
          <li>Journal d'audit</li>
        </ul>
      </div>
    </>
  )
}
