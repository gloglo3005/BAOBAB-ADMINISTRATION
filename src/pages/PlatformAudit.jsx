import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../ui'
import { AuditTable } from './AdminShared'

export default function PlatformAudit() {
  const [params] = useSearchParams()
  const organization = params.get('organization') || undefined
  return (
    <>
      <PageHeader title="Journal d'audit global" subtitle={organization ? 'Une seule structure, lecture seule' : 'Toutes les structures, lecture seule'}>
        <Link className="btn btn-ghost" to="/platform">← Structures</Link>
      </PageHeader>
      <AuditTable url="/platform/audit/" showOrg extra={{ organization }} />
    </>
  )
}
