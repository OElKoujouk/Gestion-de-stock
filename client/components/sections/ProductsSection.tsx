import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type EstablishmentOption = { id: string; nom: string };
type Category = { id: string; nom: string };
type Article = {
  id: string;
  nom: string;
  quantite: number;
  referenceFournisseur?: string | null;
  seuilAlerte: number;
  categorieId?: string | null;
};

const initialArticleForm = {
  nom: "",
  categorieId: "",
  quantite: 0,
  referenceFournisseur: "",
  seuilAlerte: 0,
};

const GRID_MANAGE = "0.45fr 2fr 1fr 0.7fr 0.7fr 0.9fr"; // checkbox + nom + ref + qty + seuil + actions
const GRID_VIEW = "2fr 1fr 0.7fr 0.7fr"; // nom + ref + qty + seuil

export function ProductsSection() {
  const { role, hasAbility } = useAuth();
  const isSuperAdmin = role === "superAdmin";
  const canManageCategories = hasAbility("manageCategories");
  const canManageProducts = hasAbility("manageProducts");
  const canManage = canManageCategories || canManageProducts;

  const [establishments, setEstablishments] = useState<EstablishmentOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [establishmentsLoading, setEstablishmentsLoading] = useState(false);
  const [establishmentsError, setEstablishmentsError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState({ categories: true, articles: true });
  const [errors, setErrors] = useState<{ categories: string | null; articles: string | null }>({
    categories: null,
    articles: null,
  });

  // Catégories : séparer création / édition (évite les bugs de champ partagé)
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [articleForm, setArticleForm] = useState(initialArticleForm);
  const [articleSubmitting, setArticleSubmitting] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [savingArticleId, setSavingArticleId] = useState<string | null>(null);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  // Sélection + bulk actions
  const [selectedArticleIds, setSelectedArticleIds] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkUpdatingCategory, setBulkUpdatingCategory] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const targetTenantId = isSuperAdmin ? selectedTenantId || "" : undefined;
  const canLoadInventory = !isSuperAdmin || Boolean(targetTenantId);
  const readyToManage = canManage && canLoadInventory;
  const showCategoriesManager = readyToManage && canManageCategories;
  const showProductsManager = readyToManage && canManageProducts;

  /* --------------------- Établissements --------------------- */

  useEffect(() => {
    if (!isSuperAdmin) {
      setEstablishments([]);
      setSelectedTenantId("");
      setEstablishmentsLoading(false);
      setEstablishmentsError(null);
      return;
    }

    setEstablishmentsLoading(true);
    api
      .getEstablishments()
      .then((data) => {
        const options = data.map((item) => ({ id: item.id, nom: item.nom }));
        setEstablishments(options);
        setEstablishmentsError(null);
        setSelectedTenantId((prev) =>
          prev && options.some((opt) => opt.id === prev) ? prev : options[0]?.id ?? "",
        );
      })
      .catch((err) =>
        setEstablishmentsError(
          err instanceof Error ? err.message : "Impossible de charger les établissements",
        ),
      )
      .finally(() => setEstablishmentsLoading(false));
  }, [isSuperAdmin]);

  /* --------------------- Fetch catégories & articles --------------------- */

  const fetchCategories = async (tenantId?: string) => {
    setLoading((prev) => ({ ...prev, categories: true }));
    try {
      const data = await api.getCategories(tenantId ? { etablissementId: tenantId } : undefined);
      setCategories(data);
      setErrors((prev) => ({ ...prev, categories: null }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        categories: err instanceof Error ? err.message : "Impossible de charger les catégories",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, categories: false }));
    }
  };

  const fetchArticles = async (tenantId?: string) => {
    setLoading((prev) => ({ ...prev, articles: true }));
    try {
      const params: Record<string, string> = {};
      if (tenantId) params.etablissementId = tenantId;
      const data = await api.getArticles(Object.keys(params).length ? params : undefined);
      setArticles(data);
      setSelectedArticleIds(new Set());
      setErrors((prev) => ({ ...prev, articles: null }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        articles: err instanceof Error ? err.message : "Impossible de charger les produits",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, articles: false }));
    }
  };

  useEffect(() => {
    if (!canLoadInventory) {
      setLoading({ categories: false, articles: false });
      setEditingArticleId(null);
      setSelectedArticleIds(new Set());
      return;
    }
    setEditingArticleId(null);
    setSelectedArticleIds(new Set());
    void fetchCategories(targetTenantId);
    void fetchArticles(targetTenantId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoadInventory, targetTenantId]);

  /* --------------------- Création / édition catégories --------------------- */

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageCategories) {
      setCategoryError("Vous n'avez pas la permission de créer des catégories.");
      return;
    }
    if (isSuperAdmin && !targetTenantId) {
      setCategoryError("Choisissez un établissement.");
      return;
    }
    if (!newCategoryName.trim()) {
      setCategoryError("Le nom est requis.");
      return;
    }
    setCategoryError(null);
    setCategorySubmitting(true);
    try {
      const category = await api.createCategory({
        nom: newCategoryName.trim(),
        etablissementId: targetTenantId,
      });
      setCategories((prev) => [category, ...prev]);
      setNewCategoryName("");
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Impossible de créer la catégorie");
    } finally {
      setCategorySubmitting(false);
    }
  };

  /* --------------------- Création / édition articles --------------------- */

  const handleCreateArticle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageProducts) {
      setArticleError("Vous n'avez pas la permission de créer des produits.");
      return;
    }
    if (isSuperAdmin && !targetTenantId) {
      setArticleError("Choisissez un établissement.");
      return;
    }
    if (!articleForm.nom.trim()) {
      setArticleError("Le nom est requis.");
      return;
    }
    setArticleError(null);
    setArticleSubmitting(true);
    try {
      const payload = {
        nom: articleForm.nom.trim(),
        categorieId: articleForm.categorieId || null,
        quantite: Number(articleForm.quantite),
        referenceFournisseur: articleForm.referenceFournisseur.trim() || "",
        seuilAlerte: Number(articleForm.seuilAlerte),
        etablissementId: targetTenantId,
      };
      const article = await api.createArticle(payload);
      setArticles((prev) => [article, ...prev]);
      setArticleForm(initialArticleForm);
    } catch (err) {
      setArticleError(err instanceof Error ? err.message : "Impossible de créer le produit");
    } finally {
      setArticleSubmitting(false);
    }
  };

  const toggleArticleSelection = (articleId: string, checked: boolean) => {
    setSelectedArticleIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(articleId);
      else next.delete(articleId);
      return next;
    });
  };

  const toggleSelectMany = (ids: string[], checked: boolean) => {
    setSelectedArticleIds((prev) => {
      const next = new Set(prev);
      if (checked) ids.forEach((id) => next.add(id));
      else ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedArticleIds(new Set());

  const updateArticleField = async (articleId: string, patch: Partial<Article>) => {
    setSavingArticleId(articleId);
    try {
      const payload: Partial<{
        nom: string;
        referenceFournisseur: string | null;
        quantite: number;
        seuilAlerte: number;
        categorieId: string | null;
      }> = {};

      if (patch.nom !== undefined) payload.nom = patch.nom;
      if (patch.referenceFournisseur !== undefined)
        payload.referenceFournisseur = patch.referenceFournisseur ?? null;
      if (patch.quantite !== undefined) payload.quantite = patch.quantite;
      if (patch.seuilAlerte !== undefined) payload.seuilAlerte = patch.seuilAlerte;
      if (patch.categorieId !== undefined) payload.categorieId = patch.categorieId ?? null;

      const updated = await api.updateArticle(articleId, payload);
      setArticles((prev) => prev.map((item) => (item.id === articleId ? { ...item, ...updated } : item)));
      setArticleError(null);
    } catch (err) {
      setArticleError(err instanceof Error ? err.message : "Impossible de mettre à jour le produit");
    } finally {
      setSavingArticleId(null);
    }
  };

  const handleDeleteArticle = async (articleId: string, articleName: string) => {
    if (!window.confirm(`Supprimer le produit « ${articleName} » ?`)) return;
    setDeletingArticleId(articleId);
    try {
      await api.deleteArticle(articleId);
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      setEditingArticleId((prev) => (prev === articleId ? null : prev));
      setSelectedArticleIds((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
    } catch (err) {
      setArticleError(err instanceof Error ? err.message : "Impossible de supprimer le produit");
    } finally {
      setDeletingArticleId(null);
    }
  };

  const handleBulkCategoryUpdate = async () => {
    if (!selectedArticleIds.size || bulkUpdatingCategory) return;
    setBulkUpdatingCategory(true);
    setArticleError(null);

    const targetCategory = bulkCategoryId || null;
    try {
      await Promise.all(
        Array.from(selectedArticleIds).map((id) => api.updateArticle(id, { categorieId: targetCategory })),
      );
      setArticles((prev) =>
        prev.map((article) =>
          selectedArticleIds.has(article.id) ? { ...article, categorieId: targetCategory } : article,
        ),
      );
    } catch (err) {
      setArticleError(
        err instanceof Error
          ? err.message
          : "Impossible de changer la catégorie des produits sélectionnés",
      );
    } finally {
      setBulkUpdatingCategory(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedArticleIds.size || bulkDeleting) return;
    if (!window.confirm(`Supprimer ${selectedArticleIds.size} sélectionné(s) ?`)) return;
    setBulkDeleting(true);
    setArticleError(null);
    try {
      await Promise.all(Array.from(selectedArticleIds).map((id) => api.deleteArticle(id)));
      setArticles((prev) => prev.filter((article) => !selectedArticleIds.has(article.id)));
      setSelectedArticleIds(new Set());
    } catch (err) {
      setArticleError(err instanceof Error ? err.message : "Impossible de supprimer la sélection");
    } finally {
      setBulkDeleting(false);
    }
  };

  /* --------------------- Vue / filtres produits --------------------- */

  const visibleArticles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    let list = articles;
    if (query) {
      list = list.filter(
        (article) =>
          article.nom.toLowerCase().includes(query) ||
          (article.referenceFournisseur ?? "").toLowerCase().includes(query),
      );
    }
    if (showOnlyAlerts) {
      list = list.filter((article) => article.quantite <= article.seuilAlerte);
    }
    return list;
  }, [articles, searchTerm, showOnlyAlerts]);

  const articlesGroupedByCategory = useMemo(() => {
    const grouped = new Map<string, { id: string; label: string; items: Article[] }>();

    visibleArticles.forEach((article) => {
      const catId = article.categorieId ?? "uncategorized";
      const label = article.categorieId
        ? categories.find((c) => c.id === catId)?.nom ?? "Catégorie inconnue"
        : "Sans catégorie";

      if (!grouped.has(catId)) grouped.set(catId, { id: catId, label, items: [] });
      grouped.get(catId)!.items.push(article);
    });

    return Array.from(grouped.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [visibleArticles, categories]);

  const alertCount = useMemo(
    () => articles.filter((article) => article.quantite <= article.seuilAlerte).length,
    [articles],
  );

  const stats = [
    { label: "Produits", value: articles.length },
    { label: "Catégories", value: categories.length },
    { label: "Alertes seuil", value: alertCount },
  ];

  // Sélection globale (visibles)
  const visibleIds = useMemo(() => visibleArticles.map((a) => a.id), [visibleArticles]);
  const allVisibleSelected = useMemo(
    () => visibleIds.length > 0 && visibleIds.every((id) => selectedArticleIds.has(id)),
    [visibleIds, selectedArticleIds],
  );
  const someVisibleSelected = useMemo(
    () => visibleIds.some((id) => selectedArticleIds.has(id)),
    [visibleIds, selectedArticleIds],
  );
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  /* --------------------- Render --------------------- */

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Gestion des produits"
        title={isSuperAdmin ? "Stock par établissement" : "Stock de l'établissement"}
        description="Structurez le catalogue : catégories, produits, quantités et seuils d’alerte. Toutes les données sont reliées à l’API en temps réel."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm"
          >
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Sélection établissement */}
      {isSuperAdmin ? (
        <Card>
          <CardHeader title="Établissement cible" subtitle="Sélectionnez où créer catégories et produits" />
          {establishmentsLoading ? (
            <p className="text-sm text-slate-500">Chargement...</p>
          ) : establishmentsError ? (
            <p className="text-sm text-rose-600">{establishmentsError}</p>
          ) : establishments.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun établissement disponible.</p>
          ) : (
            <select
              className="mt-3 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm"
              value={selectedTenantId}
              onChange={(event) => setSelectedTenantId(event.target.value)}
            >
              {establishments.map((etab) => (
                <option key={etab.id} value={etab.id}>
                  {etab.nom}
                </option>
              ))}
            </select>
          )}
        </Card>
      ) : null}

      {/* Managers */}
      <Card>
        <CardHeader title="Filtres & recherche" subtitle="Affinez l’affichage du stock" />
        {canLoadInventory ? (
          showCategoriesManager || showProductsManager ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {showCategoriesManager ? (
                <Card className="min-w-0 bg-gradient-to-br from-slate-50 to-white">
                  <CardHeader title="Catégories" subtitle="Organisez votre catalogue" />
                  {loading.categories ? (
                    <p className="text-sm text-slate-500">Chargement...</p>
                  ) : errors.categories ? (
                    <p className="text-sm text-rose-600">{errors.categories}</p>
                  ) : categories.length === 0 ? (
                    <p className="text-sm text-slate-500">Aucune catégorie pour le moment.</p>
                  ) : (
                    <ul className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      {categories.map((category) => (
                        <li
                          key={category.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm"
                        >
                          {editingCategoryId === category.id ? (
                            <form
                              className="flex w-full items-center gap-2"
                              onSubmit={async (event) => {
                                event.preventDefault();
                                if (!editingCategoryName.trim()) {
                                  setCategoryError("Nom requis");
                                  return;
                                }
                                setCategorySubmitting(true);
                                setCategoryError(null);
                                try {
                                  const updated = await api.updateCategory(category.id, {
                                    nom: editingCategoryName.trim(),
                                  });
                                  setCategories((prev) =>
                                    prev.map((cat) => (cat.id === category.id ? updated : cat)),
                                  );
                                  setEditingCategoryId(null);
                                  setEditingCategoryName("");
                                } catch (err) {
                                  setCategoryError(
                                    err instanceof Error
                                      ? err.message
                                      : "Impossible de mettre à jour la catégorie",
                                  );
                                } finally {
                                  setCategorySubmitting(false);
                                }
                              }}
                            >
                              <input
                                type="text"
                                value={editingCategoryName}
                                onChange={(event) => setEditingCategoryName(event.target.value)}
                                className="flex-1 rounded-full border border-slate-200 px-3 py-1 text-sm focus:border-emerald-500/70 focus:outline-none disabled:bg-slate-50"
                                disabled={!canManageCategories}
                              />
                              <button
                                type="submit"
                                className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                disabled={categorySubmitting || !canManageCategories}
                              >
                                Sauver
                              </button>
                              <button
                                type="button"
                                className="text-xs font-semibold text-slate-500 underline"
                                onClick={() => {
                                  setEditingCategoryId(null);
                                  setEditingCategoryName("");
                                  setCategoryError(null);
                                }}
                              >
                                Annuler
                              </button>
                            </form>
                          ) : (
                            <>
                              <span className="font-semibold text-slate-900">{category.nom}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-200 disabled:opacity-50"
                                  onClick={() => {
                                    setEditingCategoryId(category.id);
                                    setEditingCategoryName(category.nom);
                                    setCategoryError(null);
                                  }}
                                  disabled={!canManageCategories}
                                >
                                  Modifier
                                </button>
                                <button
                                  type="button"
                                  className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                                  disabled={categorySubmitting || !canManageCategories}
                                  onClick={async () => {
                                    if (!window.confirm(`Supprimer la catégorie « ${category.nom} » ?`)) return;
                                    setCategorySubmitting(true);
                                    setCategoryError(null);
                                    try {
                                      await api.deleteCategory(category.id);
                                      setCategories((prev) => prev.filter((cat) => cat.id !== category.id));
                                      setArticles((prev) =>
                                        prev.map((article) =>
                                          article.categorieId === category.id ? { ...article, categorieId: null } : article,
                                        ),
                                      );
                                    } catch (err) {
                                      setCategoryError(
                                        err instanceof Error ? err.message : "Impossible de supprimer la catégorie",
                                      );
                                    } finally {
                                      setCategorySubmitting(false);
                                    }
                                  }}
                                >
                                  Supprimer
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <form
                    className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm"
                    onSubmit={handleCreateCategory}
                  >
                    <label className="text-sm font-medium text-slate-700">
                      Nouvelle catégorie
                      <div className="mt-1 flex flex-col gap-3 sm:flex-row">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(event) => setNewCategoryName(event.target.value)}
                          className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none disabled:bg-slate-50"
                          placeholder="Ex : Fournitures"
                          disabled={!canManageCategories}
                        />
                        <button
                          type="submit"
                          className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
                          disabled={categorySubmitting || !canManageCategories}
                        >
                          {categorySubmitting ? "Ajout..." : "Ajouter"}
                        </button>
                      </div>
                    </label>
                    {categoryError ? <p className="text-sm text-rose-600">{categoryError}</p> : null}
                    <p className="text-xs text-slate-500">
                      {canManageCategories
                        ? "Ajoutez des catégories pour mieux structurer le catalogue."
                        : "Vous n'avez pas l'autorisation de créer ou modifier les catégories."}
                    </p>
                  </form>
                </Card>
              ) : null}

              {showProductsManager ? (
                <Card className="min-w-0 bg-gradient-to-br from-white to-slate-50">
                  <CardHeader title="Créer un produit" subtitle="Réservé à l’établissement sélectionné" />
                  <form className="space-y-4" onSubmit={handleCreateArticle}>
                    <div className="grid gap-4">
                      <label className="text-sm font-medium text-slate-700">
                        Nom du produit
                        <input
                          type="text"
                          value={articleForm.nom}
                          onChange={(event) => setArticleForm((prev) => ({ ...prev, nom: event.target.value }))}
                          className="mt-1 w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none disabled:bg-slate-50"
                          required
                          disabled={!canManageProducts}
                        />
                      </label>

                      <label className="text-sm font-medium text-slate-700">
                        Catégorie
                        <select
                          value={articleForm.categorieId}
                          onChange={(event) => setArticleForm((prev) => ({ ...prev, categorieId: event.target.value }))}
                          className="mt-1 w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none disabled:bg-slate-50"
                          disabled={!canManageProducts}
                        >
                          <option value="">Aucune</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.nom}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-medium text-slate-700">
                          Quantité
                          <input
                            type="number"
                            min={0}
                            value={articleForm.quantite}
                            onChange={(event) =>
                              setArticleForm((prev) => ({ ...prev, quantite: Number(event.target.value) }))
                            }
                            className="mt-1 w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none disabled:bg-slate-50"
                            required
                            disabled={!canManageProducts}
                          />
                        </label>

                        <label className="text-sm font-medium text-slate-700">
                          Seuil d’alerte
                          <input
                            type="number"
                            min={0}
                            value={articleForm.seuilAlerte}
                            onChange={(event) =>
                              setArticleForm((prev) => ({ ...prev, seuilAlerte: Number(event.target.value) }))
                            }
                            className="mt-1 w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none disabled:bg-slate-50"
                            required
                            disabled={!canManageProducts}
                          />
                        </label>
                      </div>

                      <label className="text-sm font-medium text-slate-700">
                        Référence fournisseur (optionnel)
                        <input
                          type="text"
                          value={articleForm.referenceFournisseur}
                          onChange={(event) =>
                            setArticleForm((prev) => ({ ...prev, referenceFournisseur: event.target.value }))
                          }
                          className="mt-1 w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none disabled:bg-slate-50"
                          disabled={!canManageProducts}
                        />
                      </label>
                    </div>

                    {articleError ? <p className="text-sm text-rose-600">{articleError}</p> : null}

                    <div className="flex flex-col items-stretch gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        {canManageProducts
                          ? "Complétez les champs obligatoires avant de créer le produit."
                          : "Permissions manquantes pour créer ou modifier des produits."}
                      </span>
                      <button
                        type="submit"
                        className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
                        disabled={articleSubmitting || !canManageProducts}
                      >
                        {articleSubmitting ? "Création..." : "Créer le produit"}
                      </button>
                    </div>

                    <p className="text-xs text-slate-500">
                      {canManageProducts
                        ? "Créez un produit pour l’établissement sélectionné. Le stock est mis à jour par les demandes et les mouvements."
                        : "Vous n'avez pas l'autorisation de créer ou modifier des produits."}
                    </p>
                  </form>
                </Card>
              ) : null}
            </div>
          ) : (
            <Card>
              <CardHeader title="Gestion restreinte" subtitle="Permissions insuffisantes" />
              <p className="text-sm text-slate-600">
                Activez au moins une permission (catégories ou produits) pour gérer le catalogue.
              </p>
            </Card>
          )
        ) : (
          <p className="pt-2 text-sm text-slate-500">
            Sélectionnez un établissement et un rôle autorisé pour gérer le stock.
          </p>
        )}
      </Card>

      {/* Stock regroupé par catégorie */}
      <Card>
        <CardHeader
          title="Stock"
          subtitle="Tous les produits regroupés par catégorie"
          action={
            canLoadInventory ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-900/5 px-3 py-1 font-semibold text-slate-700">
                  {visibleArticles.length} produit(s) - {alertCount} alerte(s)
                </span>

                {readyToManage ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                    {selectedArticleIds.size} sélectionné(s)
                  </span>
                ) : null}

                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Recherche produit ou ref."
                    className="w-36 rounded-full border-none px-2 py-1 text-xs outline-none focus:ring-0 sm:w-52"
                  />
                </div>

                <label className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={showOnlyAlerts}
                    onChange={(event) => setShowOnlyAlerts(event.target.checked)}
                  />
                  Alertes uniquement
                </label>

                {readyToManage ? (
                  <>
                    <label className="flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={allVisibleSelected}
                        onChange={(event) => toggleSelectMany(visibleIds, event.target.checked)}
                        disabled={visibleIds.length === 0}
                      />
                      Tout sélectionner (visibles)
                    </label>

                    <select
                      className="rounded-full border border-slate-200 px-2 py-1 text-xs focus:border-emerald-500/70 focus:outline-none"
                      value={bulkCategoryId}
                      onChange={(event) => setBulkCategoryId(event.target.value)}
                      disabled={!selectedArticleIds.size || bulkUpdatingCategory}
                    >
                      <option value="">Catégorie : aucune</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.nom}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                      disabled={!selectedArticleIds.size || bulkUpdatingCategory}
                      onClick={handleBulkCategoryUpdate}
                    >
                      {bulkUpdatingCategory ? "Mise à jour..." : "Changer catégorie"}
                    </button>

                    <button
                      type="button"
                      className="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      disabled={!selectedArticleIds.size || bulkDeleting}
                      onClick={handleBulkDelete}
                    >
                      {bulkDeleting ? "Suppression..." : "Supprimer sélection"}
                    </button>

                    <button
                      type="button"
                      className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                      disabled={!selectedArticleIds.size}
                      onClick={clearSelection}
                    >
                      Vider sélection
                    </button>
                  </>
                ) : null}
              </div>
            ) : undefined
          }
        />

        {loading.articles ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : errors.articles ? (
          <p className="text-sm text-rose-600">{errors.articles}</p>
        ) : articlesGroupedByCategory.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun article pour le moment.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <div className="min-w-full space-y-3 text-sm md:min-w-[720px]">
              {articlesGroupedByCategory.map((group) => {
                const sortedGroupItems = group.items.slice().sort((a, b) => a.nom.localeCompare(b.nom));
                const groupAlert = sortedGroupItems.some((article) => article.quantite <= article.seuilAlerte);

                const groupIds = sortedGroupItems.map((a) => a.id);
                const groupAll =
                  readyToManage && groupIds.length > 0 && groupIds.every((id) => selectedArticleIds.has(id));
                const groupSome = readyToManage && groupIds.some((id) => selectedArticleIds.has(id));
                const isExpanded = expandedCategories.has(group.id);
                const itemsToDisplay = isExpanded ? sortedGroupItems : sortedGroupItems.slice(0, 5);

                return (
                  <div
                    key={group.id}
                    className={cn(
                      "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
                      groupAlert && "border-amber-300",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-2.5 py-2 text-[13px] sm:text-sm">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Catégorie</p>
                        <p className="text-sm font-semibold text-slate-900">{group.label}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {readyToManage ? (
                          <label className="flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              checked={groupAll}
                              ref={(el) => {
                                if (!el) return;
                                el.indeterminate = Boolean(groupSome && !groupAll);
                              }}
                              onChange={(event) => toggleSelectMany(groupIds, event.target.checked)}
                              disabled={groupIds.length === 0}
                            />
                            Selectionner cette categorie
                          </label>
                        ) : null}

                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                          {group.items.length} article{group.items.length > 1 ? "s" : ""}
                        </span>

                        {groupAlert ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                            Alerte sur cette categorie
                          </span>
                        ) : null}

                        {sortedGroupItems.length > 5 ? (
                          <button
                            type="button"
                            className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100"
                            onClick={() => toggleCategoryExpansion(group.id)}
                          >
                            {isExpanded ? "Voir moins" : "Voir plus"}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 text-[13px] sm:text-sm">
                      {/* En-tête colonnes */}
                      <div
                        className="grid items-center gap-2 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                        style={{ gridTemplateColumns: readyToManage ? GRID_MANAGE : GRID_VIEW }}
                      >
                        {readyToManage ? <span className="text-center">V</span> : null}
                        <span>Nom</span>
                        <span>Référence</span>
                        <span className="text-center">Quantité</span>
                        <span className="text-center">Seuil</span>
                        {readyToManage ? <span className="text-right">Actions</span> : null}
                      </div>

                      {/* Lignes produits */}
                        {itemsToDisplay.map((article) => {
                          const inAlert = article.quantite <= article.seuilAlerte;
                          const isEditing = editingArticleId === article.id;
                          const disableInputs =
                            !readyToManage ||
                            !isEditing ||
                            savingArticleId === article.id ||
                            deletingArticleId === article.id;

                          return (
                            <div
                              key={article.id}
                              className={cn("grid items-center gap-2 px-2.5 py-1.5", inAlert && "bg-amber-50/60")}
                              style={{ gridTemplateColumns: readyToManage ? GRID_MANAGE : GRID_VIEW }}
                            >
                              {/* Checkbox sélection */}
                              {readyToManage ? (
                                <div className="text-center">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    checked={selectedArticleIds.has(article.id)}
                                    onChange={(event) => toggleArticleSelection(article.id, event.target.checked)}
                                  />
                                </div>
                              ) : null}

                              {/* Nom (+ édition catégorie) */}
                              <div className="flex flex-col gap-1">
                                {isEditing ? (
                                  <>
                                    <input
                                      className="w-full rounded-full border border-slate-200 px-2.5 py-1 text-sm focus:border-emerald-500/70 focus:outline-none"
                                      value={article.nom}
                                      disabled={disableInputs}
                                      onChange={(event) =>
                                        setArticles((prev) =>
                                          prev.map((item) =>
                                            item.id === article.id ? { ...item, nom: event.target.value } : item,
                                          ),
                                        )
                                      }
                                      onBlur={(event) =>
                                        updateArticleField(article.id, { nom: event.target.value.trim() })
                                      }
                                    />

                                    {/* Modification de catégorie du produit */}
                                    <select
                                      className="w-full rounded-full border border-slate-200 px-2.5 py-1 text-xs focus:border-emerald-500/70 focus:outline-none"
                                      value={article.categorieId ?? ""}
                                      disabled={disableInputs}
                                      onChange={(event) => {
                                        const nextCat = event.target.value || null;
                                        setArticles((prev) =>
                                          prev.map((item) =>
                                            item.id === article.id ? { ...item, categorieId: nextCat } : item,
                                          ),
                                        );
                                        void updateArticleField(article.id, { categorieId: nextCat });
                                      }}
                                    >
                                      <option value="">Sans catégorie</option>
                                      {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.nom}
                                        </option>
                                      ))}
                                    </select>
                                  </>
                                ) : (
                                  <p className="font-semibold text-slate-900">{article.nom}</p>
                                )}

                                {inAlert ? (
                                  <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
                                    Niveau d&apos;alerte atteint (quantité = seuil)
                                  </span>
                                ) : null}
                              </div>

                              {/* Référence */}
                              <div>
                                {readyToManage && isEditing ? (
                                  <input
                                    className="w-full rounded-full border border-slate-200 px-2.5 py-1 text-sm focus:border-emerald-500/70 focus:outline-none"
                                    value={article.referenceFournisseur ?? ""}
                                    disabled={disableInputs}
                                    onChange={(event) =>
                                      setArticles((prev) =>
                                        prev.map((item) =>
                                          item.id === article.id
                                            ? { ...item, referenceFournisseur: event.target.value }
                                            : item,
                                        ),
                                      )
                                    }
                                    onBlur={(event) =>
                                      updateArticleField(article.id, {
                                        referenceFournisseur: event.target.value.trim() || null,
                                      })
                                    }
                                  />
                                ) : (
                                  <p className="text-slate-600">{article.referenceFournisseur ?? "—"}</p>
                                )}
                              </div>

                              {/* Quantité */}
                              <div>
                                {readyToManage && isEditing ? (
                                  <input
                                    type="number"
                                    min={0}
                                    className={cn(
                                      "w-full rounded-full border border-slate-200 px-2.5 py-1 text-sm text-center focus:border-emerald-500/70 focus:outline-none",
                                      inAlert ? "text-rose-600" : "text-slate-900",
                                    )}
                                    value={article.quantite}
                                    disabled={disableInputs}
                                    onChange={(event) =>
                                      setArticles((prev) =>
                                        prev.map((item) =>
                                          item.id === article.id
                                            ? { ...item, quantite: Number(event.target.value) }
                                            : item,
                                        ),
                                      )
                                    }
                                    onBlur={(event) =>
                                      updateArticleField(article.id, { quantite: Number(event.target.value) })
                                    }
                                  />
                                ) : (
                                  <span
                                    className={cn(
                                      "block text-center font-semibold",
                                      inAlert ? "text-rose-600" : "text-slate-900",
                                    )}
                                  >
                                    {article.quantite}
                                  </span>
                                )}
                              </div>

                              {/* Seuil */}
                              <div>
                                {readyToManage && isEditing ? (
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-full rounded-full border border-slate-200 px-2.5 py-1 text-sm text-center focus:border-emerald-500/70 focus:outline-none"
                                    value={article.seuilAlerte}
                                    disabled={disableInputs}
                                    onChange={(event) =>
                                      setArticles((prev) =>
                                        prev.map((item) =>
                                          item.id === article.id
                                            ? { ...item, seuilAlerte: Number(event.target.value) }
                                            : item,
                                        ),
                                      )
                                    }
                                    onBlur={(event) =>
                                      updateArticleField(article.id, { seuilAlerte: Number(event.target.value) })
                                    }
                                  />
                                ) : (
                                  <span className="block text-center text-slate-900">{article.seuilAlerte}</span>
                                )}
                              </div>

                              {/* Actions */}
                              {readyToManage ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    className="w-1/2 rounded-full bg-slate-100 px-2.5 py-0.5 text-center text-[11px] font-semibold text-slate-800 hover:bg-slate-200 disabled:opacity-50"
                                    disabled={deletingArticleId === article.id}
                                    onClick={() =>
                                      setEditingArticleId((prev) => (prev === article.id ? null : article.id))
                                    }
                                  >
                                    {editingArticleId === article.id ? "Terminer" : "Modifier"}
                                  </button>

                                  <button
                                    type="button"
                                    className="w-1/2 rounded-full bg-rose-50 px-2.5 py-0.5 text-center text-[11px] font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                                    disabled={deletingArticleId === article.id}
                                    onClick={() => handleDeleteArticle(article.id, article.nom)}
                                  >
                                    {deletingArticleId === article.id ? "Suppression..." : "Supprimer"}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}



