import { Card, CardHeader } from "@/components/ui/card";

export function ProductsSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Gestion des produits</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Catalogue par établissement</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          Administrateurs et responsables magasin peuvent ajouter, modifier ou supprimer un article. Chaque produit est lié à son établissement avec un seuil d’alerte configuré.
        </p>
      </div>

      <Card>
        <CardHeader title="Catalogue vide" subtitle="L’ajout de produits se fera uniquement via l’interface une fois connectée à l’API" />
        <p className="text-sm text-slate-600">
          Les tableaux mockés ont été retirés. Cette section restera vide tant que les formulaires de création/édition n’auront pas été développés.
        </p>
      </Card>
    </div>
  );
}
