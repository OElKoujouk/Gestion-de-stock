import { useEffect, useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/api";

type Establishment = {
  id: string;
  nom: string;
  createdAt: string;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
};

type Props = {
  open: boolean;
  establishment: Establishment | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: (establishment: Establishment) => void;
};

export function EditEstablishmentDialog({ open, establishment, onOpenChange, onUpdated }: Props) {
  const [form, setForm] = useState({ nom: "", adresse: "", codePostal: "", ville: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && establishment) {
      setForm({
        nom: establishment.nom,
        adresse: establishment.adresse ?? "",
        codePostal: establishment.codePostal ?? "",
        ville: establishment.ville ?? "",
      });
      setError(null);
    }
    if (!open) {
      setLoading(false);
    }
  }, [open, establishment]);

  if (!open || !establishment) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!establishment) return;
    if (!form.nom.trim()) {
      setError("Le nom est obligatoire");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const updated = await api.updateEstablishment(establishment.id, {
        nom: form.nom.trim(),
        adresse: form.adresse || null,
        codePostal: form.codePostal || null,
        ville: form.ville || null,
      });
      onUpdated(updated);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour l’établissement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl">
        <Card className="border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/60 to-white shadow-xl shadow-emerald-900/5">
          <CardHeader title="Modifier l’établissement" subtitle="Mettre à jour l'adresse et les informations" />
          <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
            <label className="text-sm font-semibold text-slate-800">
              Nom de l’établissement
              <input
                type="text"
                value={form.nom}
                onChange={(event) => setForm((prev) => ({ ...prev, nom: event.target.value }))}
                className="mt-1 w-full rounded-xl border-2 border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                required
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Adresse
              <input
                type="text"
                value={form.adresse}
                onChange={(event) => setForm((prev) => ({ ...prev, adresse: event.target.value }))}
                className="mt-1 w-full rounded-xl border-2 border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-800">
                Code postal
                <input
                  type="text"
                  value={form.codePostal}
                  onChange={(event) => setForm((prev) => ({ ...prev, codePostal: event.target.value }))}
                  className="mt-1 w-full rounded-xl border-2 border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Ville
                <input
                  type="text"
                  value={form.ville}
                  onChange={(event) => setForm((prev) => ({ ...prev, ville: event.target.value }))}
                  className="mt-1 w-full rounded-xl border-2 border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>
            {error ? <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-inner">{error}</div> : null}
            <div className="flex items-center justify-end gap-3 pt-1">
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
