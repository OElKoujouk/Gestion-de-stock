import { useEffect, useMemo, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type DemandeStatus = "en_attente" | "preparee" | "modifiee" | "refusee";

type DemandeItem = {
  id: string;
  articleId: string;
  quantiteDemandee: number;
  quantitePreparee: number;
};

type Demande = {
  id: string;
  statut: DemandeStatus;
  items: DemandeItem[];
  agent?: { id: string; nom: string; email: string };
  createdAt?: string;
  updatedAt?: string;
};

type Article = { id: string; nom: string };

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });

export function MovementsSection() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"date_desc" | "date_asc">("date_desc");
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "preparee" | "modifiee" | "refusee">("all");

  useEffect(() => {
    Promise.all([api.getDemandes(), api.getArticles()])
      .then(([demandesData, articlesData]) => {
        setDemandes(demandesData as Demande[]);
        setArticles((articlesData as Array<{ id: string; nom: string }>).map((a) => ({ id: a.id, nom: a.nom })));
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger les mouvements"))
      .finally(() => setLoading(false));
  }, []);

  const articleIndex = useMemo(() => {
    const map = new Map<string, Article>();
    articles.forEach((a) => map.set(a.id, a));
    return map;
  }, [articles]);

  const mouvements = useMemo(
    () => demandes.filter((d) => d.statut === "preparee" || d.statut === "modifiee" || d.statut === "refusee"),
    [demandes],
  );

  const agentOptions = useMemo(() => {
    const options = new Map<string, { id: string; label: string }>();
    mouvements.forEach((demande) => {
      if (demande.agent) {
        options.set(demande.agent.id, {
          id: demande.agent.id,
          label: `${demande.agent.nom ?? demande.agent.email ?? "Agent"}`,
        });
      }
    });
    return Array.from(options.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [mouvements]);

  const formatItems = (items: DemandeItem[]) =>
    items
      .map((item) => {
        const article = articleIndex.get(item.articleId);
        const qty = item.quantitePreparee > 0 ? item.quantitePreparee : item.quantiteDemandee;
        return `${article?.nom ?? "Article"} x${qty}`;
      })
      .join(", ");

  const movementDate = (demande: Demande) => new Date(demande.updatedAt ?? demande.createdAt ?? 0).getTime();

  const filteredMouvements = useMemo(() => {
    return mouvements.filter((demande) => {
      const matchAgent = agentFilter ? demande.agent?.id === agentFilter : true;
      const matchStatus = statusFilter === "all" ? true : demande.statut === statusFilter;
      return matchAgent && matchStatus;
    });
  }, [agentFilter, statusFilter, mouvements]);

  const sortedMouvements = useMemo(() => {
    const base = [...filteredMouvements];
    return base.sort((a, b) => {
      switch (sortMode) {
        case "date_asc":
          return movementDate(a) - movementDate(b);
        case "date_desc":
        default:
          return movementDate(b) - movementDate(a);
      }
    });
  }, [filteredMouvements, sortMode, articleIndex]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Mouvements"
        title="Entrees & sorties"
        description="Historique des demandes preparees ou modifiees (decrement de stock). Les donnees viennent de l'API en temps reel."
      />
      <Card>
        <CardHeader
          title="Historique / Mouvements"
          subtitle="Demandes preparees / modifiees"
          action={
            mouvements.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                <select value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)} className="rounded-full border border-slate-200 px-3 py-1">
                  <option value="">Tous les agents</option>
                  {agentOptions.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.label}
                    </option>
                  ))}
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="rounded-full border border-slate-200 px-3 py-1">
                  <option value="all">Tous les statuts</option>
                  <option value="preparee">Demandes validées</option>
                  <option value="modifiee">Demandes modifiées</option>
                  <option value="refusee">Demandes refusées</option>
                </select>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as typeof sortMode)}
                  className="rounded-full border border-slate-200 px-3 py-1"
                >
                  <option value="date_desc">Date (recent en premier)</option>
                  <option value="date_asc">Date (plus anciens)</option>
                </select>
              </div>
            ) : null
          }
        />
        {loading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : sortedMouvements.length === 0 ? (
          <p className="text-sm text-slate-500">
            {agentFilter || statusFilter !== "all" ? "Aucun mouvement pour ces filtres." : "Aucun mouvement a afficher."}
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {sortedMouvements.map((demande) => (
              <div
                key={demande.id}
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm",
                  demande.statut === "preparee" ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{demande.agent?.nom ?? "Agent inconnu"}</p>
                    {demande.agent ? (
                      <p className="text-xs text-slate-600">
                        Par {demande.agent.nom} ({demande.agent.email})
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs text-slate-600">
                    {demande.updatedAt
                      ? dateFormatter.format(new Date(demande.updatedAt))
                      : demande.createdAt
                        ? dateFormatter.format(new Date(demande.createdAt))
                        : "Date inconnue"}
                  </span>
                </div>
                <p className="text-xs text-slate-600">Statut: {demande.statut === "preparee" ? "Prete" : demande.statut === "modifiee" ? "Modifiee" : "Refusee"}</p>
                <p className="text-xs text-slate-500">{formatItems(demande.items)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}


