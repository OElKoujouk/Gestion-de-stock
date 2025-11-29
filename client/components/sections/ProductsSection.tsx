import { useEffect, useMemo, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
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

export function ProductsSection() {
  const { role } = useAuth();
  const isSuperAdmin = role === "superAdmin";
  const canManage = role === "superAdmin" || role === "admin" || role === "responsable";

  const [establishments, setEstablishments] = useState<EstablishmentOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [establishmentsLoading, setEstablishmentsLoading] = useState(false);
  const [establishmentsError, setEstablishmentsError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState({ categories: true, articles: true });
  const [errors, setErrors] = useState<{ categories: string | null; articles: string | null }>({ categories: null, articles: null });

  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [articleForm, setArticleForm] = useState(initialArticleForm);
  const [articleSubmitting, setArticleSubmitting] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [savingArticleId, setSavingArticleId] = useState<string | null>(null);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);

  const targetTenantId = isSuperAdmin ? selectedTenantId || "" : undefined;
  const readyToManage = canManage && (!isSuperAdmin || Boolean(targetTenantId));

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
        setSelectedTenantId((prev) => (prev && options.some((opt) => opt.id === prev) ? prev : options[0]?.id ?? ""));
      })
      .catch((err) => setEstablishmentsError(err instanceof Error ? err.message : "Impossible de charger les établissements"))
      .finally(() => setEstablishmentsLoading(false));
  }, [isSuperAdmin]);

  const fetchCategories = async (tenantId?: string) => {
    setLoading((prev) => ({ ...prev, categories: true }));
    try {
      const data = await api.getCategories(tenantId ? { etablissementId: tenantId } : undefined);
      setCategories(data);
      setErrors((prev) => ({ ...prev, categories: null }));
    } catch (err) {
      setErrors((prev) => ({ ...prev, categories: err instanceof Error ? err.message : "Impossible de charger les catégories" }));
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
      setErrors((prev) => ({ ...prev, articles: null }));
    } catch (err) {
      setErrors((prev) => ({ ...prev, articles: err instanceof Error ? err.message : "Impossible de charger les produits" }));
    } finally {
      setLoading((prev) => ({ ...prev, articles: false }));
    }
  };

  useEffect(() => {
    if (!readyToManage) {
      setLoading({ categories: false, articles: false });
      return;
    }
    void fetchCategories(targetTenantId);
    void fetchArticles(targetTenantId);
  }, [readyToManage, targetTenantId]);

  const handleCreateCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSuperAdmin && !targetTenantId) {
      setCategoryError("Choisissez un établissement");
      return;
    }
    if (!categoryName.trim()) {
      setCategoryError("Nom requis");
      return;
    }
    setCategoryError(null);
    setCategorySubmitting(true);
    try {
      const category = await api.createCategory({ nom: categoryName.trim(), etablissementId: targetTenantId });
      setCategories((prev) => [category, ...prev]);
      setCategoryName("");
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Impossible de créer la catégorie");
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleCreateArticle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSuperAdmin && !targetTenantId) {
      setArticleError("Choisissez un établissement");
      return;
    }
    if (!articleForm.nom.trim()) {
      setArticleError("Nom requis");
      return;
    }
    setArticleError(null);
    setArticleSubmitting(true);
    try {
      const payload = {
        nom: articleForm.nom.trim(),
        categorieId: articleForm.categorieId || null,
        quantite: Number(articleForm.quantite),
        referenceFournisseur: articleForm.referenceFournisseur.trim() || null,
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

  const updateArticleField = async (articleId: string, patch: Partial<Article>) => {
    setSavingArticleId(articleId);
    try {
      const updated = await api.updateArticle(articleId, {
        nom: patch.nom,
        referenceFournisseur: patch.referenceFournisseur ?? null,
        quantite: patch.quantite,
        seuilAlerte: patch.seuilAlerte,
        categorieId: patch.categorieId ?? null,
      });
      setArticles((prev) => prev.map((item) => (item.id === articleId ? { ...item, ...updated } : item)));
      setArticleError(null);
    } catch (err) {
      setArticleError(err instanceof Error ? err.message : "Impossible de mettre à jour le produit");
    } finally {
      setSavingArticleId(null);
    }
  };

  const handleDeleteArticle = async (articleId: string, articleName: string) => {
    if (!window.confirm(`Supprimer le produit "${articleName}" ?`)) return;
    setDeletingArticleId(articleId);
    try {
      await api.deleteArticle(articleId);
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
    } catch (err) {
      setArticleError(err instanceof Error ? err.message : "Impossible de supprimer le produit");
    } finally {
      setDeletingArticleId(null);
    }
  };

  const articlesGroupedByCategory = useMemo(() => {
    const grouped = new Map<string, { label: string; items: Article[] }>();
    articles.forEach((article) => {
      const catId = article.categorieId ?? "uncategorized";
      const label = article.categorieId ? categories.find((c) => c.id === catId)?.nom ?? "Catégorie inconnue" : "Sans catégorie";
      if (!grouped.has(catId)) {
        grouped.set(catId, { label, items: [] });
      }
      grouped.get(catId)!.items.push(article);
    });
    return Array.from(grouped.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [articles, categories]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Gestion des produits</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Catalogue par établissement</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          Administrateurs, responsables magasin et le super-admin structurent le stock établissement par établissement : catégories, produits, quantités et seuils d'alerte.
        </p>
      </div>

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
              className="mt-2 w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900"
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

      {readyToManage ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-gradient-to-br from-slate-50 to-white">
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
                  <li key={category.id} className="flex items-center justify-between gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                    {editingCategoryId === category.id ? (
                      <form
                        className="flex w-full items-center gap-2"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          if (!categoryName.trim()) {
                            setCategoryError("Nom requis");
                            return;
                          }
                          setCategorySubmitting(true);
                          setCategoryError(null);
                          try {
                            const updated = await api.updateCategory(category.id, { nom: categoryName.trim() });
                            setCategories((prev) => prev.map((cat) => (cat.id === category.id ? updated : cat)));
                            setEditingCategoryId(null);
                            setCategoryName("");
                          } catch (err) {
                            setCategoryError(err instanceof Error ? err.message : "Impossible de mettre à jour la catégorie");
                          } finally {
                            setCategorySubmitting(false);
                          }
                        }}
                      >
                        <input
                          type="text"
                          value={categoryName}
                          onChange={(event) => setCategoryName(event.target.value)}
                          className="flex-1 rounded-full border border-slate-200 px-3 py-1 text-sm focus:border-slate-400 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                          disabled={categorySubmitting}
                        >
                          Sauver
                        </button>
                        <button
                          type="button"
                          className="text-xs font-semibold text-slate-500 underline"
                          onClick={() => {
                            setEditingCategoryId(null);
                            setCategoryName("");
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
                            className="text-xs font-semibold text-slate-900 underline"
                            onClick={() => {
                              setEditingCategoryId(category.id);
                              setCategoryName(category.nom);
                              setCategoryError(null);
                            }}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-rose-600 underline disabled:opacity-50"
                            disabled={categorySubmitting}
                            onClick={async () => {
                              if (!window.confirm(`Supprimer la catégorie "${category.nom}" ?`)) return;
                              setCategorySubmitting(true);
                              setCategoryError(null);
                              try {
                                await api.deleteCategory(category.id);
                                setCategories((prev) => prev.filter((cat) => cat.id !== category.id));
                                setArticles((prev) =>
                                  prev.map((article) => (article.categorieId === category.id ? { ...article, categorieId: null } : article)),
                                );
                              } catch (err) {
                                setCategoryError(err instanceof Error ? err.message : "Impossible de supprimer la catégorie");
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
            <form className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm" onSubmit={handleCreateCategory}>
              <label className="text-sm font-medium text-slate-700">
                Nouvelle catégorie
                <input
                  type="text"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  className="mt-1 w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  placeholder="Ex : Fournitures"
                />
              </label>
              {categoryError ? <p className="text-sm text-rose-600">{categoryError}</p> : null}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Ajoutez des catégories pour mieux structurer le catalogue.</span>
                <button
                  type="submit"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                  disabled={categorySubmitting}
                >
                  {categorySubmitting ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </form>
          </Card>

          <Card className="bg-gradient-to-br from-white to-slate-50">
            <CardHeader title="Créer un produit" subtitle="Réservé à l'établissement sélectionné" />
            <form className="space-y-4" onSubmit={handleCreateArticle}>
              <div className="grid gap-4">
                <label className="text-sm font-medium text-slate-700">
                  Nom du produit
                  <input
                    type="text"
                    value={articleForm.nom}
                    onChange={(event) => setArticleForm((prev) => ({ ...prev, nom: event.target.value }))}
                    className="mt-1 w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    required
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Catégorie
                  <select
                    value={articleForm.categorieId}
                    onChange={(event) => setArticleForm((prev) => ({ ...prev, categorieId: event.target.value }))}
                    className="mt-1 w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
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
                      onChange={(event) => setArticleForm((prev) => ({ ...prev, quantite: Number(event.target.value) }))}
                      className="mt-1 w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      required
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Seuil d&apos;alerte
                    <input
                      type="number"
                      min={0}
                      value={articleForm.seuilAlerte}
                      onChange={(event) => setArticleForm((prev) => ({ ...prev, seuilAlerte: Number(event.target.value) }))}
                      className="mt-1 w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      required
                    />
                  </label>
                </div>
                <label className="text-sm font-medium text-slate-700">
                  Référence fournisseur (optionnel)
                  <input
                    type="text"
                    value={articleForm.referenceFournisseur}
                    onChange={(event) => setArticleForm((prev) => ({ ...prev, referenceFournisseur: event.target.value }))}
                    className="mt-1 w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </label>
              </div>
              {articleError ? <p className="text-sm text-rose-600">{articleError}</p> : null}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Complétez tous les champs obligatoires avant de créer le produit.</span>
                <button
                  type="submit"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                  disabled={articleSubmitting}
                >
                  {articleSubmitting ? "Création..." : "Créer le produit"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader title="Gestion restreinte" subtitle="Connectez-vous avec un rôle autorisé" />
          <p className="text-sm text-slate-600">
            {isSuperAdmin ? "Sélectionnez un établissement pour commencer." : "Seuls les administrateurs, responsables ou super-admin peuvent créer des produits."}
          </p>
        </Card>
      )}

      <Card>
        <CardHeader title="Catalogue" subtitle="Tous les produits regroupés par catégorie" />
        {loading.articles ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : errors.articles ? (
          <p className="text-sm text-rose-600">{errors.articles}</p>
        ) : articlesGroupedByCategory.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun article pour le moment.</p>
        ) : (
          <div className="mt-4 space-y-4 text-sm">
            {articlesGroupedByCategory.map((group) => (
              <div key={group.label} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Catégorie</p>
                    <p className="text-lg font-semibold text-slate-900">{group.label}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {group.items.length} article{group.items.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <span className="col-span-4 sm:col-span-4">Nom</span>
                    <span className="col-span-3 sm:col-span-3">Référence</span>
                    <span className="col-span-2 sm:col-span-2 text-center">Quantité</span>
                    <span className="col-span-2 sm:col-span-2 text-center">Seuil</span>
                    {readyToManage ? <span className="col-span-1 text-right">Actions</span> : null}
                  </div>
                  {group.items
                    .slice()
                    .sort((a, b) => a.nom.localeCompare(b.nom))
                    .map((article) => {
                      const inAlert = article.quantite <= article.seuilAlerte;
                      const disableEdit = !readyToManage || savingArticleId === article.id || deletingArticleId === article.id;
                      return (
                        <div key={article.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3 sm:py-2">
                          <div className="col-span-4 sm:col-span-4">
                            <input
                              className="w-full rounded-full border border-slate-200 px-3 py-1 text-sm focus:border-slate-400 focus:outline-none"
                              value={article.nom}
                              disabled={disableEdit}
                              onChange={(event) =>
                                setArticles((prev) => prev.map((item) => (item.id === article.id ? { ...item, nom: event.target.value } : item)))
                              }
                              onBlur={(event) => updateArticleField(article.id, { nom: event.target.value.trim() })}
                            />
                          </div>
                          <div className="col-span-3 sm:col-span-3">
                            <input
                              className="w-full rounded-full border border-slate-200 px-3 py-1 text-sm focus:border-slate-400 focus:outline-none"
                              value={article.referenceFournisseur ?? ""}
                              disabled={disableEdit}
                              onChange={(event) =>
                                setArticles((prev) =>
                                  prev.map((item) => (item.id === article.id ? { ...item, referenceFournisseur: event.target.value } : item)),
                                )
                              }
                              onBlur={(event) => updateArticleField(article.id, { referenceFournisseur: event.target.value.trim() || null })}
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-2">
                            <input
                              type="number"
                              min={0}
                              className={cn(
                                "w-full rounded-full border border-slate-200 px-3 py-1 text-sm focus:border-slate-400 focus:outline-none",
                                inAlert ? "text-rose-600" : "text-slate-900",
                              )}
                              value={article.quantite}
                              disabled={disableEdit}
                              onChange={(event) =>
                                setArticles((prev) =>
                                  prev.map((item) => (item.id === article.id ? { ...item, quantite: Number(event.target.value) } : item)),
                                )
                              }
                              onBlur={(event) => updateArticleField(article.id, { quantite: Number(event.target.value) })}
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-2">
                            <input
                              type="number"
                              min={0}
                              className="w-full rounded-full border border-slate-200 px-3 py-1 text-sm focus:border-slate-400 focus:outline-none"
                              value={article.seuilAlerte}
                              disabled={disableEdit}
                              onChange={(event) =>
                                setArticles((prev) =>
                                  prev.map((item) => (item.id === article.id ? { ...item, seuilAlerte: Number(event.target.value) } : item)),
                                )
                              }
                              onBlur={(event) => updateArticleField(article.id, { seuilAlerte: Number(event.target.value) })}
                            />
                          </div>
                          {readyToManage ? (
                            <div className="col-span-1 text-right">
                              <button
                                type="button"
                                className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
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
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
