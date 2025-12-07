"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_SECTION_IDS = void 0;
exports.defaultPermissionsForRole = defaultPermissionsForRole;
exports.normalizePermissions = normalizePermissions;
exports.hasAbility = hasAbility;
exports.mergePermissionsUpdate = mergePermissionsUpdate;
exports.ALL_SECTION_IDS = [
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
const DEFAULT_SECTIONS_BY_ROLE = {
    superAdmin: ["establishments", "responsable", "products", "movements", "supplierOrders", "users"],
    superadmin: ["establishments", "responsable", "products", "movements", "supplierOrders", "users"],
    admin: ["establishments", "responsable", "products", "movements", "supplierOrders", "users"],
    responsable: ["responsable", "supplierOrders", "products", "movements"],
    agent: ["agent"],
};
const DEFAULT_ABILITIES_BY_ROLE = {
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
const ABILITY_KEYS = ["manageCategories", "manageProducts", "manageSupplierOrders", "manageMovements"];
function defaultPermissionsForRole(role) {
    return {
        allowedSections: DEFAULT_SECTIONS_BY_ROLE[role] ?? DEFAULT_SECTIONS_BY_ROLE.superAdmin,
        abilities: { ...DEFAULT_ABILITIES_BY_ROLE[role] },
    };
}
function normalizePermissions(raw, role) {
    const defaults = defaultPermissionsForRole(role);
    const allowedSections = Array.isArray(raw?.allowedSections)
        ? raw.allowedSections.filter((value) => exports.ALL_SECTION_IDS.includes(value))
        : defaults.allowedSections;
    const abilities = { ...defaults.abilities };
    if (raw && typeof raw === "object" && raw.abilities && typeof raw.abilities === "object") {
        const provided = raw.abilities;
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
function hasAbility(permissions, ability) {
    if (!permissions)
        return false;
    return Boolean(permissions.abilities?.[ability]);
}
function mergePermissionsUpdate(input, role) {
    const defaults = defaultPermissionsForRole(role);
    if (!input)
        return defaults;
    const normalized = normalizePermissions(input, role);
    return {
        allowedSections: normalized.allowedSections.length ? normalized.allowedSections : defaults.allowedSections,
        abilities: { ...defaults.abilities, ...normalized.abilities },
    };
}
