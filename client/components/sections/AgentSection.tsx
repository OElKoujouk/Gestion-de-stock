import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

export function AgentSection() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Agent d’entretien"
        title="Commander des produits en interne"
        description="L’agent ne voit pas le stock global : il accède uniquement aux produits disponibles à la demande, peut les ajouter en favoris et suivre le statut de ses demandes (prête, modifiée, refusée)."
      />

      <Card>
        <CardHeader title="Interface dédiée" subtitle="Commande interne, favoris et historique personnel" />
        <p className="text-sm text-slate-600">
          Les agents disposent d’un espace dédié pour passer leurs commandes internes, retrouver leurs favoris et consulter l’historique de leurs demandes. L’intégration temps réel sera branchée sur l’API.
        </p>
      </Card>
    </div>
  );
}
