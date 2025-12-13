import { useEffect, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/api";
import { defaultPermissionsForRole, type UserPermissions } from "@/lib/permissions";
import { UserPermissionsFields } from "@/components/super-admin/UserPermissionsFields";
import type { RoleSelection } from "@/types/roles";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (user: {
    id: string;
    nom: string;
    identifiant: string;
    contactEmail?: string | null;
    role: string;
    etablissementId: string | null;
    domaine?: string | null;
    permissions: UserPermissions;
  }) => void;
  establishments: Array<{ id: string; nom: string }>;
  canSelectTenant: boolean;
  forcedTenantId?: string | null;
  forcedTenantLabel?: string;
};

export function CreateUserForm({
  open,
  onOpenChange,
  onCreated,
  establishments,
  canSelectTenant,
  forcedTenantId,
  forcedTenantLabel,
}: Props) {
  const [form, setForm] = useState({
    nom: "",
    identifiant: "",
    email: "",
    motDePasse: "",
    role: "responsable" as RoleSelection,
    etablissementId: "",
    domaine: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissionsForRole("responsable"));

  useEffect(() => {
    if (!open) {
      setForm({ nom: "", identifiant: "", email: "", motDePasse: "", role: "responsable", etablissementId: "", domaine: "" });
      setPermissions(defaultPermissionsForRole("responsable"));
      setError(null);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (forcedTenantId !== undefined) {
      setForm((prev) => ({ ...prev, etablissementId: forcedTenantId ?? "" }));
    }
  }, [forcedTenantId, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const created = await api.createUser({
        nom: form.nom,
        identifiant: form.identifiant || form.email,
        contactEmail: form.email || null,
        motDePasse: form.motDePasse,
        role: form.role,
        domaine: form.domaine || null,
        etablissementId:
          forcedTenantId !== undefined
            ? forcedTenantId || null
            : canSelectTenant
              ? form.etablissementId || null
              : undefined,
        permissions,
      });
      onCreated(created);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer l’utilisateur");
    } finally {
      setLoading(false);
    }
  }

  const showTenantSelect = !forcedTenantId && canSelectTenant;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-8 backdrop-blur-sm sm:px-6">
      <div className="mx-auto w-full max-w-xl">
        <Card className="border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/50 to-white shadow-xl shadow-emerald-900/5">
          <CardHeader title="Nouvel utilisateur" subtitle="Attribuez un rôle et un établissement" />
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
              Identifiant
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
              Mot de passe
              <input
                type="password"
                value={form.motDePasse}
                onChange={(e) => setForm((f) => ({ ...f, motDePasse: e.target.value }))}
                className="mt-1 rounded-xl border-2 border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                required
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Domaine / pôle (ex. Informatique, Ménage)
              <input
                type="text"
                value={form.domaine}
                onChange={(e) => setForm((f) => ({ ...f, domaine: e.target.value }))}
                className="mt-1 rounded-xl border-2 border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Informatique, Ménage..."
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
                <option value="admin">Administrateur établissement</option>
                <option value="responsable">Responsable magasin</option>
                <option value="agent">Agent d&apos;entretien</option>
              </select>
            </label>
            <UserPermissionsFields role={form.role} value={permissions} onChange={setPermissions} />
            {forcedTenantId ? (
              <div className="text-sm font-semibold text-slate-800">
                Établissement
                <p className="mt-1 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600">
                  {forcedTenantLabel ?? establishments.find((etab) => etab.id === forcedTenantId)?.nom ?? "Aucun (Global)"}
                </p>
              </div>
            ) : showTenantSelect ? (
              <label className="text-sm font-semibold text-slate-800">
                Établissement
                <select
                  value={form.etablissementId}
                  onChange={(e) => setForm((f) => ({ ...f, etablissementId: e.target.value }))}
                  className="mt-1 rounded-xl border-2 border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  required
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
            {error ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-inner">{error}</div>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
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
                {loading ? "Création..." : "Créer"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
