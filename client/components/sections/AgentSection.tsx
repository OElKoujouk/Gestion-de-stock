import { Card, CardHeader } from "@/components/ui/card";

export function AgentSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Agent d’entretien</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Commander des produits en interne</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          L’agent ne voit pas tout le stock : il accède uniquement aux produits disponibles à la demande, peut les ajouter en favoris et suivre l’état de ses demandes.
        </p>
      </div>

      <Card>
        <CardHeader title="Interface épurée" subtitle="La demande de produits sera implémentée prochainement" />
        <p className="text-sm text-slate-600">
          Nous avons retiré les données fictives afin de repartir d’une interface vide. Les agents disposeront bientôt d’un formulaire connecté pour envoyer leurs demandes.
        </p>
      </Card>
    </div>
  );
}
