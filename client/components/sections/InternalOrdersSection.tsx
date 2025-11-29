import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

export function InternalOrdersSection() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Commandes internes"
        title="Flux agent → responsable"
        description="Les agents soumettent leurs besoins, le responsable magasin prépare la commande, peut modifier les quantités et le stock est mis à jour automatiquement."
      />

      <Card>
        <CardHeader title="Aucun mock affiché" subtitle="Le workflow agent → responsable sera branché ici" />
        <p className="text-sm text-slate-600">Cette section sera alimentée par les vraies demandes internes dès que les formulaires seront opérationnels.</p>
      </Card>
    </div>
  );
}
