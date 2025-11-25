import { Card, CardHeader } from "@/components/ui/card";

export function AdminEstablishmentSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Administrateur établissement</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Pilotage d’un établissement</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          Gérez votre stock, vos utilisateurs et vos commandes fournisseurs depuis une interface unique. Chaque action reste cantonnée à votre établissement.
        </p>
      </div>

      <Card>
        <CardHeader title="Module en cours de construction" subtitle="La gestion détaillée sera pilotée directement depuis cette interface" />
        <p className="text-sm text-slate-600">
          Dès que les flux seront branchés, vous pourrez suivre les stocks, les demandes et les commandes fournisseurs ici même. Pour l’instant, aucune donnée mockée n’est
          affichée afin de partir d’une base vierge.
        </p>
      </Card>
    </div>
  );
}
