import type { RoleSelection } from "@/types/roles";

export type SectionId =
  | "establishments"
  | "admin"
  | "responsable"
  | "agent"
  | "products"
  | "movements"
  | "supplierOrders"
  | "users"
  | "auth";

export const SECTION_ORDER: SectionId[] = [
  "establishments",
  "admin",
  "responsable",
  "agent",
  "products",
  "movements",
  "supplierOrders",
  "users",
  "auth",
] as const;

export type AbilityKey = "manageCategories" | "manageProducts" | "manageSupplierOrders" | "manageMovements";

export type UserPermissions = {
  allowedSections: SectionId[];
  abilities: Partial<Record<AbilityKey, boolean>>;
};

const DEFAULT_SECTIONS_BY_ROLE: Record<RoleSelection, SectionId[]> = {
  superAdmin: ["establishments", "responsable", "products", "movements", "supplierOrders", "users"],
  admin: ["establishments", "responsable", "products", "movements", "supplierOrders", "users"],
  responsable: ["responsable", "supplierOrders", "products", "movements"],
  agent: ["agent"],
};

const DEFAULT_ABILITIES_BY_ROLE: Record<RoleSelection, Partial<Record<AbilityKey, boolean>>> = {
  superAdmin: {
    manageCategories: true,
    manageProducts: true,
    manageSupplierOrders: true,
    manageMovements: true,
  },
  admin: {
    manageCategories: true,
    manageProducts: true,
    manageSupplierOrders: true,
    manageMovements: true,
  },
  responsable: {
    manageCategories: true,
    manageProducts: true,
    manageSupplierOrders: true,
    manageMovements: true,
  },
  agent: {
    manageCategories: false,
    manageProducts: false,
    manageSupplierOrders: false,
    manageMovements: false,
  },
};

export const ALL_SECTIONS: { id: SectionId; label: string }[] = [
  { id: "establishments", label: "Etablissements" },
  { id: "admin", label: "Mon etablissement" },
  { id: "responsable", label: "Commandes agent" },
  { id: "agent", label: "Agent" },
  { id: "products", label: "Produits" },
  { id: "movements", label: "Mouvements" },
  { id: "supplierOrders", label: "Commandes fournisseurs" },
  { id: "users", label: "Utilisateurs" },
  { id: "auth", label: "Authentification" },
];

const ABILITY_KEYS: AbilityKey[] = ["manageCategories", "manageProducts", "manageSupplierOrders", "manageMovements"];

export function defaultPermissionsForRole(role: RoleSelection): UserPermissions {
  return {
    allowedSections: DEFAULT_SECTIONS_BY_ROLE[role] ?? [],
    abilities: { ...(DEFAULT_ABILITIES_BY_ROLE[role] ?? {}) },
  };
}

export function normalizePermissions(raw: unknown, role: RoleSelection): UserPermissions {
  const defaults = defaultPermissionsForRole(role);
  const allowedSections = Array.isArray((raw as any)?.allowedSections)
    ? ((raw as any).allowedSections as unknown[]).filter((value): value is SectionId => SECTION_ORDER.includes(value as SectionId))
    : defaults.allowedSections;

  const abilities: Partial<Record<AbilityKey, boolean>> = { ...defaults.abilities };
  if (raw && typeof raw === "object" && (raw as any).abilities && typeof (raw as any).abilities === "object") {
    const provided = (raw as any).abilities as Record<string, unknown>;
    ABILITY_KEYS.forEach((key) => {
      if (typeof provided[key] === "boolean") {
        abilities[key] = Boolean(provided[key]);
      }
    });
  }

  return {
    allowedSections: allowedSections.length > 0 ? Array.from(new Set(allowedSections)) : defaults.allowedSections,
    abilities,
  };
}

export function hasAbility(permissions: UserPermissions | undefined, ability: AbilityKey) {
  return Boolean(permissions?.abilities?.[ability]);
}

