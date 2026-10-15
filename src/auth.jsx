import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, get, tokens } from './api'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// Rôles gérés par cette application : administrateur global et personnel de structure.
export function hasAdminAccess(user) {
  return Boolean(user && (user.is_platform_admin || user.staff_organizations?.length > 0))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | anon | ready

  const logout = useCallback(() => {
    tokens.clear()
    setUser(null)
    setStatus('anon')
  }, [])

  const loadMe = useCallback(async () => {
    const me = await get('/auth/me/')
    setUser(me)
    setStatus('ready')
    return me
  }, [])

  useEffect(() => {
    if (!tokens.get()?.access) {
      setStatus('anon')
      return
    }
    loadMe().catch(() => logout())
  }, [loadMe, logout])

  useEffect(() => {
    window.addEventListener('baobab:unauthorized', logout)
    return () => window.removeEventListener('baobab:unauthorized', logout)
  }, [logout])

  const login = useCallback(
    async (email, password) => {
      const data = await api('/auth/login/', { method: 'POST', body: { email, password }, auth: false })
      tokens.set({ access: data.access, refresh: data.refresh })
      const me = await loadMe()
      if (!hasAdminAccess(me)) {
        logout()
        throw new Error(
          "Ce compte n'a pas accès à l'espace administration (ni administrateur global, ni personnel d'une structure active). Utilisez baobab-user.",
        )
      }
      return me
    },
    [loadMe, logout],
  )

  const changePassword = useCallback(
    async (oldPassword, newPassword) => {
      const data = await api('/auth/password/', {
        method: 'POST',
        body: { old_password: oldPassword, new_password: newPassword },
      })
      tokens.set({ access: data.access, refresh: data.refresh })
      await loadMe()
    },
    [loadMe],
  )

  const value = useMemo(
    () => ({ user, status, login, logout, changePassword, reload: loadMe }),
    [user, status, login, logout, changePassword, loadMe],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
