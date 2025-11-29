import { Card, CardHeader } from "@/components/ui/card";

export function SupplierOrdersSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Commandes fournisseurs</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Approvisionnements</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          L administrateur peut cr er une commande, ajouter des articles et mettre  jour l tat.  la r ception, une entr e de stock est g n r e automatiquement.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Commandes"
          subtitle="Suivi des tats"
          action={<button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Nouvelle commande</button>}
        />
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Aucune commande simul e n est affich e. Les donn es r elles appara tront ici d s que le module sera branch  l API.
        </div>
      </Card>
    </div>
  );
}
