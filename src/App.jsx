import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { hasAdminAccess, useAuth } from './auth'
import { useOrg } from './org'
import Layout from './Layout'
import Login from './pages/Login'
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const Home = lazy(() => import('./pages/Home'))
const Landing = lazy(() => import('./pages/Landing'))
const Import = lazy(() => import('./pages/Import'))
const ImportDetail = lazy(() => import('./pages/ImportDetail'))
const Platform = lazy(() => import('./pages/Platform'))
const PlatformOrg = lazy(() => import('./pages/PlatformOrg'))
const PlatformAudit = lazy(() => import('./pages/PlatformAudit'))
const Team = lazy(() => import('./pages/Team'))
const StructureSettings = lazy(() => import('./pages/StructureSettings'))
const Audit = lazy(() => import('./pages/Audit'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Books = lazy(() => import('./pages/Books'))
const BookDetail = lazy(() => import('./pages/BookDetail'))
const Members = lazy(() => import('./pages/Members'))
const Loans = lazy(() => import('./pages/Loans'))
const Referentials = lazy(() => import('./pages/Referentials'))
const CwDashboard = lazy(() => import('./pages/CwDashboard'))
const CwResources = lazy(() => import('./pages/CwResources'))
const CwCustomers = lazy(() => import('./pages/CwCustomers'))
const CwReservations = lazy(() => import('./pages/CwReservations'))
const CwSessions = lazy(() => import('./pages/CwSessions'))
const CwPayments = lazy(() => import('./pages/CwPayments'))
const CwRates = lazy(() => import('./pages/CwRates'))
const CwSettings = lazy(() => import('./pages/CwSettings'))
import Privacy from './pages/Privacy'
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
    <Layout><Suspense fallback={<Loading />}>{el}</Suspense></Layout>
  </Protected>
)

// Page d'accueil publique pour les visiteurs, tableau de bord pour le personnel connecté.
function Root() {
  const { user, status } = useAuth()
  if (status === 'loading') return <div className="auth-page"><Loading /></div>
  if (user && hasAdminAccess(user)) return page(<Home />)
  return (
    <Suspense fallback={<div className="auth-page"><Loading /></div>}>
      <Landing />
    </Suspense>
  )
}
export default function App() {
  return (
    <Suspense fallback={<div className="auth-page"><Loading /></div>}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/password" element={<ChangePassword />} />
      <Route path="/" element={<Root />} />
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
      <Route path="/library/import" element={page(<Import />, { module: 'library' })} />
      <Route path="/library/import/:id" element={page(<ImportDetail />, { module: 'library' })} />
      <Route path="/library/settings" element={page(<Referentials />, { module: 'library' })} />

      <Route path="/coworking" element={page(<CwDashboard />, { module: 'coworking' })} />
      <Route path="/coworking/reservations" element={page(<CwReservations />, { module: 'coworking' })} />
      <Route path="/coworking/sessions" element={page(<CwSessions />, { module: 'coworking' })} />
      <Route path="/coworking/payments" element={page(<CwPayments />, { module: 'coworking' })} />
      <Route path="/coworking/customers" element={page(<CwCustomers />, { module: 'coworking' })} />
      <Route path="/coworking/rates" element={page(<CwRates />, { module: 'coworking' })} />
      <Route path="/coworking/settings" element={page(<CwSettings />, { module: 'coworking' })} />
      <Route path="/coworking/resources" element={page(<CwResources />, { module: 'coworking' })} />

      <Route path="/confidentialite" element={<Privacy />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  )
}
