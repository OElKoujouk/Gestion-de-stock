import { Card, CardHeader } from "@/components/ui/card";

const tables = [
  {
    name: "Établissements",
    fields: ["id", "nom", "created_at", "updated_at"],
    note: "Point d’entrée pour isoler le tenant.",
  },
  {
    name: "Utilisateurs",
    fields: [
      "id",
      "etablissement_id (nullable pour Super-Admin)",
      "nom",
      "email unique",
      "mot_de_passe (hash)",
      "role",
      "actif",
      "created_at/updated_at",
    ],
    note: "Rôles : superadmin, admin, responsable, agent.",
  },
  {
    name: "Articles",
    fields: [
      "id",
      "etablissement_id",
      "categorie_id (nullable)",
      "nom",
      "quantite",
      "reference_fournisseur",
      "seuil_alerte",
      "description",
      "timestamps",
    ],
  },
  {
    name: "Catégories",
    fields: ["id", "etablissement_id", "nom"],
  },
  {
    name: "Mouvements",
    fields: ["id", "etablissement_id", "article_id", "user_id", "type (entrée/sortie)", "quantite", "commentaire", "created_at"],
    note: "Indexer sur article_id + created_at.",
  },
  {
    name: "Demandes",
    fields: ["id", "etablissement_id", "agent_id", "statut", "created_at", "updated_at"],
  },
  {
    name: "Demande items",
    fields: ["id", "demande_id", "article_id", "quantite_demandee", "quantite_preparee"],
    note: "Permet 1 demande = n articles.",
  },
  {
    name: "Commandes fournisseurs",
    fields: ["id", "etablissement_id", "fournisseur", "statut", "created_at", "updated_at"],
  },
  {
    name: "Commande items",
    fields: ["id", "commande_id", "article_id", "quantite"],
  },
];

export function DataModelSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Données</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Modèle relationnel</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          Toutes les tables métiers incluent un champ etablissement_id pour garantir l’isolation. Les FK et index sont indispensables pour maintenir la cohérence.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {tables.map((table) => (
          <Card key={table.name}>
            <CardHeader title={table.name} subtitle={table.note} />
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {table.fields.map((field) => (
                <li key={field} className="flex gap-2">
                  <span className="text-slate-400">•</span>
                  <span>{field}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
