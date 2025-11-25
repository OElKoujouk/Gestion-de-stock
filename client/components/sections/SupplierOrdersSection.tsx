import { Card, CardHeader } from "@/components/ui/card";

const supplierOrders = [
  { ref: "CMD-2408-01", supplier: "HygiPlus", items: 5, status: "En cours", state: "Préparation fournisseur" },
  { ref: "CMD-2407-14", supplier: "Clean&Co", items: 8, status: "Reçue", state: "Stock mis à jour" },
  { ref: "CMD-2407-07", supplier: "EcoNet", items: 3, status: "En cours", state: "Attente réception" },
];

export function SupplierOrdersSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Commandes fournisseurs</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Approvisionnements</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          L’administrateur peut créer une commande, ajouter des articles et mettre à jour l’état. À la réception, une entrée de stock est générée automatiquement.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Commandes"
          subtitle="Suivi des états"
          action={<button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Nouvelle commande</button>}
        />
        <div className="mt-4 overflow-x-auto text-sm">
          <table className="min-w-full">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-3 pr-6 font-semibold">Référence</th>
                <th className="pb-3 pr-6 font-semibold">Fournisseur</th>
                <th className="pb-3 pr-6 font-semibold">Articles</th>
                <th className="pb-3 pr-6 font-semibold">Statut</th>
                <th className="pb-3 font-semibold text-right">État détaillé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {supplierOrders.map((order) => (
                <tr key={order.ref}>
                  <td className="py-4 pr-6 font-semibold text-slate-900">{order.ref}</td>
                  <td className="py-4 pr-6">{order.supplier}</td>
                  <td className="py-4 pr-6">{order.items}</td>
                  <td className="py-4 pr-6">{order.status}</td>
                  <td className="py-4 text-right text-slate-500">{order.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
