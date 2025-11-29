import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

export function StoreManagerSection() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Responsable magasin"
        title="Inventaire & préparation"
        description="Le responsable tient l’inventaire, gère les produits et catégories, prépare les demandes internes des agents (avec mise à jour automatique des stocks) et suit les mouvements du jour."
      />

      <Card>
        <CardHeader title="Tableau de bord magasin" subtitle="Inventaire, mouvements et préparation des demandes" />
        <p className="text-sm text-slate-600">
          Cette vue regroupera l’inventaire, les mises à jour de quantités (entrées/sorties), la préparation des demandes internes et des statistiques internes (consommation par agent, filtres par période). Les données seront branchées sur l’API.
        </p>
      </Card>
    </div>
  );
}
