import InstallApp from './InstallApp'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from './auth'
import { useOrg } from './org'
import { watchTables } from './responsiveTables'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { orgs, org, select } = useOrg()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  useEffect(() => watchTables(), [])
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])
  const link = (to, text, end) => (
    <NavLink to={to} end={end} onClick={close}>{text}</NavLink>
  )
  const role = user.is_platform_admin ? 'Administrateur global' : org?.role === 'ADMIN' ? 'Responsable de structure' : 'Personnel'

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
              <div className="nav-title">Bibliothèque</div>
              {link('/library', 'Tableau de bord', true)}
              {link('/library/books', 'Livres')}
              {link('/library/members', 'Membres')}
              {link('/library/loans', 'Prêts')}
              {link('/library/import', 'Import du catalogue')}
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
              {link('/coworking/rates', 'Tarifs')}
              {link('/coworking/settings', 'Réglages')}
            </>
          )}
          {org?.role === 'ADMIN' && (
            <>
              <div className="nav-title">Ma structure</div>
              {link('/team', 'Équipe')}
              {link('/settings', 'Paramètres')}
              {link('/audit', "Journal d'audit")}
            </>
          )}
          {user.is_platform_admin && (
            <>
              <div className="nav-title">Plateforme</div>
              {link('/platform', 'Structures', true)}
              {link('/platform/audit', "Journal d'audit global")}
            </>
          )}
        </nav>

        <div className="sidebar-foot">
          <strong>{user.first_name || user.email}</strong>
          <div>{role}</div>
          <InstallApp />
          <button className="btn btn-ghost btn-sm" onClick={logout}>Se déconnecter</button>
        </div>
      </aside>
      {open && <div className="backdrop" onClick={close} aria-hidden="true" />}
      <header className="mobile-bar">
        <button className="btn btn-ghost" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Ouvrir le menu">☰ Menu</button>
        <strong>Baobab</strong>
        {org && <span>{org.name}</span>}
      </header>
      <main className="main">
        {children}
      </main>
    </div>
  )
}
