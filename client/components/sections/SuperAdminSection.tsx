import { Card, CardHeader } from "@/components/ui/card";

export function SuperAdminSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Super-Admin</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Vision globale du service</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          Surveillez l'activite de chaque etablissement, pilotez les administrateurs et centralisez les alertes critiques. Chaque donnee est isolee mais
          visible pour garantir la coherence du reseau.
        </p>
      </div>

      <Card>
        <CardHeader title="Tableau de bord a construire" subtitle="Les indicateurs globaux seront branches sur les donnees reelles" />
        <p className="text-sm text-slate-600">Tous les anciens chiffres fictifs ont ete retires pour ne garder que l'interface fonctionnelle.</p>
      </Card>
    </div>
  );
}
