import type { RoleSelection } from "@/types/roles";

/* ─────────────────── Sections ─────────────────── */

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

export const SECTION_ORDER: readonly SectionId[] = [
  "establishments",
  "admin",
  "responsable",
  "agent",
  "products",
  "movements",
  "supplierOrders",
  "users",
  "auth",
];

/* ─────────────────── Abilities ─────────────────── */

export type AbilityKey =
  | "manageCategories"
  | "manageProducts"
  | "manageSupplierOrders"
  | "manageMovements";

export type UserPermissions = {
  allowedSections: SectionId[];
  abilities: Partial<Record<AbilityKey, boolean>>;
};

/* ─────────────────── Defaults ─────────────────── */

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

/* ─────────────────── UI Helpers ─────────────────── */

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

const ABILITY_KEYS: readonly AbilityKey[] = [
  "manageCategories",
  "manageProducts",
  "manageSupplierOrders",
  "manageMovements",
];

/* ─────────────────── API ─────────────────── */

export function defaultPermissionsForRole(role: RoleSelection): UserPermissions {
  return {
    allowedSections: [...(DEFAULT_SECTIONS_BY_ROLE[role] ?? [])],
    abilities: { ...(DEFAULT_ABILITIES_BY_ROLE[role] ?? {}) },
  };
}

type RawPermissions = {
  allowedSections?: unknown;
  abilities?: unknown;
};

export function normalizePermissions(raw: unknown, role: RoleSelection): UserPermissions {
  const defaults = defaultPermissionsForRole(role);
  const safeRaw: RawPermissions = typeof raw === "object" && raw !== null ? raw : {};

  const allowedSections: SectionId[] = Array.isArray(safeRaw.allowedSections)
    ? safeRaw.allowedSections.filter(
        (value): value is SectionId =>
          typeof value === "string" && SECTION_ORDER.includes(value as SectionId),
      )
    : defaults.allowedSections;

  const abilities: Partial<Record<AbilityKey, boolean>> = { ...defaults.abilities };

  if (typeof safeRaw.abilities === "object" && safeRaw.abilities !== null) {
    ABILITY_KEYS.forEach((key) => {
      const value = (safeRaw.abilities as Record<string, unknown>)[key];
      if (typeof value === "boolean") {
        abilities[key] = value;
      }
    });
  }

  return {
    allowedSections: allowedSections.length
      ? Array.from(new Set(allowedSections))
      : defaults.allowedSections,
    abilities,
  };
}

export function hasAbility(
  permissions: UserPermissions | undefined,
  ability: AbilityKey,
): boolean {
  return Boolean(permissions?.abilities?.[ability]);
}
