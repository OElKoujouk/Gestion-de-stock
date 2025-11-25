import { Card, CardHeader } from "@/components/ui/card";

const priorities = [
  { title: "1. Auth + rôles + middleware tenant", description: "Mise en place de la base multi-tenant : login, JWT/sessions, guards et contexte établissement." },
  { title: "2. CRUD Articles", description: "Gestion des produits (filtres, seuils, références) — cœur du stock." },
  { title: "3. Mouvements entrées/sorties", description: "Entrées après inventaire/commande, sorties pour demandes ou corrections." },
  { title: "4. Tableau de bord simple", description: "KPI par rôle, alertes stock bas, activités récentes." },
  { title: "5. Gestion utilisateurs", description: "Création, activation/désactivation, assignation d’établissement et de rôle." },
  { title: "6. Système de demandes internes", description: "Flux agent → responsable avec validation et décrémentation automatique." },
  { title: "7. Statistiques simples", description: "Consommation par agent, alertes critiques, filtres temporels." },
];

export function PrioritiesSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Roadmap</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Priorités techniques MVP</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          L’ordre des chantiers garantit que l’isolation multi-tenant reste respectée dès les premières itérations et que les fonctionnalités critiques sont livrées rapidement.
        </p>
      </div>

      <Card>
        <CardHeader title="Backlog priorisé" />
        <ol className="mt-4 space-y-3 text-sm text-slate-600">
          {priorities.map((priority) => (
            <li key={priority.title} className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="font-semibold text-slate-900">{priority.title}</p>
              <p>{priority.description}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
