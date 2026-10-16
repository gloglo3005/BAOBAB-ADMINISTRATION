import { useOrg } from '../org'
import { PageHeader } from '../ui'
import { AuditTable } from './AdminShared'

export default function Audit() {
  const { org, path } = useOrg()
  return (
    <>
      <PageHeader title="Journal d'audit" subtitle={`Actions enregistrées dans ${org.name}`} />
      <AuditTable url={path('/audit/')} />
    </>
  )
}
