import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from './auth'
import { useOrg } from './org'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { orgs, org, select } = useOrg()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const link = (to, text, end) => (
    <NavLink to={to} end={end} onClick={close}>{text}</NavLink>
  )
  const role = user.is_platform_admin ? 'Administrateur global' : 'Personnel'

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <img src="/favicon.png" alt="" />
          <div>Baobab<small>Administration</small></div>
        </div>

        {orgs.length > 0 && (
          <select className="org-select" value={org?.id ?? ''} onChange={(e) => select(e.target.value)} aria-label="Structure">
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}

        <nav className="nav">
          {link('/', 'Accueil', true)}
          {org?.library_module && (
            <>
              <div className="nav-title">BibliothÃ¨que</div>
              {link('/library', 'Tableau de bord', true)}
              {link('/library/books', 'Livres')}
              {link('/library/members', 'Membres')}
              {link('/library/loans', 'PrÃªts')}
              {link('/library/import', 'Import du catalogue')}
              {link('/library/settings', 'ParamÃ¨tres')}
            </>
          )}
          {org?.coworking_module && (
            <>
              <div className="nav-title">Coworking</div>
              {link('/coworking', "Vue d'ensemble", true)}
              {link('/coworking/reservations', 'RÃ©servations')}
              {link('/coworking/sessions', 'ArrivÃ©es / sorties')}
              {link('/coworking/payments', 'Paiements')}
              {link('/coworking/customers', 'Clients')}
              {link('/coworking/resources', 'Zones & ressources')}
              {link('/coworking/settings', 'ParamÃ¨tres & tarifs')}
            </>
          )}
          {user.is_platform_admin && (
            <>
              <div className="nav-title">Plateforme</div>
              {link('/platform', "Vue d'ensemble", true)}
              {link('/platform/organizations', 'Structures')}
              {link('/platform/users', 'Comptes')}
              {link('/platform/audit', "Journal d'audit")}
            </>
          )}
        </nav>

        <div className="sidebar-foot">
          <strong>{user.first_name || user.email}</strong>
          <div>{role}</div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Se dÃ©connecter</button>{' '}
          <NavLink to="/password" style={{ color: '#b9cbbf', fontSize: '.8rem' }}>Mot de passe</NavLink>
        </div>
      </aside>
      <main className="main">
        <button className="btn btn-ghost menu-toggle" onClick={() => setOpen(!open)}>â˜° Menu</button>
        {children}
      </main>
    </div>
  )
}