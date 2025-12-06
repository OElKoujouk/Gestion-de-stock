import { useState } from "react";

import { Card, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/api";

export type RoleSelection = "superAdmin" | "admin" | "responsable" | "agent";

type AuthSectionProps = {
  onAuthenticated?: (token: string, role: RoleSelection, userName: string) => void;
};

export function AuthSection({ onAuthenticated }: AuthSectionProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberInTab, setRememberInTab] = useState(true);

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

      if (!rememberInTab) {
        sessionStorage.clear();
      }

      onAuthenticated?.(response.token, role, response.user.nom);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de se connecter pour le moment."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-10">
      <Card className="w-full max-w-lg border border-slate-200 bg-white/80 backdrop-blur-md shadow-xl rounded-2xl">
        <CardHeader
          title="Connexion"
          subtitle="Accédez à votre espace sécurisé"
          action={
            error ? (
              <span className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-100">
                {error}
              </span>
            ) : null
          }
        />

        <form className="mt-4 grid gap-5" onSubmit={handleSubmit}>
          {/* Email */}
          <label className="text-sm font-medium text-slate-800">
            Identifiant / email
            <input
              type="text"
              value={email}
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@etablissement.fr"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              required
            />
          </label>

          {/* Password */}
          <label className="text-sm font-medium text-slate-800">
            Mot de passe
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full border-none bg-transparent p-0 text-sm focus:outline-none focus:ring-0 appearance-none shadow-none"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                {showPassword ? "Masquer" : "Afficher"}
              </button>
            </div>
          </label>

          {/* Remember */}
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
              checked={rememberInTab}
              onChange={(event) => setRememberInTab(event.target.checked)}
            />
            Rester connecté dans cet onglet
          </label>

          {/* Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
