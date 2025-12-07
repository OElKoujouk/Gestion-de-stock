import { useEffect, useMemo, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Article = {
  id: string;
  nom: string;
  quantite: number;
  conditionnement?: string | null;
};

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
  reference?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const FAVORITES_STORAGE_KEY = "gestion-stock:agent-favorites";

const statusLabel: Record<DemandeStatus, string> = {
  en_attente: "En attente",
  preparee: "Prete",
  modifiee: "Modifiee",
  refusee: "Annulee",
};

const statusStyle: Record<DemandeStatus, string> = {
  en_attente: "bg-slate-100 text-slate-800 ring-1 ring-slate-200",
  preparee: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  modifiee: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
  refusee: "bg-rose-100 text-rose-900 ring-1 ring-rose-200",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });

export function AgentSection() {
  const { role, isAuthenticated } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [demandesLoading, setDemandesLoading] = useState(true);
  const [demandesError, setDemandesError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [expandedDemandeIds, setExpandedDemandeIds] = useState<Set<string>>(new Set());
  const [showAllInProgress, setShowAllInProgress] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(FAVORITES_STORAGE_KEY) : null;
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!isAuthenticated || role !== "agent") return;
    setArticlesLoading(true);
    api
      .getArticles()
      .then((data) => {
        setArticles(
          data.map((article) => ({
            id: article.id,
            nom: article.nom,
            quantite: article.quantite,
            conditionnement: (article as { conditionnement?: string | null }).conditionnement ?? null,
          })),
        );
        setArticlesError(null);
      })
      .catch((err) => setArticlesError(err instanceof Error ? err.message : "Impossible de charger les articles disponibles"))
      .finally(() => setArticlesLoading(false));
  }, [isAuthenticated, role]);

  const fetchDemandes = () => {
    if (!isAuthenticated || role !== "agent") return;
    setDemandesLoading(true);
    api
      .getDemandes()
      .then((data) => {
        setDemandes(data);
        setDemandesError(null);
      })
      .catch((err) => setDemandesError(err instanceof Error ? err.message : "Impossible de charger vos demandes"))
      .finally(() => setDemandesLoading(false));
  };

  useEffect(() => {
    fetchDemandes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, role]);

  const availableArticles = useMemo(() => articles.filter((article) => article.quantite > 0), [articles]);

  const articleIndex = useMemo(() => {
    const map = new Map<string, Article>();
    articles.forEach((article) => map.set(article.id, article));
    return map;
  }, [articles]);

  const selectedItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, quantity]) => quantity > 0)
        .map(([articleId, quantity]) => ({ articleId, quantity })),
    [cart],
  );

  const demandesSorted = useMemo(
    () =>
      [...demandes].sort((a, b) => {
        const aDate = a.updatedAt ?? a.createdAt ?? "";
        const bDate = b.updatedAt ?? b.createdAt ?? "";
        return bDate.localeCompare(aDate);
      }),
    [demandes],
  );

  const inProgressDemandes = useMemo(
    () => demandesSorted.filter((demande) => demande.statut === "en_attente" || demande.statut === "modifiee"),
    [demandesSorted],
  );

  // Historique: seulement les demandes cloturees (preparee/refusee)
  const historyDemandes = useMemo(
    () => demandesSorted.filter((demande) => demande.statut === "preparee" || demande.statut === "refusee").slice(0, 5),
    [demandesSorted],
  );
  const visibleInProgress = useMemo(
    () => (showAllInProgress ? inProgressDemandes : inProgressDemandes.slice(0, 3)),
    [inProgressDemandes, showAllInProgress],
  );
  const visibleHistory = useMemo(
    () => (showAllHistory ? historyDemandes : historyDemandes.slice(0, 3)),
    [historyDemandes, showAllHistory],
  );

  const demandeCode = (demande: Demande) => demande.reference ?? `CMD-${demande.id.slice(-6).toUpperCase()}`;

  const formatDemandeRef = (demande: Demande) => demandeCode(demande);

  const toggleFavorite = (articleId: string) => {
    setFavorites((prev) => (prev.includes(articleId) ? prev.filter((id) => id !== articleId) : [...prev, articleId]));
  };

  const toggleDemandeExpansion = (demandeId: string) => {
    setExpandedDemandeIds((prev) => {
      const next = new Set(prev);
      if (next.has(demandeId)) {
        next.delete(demandeId);
      } else {
        next.add(demandeId);
      }
      return next;
    });
  };

  const updateQuantity = (articleId: string, quantity: number, maxAllowed: number) => {
    if (Number.isNaN(quantity) || quantity < 0) return;
    if (quantity === 0) {
      setCart((prev) => {
        const next = { ...prev };
        delete next[articleId];
        return next;
      });
      return;
    }
    const safeQuantity = Math.min(quantity, Math.max(1, Math.min(maxAllowed, 20)));
    setCart((prev) => ({ ...prev, [articleId]: safeQuantity }));
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (selectedItems.length === 0) {
      setSubmitError("Ajoutez au moins un article a votre demande.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createDemande({ items: selectedItems.map((item) => ({ articleId: item.articleId, quantite: item.quantity })) });
      setCart({});
      setSubmitSuccess("Demande envoyee au responsable.");
      setToast({ message: "Demande envoyee", type: "success" });
      fetchDemandes();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Impossible d'envoyer la demande pour le moment.");
      setToast({ message: "Erreur lors de l'envoi", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelDemande = async (demandeId: string) => {
    setCancelingId(demandeId);
    setDemandesError(null);
    try {
      await api.cancelDemande(demandeId);
      fetchDemandes();
    } catch (err) {
      setDemandesError(err instanceof Error ? err.message : "Impossible d'annuler la demande pour le moment.");
    } finally {
      setCancelingId(null);
    }
  };

  if (!isAuthenticated || role !== "agent") {
    return (
      <div className="space-y-4">
        <SectionHeader
          eyebrow="Agent d'entretien"
          title="Acces reserve"
          description="Connectez-vous en tant qu'agent pour passer des commandes internes et suivre vos demandes."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Agent d'entretien"
        title="Commande produits"
        description="Articles ouverts, favoris, suivi des statuts (prete, modifiee, attente, refusee)."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Nouvelle demande interne"
            subtitle="Produits disponibles a la commande"
            action={
              submitError ? (
                <span className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
                  {submitError}
                </span>
              ) : submitSuccess ? (
                <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  {submitSuccess}
                </span>
              ) : null
            }
          />

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-dashed border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
              <p className="font-semibold">Pas de stock global</p>
              <p className="text-xs text-emerald-800">Seuls les articles disponibles a la demande s&apos;affichent ici.</p>
            </div>

            {articlesLoading ? (
              <p className="text-sm text-slate-500">Chargement des articles...</p>
            ) : articlesError ? (
              <p className="text-sm text-rose-600">{articlesError}</p>
            ) : availableArticles.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun article ouvert a la commande pour le moment.</p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/70 bg-white/70">
                {availableArticles.map((article) => {
                  const isFavorite = favorites.includes(article.id);
                  const quantity = cart[article.id] ?? 0;
                  const maxAllowed = Math.max(article.quantite, 1);
                  return (
                    <div key={article.id} className="flex flex-wrap items-center gap-3 px-3 py-3 sm:px-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{article.nom}</p>
                        <p className="truncate text-xs text-slate-500">
                          {article.conditionnement ? article.conditionnement : "Conditionnement non renseigne"}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Disponible</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">Commande interne</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(article.id)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-[11px] font-semibold transition",
                            isFavorite
                              ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                          )}
                        >
                          {isFavorite ? "Favori" : "Favori +"}
                        </button>
                        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(article.id, Math.max(0, quantity - 1), maxAllowed)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={maxAllowed}
                            value={quantity}
                            onChange={(event) => updateQuantity(article.id, Number(event.target.value), maxAllowed)}
                            className="h-7 w-12 rounded-md border border-slate-200 bg-white text-center text-sm font-semibold text-slate-900 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(article.id, quantity + 1, maxAllowed)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Recapitulatif avant envoi</p>
                <span className="text-xs text-slate-500">{selectedItems.length} ligne(s)</span>
              </div>

              {selectedItems.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {selectedItems.map(({ articleId, quantity }) => {
                    const article = articleIndex.get(articleId);
                    return (
                      <div
                        key={articleId}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{article?.nom ?? "Article"}</p>
                          <p className="text-xs text-slate-500">{article?.conditionnement ?? "Conditionnement non renseigne"}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-800">x{quantity}</span>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {submitting ? "Envoi..." : "Envoyer la demande au responsable"}
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Selectionnez des produits et des quantites pour constituer votre commande interne.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Favoris" subtitle="Raccourcis vers les articles les plus utilises" />
          <div className="mt-4 space-y-3">
            {favorites.length > 0 ? (
              favorites
                .map((favoriteId) => articleIndex.get(favoriteId))
                .filter((article): article is Article => Boolean(article))
                .map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-amber-50/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{article.nom}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateQuantity(article.id, (cart[article.id] ?? 0) + 1, Math.max(article.quantite, 1))}
                      className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-amber-700"
                    >
                      Ajouter
                    </button>
                  </div>
                ))
            ) : (
              <p className="text-sm text-slate-500">Aucun favori. Ajoutez-en depuis la liste des produits.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Mes demandes" subtitle="Statut en direct (prete, modifiee, en attente)" />
          <div className="mt-4 space-y-3">
            {demandesLoading ? (
              <p className="text-sm text-slate-500">Chargement des demandes...</p>
            ) : demandesError ? (
              <p className="text-sm text-rose-600">{demandesError}</p>
            ) : inProgressDemandes.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune demande en cours pour le moment.</p>
              ) : (
              inProgressDemandes.map((demande) => (
                <div key={demande.id} className="rounded-2xl border border-slate-200/70 bg-slate-50/80">
                  <button
                    type="button"
                    onClick={() => toggleDemandeExpansion(demande.id)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                    aria-expanded={expandedDemandeIds.has(demande.id)}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{formatDemandeRef(demande)}</p>
                      <p className="text-[11px] text-slate-500">
                        {demande.updatedAt ? dateFormatter.format(new Date(demande.updatedAt)) : "Date inconnue"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusStyle[demande.statut])}>
                        {statusLabel[demande.statut]}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
                        {expandedDemandeIds.has(demande.id) ? "Masquer" : "Voir"}
                      </span>
                    </div>
                  </button>

                  {expandedDemandeIds.has(demande.id) ? (
                    <div className="space-y-3 border-t border-slate-100 px-4 py-3">
                      <ul className="list-disc space-y-1 pl-4 text-sm font-semibold text-slate-900">
                        {demande.items.length === 0 ? (
                          <li>Demande sans article</li>
                        ) : (
                          demande.items.map((item) => {
                            const article = articleIndex.get(item.articleId);
                            const quantity = item.quantitePreparee > 0 ? item.quantitePreparee : item.quantiteDemandee;
                            return <li key={item.id}>{`${article?.nom ?? "Article"} x${quantity}`}</li>;
                          })
                        )}
                      </ul>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                        {demande.statut === "en_attente" ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCancelDemande(demande.id);
                            }}
                            disabled={cancelingId === demande.id}
                            className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                          >
                            {cancelingId === demande.id ? "Annulation..." : "Annuler"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Historique personnel" subtitle="Faits marquants des 5 dernieres demandes" />
          <div className="mt-4 space-y-2">
            {demandesLoading ? (
              <p className="text-sm text-slate-500">Chargement de l&apos;historique...</p>
            ) : demandesError ? (
              <p className="text-sm text-rose-600">{demandesError}</p>
            ) : historyDemandes.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune demande enregistree.</p>
            ) : (
              historyDemandes.map((demande) => (
                <div
                  key={demande.id}
                  className="rounded-xl border border-slate-100 bg-slate-50"
                >
                  <button
                    type="button"
                    onClick={() => toggleDemandeExpansion(demande.id)}
                    className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm text-slate-800"
                    aria-expanded={expandedDemandeIds.has(demande.id)}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{formatDemandeRef(demande)}</p>
                      <p className="text-[11px] text-slate-500">
                        {demande.updatedAt ? dateFormatter.format(new Date(demande.updatedAt)) : "Date inconnue"}
                      </p>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", statusStyle[demande.statut])}>
                      {statusLabel[demande.statut]}
                    </span>
                  </button>
                  {expandedDemandeIds.has(demande.id) ? (
                    <div className="space-y-2 border-t border-slate-100 px-3 py-2">
                      <ul className="list-disc space-y-1 pl-4 text-sm font-semibold text-slate-900">
                        {demande.items.length === 0 ? (
                          <li>Demande sans article</li>
                        ) : (
                          demande.items.map((item) => {
                            const article = articleIndex.get(item.articleId);
                            const quantity = item.quantitePreparee > 0 ? item.quantitePreparee : item.quantiteDemandee;
                            return <li key={item.id}>{`${article?.nom ?? "Article"} x${quantity}`}</li>;
                          })
                        )}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
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
