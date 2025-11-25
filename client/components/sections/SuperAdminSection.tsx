import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { CreateEstablishmentForm } from "@/components/super-admin/CreateEstablishmentForm";
import { api } from "@/lib/api";

export function SuperAdminSection() {
  const [establishments, setEstablishments] = useState<Array<{ id: string; nom: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    api
      .getEstablishments()
      .then((data) => setEstablishments(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger les établissements"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (establishment: { id: string; nom: string; createdAt: string }) => {
    setEstablishments((prev) => [establishment, ...prev]);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Super-Admin</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Vision globale du service</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          Surveillez l’activité de chaque établissement, pilotez les administrateurs et centralisez les alertes critiques.
          Chaque donnée est isolée, mais visible pour vous pour garantir la cohérence du réseau.
        </p>
      </div>

      <Card>
        <CardHeader title="Tableau de bord à construire" subtitle="Les indicateurs globaux seront branchés sur les données réelles" />
        <p className="text-sm text-slate-600">Tous les anciens chiffres fictifs ont été retirés pour ne garder que l’interface fonctionnelle (établissements + utilisateurs).</p>
      </Card>

      <Card>
        <CardHeader
          title="Établissements connectés"
          subtitle="Gestion hiérarchisée"
          action={
            <button type="button" onClick={() => setDialogOpen(true)} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Nouvel établissement
            </button>
          }
        />
        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : establishments.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun établissement enregistré.</p>
          ) : (
            establishments.map((school) => (
              <div key={school.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{school.nom}</p>
                  <p className="text-sm text-slate-500">Créé le {new Date(school.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="info">Tenant isolé</Badge>
                </div>
                <button className="text-sm font-semibold text-slate-900">Voir l’activité</button>
              </div>
            ))
          )}
        </div>
      </Card>

      <CreateEstablishmentForm open={dialogOpen} onOpenChange={setDialogOpen} onCreated={handleCreated} />
    </div>
  );
}
