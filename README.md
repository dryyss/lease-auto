# lease-auto.fr

Nouveau site de Lease Auto (cahier des charges : [CDC-LEA1](Cahier_des_charges_CDC-LEA1_Lease_Auto.md)).

**Stack :** Next.js 15.4 · Payload CMS 3.91 · PostgreSQL · Auth0 · hébergement Vercel.
Design : structure et composants inspirés de Finarent, aux couleurs de Lease Auto.

> Versions bloquées volontairement : Payload ≥ 3.92 exige Node ≥ 22.23, et Payload n'accepte pas Next 15.5.
> Pour passer à Payload 3.92+, mettre Node à jour (22.23+ ou 24.22+).

## Démarrer en local

```bash
docker compose up -d          # PostgreSQL sur le port 5433
cp .env.example .env          # puis remplir PAYLOAD_SECRET et AUTH0_*
pnpm install
pnpm dev                      # http://localhost:3000, admin sur /admin
pnpm create-admin vous@exemple.fr "Prénom Nom"   # premier administrateur
```

En développement, Payload crée et met à jour les tables tout seul. Avant la mise en production, générer les migrations (`pnpm payload migrate:create`).

## Connexion à l'administration (Auth0)

- **Auth0 gère l'identité** : connexion, mot de passe oublié, double authentification.
- **Payload gère les rôles** (`admin` ou `commercial`) dans la collection Utilisateurs. C'est la seule source de vérité.
- Pour donner un accès : créer l'utilisateur dans l'admin avec son e-mail. Un compte Auth0 dont l'e-mail n'existe pas dans Payload est renvoyé vers `/acces-refuse`.
- Pour retirer un accès : cocher « Accès désactivé ».

Configuration Auth0 (Applications → *Regular Web Application*) :

| Réglage | Valeurs |
|---|---|
| Allowed Callback URLs | `http://localhost:3000/auth/callback, https://www.lease-auto.fr/auth/callback` |
| Allowed Logout URLs | `http://localhost:3000, https://www.lease-auto.fr` |
| Allowed Web Origins | `http://localhost:3000, https://www.lease-auto.fr` |

Désactiver l'inscription publique (Authentication → Database → *Disable Sign Ups*) : les comptes sont créés sur invitation.

Le SDK est `@auth0/nextjs-auth0` v4. Les routes sont `/auth/*`, pas `/api/auth/*` comme sur Finarent (v3).

## Organisation

| Dossier | Contenu |
|---|---|
| `src/collections` | Véhicules, Marques/Modèles, Demandes, Justificatifs, Rendez-vous, Abonnés, Avis, FAQ, Articles, Pages locales, Images, Utilisateurs |
| `src/globals` | Page d'accueil, Réglages (coordonnées, taux, délais, mentions légales), Créneaux de rendez-vous |
| `src/access` | Règles d'accès admin / commercial / public |
| `src/auth` | Stratégie de connexion Auth0 pour Payload |
| `src/lib/finance.ts` | Calcul des mensualités LOA / LLD / crédit (admin et simulateur) |
| `ressources/ancien-site` | Images et textes récupérés de l'ancien site |

Les justificatifs clients sont stockés hors de `public/` (`private/documents`) et ne sont servis qu'à l'équipe connectée.

## Tests

```bash
pnpm test:int    # tests unitaires (calcul des mensualités)
pnpm test:e2e    # tests navigateur (Playwright)
```
