import { Card, CardHeader } from "@/components/ui/card";

const highlights = [
  {
    title: "Multi-tenant SaaS",
    description:
      "Chaque établissement possède ses propres données (articles, utilisateurs, mouvements). Toutes les tables critiques incluent un champ etablissement_id.",
  },
  {
    title: "Isolation forte",
    description:
      "Middleware tenant applique automatiquement un filtre WHERE etablissement_id = user.etablissement_id sur toutes les requêtes non-super-admin.",
  },
  {
    title: "Supervision globale",
    description:
      "Le Super-Admin n’est pas restreint par le middleware et peut monitorer l’ensemble des établissements, stats et alertes.",
  },
  {
    title: "Journalisation",
    description:
      "Actions critiques (mouvements, demandes, suppressions) sont historisées pour audit et traçabilité.",
  },
];

export function ArchitectureSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Architecture</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Vue d’ensemble multi-tenant</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          L’application est pensée comme un SaaS pour plusieurs établissements scolaires. Chaque couche (base, API, interface) applique les contraintes de séparation et
          aide le Super-Admin à administrer l’ensemble du parc.
        </p>
      </div>

      <Card>
        <CardHeader title="Bloc logique" subtitle="Front SPA + API REST + base relationnelle" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 px-4 py-4">
              <p className="text-base font-semibold text-slate-900">{item.title}</p>
              <p className="text-sm text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
