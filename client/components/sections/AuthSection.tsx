import { useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/api";

const roleRedirects = [
  { role: "Super-Admin", destination: "Vue consolidée multi-établissements" },
  { role: "Administrateur", destination: "Dashboard établissement" },
  { role: "Responsable magasin", destination: "Inventaire & préparation" },
  { role: "Agent d’entretien", destination: "Formulaire de demande simplifié" },
];

export type RoleSelection = "superAdmin" | "admin" | "responsable" | "agent";

type AuthSectionProps = {
  onAuthenticated?: (token: string, role: RoleSelection) => void;
};

export function AuthSection({ onAuthenticated }: AuthSectionProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await api.login({ email, password });
      const roleMap: Record<string, RoleSelection> = {
        superadmin: "superAdmin",
        admin: "admin",
        responsable: "responsable",
        agent: "agent",
      };
      const role = roleMap[response.user.role] ?? "admin";
      onAuthenticated?.(response.token, role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de se connecter");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Authentification</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Accès sécurisé & rôles</h2>

      </div>

      <Card className="max-w-3xl">
        <CardHeader title="Connexion" />
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="text-sm font-medium text-slate-700">
            Identifiant / Email
            <input type="text" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@etablissement.fr" className="mt-1" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Mot de passe
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="•••••••" className="mt-1" />
          </label>
          <div className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-slate-900" />
            Rester connecté
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
