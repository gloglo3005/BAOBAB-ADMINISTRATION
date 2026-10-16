import { Navigate, Route, Routes } from 'react-router-dom'
import { hasAdminAccess, useAuth } from './auth'
import { useOrg } from './org'
import Layout from './Layout'
import Login from './pages/Login'
import ChangePassword from './pages/ChangePassword'
import Home from './pages/Home'
import Platform from './pages/Platform'
import PlatformOrg from './pages/PlatformOrg'
import PlatformAudit from './pages/PlatformAudit'
import Team from './pages/Team'
import StructureSettings from './pages/StructureSettings'
import Audit from './pages/Audit'
import Dashboard from './pages/Dashboard'
import Books from './pages/Books'
import BookDetail from './pages/BookDetail'
import Members from './pages/Members'
import Loans from './pages/Loans'
import Referentials from './pages/Referentials'
import Imports from './pages/Imports'
import ImportDetail from './pages/ImportDetail'
import CwDashboard from './pages/CwDashboard'
import CwResources from './pages/CwResources'
import CwCustomers from './pages/CwCustomers'
import CwReservations from './pages/CwReservations'
import CwSessions from './pages/CwSessions'
import CwPayments from './pages/CwPayments'
import CwRates from './pages/CwRates'
import CwSettings from './pages/CwSettings'
import { Loading, NotFound } from './ui'

function Protected({ children, platform, module, responsable }) {
  const { user, status } = useAuth()
  const { org } = useOrg()
  if (status === 'loading') return <div className="auth-page"><Loading /></div>
  if (!user || !hasAdminAccess(user)) return <Navigate to="/login" replace />
  if (user.must_change_password) return <Navigate to="/password" replace />
  if (platform && !user.is_platform_admin) return <Navigate to="/" replace />
  if (module && !org?.[`${module}_module`]) return <Navigate to="/" replace />
  if (responsable && org?.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

const page = (el, opts) => (
  <Protected {...opts}>
    <Layout>{el}</Layout>
  </Protected>
)

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/password" element={<ChangePassword />} />
      <Route path="/" element={page(<Home />)} />
      <Route path="/platform" element={page(<Platform />, { platform: true })} />
      <Route path="/platform/organizations/:id" element={page(<PlatformOrg />, { platform: true })} />
      <Route path="/platform/audit" element={page(<PlatformAudit />, { platform: true })} />
      <Route path="/team" element={page(<Team />, { responsable: true })} />
      <Route path="/settings" element={page(<StructureSettings />, { responsable: true })} />
      <Route path="/audit" element={page(<Audit />, { responsable: true })} />

      <Route path="/library" element={page(<Dashboard />, { module: 'library' })} />
      <Route path="/library/books" element={page(<Books />, { module: 'library' })} />
      <Route path="/library/books/:id" element={page(<BookDetail />, { module: 'library' })} />
      <Route path="/library/members" element={page(<Members />, { module: 'library' })} />
      <Route path="/library/loans" element={page(<Loans />, { module: 'library' })} />
      <Route path="/library/settings" element={page(<Referentials />, { module: 'library' })} />
      <Route path="/library/imports" element={page(<Imports />, { module: 'library' })} />
      <Route path="/library/imports/:id" element={page(<ImportDetail />, { module: 'library' })} />

      <Route path="/coworking" element={page(<CwDashboard />, { module: 'coworking' })} />
      <Route path="/coworking/reservations" element={page(<CwReservations />, { module: 'coworking' })} />
      <Route path="/coworking/sessions" element={page(<CwSessions />, { module: 'coworking' })} />
      <Route path="/coworking/payments" element={page(<CwPayments />, { module: 'coworking' })} />
      <Route path="/coworking/customers" element={page(<CwCustomers />, { module: 'coworking' })} />
      <Route path="/coworking/rates" element={page(<CwRates />, { module: 'coworking' })} />
      <Route path="/coworking/settings" element={page(<CwSettings />, { module: 'coworking' })} />
      <Route path="/coworking/resources" element={page(<CwResources />, { module: 'coworking' })} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
