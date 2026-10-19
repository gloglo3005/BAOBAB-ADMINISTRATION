import { Link } from 'react-router-dom'
import { usePageTitle } from '../ui'

// Adresse de contact de la plateforme (facultative) : définir VITE_PRIVACY_EMAIL dans le fichier .env.
const CONTACT = import.meta.env.VITE_PRIVACY_EMAIL

const SECTIONS = [
  ['essentiel', "L'essentiel"],
  ['donnees', 'Les données concernées'],
  ['usage', "À quoi elles servent"],
  ['navigateur', 'Ce qui est enregistré dans votre navigateur'],
  ['partage', 'Qui peut les voir'],
  ['conservation', 'Combien de temps elles sont gardées'],
  ['droits', 'Vos droits'],
  ['securite', 'Sécurité'],
  ['contact', 'Nous contacter'],
]

export default function Privacy() {
  usePageTitle('Confidentialité')
  return (
    <div className="legal-page">
      <article className="card legal-card">
        <p className="legal-top"><Link to="/">← Retour</Link></p>
        <h1>Politique de confidentialité</h1>
        <p className="muted">Dernière mise à jour : octobre 2026</p>

        <nav className="legal-toc" aria-label="Sommaire">
          <strong>Sommaire</strong>
          <ol>
            {SECTIONS.map(([id, text]) => <li key={id}><a href={`#${id}`}>{text}</a></li>)}
          </ol>
        </nav>

        <section id="essentiel">
          <h2>L'essentiel</h2>
          <ul className="legal-summary">
            <li>Baobab n'utilise <strong>aucun cookie publicitaire</strong> et aucun outil de suivi de votre navigation.</li>
            <li>Vos informations sont gérées par <strong>la structure</strong> (bibliothèque, espace de coworking) dont vous faites partie, via la plateforme Baobab.</li>
            <li>Vous pouvez <strong>effacer les données gardées dans votre navigateur</strong> à tout moment, depuis la page « Compte » ou en vous déconnectant.</li>
            <li>Pour consulter, corriger ou supprimer vos données, adressez-vous à votre structure.</li>
          </ul>
        </section>

        <section id="donnees">
          <h2>Les données concernées</h2>
          <ul>
            <li><strong>Identité et contact</strong> : nom, prénom, adresse e-mail, numéro de téléphone.</li>
            <li><strong>Activité dans la structure</strong> : fiche de membre, prêts et retours de livres, réservations, présences et paiements du coworking.</li>
            <li><strong>Compte</strong> : mot de passe (conservé sous forme chiffrée, jamais en clair) et date de dernière modification.</li>
            <li><strong>Journal d'audit</strong> : pour la sécurité, certaines actions du personnel (création, modification, suppression) sont enregistrées dans un journal que consultent les responsables de la structure.</li>
          </ul>
        </section>

        <section id="usage">
          <h2>À quoi elles servent</h2>
          <p>
            Uniquement à faire fonctionner le service : vous identifier, gérer les prêts et les réservations, vous
            permettre de consulter vos emprunts, et permettre à la structure d'assurer sa gestion. Elles ne sont ni vendues, ni utilisées à des fins publicitaires.
          </p>
        </section>

        <section id="navigateur">
          <h2>Ce qui est enregistré dans votre navigateur</h2>
          <p>Baobab n'enregistre que ce qui est nécessaire au fonctionnement ou que vous avez choisi :</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Élément</th><th>À quoi il sert</th><th>Durée</th></tr>
              </thead>
              <tbody>
                <tr><td>Jeton de connexion</td><td>Éviter de retaper votre mot de passe à chaque page.</td><td>Jusqu'à la déconnexion</td></tr>
                <tr><td>Copie hors connexion</td><td>Relire les pages déjà consultées lorsque le réseau est coupé.</td><td>7 jours au plus, effacée à la déconnexion</td></tr>
                <tr><td>Choix du bandeau d'information</td><td>Ne pas vous le réafficher.</td><td>Jusqu'à ce que vous vidiez les données du site</td></tr>
                <tr><td>Thème d'affichage</td><td>Garder votre choix clair, sombre ou automatique.</td><td>Jusqu'à ce que vous vidiez les données du site</td></tr>
              </tbody>
            </table>
          </div>
          <p>Aucun cookie publicitaire, aucun outil de statistiques, aucun traceur de tiers.</p>
        </section>

        <section id="partage">
          <h2>Qui peut les voir</h2>
          <ul>
            <li><strong>Vous</strong>, pour les informations de votre compte.</li>
            <li><strong>Le personnel de votre structure</strong>, pour les données de sa propre structure uniquement. Une structure ne voit pas les données d'une autre.</li>
            <li><strong>L'équipe technique de la plateforme</strong>, dans la mesure nécessaire à l'hébergement et à la maintenance du service.</li>
          </ul>
        </section>

        <section id="conservation">
          <h2>Combien de temps elles sont gardées</h2>
          <p>
            Tant que votre compte est actif et que la structure en a besoin pour sa gestion. La durée précise est fixée par
            votre structure ; elle peut supprimer ou anonymiser une fiche sur demande.
          </p>
        </section>

        <section id="droits">
          <h2>Vos droits</h2>
          <p>
            Vous pouvez demander à accéder à vos données, à les faire corriger, à en demander la suppression, à vous opposer à
            leur utilisation ou à en obtenir une copie. Adressez votre demande à votre structure ; elle y donnera suite avec
            l'équipe de la plateforme. Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l'autorité de
            protection des données personnelles de votre pays.
          </p>
        </section>

        <section id="securite">
          <h2>Sécurité</h2>
          <p>
            Les échanges entre votre appareil et le service sont chiffrés (HTTPS). Les mots de passe sont conservés sous forme
            chiffrée. Pensez à vous déconnecter sur un appareil partagé et à choisir un mot de passe que vous n'utilisez
            nulle part ailleurs.
          </p>
        </section>

        <section id="contact">
          <h2>Nous contacter</h2>
          <p>
            Pour toute question sur vos données, contactez d'abord votre structure.
            {CONTACT && <> Vous pouvez aussi écrire à l'équipe de la plateforme : <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</>}
          </p>
        </section>

        <p className="legal-actions">
          <Link className="btn" to="/">Retour à l'application</Link>
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>Imprimer</button>
        </p>
      </article>
    </div>
  )
}
