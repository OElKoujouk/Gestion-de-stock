"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSuperAdmin = ensureSuperAdmin;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("./prisma");
const SUPER_ADMIN_EMAIL = "admin-s";
const SUPER_ADMIN_PASSWORD = "admin";
async function ensureSuperAdmin() {
    const existing = await prisma_1.prisma.user.findUnique({ where: { identifiant: SUPER_ADMIN_EMAIL } });
    if (existing) {
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
        },
    });
    console.log("Super-admin par défaut créé (identifiant: admin-s / mdp: admin)");
}
