import { Card, CardHeader } from "@/components/ui/card";

const securityItems = [
  {
    title: "Middleware tenant",
    details: [
      "Injecte etablissement_id depuis le token/session.",
      "Ajoute automatiquement le filtre dans chaque repository/service.",
      "Ignoré uniquement pour le Super-Admin.",
    ],
  },
  {
    title: "Permissions par rôle",
    details: [
      "Super-Admin : vision globale et gestion des établissements.",
      "Administrateur : accès complet à son établissement.",
      "Responsable : gestion stock + mouvements + demandes.",
      "Agent : création/suivi de ses demandes uniquement.",
    ],
  },
  {
    title: "Authentification & protection",
    details: ["Hash Bcrypt des mots de passe", "JWT access/refresh ou session HTTP sécurisée", "Rate limiting sur /auth/login", "Audit log pour mouvements/demandes/suppressions"],
  },
  {
    title: "Isolation des données",
    details: ["Toutes les requêtes SELECT/UPDATE/DELETE utilisent etablissement_id", "Tests automatisés pour vérifier le respect des limites", "Alertes en cas d’accès refusé ou d’erreur tenant"],
  },
];

export function SecuritySection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Sécurité</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Isolation & protections</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          Le multi-tenant impose des garde-fous à toutes les couches : middleware, base de données, rôles et journalisation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {securityItems.map((item) => (
          <Card key={item.title}>
            <CardHeader title={item.title} />
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {item.details.map((detail) => (
                <li key={detail} className="flex gap-2">
                  <span className="text-slate-400">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
