import { useEffect, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
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
  const [form, setForm] = useState({ nom: "", email: "", motDePasse: "", role: "responsable", etablissementId: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm({ nom: "", email: "", motDePasse: "", role: "responsable", etablissementId: "" });
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

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.createUser({
        nom: form.nom,
        email: form.email,
        motDePasse: form.motDePasse,
        role: form.role,
        etablissementId:
          forcedTenantId !== undefined
            ? forcedTenantId || null
            : canSelectTenant
              ? form.etablissementId || null
              : undefined,
      });
      onCreated();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer l’utilisateur");
    } finally {
      setLoading(false);
    }
  }

  const showTenantSelect = !forcedTenantId && canSelectTenant;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl">
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
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 rounded-xl border-2 border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                required
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
              Rôle
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="mt-1 rounded-xl border-2 border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="admin">Administrateur établissement</option>
                <option value="responsable">Responsable magasin</option>
                <option value="agent">Agent d'exploitation</option>
              </select>
            </label>
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
                {loading ? "Création..." : "Créer"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
