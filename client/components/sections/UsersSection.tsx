import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { CreateUserForm } from "@/components/super-admin/CreateUserForm";
import { EditUserDialog } from "@/components/super-admin/EditUserDialog";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";

export function UsersSection() {
  const { role } = useAuth();

  const isSuperAdmin = role === "superAdmin";
  const canManageUsers = role === "superAdmin" || role === "admin";

  const [users, setUsers] = useState<
    Array<{ id: string; nom: string; email: string; role: string; actif: boolean; etablissementId: string | null }>
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

  /* ───────────── Fetch ───────────── */

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

  /* ───────────── Filtering ───────────── */

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users
      .filter((u) => u.id !== currentUserId)
      .filter((u) => (tenantFilter ? u.etablissementId === tenantFilter : true))
      .filter((u) => {
        if (!q) return true;
        return (
          u.nom.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
        );
      });
  }, [users, currentUserId, search, tenantFilter]);

  /* ───────────── Actions ───────────── */

  const handleDelete = async (user: (typeof users)[number]) => {
    if (!window.confirm(`Supprimer l’utilisateur ${user.nom} ?`)) return;

    setDeletingUserId(user.id);
    try {
      await api.deleteUser(user.id);
      await fetchUsers();
    } catch {
      setError("Impossible de supprimer l’utilisateur");
    } finally {
      setDeletingUserId(null);
    }
  };

  /* ───────────── Render ───────────── */

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
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Créer un utilisateur
            </button>
          ) : null
        }
      />

      {/* ───────────── Filtres ───────────── */}
      <Card>
        <CardHeader title="Filtres" />
        <div className="flex flex-wrap gap-3 pt-2">
          {isSuperAdmin && (
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm"
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
            className="w-64 rounded-full border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </Card>

      {/* ───────────── Liste utilisateurs ───────────── */}
      <Card>
        <CardHeader title="Utilisateurs" subtitle={`${filteredUsers.length} compte(s)`} />

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-3 pr-6">Utilisateur</th>
                <th className="pb-3 pr-6">Rôle</th>
                <th className="pb-3 pr-6">Établissement</th>
                <th className="pb-3 pr-6">État</th>
                {canManageUsers && <th className="pb-3 text-right">Actions</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={columnCount} className="py-6 text-center text-slate-500">Chargement…</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columnCount} className="py-6 text-center text-rose-600">{error}</td>
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
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>

                    <td className="py-4 pr-6">
                      <Badge variant="secondary" className="capitalize">
                        {user.role}
                      </Badge>
                    </td>

                    <td className="py-4 pr-6 text-slate-600">
                      {user.etablissementId
                        ? establishmentNames[user.etablissementId] ?? "—"
                        : "Global"}
                    </td>

                    <td className="py-4 pr-6">
                      <Badge variant={user.actif ? "success" : "warning"}>
                        {user.actif ? "Actif" : "Désactivé"}
                      </Badge>
                    </td>

                    {canManageUsers && (
                      <td className="py-4 text-right">
                        <div className="inline-flex gap-2">
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
                              deletingUserId === user.id ||
                              (role === "admin" && user.role === "admin")
                            }
                            className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                          >
                            {deletingUserId === user.id ? "…" : "Supprimer"}
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
      </Card>

      {/* Dialogs */}
      {canManageUsers && (
        <CreateUserForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreated={fetchUsers}
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
