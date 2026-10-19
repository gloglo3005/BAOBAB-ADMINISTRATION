# baobab-administration

Interface React (Vite) pour l'**administrateur global** et le **personnel (staff)** des structures.
Le lecteur a son propre projet : `baobab-user`.

## Lancer

```bash
cp .env.example .env     # puis ajuster si besoin
npm install
npm run dev              # http://localhost:5173
```

Le backend Django doit tourner sur `http://localhost:8000`. Le port 5173 est autorisé par défaut
dans `CORS_ALLOWED_ORIGINS`.

## Rôles

La connexion appelle `POST /api/v1/auth/login/` puis `GET /api/v1/auth/me/` :

| Rôle | Détection | Accès |
|---|---|---|
| Admin global | `is_platform_admin` | page « Administration globale » (lien vers `/global/`) |
| Staff | `staff_organizations` non vide | modules de la structure choisie |
| Autre compte | — | refusé (à utiliser sur `baobab-user`) |

Un compte staff de plusieurs structures choisit la structure active dans la barre latérale.
Les modules (bibliothèque / coworking) apparaissent selon les drapeaux de la structure.

## Pages
- Bibliothèque : tableau de bord, livres (+ exemplaires), membres, prêts (retour et renouvellement), import du catalogue (CSV ou XLSX), catégories et emplacements.
- Coworking : vue d'ensemble, réservations, arrivées/sorties, paiements, clients, zones et ressources.
- Plateforme : création et gestion des structures (informations, modules, statut) et journal d'audit global. L'admin Django reste disponible sur `/global/`.
- Responsable de structure : équipe, paramètres de la structure et journal d'audit.

## Structure
`src/api.js` (client + JWT) · `src/auth.jsx` · `src/org.jsx` (structure active) · `src/ui.jsx` (composants) · `src/pages/`.

## Limites actuelles
Pas de test automatisé du front. Pas de « mot de passe oublié » (les e-mails ne sont pas encore branchés côté backend).
