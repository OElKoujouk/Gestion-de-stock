import { useCallback, useEffect, useMemo, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { CreateEstablishmentForm } from "@/components/super-admin/CreateEstablishmentForm";
import { CreateUserForm } from "@/components/super-admin/CreateUserForm";
import { EditEstablishmentDialog } from "@/components/super-admin/EditEstablishmentDialog";
import { EditUserDialog } from "@/components/super-admin/EditUserDialog";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Establishment = {
  id: string;
  nom: string;
  createdAt: string;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
};
type UserSummary = { id: string; nom: string; email: string; role: string; etablissementId: string | null };
type ArticleSummary = { id: string; nom: string; uantite: number; referenceFournisseur: string | null; seuilAlerte: number; categorieId?: string | null };

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  responsable: "Responsable magasin",
  agent: "Agent",
};

export function AdminEstablishmentSection() {
  const { role } = useAuth();
  const isTenantAdmin = role === "admin";
  const isSuperAdmin = role === "superAdmin";
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [establishmentDialogOpen, setEstablishmentDialogOpen] = useState(false);
  const [editEstablishmentDialogOpen, setEditEstablishmentDialogOpen] = useState(false);

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; nom: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const [selectedEtablissementId, setSelectedEtablissementId] = useState<string | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [editingEstablishment, setEditingEstablishment] = useState<Establishment | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchEstablishments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getEstablishments();
      setEstablishments(data);
      setError(null);
      setSelectedEtablissementId((prev) => (prev ?? data[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les etablissements");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
      setUsersError(null);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : "Impossible de charger les utilisateurs");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchArticles = useCallback(async (establishmentId: string | null) => {
    if (!establishmentId) {
      setArticles([]);
      return;
    }
    setArticlesLoading(true);
    try {
      const data = await api.getArticles({ etablissementId: establishmentId });
      setArticles(data);
      setArticlesError(null);
    } catch (err) {
      setArticlesError(err instanceof Error ? err.message : "Impossible de charger les stocks");
    } finally {
      setArticlesLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async (establishmentId: string | null) => {
    if (!establishmentId) {
      setCategories([]);
      return;
    }
    setCategoriesLoading(true);
    try {
      const data = await api.getCategories({ etablissementId: establishmentId });
      setCategories(data);
      setCategoriesError(null);
    } catch (err) {
      setCategoriesError(err instanceof Error ? err.message : "Impossible de charger les categories");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEstablishments();
    void fetchUsers();
    api
      .me()
      .then((data) => setCurrentUserId(data.id))
      .catch(() => setCurrentUserId(null));
  }, [fetchEstablishments, fetchUsers]);

  useEffect(() => {
    if (!selectedEtablissementId && establishments.length > 0) {
      setSelectedEtablissementId(establishments[0].id);
    }
  }, [establishments, selectedEtablissementId]);

  useEffect(() => {
    void fetchArticles(selectedEtablissementId);
    void fetchCategories(selectedEtablissementId);
    setSelectedCategoryId("");
  }, [establishments, fetchArticles, fetchCategories, selectedEtablissementId]);

  const filteredArticles = useMemo(() => {
    if (!selectedCategoryId) return articles;
    return articles.filter((article) => article.categorieId === selectedCategoryId);
  }, [articles, selectedCategoryId]);

  const categoryById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.nom])), [categories]);

  const lowStockArticles = useMemo(() => articles.filter((article) => article.uantite <= article.seuilAlerte), [articles]);

  const handleCreated = (establishment: Establishment) => {
    setEstablishments((prev) => [establishment, ...prev]);
    setSelectedEtablissementId(establishment.id);
    setEstablishmentDialogOpen(false);
  };

  const handleEstablishmentUpdated = (updated: Establishment) => {
    setEstablishments((prev) => prev.map((etab) => (etab.id === updated.id ? updated : etab)));
    if (editingEstablishment && editingEstablishment.id === updated.id) {
      setEditingEstablishment(updated);
    }
  };

  const selectedEtablissement = useMemo(
    () => establishments.find((etab) => etab.id === selectedEtablissementId) ?? null,
    [establishments, selectedEtablissementId],
  );

  const assignedUsers = useMemo(
    () => (selectedEtablissement ? users.filter((user) => user.etablissementId === selectedEtablissement.id) : []),
    [users, selectedEtablissement],
  );

  const roleCounts = assignedUsers.reduce(
    (acc, user) => {
      const key = user.role;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const openUserModal = () => {
    if (selectedEtablissement) {
      setUserDialogOpen(true);
    }
  };

  const handleOpenEstablishmentEdit = (establishment: Establishment) => {
    setEditingEstablishment(establishment);
    setEditEstablishmentDialogOpen(true);
  };

  const handleEditEstablishmentOpenChange = (open: boolean) => {
    setEditEstablishmentDialogOpen(open);
    if (!open) {
      setEditingEstablishment(null);
    }
  };

  const handleDeleteEstablishment = async (establishment: Establishment) => {
    if (!window.confirm(`Supprimer l'etablissement ${establishment.nom} ?`)) {
      return;
    }
    try {
      await api.deleteEstablishment(establishment.id);
      setEstablishments((prev) => {
        const next = prev.filter((etab) => etab.id !== establishment.id);
        if (selectedEtablissementId === establishment.id) {
          setSelectedEtablissementId(next[0]?.id ?? null);
        }
        if (editingEstablishment && editingEstablishment.id === establishment.id) {
          setEditingEstablishment(null);
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer l'etablissement");
    }
  };

  const handleUserCreated = () => {
    setUserDialogOpen(false);
    void fetchUsers();
  };

  const handleOpenEdit = (user: UserSummary) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleEditOpenChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setEditingUser(null);
    }
  };

  const handleDeleteUser = async (user: UserSummary) => {
    if (!window.confirm(`Supprimer ${user.nom} ?`)) {
      return;
    }
    setDeletingUserId(user.id);
    try {
      await api.deleteUser(user.id);
      await fetchUsers();
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : "Impossible de supprimer l'utilisateur");
    } finally {
      setDeletingUserId(null);
    }
  };

  const roleDisplayOrder: Array<keyof typeof ROLE_LABELS> = ["admin", "responsable", "agent"];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Administrateur etablissement"
        title={isSuperAdmin ? "Pilotage des etablissements" : "Pilotage de l'etablissement"}
        description={
          isTenantAdmin
            ? "Gerez votre etablissement : utilisateurs rattaches et stock resume."
            : "Creez un etablissement puis selectionnez-le pour consulter les roles attribues, ajouter des comptes et suivre la repartition des droits."
        }
        actions={
          !isTenantAdmin ? (
            <button
              type="button"
              onClick={() => setEstablishmentDialogOpen(true)}
              className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-600"
            >
              Nouvel etablissement
            </button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {!isTenantAdmin ? (
          <Card>
            <CardHeader title="Liste des etablissements" subtitle="Affichage des donnees reelles" />
            {loading ? (
              <p className="text-sm text-slate-500">Chargement...</p>
            ) : error ? (
              <p className="text-sm text-rose-600">{error}</p>
            ) : establishments.length === 0 ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-sm text-slate-700">
                <p>Aucun etablissement pour le moment.</p>
                <button
                  type="button"
                  onClick={() => setEstablishmentDialogOpen(true)}
                  className="self-start rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600"
                >
                  Creer un etablissement
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-sm">
                {establishments.map((etab) => (
                  <div key={etab.id} className="rounded-2xl border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedEtablissementId(etab.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition",
                        selectedEtablissementId === etab.id ? "text-slate-900" : "text-slate-600",
                      )}
                    >
                      <div>
                        <p className="font-semibold">{etab.nom}</p>
                        <p className="text-xs">Cree le {new Date(etab.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-500">{etab.adresse ?? "Adresse non renseignee"}</p>
                        <p className="text-xs text-slate-500">{[etab.codePostal, etab.ville].filter(Boolean).join(" ") || "Localisation non renseignee"}</p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          selectedEtablissementId === etab.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700",
                        )}
                      >
                        Actif
                      </span>
                    </button>
                    <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-2 text-xs font-semibold">
                      <button type="button" onClick={() => handleOpenEstablishmentEdit(etab)} className="text-slate-900 underline">
                        Renommer
                      </button>
                      <button type="button" onClick={() => handleDeleteEstablishment(etab)} className="text-rose-600 underline">
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <CardHeader title="Mon etablissement" />
            {loading ? (
              <p className="text-sm text-slate-500">Chargement...</p>
            ) : error ? (
              <p className="text-sm text-rose-600">{error}</p>
            ) : establishments.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun etablissement pour le moment.</p>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Etablissement</p>
                  <p className="text-lg font-semibold text-slate-900">{establishments[0].nom}</p>
                  <p className="text-xs text-slate-500">
                    {[establishments[0].codePostal, establishments[0].ville].filter(Boolean).join(" ") || "Localisation non renseignee"}
                  </p>
                </div>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Actif</span>
              </div>
            )}
          </Card>
        )}

        <Card>
          <CardHeader title="Vue detaillee" />
          {selectedEtablissement ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {roleDisplayOrder.map((roleKey) => (
                  <div key={roleKey} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{ROLE_LABELS[roleKey]}</p>
                    <p className="text-2xl font-semibold text-slate-900">{roleCounts[roleKey] ?? 0}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Comptes rattaches</p>
                  <p className="text-xs text-slate-500">
                    {usersLoading ? "Chargement des utilisateurs..." : `${assignedUsers.length} utilisateur(s)`} (admin / responsable / agent)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openUserModal}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={!selectedEtablissement}
                >
                  Creer un role
                </button>
              </div>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
                {usersLoading ? (
                  <p className="px-4 py-3 text-sm text-slate-500">Chargement...</p>
                ) : usersError ? (
                  <p className="px-4 py-3 text-sm text-rose-600">{usersError}</p>
                ) : assignedUsers.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-500">Aucun utilisateur affecte a cet etablissement.</p>
                ) : (
                  assignedUsers
                    .filter((user) => user.id !== currentUserId)
                    .map((user) => {
                      const isSelf = currentUserId === user.id;
                      return (
                        <div key={user.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                          <div>
                            <p className="font-semibold text-slate-900">{user.nom}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {ROLE_LABELS[user.role] ?? user.role}
                            </span>
                            {!isSelf ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(user)}
                                  className="text-xs font-semibold text-slate-900 underline disabled:opacity-50"
                                  disabled={isTenantAdmin && user.role === "admin"}
                                >
                                  Modifier
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-xs font-semibold text-rose-600 underline disabled:opacity-50"
                                  disabled={deletingUserId === user.id || (isTenantAdmin && user.role === "admin")}
                                >
                                  {deletingUserId === user.id ? "Suppression..." : "Supprimer"}
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Vous</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Selectionnez un etablissement pour afficher les roles assignes.</p>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Alertes seuil" subtitle="Articles a reapprovisionner" />
        {selectedEtablissement ? (
          articlesLoading ? (
            <p className="px-4 py-3 text-sm text-slate-500">Chargement...</p>
          ) : articlesError ? (
            <p className="px-4 py-3 text-sm text-rose-600">{articlesError}</p>
          ) : lowStockArticles.length === 0 ? (
            <p className="px-4 py-3 text-sm text-emerald-600">Aucun article n'est sous son seuil d'alerte.</p>
          ) : (
            <div className="mt-3 grid gap-3 px-4 pb-4 md:grid-cols-2">
              {lowStockArticles.map((article) => (
                <div key={article.id} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <p className="text-sm font-semibold text-slate-900">{article.nom}</p>
                  <p className="text-xs text-slate-600">
                    Stock: <span className="font-semibold text-slate-900">{article.uantite}</span> / seuil{" "}
                    <span className="font-semibold text-slate-900">{article.seuilAlerte}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">Reference: {article.referenceFournisseur ?? "N/A"}</p>
                </div>
              ))}
            </div>
          )
        ) : (
          <p className="px-4 py-3 text-sm text-slate-500">Selectionnez un etablissement pour voir les alertes.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Stock de l'etablissement" subtitle="Articles et uantites disponibles" />
        {selectedEtablissement ? (
          articlesLoading ? (
            <p className="px-4 py-3 text-sm text-slate-500">Chargement...</p>
          ) : articlesError ? (
            <p className="px-4 py-3 text-sm text-rose-600">{articlesError}</p>
          ) : filteredArticles.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">Aucun article pour cet etablissement.</p>
          ) : (
            <div className="mt-4 overflow-x-auto text-sm">
              {categories.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-3 px-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    Categorie
                    <select
                      className="rounded-full border border-slate-300 px-3 py-1"
                      value={selectedCategoryId}
                      onChange={(event) => setSelectedCategoryId(event.target.value)}
                      disabled={categoriesLoading}
                    >
                      <option value="">Toutes</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.nom}
                        </option>
                      ))}
                    </select>
                    {categoriesLoading ? <span className="text-xs text-slate-500">Maj...</span> : null}
                    {categoriesError ? <span className="text-xs text-rose-600">{categoriesError}</span> : null}
                  </label>
                </div>
              ) : null}
              <table className="min-w-full">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-3 pr-6 font-semibold">Article</th>
                    <th className="pb-3 pr-6 font-semibold">Reference</th>
                    <th className="pb-3 pr-6 font-semibold">Quantite</th>
                    <th className="pb-3 font-semibold">Seuil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredArticles
                    .slice()
                    .sort((a, b) => {
                      const ca = categoryById[a.categorieId ?? ""] ?? "";
                      const cb = categoryById[b.categorieId ?? ""] ?? "";
                      if (ca !== cb) return ca.localeCompare(cb);
                      return a.nom.localeCompare(b.nom);
                    })
                    .map((article) => {
                      const isLow = article.uantite <= article.seuilAlerte;
                      return (
                        <tr key={article.id}>
                          <td className="py-3 pr-6 font-semibold text-slate-900">{article.nom}</td>
                          <td className="py-3 pr-6 text-slate-500">{article.referenceFournisseur ?? "—"}</td>
                          <td className="py-3 pr-6">
                            <span className={cn(isLow ? "text-rose-600" : "text-slate-900")}>{article.uantite}</span>
                          </td>
                          <td className="py-3">{article.seuilAlerte}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <p className="px-4 py-3 text-sm text-slate-500">Selectionnez un etablissement pour voir le stock.</p>
        )}
      </Card>

      <CreateEstablishmentForm open={establishmentDialogOpen} onOpenChange={setEstablishmentDialogOpen} onCreated={handleCreated} />
      <EditEstablishmentDialog
        open={editEstablishmentDialogOpen}
        establishment={editingEstablishment}
        onOpenChange={handleEditEstablishmentOpenChange}
        onUpdated={(updated) => {
          handleEstablishmentUpdated(updated);
        }}
      />

      {selectedEtablissement ? (
        <CreateUserForm
          open={userDialogOpen}
          onOpenChange={setUserDialogOpen}
          onCreated={handleUserCreated}
          establishments={establishments}
          canSelectTenant={false}
          forcedTenantId={selectedEtablissement.id}
          forcedTenantLabel={selectedEtablissement.nom}
        />
      ) : null}

      <EditUserDialog
        open={editDialogOpen}
        user={editingUser}
        onOpenChange={handleEditOpenChange}
        onUpdated={fetchUsers}
        establishments={establishments}
        canSelectTenant={false}
      />
    </div>
  );
}
