import { Card, CardHeader } from "@/components/ui/card";

export function StoreManagerSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Responsable magasin</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Inventaire & préparation</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          Cette zone affichera l’inventaire temps réel, les mouvements du jour et la préparation des demandes internes une fois les flux branchés.
        </p>
      </div>

      <Card>
        <CardHeader title="Module en cours de construction" />
        <p className="text-sm text-slate-600">
          Aucun mock ne subsiste dans cette vue. Lorsque les fonctionnalités d’inventaire seront développées, elles apparaîtront ici.
        </p>
      </Card>
    </div>
  );
}
