import { createContext, useContext, useMemo, useState } from 'react'
import { useAuth } from './auth'

const OrgContext = createContext(null)
export const useOrg = () => useContext(OrgContext)

const KEY = 'baobab-admin.org'

// Structure active du personnel connecté. Toutes les routes /staff/<id>/... en dépendent.
export function OrgProvider({ children }) {
  const { user } = useAuth()
  const orgs = user?.staff_organizations || []
  const [selected, setSelected] = useState(() => {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  })
  const org = orgs.find((o) => String(o.id) === String(selected)) || orgs[0] || null

  const value = useMemo(
    () => ({
      orgs,
      org,
      select: (id) => {
        setSelected(String(id))
        try {
          localStorage.setItem(KEY, String(id))
        } catch {
          /* stockage indisponible */
        }
      },
      path: (suffix) => (org ? `/staff/${org.id}${suffix}` : null),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, org?.id],
  )
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}
