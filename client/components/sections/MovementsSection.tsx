import { Card, CardHeader } from "@/components/ui/card";

export function MovementsSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Mouvements</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Entrées & sorties tracées</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          Chaque mouvement contient le produit, le type, la quantité, l’utilisateur et un commentaire. L’historique est filtrable par date, produit ou utilisateur.
        </p>
      </div>
      <Card>
        <CardHeader title="Historique des mouvements" subtitle="Les flux réels apparaîtront ici une fois la fonctionnalité connectée" />
        <p className="text-sm text-slate-600">Plus aucun mock : cette carte restera vide jusqu’à ce que les mouvements soient saisis via l’interface.</p>
      </Card>
    </div>
  );
}
