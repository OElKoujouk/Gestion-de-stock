import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

export function SuperAdminSection() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Super-admin"
        title="Vision globale du service"
        description="Surveillez l’activité de chaque établissement, pilotez les administrateurs et centralisez les alertes critiques. Les données restent cloisonnées par tenant."
      />

      <Card>
        <CardHeader title="Tableau de bord à construire" subtitle="Les indicateurs globaux seront branchés sur les données réelles" />
        <p className="text-sm text-slate-600">
          Tous les anciens chiffres fictifs ont été retirés pour ne garder que l’interface fonctionnelle. Branchez l’API pour alimenter cet écran.
        </p>
      </Card>
    </div>
  );
}
