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
          <img src="/favicon.svg" alt="" />
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
              <div className="nav-title">Bibliothèque</div>
              {link('/library', 'Tableau de bord', true)}
              {link('/library/books', 'Livres')}
              {link('/library/members', 'Membres')}
              {link('/library/loans', 'Prêts')}
              {link('/library/settings', 'Catégories & emplacements')}
            </>
          )}
          {org?.coworking_module && (
            <>
              <div className="nav-title">Coworking</div>
              {link('/coworking', "Vue d'ensemble", true)}
              {link('/coworking/reservations', 'Réservations')}
              {link('/coworking/sessions', 'Arrivées / sorties')}
              {link('/coworking/payments', 'Paiements')}
              {link('/coworking/customers', 'Clients')}
              {link('/coworking/resources', 'Zones & ressources')}
            </>
          )}
          {user.is_platform_admin && (
            <>
              <div className="nav-title">Plateforme</div>
              {link('/platform', 'Administration globale')}
            </>
          )}
        </nav>

        <div className="sidebar-foot">
          <strong>{user.first_name || user.email}</strong>
          <div>{role}</div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Se déconnecter</button>
        </div>
      </aside>
      <main className="main">
        <button className="btn btn-ghost menu-toggle" onClick={() => setOpen(!open)}>☰ Menu</button>
        {children}
      </main>
    </div>
  )
}
