# Contexte general
- Application de gestion de stock multi-tenant: serveur Express/Prisma (MySQL) + front Next.js 16 (app router). Roles prevus: `superadmin`, `admin`, `responsable`, `agent`.
- Repertoires clefs: `server/` (API), `server/prisma/` (schema + migrations), `client/` (UI Next), `.env` a la racine et dans `server/` pour la configuration locale.

# Backend (server/)
- Stack: Express + TypeScript, Prisma MySQL, JWT pour l auth (secret `JWT_SECRET`, port `PORT`, CORS via `CORS_ORIGIN`). Commandes: `npm run dev` (ts-node-dev), `npm run build`, `npm start`.
- Bootstrap: `src/index.ts` charge l app Express et `ensureSuperAdmin` (src/bootstrap.ts) qui cree un compte superadmin par defaut `admin-s` / `admin` si absent.
- Middleware: `authMiddleware` (JWT Bearer -> `req.user`), `tenantMiddleware` (force `req.tenantId`, null pour superadmin), `allowRoles` pour filtrer les roles.
- Routage (`src/router.ts`): `/auth` (login/logout/me), puis routes protegees par auth+tenant:
  - `/etablissements` superadmin uniquement (CRUD simple).
  - `/articles`, `/categories`, `/mouvements` (CRUD + mouvements qui ajustent la quantite).
  - `/demandes` (creation/lecture par agent/responsable/admin; patch par responsable/admin avec decrements de stock).
  - `/fournisseurs/commandes` (admin/responsable: creation, lecture, changement de statut avec increments de stock).
  - `/users` (superadmin/admin: CRUD + activation).
- Modele Prisma (`prisma/schema.prisma`): etablissements -> categories -> articles; mouvements; demandes + demandeItems; commandes fournisseurs + items; users rattaches a un etablissement (optionnel pour superadmin). Enums: `Role`, `MovementType`, `DemandeStatut`, `SupplierOrderStatus`.

# Frontend (client/)
- Stack: Next.js 16 + React 19, TypeScript. Commandes: `npm run dev`, `build`, `start`, `lint`. Config Tailwind v4 (postcss) + CSS globale `app/globals.css`.
- Page unique `app/page.tsx`: navigation par sections (sidebar + mobile), depend du role connecte. L authentification met a jour un contexte simple (`context/auth-context.tsx`) stockant role + etat connecte.
- API client `lib/api.ts`: wrapper fetch vers `NEXT_PUBLIC_API_URL` (defaut `http://localhost:4000`), token en memoire via `setAccessToken` (pas de persistance). Endpoints utilises: login, me, stats (GET /articles), etablissements, users, creation d etablissement/utilisateur.
- Sections UI (`components/sections/*`): panneaux explicatifs pour chaque role (SuperAdmin/Admin/Responsable/Agent) et modules (produits, mouvements, commandes internes/fournisseurs, stats, auth). `StatsSection` consomme `/articles`; `AuthSection` gere le formulaire de login.
- Composants UI utilitaires: sidebar/mobile nav, cartes (`components/ui/card.tsx`), etc.

# Points d attention / dettes
- Le README backend mentionne encore un stub en memoire; la version actuelle utilise Prisma/MySQL et JWT.
- Aucun test automatise. Validation et messages d erreur minimalistes; pas de protection contre la suppression/edition inter-tenant en dehors du filtre tenant.
- Token garde uniquement en memoire cote client (perdu au refresh), pas de refresh token ni stockage securise.
- CORS configure avec `credentials: false`; ajuster si session/persistant requis.
- Seeds: superadmin cree au demarrage avec identifiants connus; a changer en prod.

# Lancement rapide
- Prerequis: base MySQL et `DATABASE_URL` renseigne; executer les migrations Prisma si besoin.
- API: `cd server && npm install && npm run dev` (ou `npm start` apres `npm run build`).
- Front: `cd client && npm install && npm run dev` (NEXT_PUBLIC_API_URL doit pointer sur l API).
