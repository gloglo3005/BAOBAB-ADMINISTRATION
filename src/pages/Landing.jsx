import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../landing.css'

const ICONS = {
  book: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>,
  loans: <><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></>,
  shield: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
  phone: <><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></>,
  building: <><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4M10 10h4M10 14h4M10 18h4" /></>,
}

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

const FEATURES = [
  { icon: 'book', title: 'Catalogue et exemplaires', text: 'Chaque livre, chaque exemplaire, chaque rayon. Catégories, emplacements et disponibilité toujours à jour.' },
  { icon: 'loans', title: 'Prêts, retours et échéances', text: 'Enregistrez un prêt en quelques secondes, suivez les dates de retour et repérez tout de suite les retards.' },
  { icon: 'users', title: 'Membres et espace lecteur', text: 'Vos lecteurs ont leur propre espace : catalogue, prêts en cours et réservations, depuis leur téléphone.' },
  { icon: 'grid', title: 'Coworking complet', text: 'Zones, postes et salles, réservations, arrivées et sorties, tarifs et paiements : tout au même endroit.' },
  { icon: 'upload', title: 'Import du catalogue', text: 'Vous avez déjà une liste de livres ? Importez un fichier CSV, vérifiez l’aperçu, puis confirmez.' },
  { icon: 'shield', title: 'Données protégées et tracées', text: 'Chaque structure ne voit que ses données. Les rôles sont distincts et un journal d’audit garde la trace des actions.' },
  { icon: 'building', title: 'Plusieurs structures', text: 'Une seule plateforme pour plusieurs bibliothèques et espaces, avec un administrateur global pour les piloter.' },
  { icon: 'phone', title: 'Installable sur téléphone', text: 'Une application qui s’installe comme n’importe quelle autre et reste consultable même avec une connexion fragile.' },
]

const STEPS = [
  { n: 1, title: 'Votre structure est créée', text: 'L’administrateur de la plateforme ouvre votre espace et active les modules dont vous avez besoin.' },
  { n: 2, title: 'Vous la configurez', text: 'Importez votre catalogue, ajoutez votre équipe, définissez vos règles de prêt, vos zones et vos tarifs.' },
  { n: 3, title: 'Vos lecteurs se connectent', text: 'Ils créent leur compte, rejoignent votre structure et consultent, empruntent ou réservent depuis leur téléphone.' },
]

const AUDIENCE = ['Bibliothèques communautaires', 'Écoles et universités', 'Centres culturels', 'Associations et ONG', 'Espaces de coworking', 'Médiathèques de quartier']
const ANNEE = new Date().getFullYear()

function useReveal() {
  useEffect(() => {
    const root = document.querySelector('.lp')
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!root || calm || !('IntersectionObserver' in window)) return undefined
    root.classList.add('lp-js')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      }),
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
    )
    root.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el))
    return () => {
      io.disconnect()
      root.classList.remove('lp-js')
    }
  }, [])
}

function useScrolled() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return scrolled
}

function goTo(id) {
  return (e) => {
    e.preventDefault()
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(id)?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
  }
}

