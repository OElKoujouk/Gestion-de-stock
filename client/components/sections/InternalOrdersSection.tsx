import { Card, CardHeader } from "@/components/ui/card";

export function InternalOrdersSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Commandes internes</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Flux agent → responsable</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          Les agents soumettent leurs besoins, le responsable magasin prépare la commande, peut modifier les quantités et le stock est mis à jour automatiquement.
        </p>
      </div>

      <Card>
        <CardHeader title="Aucun mock affiché" subtitle="Le workflow agent → responsable sera branché ici" />
        <p className="text-sm text-slate-600">Cette section sera alimentée par les vraies demandes internes dès que les formulaires seront opérationnels.</p>
      </Card>
    </div>
  );
}
