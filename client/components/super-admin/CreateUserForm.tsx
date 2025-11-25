import { useEffect, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  establishments: Array<{ id: string; nom: string }>;
  canSelectTenant: boolean;
};

export function CreateUserForm({ open, onOpenChange, onCreated, establishments, canSelectTenant }: Props) {
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
        etablissementId: canSelectTenant ? form.etablissementId || null : undefined,
      });
      onCreated();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer l'utilisateur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl">
        <Card>
          <CardHeader title="Nouvel utilisateur" subtitle="Attribuez un rôle et un établissement" />
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-slate-700">
              Nom complet
              <input type="text" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="mt-1" required />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Identifiant / Email
              <input type="text" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1" required />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Mot de passe
              <input type="password" value={form.motDePasse} onChange={(e) => setForm((f) => ({ ...f, motDePasse: e.target.value }))} className="mt-1" required />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Rôle
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="mt-1">
                <option value="admin">Administrateur établissement</option>
                <option value="responsable">Responsable magasin</option>
                <option value="agent">Agent d’entretien</option>
              </select>
            </label>
            {canSelectTenant ? (
              <label className="text-sm font-medium text-slate-700">
                Établissement
                <select value={form.etablissementId} onChange={(e) => setForm((f) => ({ ...f, etablissementId: e.target.value }))} className="mt-1" required>
                  <option value="">Aucun (Global)</option>
                  {establishments.map((etab) => (
                    <option key={etab.id} value={etab.id}>
                      {etab.nom}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Annuler
              </button>
              <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                {loading ? "Création..." : "Créer"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
