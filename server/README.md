# API Gestion de stock — serveur

Ce dossier contient une ébauche d’API REST en Node.js/Express qui suit le cahier des charges multi-tenant :

- **Middleware d’authentification** (`src/middleware/auth.ts`) — stub lisant des en-têtes pour simuler JWT/sessions.
- **Middleware tenant** — injecte `req.tenantId` (null pour le super-admin) et protège toutes les requêtes.
- **Guards de rôles** — limitent l’accès aux routes sensibles.
- **Routes REST** pour l’ensemble des modules (articles, catégories, mouvements, utilisateurs, demandes, commandes fournisseurs, établissements).
- **Modèle de données** simulé en mémoire (`src/db.ts`) avec les champs exigés (`etablissement_id`, `seuil_alerte`, etc.).

## Scripts

```bash
# développement
npm install
npm run dev

# build TypeScript
npm run build
```

L’API écoute sur `http://localhost:4000` et attend des en-têtes `x-user-role` et `x-tenant-id` pour simuler les rôles/établissements tant que la vraie authentification n’est pas branchée.
