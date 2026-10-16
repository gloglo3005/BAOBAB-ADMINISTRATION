import { useOrg } from '../org'
import { PageHeader } from '../ui'
import { TeamPanel } from './AdminShared'

export default function Team() {
  const { org, path } = useOrg()
  return (
    <>
      <PageHeader title="Équipe" subtitle={`Comptes du personnel de ${org.name}`} />
      <p className="muted">Vous créez les comptes des agents : un mot de passe temporaire est affiché une seule fois, à leur communiquer. Les comptes des responsables sont gérés par l'administrateur de la plateforme.</p>
      <TeamPanel base={path('/team/')} />
    </>
  )
}