export default function Landing() {
  const scrolled = useScrolled()
  useReveal()
  useEffect(() => {
    const before = document.title
    document.title = 'Baobab · Bibliothèques et espaces de coworking'
    return () => { document.title = before }
  }, [])

  return (
    <div className="lp">
      <header className={`lp-header ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="lp-brand"><img src="/favicon.png" alt="" />Baobab</Link>
        <nav className="lp-nav" aria-label="Sections de la page">
          <a href="#fonctions" onClick={goTo('fonctions')}>Fonctions</a>
          <a href="#modules" onClick={goTo('modules')}>Modules</a>
          <a href="#etapes" onClick={goTo('etapes')}>Comment ça marche</a>
          <a href="#pour-qui" onClick={goTo('pour-qui')}>Pour qui</a>
        </nav>
        <Link to="/login" className="btn btn-ochre">Se connecter</Link>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-in">
          <div>
            <span className="lp-eyebrow lp-rise">Bibliothèques · Coworking · Lecteurs</span>
            <h1 className="lp-rise" style={{ '--d': '90ms' }}>Le savoir, à l’ombre du <em>baobab</em></h1>
            <p className="lp-lead lp-rise" style={{ '--d': '180ms' }}>
              Baobab aide les bibliothèques et les espaces de coworking à gérer leur catalogue, leurs prêts, leurs membres et leurs réservations,
              simplement, et depuis n’importe quel appareil.
            </p>
            <div className="lp-cta lp-rise" style={{ '--d': '270ms' }}>
              <Link to="/login" className="btn btn-ochre btn-lg">Se connecter</Link>
              <a href="#fonctions" onClick={goTo('fonctions')} className="btn btn-lg lp-btn-light">Découvrir</a>
            </div>
          </div>
          <div className="lp-art lp-rise" style={{ '--d': '200ms' }}>
            <img src="/baobab.svg" alt="Un baobab au coucher du soleil sur la savane" />
          </div>
        </div>
        <a href="#fonctions" onClick={goTo('fonctions')} className="lp-scroll" aria-label="Faire défiler vers les fonctions"><span /></a>
      </section>

      <section id="fonctions" className="lp-section">
        <div className="lp-wrap">
          <h2 className="lp-title" data-reveal>Tout ce qu’il faut, rien de superflu</h2>
          <p className="lp-sub" data-reveal style={{ '--d': '80ms' }}>Des outils pensés pour les équipes qui n’ont pas le temps de s’occuper d’un logiciel compliqué.</p>
          <div className="lp-grid">
            {FEATURES.map((f, i) => (
              <article key={f.title} className="lp-card" data-reveal style={{ '--d': `${(i % 4) * 90}ms` }}>
                <div className="lp-ico"><Icon name={f.icon} /></div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="modules" className="lp-section lp-alt">
        <div className="lp-wrap">
          <h2 className="lp-title" data-reveal>Deux modules, une seule plateforme</h2>
          <p className="lp-sub" data-reveal style={{ '--d': '80ms' }}>Activez la bibliothèque, le coworking, ou les deux selon votre structure.</p>
          <div className="lp-modules">
            <article className="lp-panel" data-reveal>
              <span className="lp-chip">Module</span>
              <h3>Bibliothèque</h3>
              <ul>
                <li>Livres, exemplaires, auteurs et catégories</li>
                <li>Prêts, retours et suivi des échéances</li>
                <li>Membres, inscriptions et suspensions</li>
                <li>Import du catalogue depuis un fichier CSV</li>
              </ul>
              <div className="lp-mock" aria-hidden="true">
                <div className="lp-row"><span>Une si longue lettre</span><b className="ok">Disponible</b></div>
                <div className="lp-row"><span>L’Aventure ambiguë</span><b className="warn">Prêté</b></div>
                <div className="lp-row"><span>Les Soleils des indépendances</span><b className="ok">Disponible</b></div>
              </div>
            </article>
            <article className="lp-panel lp-panel-ochre" data-reveal style={{ '--d': '120ms' }}>
              <span className="lp-chip">Module</span>
              <h3>Coworking</h3>
              <ul>
                <li>Zones, postes, salles et ressources</li>
                <li>Réservations et gestion des clients</li>
                <li>Arrivées, sorties et suivi de présence</li>
                <li>Tarifs et enregistrement des paiements</li>
              </ul>
              <div className="lp-mock" aria-hidden="true">
                <div className="lp-row"><span>Salle Kapok · 09:00–12:00</span><b className="ok">Confirmée</b></div>
                <div className="lp-row"><span>Poste 4 · Journée</span><b className="warn">En attente</b></div>
                <div className="lp-row"><span>Espace ouvert · 14:00–18:00</span><b className="ok">Confirmée</b></div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="etapes" className="lp-section">
        <div className="lp-wrap">
          <h2 className="lp-title" data-reveal>Comment ça marche</h2>
          <p className="lp-sub" data-reveal style={{ '--d': '80ms' }}>Trois étapes, de l’ouverture de votre espace au premier prêt.</p>
          <ol className="lp-steps">
            {STEPS.map((s, i) => (
              <li key={s.n} data-reveal style={{ '--d': `${i * 110}ms` }}>
                <span className="lp-num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pour-qui" className="lp-section lp-alt">
        <div className="lp-wrap">
          <h2 className="lp-title" data-reveal>Pour qui ?</h2>
          <p className="lp-sub" data-reveal style={{ '--d': '80ms' }}>Partout où l’on prête des livres ou partage un espace de travail.</p>
          <div className="lp-chips">
            {AUDIENCE.map((a, i) => <span key={a} className="lp-pill" data-reveal style={{ '--d': `${i * 70}ms` }}>{a}</span>)}
          </div>
        </div>
      </section>

      <section className="lp-section lp-final">
        <div className="lp-cta-band" data-reveal>
          <h2>Prêt à ouvrir vos portes ?</h2>
          <p>Connectez-vous pour gérer votre structure. L’accès est réservé au personnel des structures et à l’administrateur de la plateforme.</p>
          <Link to="/login" className="btn btn-ochre btn-lg">Se connecter</Link>
        </div>
      </section>

      <footer className="lp-footer">
        <span>© {ANNEE} Baobab</span>
        <Link to="/confidentialite">Confidentialité</Link>
      </footer>
    </div>
  )
}