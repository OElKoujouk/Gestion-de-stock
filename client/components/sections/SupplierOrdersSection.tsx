import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

export function SupplierOrdersSection() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Commandes fournisseurs"
        title="Approvisionnements"
        description="L’administrateur peut créer une commande, ajouter des articles et mettre à jour l’état. À la réception, une entrée de stock est générée automatiquement."
      />

      <Card>
        <CardHeader
          title="Commandes"
          subtitle="Suivi des états"
          action={<button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800">Nouvelle commande</button>}
        />
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Aucune commande simulée n’est affichée. Les données réelles apparaîtront ici dès que le module sera branché à l’API.
        </div>
      </Card>
    </div>
  );
}
