import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { CreateUserForm } from "@/components/super-admin/CreateUserForm";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";

export function UsersSection() {
  const { role } = useAuth();
  const [users, setUsers] = useState<Array<{ id: string; nom: string; email: string; role: string; actif: boolean; etablissementId: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [establishments, setEstablishments] = useState<Array<{ id: string; nom: string }>>([]);

  const canManageUsers = role === "superAdmin" || role === "admin";

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
  }, []);

  useEffect(() => {
    if (role === "superAdmin") {
      api.getEstablishments().then((data) => setEstablishments(data));
    }
  }, [role]);

  const reloadUsers = () => {
    void fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Gestion des utilisateurs</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Rôles & affectations</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          Les administrateurs créent des comptes, définissent les rôles, assignent les établissements et activent ou désactivent les accès.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Utilisateurs"
          subtitle="Vue rapide des profils"
          action={
            canManageUsers ? (
              <div className="flex gap-3">
                <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Filtrer par rôle</button>
                <button onClick={() => setDialogOpen(true)} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  Créer un utilisateur
                </button>
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
                <th className="pb-3 font-semibold">État</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-slate-500">
                    Chargement…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-slate-500">
                    Aucun utilisateur.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="py-4 pr-6 font-semibold text-slate-900">{user.nom}</td>
                    <td className="py-4 pr-6 capitalize">{user.role}</td>
                    <td className="py-4 pr-6">{user.etablissementId ?? "Global"}</td>
                    <td className="py-4">
                      <Badge variant={user.actif ? "success" : "warning"}>{user.actif ? "Actif" : "Désactivé"}</Badge>
                    </td>
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
    </div>
  );
}
