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
  const [users, setUsers] = useState<Array<{ id: string; nom: string; email: string; role: string; actif: boolean; etablissementId: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [establishments, setEstablishments] = useState<Array<{ id: string; nom: string }>>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<{
    id: string;
    nom: string;
    email: string;
    role: string;
    actif: boolean;
    etablissementId: string | null;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; nom: string; role: string; etablissementId: string | null } | null>(null);
  const [establishmentNames, setEstablishmentNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const canManageUsers = role === "superAdmin" || role === "admin";
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
      .then((data) => setCurrentUser({ id: data.id, nom: data.nom, role: data.role, etablissementId: data.etablissementId }))
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    if (role === "superAdmin" || role === "admin") {
      api
        .getEstablishments()
        .then((data) => {
          setEstablishments(data);
          setEstablishmentNames(Object.fromEntries(data.map((etab) => [etab.id, etab.nom])));
        })
        .catch(() => {
          setEstablishments([]);
        });
    }
  }, [role]);

  const reloadUsers = () => {
    void fetchUsers();
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = users.filter((user) => user.id !== currentUser?.id);
    if (!query) return list;
    return list.filter(
      (user) =>
        user.nom.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query),
    );
  }, [users, currentUser, search]);

  const handleOpenEdit = (user: (typeof users)[number]) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleEditOpenChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setEditingUser(null);
    }
  };

  const handleDelete = async (user: (typeof users)[number]) => {
    if (!window.confirm(`Supprimer l’utilisateur ${user.nom} ?`)) {
      return;
    }
    setDeletingUserId(user.id);
    try {
      await api.deleteUser(user.id);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer l’utilisateur");
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="space-y-6">

      <SectionHeader
        eyebrow="Gestion des utilisateurs"
        title="Rôles & affectations"
        description="Les administrateurs créent des comptes, définissent les rôles, assignent les établissements et activent ou désactivent les accès."
        actions={
          canManageUsers ? (
            <button
              onClick={() => setDialogOpen(true)}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800"
            >
              Créer un utilisateur
            </button>
          ) : null
        }
      />

      <Card>
        <CardHeader
          title="Utilisateurs"
          subtitle="Vue rapide des profils"
          action={
            canManageUsers ? (
              <div className="flex flex-wrap gap-3">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher par nom, email ou rôle"
                  className="w-64 rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none"
                />
              </div>
            ) : undefined
          }
        />
        <div className="mt-6 overflow-x-auto text-sm">
          <table className="min-w-full">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-3 pr-6 font-semibold">Nom</th>
                <th className="pb-3 pr-6 font-semibold">Rôle</th>
                <th className="pb-3 pr-6 font-semibold">Établissement</th>
                <th className="pb-3 pr-6 font-semibold">État</th>
                {canManageUsers ? <th className="pb-3 font-semibold">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={columnCount} className="py-4 text-center text-sm text-slate-500">
                    Chargement...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columnCount} className="py-4 text-center text-sm text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="py-4 text-center text-sm text-slate-500">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="py-4 pr-6 font-semibold text-slate-900">{user.nom}</td>
                    <td className="py-4 pr-6 capitalize">{user.role}</td>
                    <td className="py-4 pr-6">{user.etablissementId ? establishmentNames[user.etablissementId] ?? user.etablissementId : "Global"}</td>
                    <td className="py-4 pr-6">
                      <Badge variant={user.actif ? "success" : "warning"}>{user.actif ? "Actif" : "Désactivé"}</Badge>
                    </td>
                    {canManageUsers ? (
                      <td className="py-4">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="text-sm font-semibold text-slate-900 underline disabled:opacity-50"
                            disabled={role === "admin" && user.role === "admin"}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            className="text-sm font-semibold text-rose-600 underline disabled:opacity-50"
                            disabled={deletingUserId === user.id || (role === "admin" && user.role === "admin")}
                          >
                            {deletingUserId === user.id ? "Suppression..." : "Supprimer"}
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {canManageUsers ? (
        <CreateUserForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreated={reloadUsers}
          establishments={establishments}
          canSelectTenant={role === "superAdmin"}
        />
      ) : null}

      {canManageUsers ? (
        <EditUserDialog
          open={editDialogOpen}
          user={editingUser}
          onOpenChange={handleEditOpenChange}
          onUpdated={reloadUsers}
          establishments={establishments}
          canSelectTenant={role === "superAdmin"}
        />
      ) : null}
    </div>
  );
}
