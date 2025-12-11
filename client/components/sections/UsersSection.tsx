import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { CreateUserForm } from "@/components/super-admin/CreateUserForm";
import { EditUserDialog } from "@/components/super-admin/EditUserDialog";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import type { UserPermissions } from "@/lib/permissions";

export function UsersSection() {
  const { role } = useAuth();

  const isSuperAdmin = role === "superAdmin";
  const canManageUsers = role === "superAdmin" || role === "admin";

  const [users, setUsers] = useState<
    Array<{
      id: string;
      nom: string;
      identifiant: string;
      contactEmail?: string | null;
      role: string;
      actif: boolean;
      etablissementId: string | null;
      permissions: UserPermissions;
    }>
  >([]);
  const [establishments, setEstablishments] = useState<Array<{ id: string; nom: string }>>([]);
  const [establishmentNames, setEstablishmentNames] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<(typeof users)[number] | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");

  const tenantFilter = isSuperAdmin ? selectedTenantId : undefined;
  const columnCount = canManageUsers ? 5 : 4;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
    api
      .me()
      .then((me) => setCurrentUserId(me.id))
      .catch(() => setCurrentUserId(null));
  }, []);

  useEffect(() => {
    if (!canManageUsers) return;

    api
      .getEstablishments()
      .then((data) => {
        setEstablishments(data);
        setEstablishmentNames(Object.fromEntries(data.map((e) => [e.id, e.nom])));
      })
      .catch(() => {
        setEstablishments([]);
        setEstablishmentNames({});
      });
  }, [canManageUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users
      .filter((u) => u.id !== currentUserId)
      .filter((u) => (tenantFilter ? u.etablissementId === tenantFilter : true))
      .filter((u) => {
        if (!q) return true;
        return (
          u.nom.toLowerCase().includes(q) ||
          u.identifiant.toLowerCase().includes(q) ||
          (u.contactEmail ?? "").toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
        );
      });
  }, [users, currentUserId, search, tenantFilter]);

  const handleDelete = async (user: (typeof users)[number]) => {
    if (!window.confirm(`Supprimer l'utilisateur ${user.nom} ?`)) return;

    setDeletingUserId(user.id);
    try {
      await api.deleteUser(user.id);
      await fetchUsers();
    } catch {
      setError("Impossible de supprimer l'utilisateur");
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Gestion des utilisateurs"
        title="Rôles & affectations"
        description="Création des comptes, attribution des rôles et rattachement aux établissements."
        actions={
          canManageUsers ? (
            <button
              onClick={() => setDialogOpen(true)}
              className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto"
            >
              Créer un utilisateur
            </button>
          ) : null
        }
      />

      <Card>
        <CardHeader title="Filtres" />
        <div className="flex flex-col flex-wrap gap-3 pt-2 sm:flex-row">
          {isSuperAdmin && (
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm sm:w-auto"
            >
              <option value="">Tous les établissements</option>
              {establishments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom}
                </option>
              ))}
            </select>
          )}

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, email ou rôle…"
            className="min-w-[200px] w-full rounded-full border border-slate-200 px-3 py-2 text-sm sm:w-64"
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Utilisateurs" subtitle={`${filteredUsers.length} compte(s)`} />

        {/* Mobile: cartes empilées */}
        <div className="users-cards mt-4 space-y-3 sm:hidden">
          {loading ? (
            <p className="py-4 text-center text-sm text-slate-500">Chargement…</p>
          ) : error ? (
            <p className="py-4 text-center text-sm text-rose-600">{error}</p>
          ) : filteredUsers.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Aucun utilisateur trouvé.</p>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{user.nom}</p>
                    <p className="text-xs text-slate-500">
                      {user.identifiant}
                      {user.contactEmail ? ` · ${user.contactEmail}` : ""}
                    </p>
                  </div>
                  <Badge variant="neutral" className="capitalize">
                    {user.role}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
                  <Badge variant="neutral">
                    {user.etablissementId ? establishmentNames[user.etablissementId] ?? "—" : "Global"}
                  </Badge>
                  <Badge variant={user.actif ? "success" : "warning"}>
                    {user.actif ? "Actif" : "Désactivé"}
                  </Badge>
                </div>

                {canManageUsers ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setEditDialogOpen(true);
                      }}
                      disabled={role === "admin" && user.role === "admin"}
                      className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold hover:bg-slate-200 disabled:opacity-50"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={deletingUserId === user.id || (role === "admin" && user.role === "admin")}
                      className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                    >
                      {deletingUserId === user.id ? "Suppression…" : "Supprimer"}
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        {/* Tablette / Desktop : tableau */}
        <div className="users-table-wrapper mt-4 hidden overflow-x-auto sm:block">
          <div className="min-w-[720px]">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="whitespace-nowrap pb-3 pr-6">Utilisateur</th>
                  <th className="pb-3 pr-6">Rôle</th>
                  <th className="pb-3 pr-6">Établissement</th>
                  <th className="pb-3 pr-6">État</th>
                  {canManageUsers && <th className="pb-3 text-right">Actions</th>}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={columnCount} className="py-6 text-center text-slate-500">
                      Chargement…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={columnCount} className="py-6 text-center text-rose-600">
                      {error}
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={columnCount} className="py-6 text-center text-slate-500">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="py-4 pr-6">
                        <p className="font-semibold text-slate-900">{user.nom}</p>
                        <p className="text-xs text-slate-500">
                          {user.identifiant}
                          {user.contactEmail ? ` · ${user.contactEmail}` : ""}
                        </p>
                      </td>

                      <td className="py-4 pr-6">
                        <Badge variant="neutral" className="capitalize">
                          {user.role}
                        </Badge>
                      </td>

                      <td className="py-4 pr-6 text-slate-600">
                        {user.etablissementId ? establishmentNames[user.etablissementId] ?? "—" : "Global"}
                      </td>

                      <td className="py-4 pr-6">
                        <Badge variant={user.actif ? "success" : "warning"}>
                          {user.actif ? "Actif" : "Désactivé"}
                        </Badge>
                      </td>

                      {canManageUsers && (
                        <td className="py-4 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setEditDialogOpen(true);
                              }}
                              disabled={role === "admin" && user.role === "admin"}
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold hover:bg-slate-200 disabled:opacity-50"
                            >
                              Modifier
                            </button>

                            <button
                              onClick={() => handleDelete(user)}
                              disabled={
                                deletingUserId === user.id || (role === "admin" && user.role === "admin")
                              }
                              className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                            >
                              {deletingUserId === user.id ? "Suppression…" : "Supprimer"}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {canManageUsers && (
        <CreateUserForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreated={() => {
            void fetchUsers();
          }}
          establishments={establishments}
          canSelectTenant={isSuperAdmin}
        />
      )}

      {canManageUsers && (
        <EditUserDialog
          open={editDialogOpen}
          user={editingUser}
          onOpenChange={setEditDialogOpen}
          onUpdated={fetchUsers}
          establishments={establishments}
          canSelectTenant={isSuperAdmin}
        />
      )}
    </div>
  );
}
