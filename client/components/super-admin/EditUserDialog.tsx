import { useEffect, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/api";

type Establishment = { id: string; nom: string };
type User = { id: string; nom: string; email: string; role: string; actif: boolean; etablissementId: string | null };

type Props = {
  open: boolean;
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
  establishments: Establishment[];
  canSelectTenant: boolean;
};

export function EditUserDialog({ open, user, onOpenChange, onUpdated, establishments, canSelectTenant }: Props) {
  const [form, setForm] = useState({ nom: "", email: "", role: "agent", actif: true, etablissementId: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setForm({
        nom: user.nom,
        email: user.email,
        role: user.role,
        actif: user.actif,
        etablissementId: user.etablissementId ?? "",
      });
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
    setError(null);
    setLoading(true);
    try {
      await api.updateUser(user.id, {
        nom: form.nom,
        email: form.email,
        role: form.role,
        actif: form.actif,
        etablissementId: canSelectTenant ? form.etablissementId || null : undefined,
      });
      onUpdated();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour l’utilisateur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl">
        <Card>
          <CardHeader title="Modifier l’utilisateur" subtitle="Mettre à jour rôle, profil et état" />
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-slate-700">
              Nom complet
              <input type="text" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="mt-1" required />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1" required />
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
                <select value={form.etablissementId} onChange={(e) => setForm((f) => ({ ...f, etablissementId: e.target.value }))} className="mt-1">
                  <option value="">Aucun (Global)</option>
                  {establishments.map((etab) => (
                    <option key={etab.id} value={etab.id}>
                      {etab.nom}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.actif}
                onChange={(e) => setForm((f) => ({ ...f, actif: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
              />
              Compte actif
            </label>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Annuler
              </button>
              <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
