import { useEffect, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/api";
import { UserPermissionsFields } from "@/components/super-admin/UserPermissionsFields";
import { defaultPermissionsForRole, type UserPermissions } from "@/lib/permissions";
import type { RoleSelection } from "@/types/roles";
import { useCallback } from "react";

type Establishment = { id: string; nom: string };
type User = {
  id: string;
  nom: string;
  identifiant: string;
  contactEmail?: string | null;
  role: string;
  actif: boolean;
  etablissementId: string | null;
  domaine?: string | null;
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
    domaine: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissionsForRole("agent"));
  const [responsableDomains, setResponsableDomains] = useState<Array<{ domain: string; responsable: string }>>([]);
  const [domainsLoading, setDomainsLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setForm({
        nom: user.nom,
        identifiant: user.identifiant,
        email: user.contactEmail ?? "",
        role: user.role as RoleSelection,
        actif: user.actif,
        etablissementId: user.etablissementId ?? "",
        domaine: user.domaine ?? "",
      });
      setPermissions(user.permissions ?? defaultPermissionsForRole(user.role as RoleSelection));
      setError(null);

      // Si le domaine n'est pas présent dans la liste, on recharge la fiche ciblée pour le préremplir.
      if (!user.domaine) {
        api
          .getUsers()
          .then((list) => {
            const fresh = list.find((u) => u.id === user.id);
            if (fresh) {
              setForm((prev) => ({
                ...prev,
                domaine: fresh.domaine ?? prev.domaine,
              }));
            }
          })
          .catch(() => null);
      }
    }
    if (!open) {
      setError(null);
      setLoading(false);
    }
  }, [open, user]);

  const loadResponsableDomains = useCallback(
    (tenantId: string | null) => {
      if (!tenantId) {
        setResponsableDomains([]);
        return;
      }
      setDomainsLoading(true);
      api
        .getUsers()
        .then((users) => {
          const pairs = users
            .filter((u) => u.role === "responsable" && u.etablissementId === tenantId && u.domaine)
            .map((u) => ({ domain: u.domaine as string, responsable: u.nom }));
          const unique = new Map<string, { domain: string; responsable: string }>();
          pairs.forEach((pair) => {
            if (!unique.has(pair.domain)) unique.set(pair.domain, pair);
          });
          setResponsableDomains(Array.from(unique.values()));
        })
        .catch(() => setResponsableDomains([]))
        .finally(() => setDomainsLoading(false));
    },
    [],
  );

  useEffect(() => {
    if (!open || !user) return;
    if (form.role !== "agent") {
      setResponsableDomains([]);
      return;
    }
    loadResponsableDomains(form.etablissementId || null);
  }, [open, user, form.role, form.etablissementId, loadResponsableDomains]);

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
        domaine: form.domaine || null,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-8 backdrop-blur-sm sm:px-6">
      <div className="mx-auto w-full max-w-xl">
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
                <option value="agent">Agent d&apos;entretien</option>
              </select>
            </label>
            {form.role === "agent" ? (
              <label className="text-sm font-semibold text-slate-800">
                Domaine (agents) — reprend les domaines de vos responsables
                <select
                  value={form.domaine}
                  onChange={(e) => setForm((f) => ({ ...f, domaine: e.target.value }))}
                  className="mt-1 w-full rounded-xl border-2 border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  disabled={domainsLoading}
                >
                  <option value="">Sélectionner...</option>
                  {responsableDomains.map((entry) => (
                    <option key={entry.domain} value={entry.domain}>
                      {entry.domain} (rattaché à {entry.responsable})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Basé sur les responsables de l&apos;établissement sélectionné.
                  {domainsLoading ? " Chargement..." : responsableDomains.length === 0 ? " Aucun domaine disponible pour cet établissement." : ""}
                </p>
              </label>
            ) : (
              <label className="text-sm font-semibold text-slate-800">
                Domaine / pôle
                <input
                  type="text"
                  value={form.domaine}
                  onChange={(e) => setForm((f) => ({ ...f, domaine: e.target.value }))}
                  className="mt-1 rounded-xl border-2 border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="Informatique, Ménage..."
                />
              </label>
            )}
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
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
