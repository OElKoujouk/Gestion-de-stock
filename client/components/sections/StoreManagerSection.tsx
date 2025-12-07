import { useEffect, useMemo, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/context/auth-context";
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
  reference?: string | null;
  items: DemandeItem[];
  etablissement?: { id: string; nom: string };
  agent?: { id: string; nom: string; contactEmail?: string | null };
  createdAt?: string;
  updatedAt?: string;
};

type ArticleWithStock = { id: string; nom: string; quantite: number; seuilAlerte: number };

const statusLabel: Record<DemandeStatus, string> = {
  en_attente: "En attente",
  preparee: "Prete",
  modifiee: "Modifiee",
  refusee: "Refusee",
};

const statusStyle: Record<DemandeStatus, string> = {
  en_attente: "bg-slate-100 text-slate-800 ring-1 ring-slate-200",
  preparee: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  modifiee: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
  refusee: "bg-rose-100 text-rose-900 ring-1 ring-rose-200",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });

export function StoreManagerSection() {
  const { role } = useAuth();
  const isSuperAdmin = role === "superAdmin";

  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [demandesLoading, setDemandesLoading] = useState(true);
  const [demandesError, setDemandesError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedDemandes, setExpandedDemandes] = useState<Record<string, boolean>>({});
  const [showAllDemandes, setShowAllDemandes] = useState(false);

  const [establishments, setEstablishments] = useState<Array<{ id: string; nom: string }>>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  const [articles, setArticles] = useState<ArticleWithStock[]>([]);
  const [quantityEdits, setQuantityEdits] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      api
        .getEstablishments()
        .then((data) => setEstablishments(data.map((e: any) => ({ id: e.id, nom: e.nom }))))
        .catch(() => setEstablishments([]));
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const params = isSuperAdmin && selectedTenantId ? { etablissementId: selectedTenantId } : undefined;
    api
      .getArticles(params)
      .then((data) =>
        setArticles(
          data.map((item: { id: string; nom: string; quantite: number; seuilAlerte: number }) => ({
            id: item.id,
            nom: item.nom,
            quantite: item.quantite,
            seuilAlerte: item.seuilAlerte,
          })),
        ),
      )
      .catch(() => setArticles([]));
  }, [isSuperAdmin, selectedTenantId]);

  const articleIndex = useMemo(() => {
    const map = new Map<string, ArticleWithStock>();
    articles.forEach((a) => map.set(a.id, a));
    return map;
  }, [articles]);

  const lowStockArticles = useMemo(
    () => articles.filter((article) => article.quantite <= article.seuilAlerte),
    [articles],
  );
  const sortedArticles = useMemo(() => [...articles].sort((a, b) => a.nom.localeCompare(b.nom)), [articles]);

  const fetchDemandes = () => {
    setDemandesLoading(true);
    const params = isSuperAdmin && selectedTenantId ? { etablissementId: selectedTenantId } : undefined;
    api
      .getDemandes(params)
      .then((data) => {
        setDemandes(data);
        setDemandesError(null);
        const defaults: Record<string, number> = {};
        data.forEach((demande: Demande) => {
          demande.items.forEach((item) => {
            defaults[item.id] = item.quantitePreparee > 0 ? item.quantitePreparee : item.quantiteDemandee;
          });
        });
        setQuantityEdits(defaults);
      })
      .catch((err) => setDemandesError(err instanceof Error ? err.message : "Impossible de charger les demandes"))
      .finally(() => setDemandesLoading(false));
  };

  useEffect(() => {
    fetchDemandes();
  }, [selectedTenantId, isSuperAdmin]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const activeDemandes = useMemo(() => demandes.filter((demande) => demande.statut === "en_attente" || demande.statut === "modifiee"), [demandes]);

  const demandesSorted = useMemo(
    () =>
      [...activeDemandes].sort((a, b) => {
        const aDate = a.updatedAt ?? a.createdAt ?? "";
        const bDate = b.updatedAt ?? b.createdAt ?? "";
        return bDate.localeCompare(aDate);
      }),
    [activeDemandes],
  );
  const visibleDemandes = useMemo(() => (showAllDemandes ? demandesSorted : demandesSorted.slice(0, 3)), [demandesSorted, showAllDemandes]);

  const handleQuantityChange = (itemId: string, value: number) => {
    if (Number.isNaN(value) || value < 0) return;
    setQuantityEdits((prev) => ({ ...prev, [itemId]: value }));
  };

  const handlePrepare = async (demande: Demande, statut: "preparee" | "modifiee") => {
    setSavingId(demande.id);
    setDemandesError(null);
    try {
      const itemsPayload = demande.items.map((item) => ({
        itemId: item.id,
        quantitePreparee: quantityEdits[item.id] ?? item.quantitePreparee ?? item.quantiteDemandee,
      }));
      const updated = await api.updateDemande(demande.id, { statut, items: itemsPayload });
      setDemandes((prev) => prev.map((d) => (d.id === demande.id ? (updated as Demande) : d)));
      const statusLabelText = statut === "preparee" ? "validee" : "modifiee";
      setToast({ message: `Commande ${formatDemandeRef(demande)} ${statusLabelText}`, type: "success" });
    } catch (err) {
      setDemandesError(err instanceof Error ? err.message : "Impossible de mettre à jour la demande.");
      setToast({ message: "Erreur lors de la mise a jour", type: "error" });
    } finally {
      setSavingId(null);
    }
  };

  const handleRefuse = async (demandeId: string) => {
    setSavingId(demandeId);
    setDemandesError(null);
    try {
      const updated = await api.refuseDemande(demandeId);
      setDemandes((prev) => prev.map((d) => (d.id === demandeId ? (updated as Demande) : d)));
    } catch (err) {
      setDemandesError(err instanceof Error ? err.message : "Impossible de refuser la demande.");
    } finally {
      setSavingId(null);
    }
  };

  const formatItems = (items: DemandeItem[]) =>
    items
      .map((item) => {
        const article = articleIndex.get(item.articleId);
        const qty = quantityEdits[item.id] ?? item.quantitePreparee ?? item.quantiteDemandee;
        return `${article?.nom ?? "Article"} x${qty}`;
      })
      .join(", ");

  const demandeCode = (demande: Demande) => demande.reference ?? `CMD-${demande.id.slice(-6).toUpperCase()}`;

  const formatDemandeRef = (demande: Demande) => demandeCode(demande);

  const demandeLabel = (demande: Demande) => {
    const firstArticle = demande.items[0] ? articleIndex.get(demande.items[0].articleId)?.nom ?? "Demande" : "Demande";
    const date = demande.createdAt ? dateFormatter.format(new Date(demande.createdAt)) : "";
    return `${firstArticle} · ${demande.items.length} ligne${demande.items.length > 1 ? "s" : ""}${date ? ` · ${date}` : ""}`;
  };

  const toggleDemandeDetails = (id: string) => {
    setExpandedDemandes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Responsable magasin"
        title="Preparer les demandes & gerer le stock"
        description="Consulte les demandes des agents, ajuste les quantites demandees et valide la preparation (avec decrement automatique du stock). Acces aux categories et produits pour maintenir l'inventaire."
      />

      {isSuperAdmin ? (
        <Card>
          <CardHeader title="Etablissement" subtitle="Filtrer les commandes internes" />
          <div className="mt-2">
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Tous les etablissements</option>
              {establishments.map((etab) => (
                <option key={etab.id} value={etab.id}>
                  {etab.nom}
                </option>
              ))}
            </select>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Produits en alerte" subtitle="Quantites au seuil ou en dessous" />
          {articles.length === 0 ? (
            <p className="text-sm text-slate-500">Chargement des articles...</p>
          ) : lowStockArticles.length === 0 ? (
            <p className="text-sm text-emerald-600">Aucun produit n'est actuellement au seuil.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {lowStockArticles.map((article) => {
                const deficit = article.seuilAlerte - article.quantite;
                const ratio = article.seuilAlerte > 0 ? Math.min(article.quantite / article.seuilAlerte, 1) : 1;
                return (
                  <div key={article.id} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-inner shadow-amber-100">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{article.nom}</p>
                        <p className="text-xs text-slate-600">
                          Stock actuel: <span className="font-semibold text-slate-900">{article.quantite}</span> / seuil{" "}
                          <span className="font-semibold text-slate-900">{article.seuilAlerte}</span>
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-800">
                        {deficit >= 0 ? `Manque ${deficit}` : "Seuil atteint"}
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/70">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${ratio * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <Card>
        <CardHeader title="Demandes des agents" subtitle="Preparation et mise a jour des quantites" />
        <div className="mt-4 space-y-3">
          {demandesLoading ? (
            <p className="text-sm text-slate-500">Chargement des demandes...</p>
          ) : demandesError ? (
            <p className="text-sm text-rose-600">{demandesError}</p>
          ) : demandesSorted.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune demande en cours.</p>
          ) : (
            visibleDemandes.map((demande: Demande) => {
              const isEditable = demande.statut === "en_attente" || demande.statut === "modifiee";
              const isExpanded = expandedDemandes[demande.id] ?? false;
              return (
                <div key={demande.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <button
                    type="button"
                    onClick={() => toggleDemandeDetails(demande.id)}
                    className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {demande.agent?.nom ?? demande.agentNom ?? "Agent inconnu"}
                      </p>
                      <p className="text-xs text-slate-600">{formatDemandeRef(demande)}</p>
                    </div>
                    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusStyle[demande.statut])}>
                      {statusLabel[demande.statut]}
                    </span>
                  </button>

                  {isExpanded ? (
                    <>
                      <div className="mt-3 space-y-2">
                        {demande.items.map((item) => {
                          const article = articleIndex.get(item.articleId);
                          const value = quantityEdits[item.id] ?? item.quantitePreparee ?? item.quantiteDemandee;
                          const stock = article?.quantite ?? 0;
                          return (
                            <div
                              key={item.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{article?.nom ?? "Article"}</p>
                                <p className="text-xs text-slate-500">Demandee: {item.quantiteDemandee}</p>
                                <p className="text-[11px] text-slate-500">Stock dispo: {stock}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={value}
                                  onChange={(event) => handleQuantityChange(item.id, Number(event.target.value))}
                                  disabled={!isEditable}
                                  className={cn(
                                    "h-9 w-20 rounded-lg border border-slate-200 px-2 text-sm font-semibold text-slate-900 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100",
                                    !isEditable && "bg-slate-50 text-slate-500",
                                  )}
                                />
                                <span className="text-xs text-slate-500">A preparer</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-white px-2 py-1">{formatDemandeRef(demande)}</span>
                        <span className="rounded-full bg-white px-2 py-1">{formatItems(demande.items)}</span>
                        <span className="rounded-full bg-white px-2 py-1">{demandeLabel(demande)}</span>
                      </div>

                      {isEditable ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handlePrepare(demande, "preparee")}
                            disabled={savingId === demande.id}
                            className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {savingId === demande.id ? "Validation..." : "Valider"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrepare(demande, "modifiee")}
                            disabled={savingId === demande.id}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {savingId === demande.id ? "Sauvegarde..." : "Enregistrer comme modifiee"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRefuse(demande.id)}
                            disabled={savingId === demande.id}
                            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          >
                            {savingId === demande.id ? "Refus..." : "Refuser"}
                          </button>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-slate-500">Demande non editable (statut {statusLabel[demande.statut]}).</p>
                      )}
                    </>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">Cliquez pour afficher les details de la demande.</p>
                  )}
                </div>
              );
            })
          )}
          {demandesSorted.length > 3 && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowAllDemandes((prev) => !prev)}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {showAllDemandes ? "Voir moins" : `Voir les ${demandesSorted.length - 3} autres`}
              </button>
            </div>
          )}
        </div>
      </Card>
      {toast ? (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg",
            toast.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-700/30"
              : "bg-rose-600 text-white shadow-rose-700/30",
          )}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
