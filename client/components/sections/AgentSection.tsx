import { Card, CardHeader } from "@/components/ui/card";

export function AgentSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Agent d'entretien</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Commander des produits en interne</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          L'agent ne voit pas le stock global : il accède uniquement aux produits disponibles à la demande, peut les ajouter en
          favoris et suivre le statut de ses demandes (prête, modifiée, refusée).
        </p>
      </div>

      <Card>
        <CardHeader title="Interface dédiée" subtitle="Commande interne, favoris et historique personnel" />
        <p className="text-sm text-slate-600">
          Les agents disposent d'un espace dédié pour passer leurs commandes internes, retrouver leurs favoris et consulter
          l'historique de leurs demandes. L'intégration temps réel sera branchée sur l'API.
        </p>
      </Card>
    </div>
  );
}
