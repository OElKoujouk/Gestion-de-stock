import { useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (establishment: { id: string; nom: string; createdAt: string }) => void;
};

export function CreateEstablishmentForm({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const establishment = await api.createEstablishment({ nom: name });
      onCreated(establishment);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer l'établissement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader title="Nouvel établissement" subtitle="Chaque établissement dispose de son tenant isolé" />
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-slate-700">
              Nom
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} className="mt-1" required />
            </label>
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
