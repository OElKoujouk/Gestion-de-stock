import { Card, CardHeader } from "@/components/ui/card";

const endpointGroups = [
  {
    title: "Auth",
    endpoints: ["POST /auth/login", "POST /auth/logout", "GET /auth/me"],
    note: "JWT (access + refresh) ou sessions serveur (cookies sécurisés).",
  },
  {
    title: "Super-Admin",
    endpoints: ["GET /etablissements", "POST /etablissements", "PUT /etablissements/:id", "DELETE /etablissements/:id"],
    note: "Pas de filtre tenant.",
  },
  {
    title: "Articles & catégories",
    endpoints: [
      "GET /articles (filtres nom, catégorie, référence)",
      "POST /articles",
      "GET /articles/:id",
      "PUT /articles/:id",
      "DELETE /articles/:id",
      "GET /categories",
      "POST /categories",
      "PUT /categories/:id",
      "DELETE /categories/:id",
    ],
  },
  {
    title: "Mouvements",
    endpoints: ["POST /mouvements", "GET /mouvements?date&type&article_id"],
    note: "Chaque écriture déclenche une entrée journalisée.",
  },
  {
    title: "Utilisateurs",
    endpoints: [
      "GET /users",
      "POST /users",
      "PUT /users/:id",
      "PATCH /users/:id/activation",
      "DELETE /users/:id",
    ],
  },
  {
    title: "Demandes internes",
    endpoints: [
      "POST /demandes",
      "GET /demandes (agent)",
      "GET /demandes/:id",
      "GET /demandes/toutes (responsable)",
      "PATCH /demandes/:id (modifier quantité/statut)",
    ],
    note: "Validation => décrémente stock.",
  },
  {
    title: "Commandes fournisseurs",
    endpoints: [
      "POST /fournisseurs/commandes",
      "GET /fournisseurs/commandes",
      "PATCH /fournisseurs/commandes/:id (statut reçue → entrée stock)",
    ],
    note: "Optionnel MVP.",
  },
];

export function ApiSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">API</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Endpoints REST</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          Toutes les routes passent par un middleware d’authentification, un middleware de rôle et un middleware tenant (sauf super-admin) afin de garantir l’isolation.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {endpointGroups.map((group) => (
          <Card key={group.title}>
            <CardHeader title={group.title} subtitle={group.note} />
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {group.endpoints.map((endpoint) => (
                <li key={endpoint} className="flex gap-2">
                  <span className="text-slate-400">•</span>
                  <span>{endpoint}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
