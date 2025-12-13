import { ALL_SECTIONS, defaultPermissionsForRole, type AbilityKey, type SectionId, type UserPermissions } from "@/lib/permissions";
import type { RoleSelection } from "@/types/roles";

type Props = {
  role: RoleSelection;
  value: UserPermissions;
  onChange: (permissions: UserPermissions) => void;
};

const ABILITY_LABELS: Record<AbilityKey, { title: string; description: string }> = {
  manageCategories: { title: "Catégories", description: "Créer / modifier / supprimer les catégories" },
  manageProducts: { title: "Produits", description: "Créer / modifier / supprimer les produits" },
  manageSupplierOrders: { title: "Commandes fournisseurs", description: "Créer / modifier les commandes fournisseurs" },
  manageMovements: { title: "Mouvements de stock", description: "Enregistrer les mouvements manuels" },
};

export function UserPermissionsFields({ role, value, onChange }: Props) {
  const toggleSection = (section: SectionId) => {
    const current = new Set(value.allowedSections);
    if (current.has(section)) {
      current.delete(section);
    } else {
      current.add(section);
    }
    onChange({ ...value, allowedSections: Array.from(current).filter((id) => id !== "auth") });
  };

  const toggleAbility = (ability: AbilityKey) => {
    onChange({
      ...value,
      abilities: { ...value.abilities, [ability]: !value.abilities?.[ability] },
    });
  };

  const resetToDefaults = () => onChange(defaultPermissionsForRole(role));

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-900">Permissions</p>
          <p className="text-xs text-emerald-800">Sélectionnez les sections accessibles dans la sidebar</p>
        </div>
        <button
          type="button"
          onClick={resetToDefaults}
          className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
        >
          Remettre par défaut
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {ALL_SECTIONS.filter((s) => s.id !== "auth").map((section) => {
          const active = value.allowedSections.includes(section.id);
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => toggleSection(section.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                active
                  ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-emerald-900">Permissions</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((ability) => {
            const active = Boolean(value.abilities?.[ability]);
            return (
              <label
                key={ability}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm shadow-sm hover:border-emerald-200"
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleAbility(ability)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                />
                <span>
                  <span className="font-semibold text-slate-900">{ABILITY_LABELS[ability].title}</span>
                  <span className="block text-xs text-slate-600">{ABILITY_LABELS[ability].description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
