import { useEffect, useMemo, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { api } from "@/lib/api";

export function StatsSection() {
  const [articles, setArticles] = useState<Array<{ id: string; nom: string; quantite: number; seuilAlerte: number }> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .stats()
      .then((data) => setArticles(data as Array<{ id: string; nom: string; quantite: number; seuilAlerte: number }>))
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de récupérer les statistiques"));
  }, []);

  const alertCount = useMemo(
    () => (articles ? articles.filter((article) => article.quantite <= article.seuilAlerte).length : 0),
    [articles],
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Statistiques MVP"
        title="Indicateurs essentiels"
        description="Focus sur les indicateurs inclus dans le MVP : niveaux de stock, alertes, consommation par agent et période."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {articles ? (
          <>
            <Card>
              <p className="text-sm text-slate-500">Articles (API)</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900">{articles.length}</p>
              <p className="text-sm text-slate-500">Nombre total d’articles disponibles.</p>
            </Card>
            <Card>
              <p className="text-sm text-slate-500">Alertes de stock</p>
              <p className="mt-1 text-3xl font-semibold text-rose-600">{alertCount}</p>
              <p className="text-sm text-slate-500">Produits au seuil ou en dessous.</p>
            </Card>
          </>
        ) : error ? (
          <Card>
            <p className="text-sm text-slate-500">Articles (API)</p>
            <p className="text-sm text-rose-600">{error}</p>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-slate-500">Articles (API)</p>
            <p className="text-sm text-slate-400">Chargement...</p>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader title="Statistiques à venir" subtitle="Le reste des KPI sera construit une fois les données disponibles" />
        <p className="text-sm text-slate-600">Nous avons supprimé tous les chiffres fictifs pour repartir d’un écran vierge.</p>
      </Card>
    </div>
  );
}
