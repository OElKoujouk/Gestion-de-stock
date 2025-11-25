import { Card, CardHeader } from "@/components/ui/card";

const stack = [
  {
    title: "Front-end",
    items: [
      "React / Next.js pour bénéficier du rendu hybride",
      "UI TailwindCSS (ou Material UI) pour homogénéiser les composants",
      "SPA communiquant avec l’API via fetch/axios (JWT ou cookie sécurisé)",
    ],
  },
  {
    title: "Back-end",
    items: [
      "Node.js (NestJS), Laravel ou Django selon expertise",
      "API REST + middleware tenant + guards de rôles",
      "Services dédiés (articles, mouvements, demandes…), orchestrés par controllers",
    ],
  },
  {
    title: "Base de données",
    items: [
      "PostgreSQL recommandé (schéma relationnel, FK, index)",
      "Alternative MySQL/MariaDB possible",
      "Migrations versionnées, triggers pour journalisation",
    ],
  },
  {
    title: "Infra & déploiement",
    items: [
      "Docker + docker-compose pour dev/staging",
      "Hébergement cloud (Render, Railway, Vercel, OVH…)",
      "Surveillance des logs et stockage sécurisé des secrets",
    ],
  },
];

export function TechStackSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Stack</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Technologies recommandées</h2>
        <p className="mt-1 max-w-3xl text-slate-500">
          Le projet reste flexible mais privilégie les frameworks modernes côté front comme back pour accélérer le time-to-market et garantir la maintenabilité.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {stack.map((section) => (
          <Card key={section.title}>
            <CardHeader title={section.title} />
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-slate-400">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
