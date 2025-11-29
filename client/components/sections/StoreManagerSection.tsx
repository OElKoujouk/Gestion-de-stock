import { Card, CardHeader } from "@/components/ui/card";

export function StoreManagerSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Responsable magasin</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Inventaire & préparation</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          Le responsable tient l'inventaire, gère les produits et catégories, prépare les demandes internes des agents (avec
          mise à jour automatique des stocks) et suit les mouvements du jour.
        </p>
      </div>

      <Card>
        <CardHeader title="Tableau de bord magasin" subtitle="Inventaire, mouvements et préparation des demandes" />
        <p className="text-sm text-slate-600">
          Cette vue regroupera l'inventaire, les mises à jour de quantités (entrées/sorties), la préparation des demandes
          internes et des statistiques internes (consommation par agent, filtres par période). Les données seront branchées sur
          l'API.
        </p>
      </Card>
    </div>
  );
}
