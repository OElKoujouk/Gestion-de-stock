import type { Role } from "@prisma/client";

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

export const ALL_SECTION_IDS: SectionId[] = [
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

export type AbilityKey = "manageCategories" | "manageProducts" | "manageSupplierOrders" | "manageMovements";

export type UserPermissions = {
  allowedSections: SectionId[];
  abilities: Partial<Record<AbilityKey, boolean>>;
};

const DEFAULT_SECTIONS_BY_ROLE: Record<Role | "superAdmin", SectionId[]> = {
  superAdmin: ["establishments", "responsable", "products", "movements", "supplierOrders", "users"],
  superadmin: ["establishments", "responsable", "products", "movements", "supplierOrders", "users"],
  admin: ["establishments", "responsable", "products", "movements", "supplierOrders", "users"],
  responsable: ["responsable", "supplierOrders", "products", "movements"],
  agent: ["agent"],
};

const DEFAULT_ABILITIES_BY_ROLE: Record<Role | "superAdmin", Partial<Record<AbilityKey, boolean>>> = {
  superAdmin: {
    manageCategories: true,
    manageProducts: true,
    manageSupplierOrders: true,
    manageMovements: true,
  },
  superadmin: {
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

const ABILITY_KEYS: AbilityKey[] = ["manageCategories", "manageProducts", "manageSupplierOrders", "manageMovements"];

export function defaultPermissionsForRole(role: Role | "superAdmin"): UserPermissions {
  return {
    allowedSections: DEFAULT_SECTIONS_BY_ROLE[role] ?? DEFAULT_SECTIONS_BY_ROLE.superAdmin,
    abilities: { ...DEFAULT_ABILITIES_BY_ROLE[role] },
  };
}

export function normalizePermissions(raw: unknown, role: Role | "superAdmin"): UserPermissions {
  const defaults = defaultPermissionsForRole(role);

  const allowedSections = Array.isArray((raw as any)?.allowedSections)
    ? ((raw as any).allowedSections as unknown[]).filter((value): value is SectionId => ALL_SECTION_IDS.includes(value as SectionId))
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

export function hasAbility(permissions: UserPermissions | undefined, ability: AbilityKey): boolean {
  if (!permissions) return false;
  return Boolean(permissions.abilities?.[ability]);
}

export function mergePermissionsUpdate(input: Partial<UserPermissions> | undefined, role: Role | "superAdmin"): UserPermissions {
  const defaults = defaultPermissionsForRole(role);
  if (!input) return defaults;
  const normalized = normalizePermissions(input, role);
  return {
    allowedSections: normalized.allowedSections.length ? normalized.allowedSections : defaults.allowedSections,
    abilities: { ...defaults.abilities, ...normalized.abilities },
  };
}

