import { useEffect, useMemo, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ───────────────────── Types ───────────────────── */

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
type EstablishmentOption = { id: string; nom: string };

/* ───────────────────── UI const ───────────────────── */

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
});

const STATUS_LABELS: Record<Exclude<DemandeStatus, "en_attente">, string> = {
  preparee: "Validée",
  modifiee: "Modifiée",
  refusee: "Refusée",
};

const STATUS_BADGE: Record<Exclude<DemandeStatus, "en_attente">, string> = {
  preparee: "bg-emerald-100 text-emerald-700",
  modifiee: "bg-amber-100 text-amber-700",
  refusee: "bg-rose-100 text-rose-700",
};

const STATUS_BORDER: Record<Exclude<DemandeStatus, "en_attente">, string> = {
  preparee: "border-l-emerald-400",
  modifiee: "border-l-amber-400",
  refusee: "border-l-rose-400",
};

/* ───────────────────── Component ───────────────────── */

export function MovementsSection() {
  const { role } = useAuth();
  const isSuperAdmin = role === "superAdmin";

  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [establishments, setEstablishments] = useState<EstablishmentOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");

  const [agentFilter, setAgentFilter] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "preparee" | "modifiee" | "refusee">("all");
  const [sortMode, setSortMode] =
    useState<"date_desc" | "date_asc">("date_desc");

  const [openId, setOpenId] = useState<string | null>(null);

  /* ───────── Fetch établissements (super admin) ───────── */

  useEffect(() => {
    if (!isSuperAdmin) return;

    api
      .getEstablishments()
      .then((data) =>
        setEstablishments(data.map((e) => ({ id: e.id, nom: e.nom }))),
      )
      .catch(() => setEstablishments([]));
  }, [isSuperAdmin]);

  /* ───────── Fetch mouvements ───────── */

  useEffect(() => {
    setLoading(true);
    const params =
      isSuperAdmin && selectedTenantId
        ? { etablissementId: selectedTenantId }
        : undefined;

    Promise.all([api.getDemandes(params), api.getArticles(params)])
      .then(([demandeData, articleData]) => {
        setDemandes(demandeData as Demande[]);
        setArticles(articleData.map((a: any) => ({ id: a.id, nom: a.nom })));
        setError(null);
      })
      .catch(() =>
        setError("Impossible de charger l’historique des mouvements"),
      )
      .finally(() => setLoading(false));
  }, [isSuperAdmin, selectedTenantId]);

  /* ───────── Derived data ───────── */

  const articleIndex = useMemo(
    () => new Map(articles.map((a) => [a.id, a])),
    [articles],
  );

  const mouvements = useMemo(
    () => demandes.filter((d) => d.statut !== "en_attente"),
    [demandes],
  );

  const agentOptions = useMemo(() => {
    const map = new Map<string, string>();
    mouvements.forEach((d) => {
      if (d.agent)
        map.set(d.agent.id, d.agent.nom ?? d.agent.email ?? "Agent");
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [mouvements]);

  const filtered = useMemo(() => {
    return mouvements
      .filter((d) => (agentFilter ? d.agent?.id === agentFilter : true))
      .filter((d) =>
        statusFilter === "all" ? true : d.statut === statusFilter,
      )
      .sort((a, b) => {
        const da = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const db = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return sortMode === "date_desc" ? db - da : da - db;
      });
  }, [mouvements, agentFilter, statusFilter, sortMode]);

  /* ───────────────────── Render ───────────────────── */

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Historique"
        title="Mouvements de stock"
        description="Entrées et sorties validées, modifiées ou refusées."
      />

      {/* Filtres */}
      <Card>
        <CardHeader title="Filtres" />
        <div className="flex flex-wrap gap-3 pt-2">
          {isSuperAdmin && (
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="rounded-full border px-3 py-1 text-sm"
            >
              <option value="">Tous les établissements</option>
              {establishments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom}
                </option>
              ))}
            </select>
          )}

          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="rounded-full border px-3 py-1 text-sm"
          >
            <option value="">Tous les agents</option>
            {agentOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-full border px-3 py-1 text-sm"
          >
            <option value="all">Tous statuts</option>
            <option value="preparee">Validées</option>
            <option value="modifiee">Modifiées</option>
            <option value="refusee">Refusées</option>
          </select>

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as any)}
            className="rounded-full border px-3 py-1 text-sm"
          >
            <option value="date_desc">Plus récentes</option>
            <option value="date_asc">Plus anciennes</option>
          </select>
        </div>
      </Card>

      {/* Liste */}
      <Card>
        <CardHeader
          title="Historique"
          subtitle={`${filtered.length} mouvement(s)`}
        />

        {loading ? (
          <p className="text-sm text-slate-500">Chargement…</p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun mouvement.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {filtered.map((d) => {
              const status = d.statut as Exclude<
                DemandeStatus,
                "en_attente"
              >;
              const isOpen = openId === d.id;

              return (
                <div
                  key={d.id}
                  className={cn(
                    "overflow-hidden rounded-xl border border-slate-200 bg-white border-l-4",
                    STATUS_BORDER[status],
                  )}
                >
                  {/* Ligne compacte */}
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : d.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold">
                        {d.agent?.nom?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {d.agent?.nom ?? "Agent inconnu"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {d.items.length} article(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          STATUS_BADGE[status],
                        )}
                      >
                        {STATUS_LABELS[status]}
                      </span>

                      <span className="text-xs text-slate-500">
                        {dateFormatter.format(
                          new Date(d.updatedAt ?? d.createdAt ?? 0),
                        )}
                      </span>

                      <span
                        className={cn(
                          "text-slate-400 transition-transform",
                          isOpen && "rotate-180",
                        )}
                      >
                        ▾
                      </span>
                    </div>
                  </button>

                  {/* Détails */}
                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                      <ul className="space-y-2 text-sm">
                        {d.items.map((item) => {
                          const article =
                            articleIndex.get(item.articleId);
                          const qty =
                            item.quantitePreparee ||
                            item.quantiteDemandee;

                          return (
                            <li
                              key={item.id}
                              className="flex items-center gap-2"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              <span className="font-medium text-slate-900">
                                {article?.nom ?? "Article"}
                              </span>
                              <span className="text-slate-500">
                                × {qty}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
