import { useEffect, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/api";
import { UserPermissionsFields } from "@/components/super-admin/UserPermissionsFields";
import { defaultPermissionsForRole, type UserPermissions } from "@/lib/permissions";
import type { RoleSelection } from "@/types/roles";

type Establishment = { id: string; nom: string };
type User = {
  id: string;
  nom: string;
  identifiant: string;
  contactEmail?: string | null;
  role: string;
  actif: boolean;
  etablissementId: string | null;
  permissions: UserPermissions;
};

type Props = {
  open: boolean;
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
  establishments: Establishment[];
  canSelectTenant: boolean;
};

export function EditUserDialog({ open, user, onOpenChange, onUpdated, establishments, canSelectTenant }: Props) {
  const [form, setForm] = useState({
    nom: "",
    identifiant: "",
    email: "",
    role: "agent" as RoleSelection,
    actif: true,
    etablissementId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissionsForRole("agent"));

  useEffect(() => {
    if (open && user) {
      setForm({
        nom: user.nom,
        identifiant: user.identifiant,
        email: user.contactEmail ?? "",
        role: user.role as RoleSelection,
        actif: user.actif,
        etablissementId: user.etablissementId ?? "",
      });
      setPermissions(user.permissions ?? defaultPermissionsForRole(user.role as RoleSelection));
      setError(null);
    }
    if (!open) {
      setError(null);
      setLoading(false);
    }
  }, [open, user]);

  if (!open || !user) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setError(null);
    if (canSelectTenant && (form.role === "admin" || form.role === "responsable") && !form.etablissementId) {
      setError("Un etablissement est requis pour ce role");
      return;
    }
    setLoading(true);
    try {
      await api.updateUser(user.id, {
        nom: form.nom,
        identifiant: form.identifiant,
        contactEmail: form.email || null,
        role: form.role,
        actif: form.actif,
        etablissementId: canSelectTenant ? form.etablissementId || null : undefined,
        permissions,
      });
      onUpdated();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre a jour l'utilisateur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl">
        <Card className="border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/50 to-white shadow-xl shadow-emerald-900/5">
          <CardHeader title="Modifier l’utilisateur" subtitle="Mettre a jour role, profil et etat" />
          <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
            <label className="text-sm font-semibold text-slate-800">
              Nom complet
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                className="mt-1 rounded-xl border-2 border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                required
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Identifiant (login)
              <input
                type="text"
                value={form.identifiant}
                onChange={(e) => setForm((f) => ({ ...f, identifiant: e.target.value }))}
                className="mt-1 rounded-xl border-2 border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                required
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Email (contact)
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 rounded-xl border-2 border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Rôle
              <select
                value={form.role}
                onChange={(e) => {
                  const nextRole = e.target.value as RoleSelection;
                  setForm((f) => ({ ...f, role: nextRole }));
                  setPermissions(defaultPermissionsForRole(nextRole));
                }}
                className="mt-1 rounded-xl border-2 border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="admin">Administrateur etablissement</option>
                <option value="responsable">Responsable magasin</option>
                <option value="agent">Agent d&apos;exploitation</option>
              </select>
            </label>
            {canSelectTenant ? (
              <label className="text-sm font-semibold text-slate-800">
                Etablissement
                <select
                  value={form.etablissementId}
                  onChange={(e) => setForm((f) => ({ ...f, etablissementId: e.target.value }))}
                  className="mt-1 rounded-xl border-2 border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  required={form.role === "admin" || form.role === "responsable"}
                >
                  <option value="">Aucun (Global)</option>
                  {establishments.map((etab) => (
                    <option key={etab.id} value={etab.id}>
                      {etab.nom}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <UserPermissionsFields role={form.role} value={permissions} onChange={setPermissions} />
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={form.actif}
                onChange={(e) => setForm((f) => ({ ...f, actif: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
              />
              Compte actif
            </label>
            {error ? <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-inner">{error}</div> : null}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-700/30 transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:opacity-60"
              >
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
