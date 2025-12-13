"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSuperAdmin = ensureSuperAdmin;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("./prisma");
const permissions_1 = require("./permissions");
const SUPER_ADMIN_EMAIL = "admin-s";
const SUPER_ADMIN_PASSWORD = "admin";
const isBcryptHash = (value) => value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
async function normalizeUserPasswords() {
    const users = await prisma_1.prisma.user.findMany({
        select: { id: true, motDePasse: true, identifiant: true },
    });
    let updated = 0;
    for (const user of users) {
        if (!isBcryptHash(user.motDePasse)) {
            const hashedPassword = await bcryptjs_1.default.hash(user.motDePasse, 10);
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { motDePasse: hashedPassword },
            });
            updated += 1;
        }
    }
    if (updated > 0) {
        console.log(`Mots de passe normalis\u00e9s (hash\u00e9s) pour ${updated} utilisateur(s).`);
    }
}
async function ensureSuperAdmin() {
    await normalizeUserPasswords();
    const existing = await prisma_1.prisma.user.findUnique({ where: { identifiant: SUPER_ADMIN_EMAIL } });
    if (existing) {
        const normalizedPermissions = (0, permissions_1.normalizePermissions)(existing.permissions, "superadmin");
        await prisma_1.prisma.user.update({
            where: { id: existing.id },
            data: {
                permissions: normalizedPermissions,
            },
        });
        if (!isBcryptHash(existing.motDePasse)) {
            const hashedPassword = await bcryptjs_1.default.hash(existing.motDePasse || SUPER_ADMIN_PASSWORD, 10);
            await prisma_1.prisma.user.update({
                where: { id: existing.id },
                data: { motDePasse: hashedPassword },
            });
            console.log("Mot de passe du super-admin normalis\u00e9 (hash\u00e9).");
        }
        return;
    }
    const hashedPassword = await bcryptjs_1.default.hash(SUPER_ADMIN_PASSWORD, 10);
    await prisma_1.prisma.user.create({
        data: {
            nom: "Super Admin",
            identifiant: SUPER_ADMIN_EMAIL,
            contactEmail: "admin-s@example.com",
            motDePasse: hashedPassword,
            role: "superadmin",
            actif: true,
            etablissementId: null,
            permissions: (0, permissions_1.defaultPermissionsForRole)("superadmin"),
        },
    });
    console.log("Super-admin par défaut créé (identifiant: admin-s / mdp: admin)");
}
