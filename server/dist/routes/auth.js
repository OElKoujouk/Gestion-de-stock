"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../permissions");
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-token";
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email/identifiant et mot de passe requis" });
    }
    // Connexion via identifiant OU email de contact
    const identifier = email.trim();
    const user = await prisma_1.prisma.user.findFirst({
        where: {
            OR: [{ identifiant: identifier }, { contactEmail: identifier }],
        },
    });
    if (!user || !(await bcryptjs_1.default.compare(password, user.motDePasse))) {
        return res.status(401).json({ message: "Identifiants invalides" });
    }
    if (!user.actif) {
        return res.status(403).json({ message: "Compte désactivé" });
    }
    const permissions = (0, permissions_1.normalizePermissions)(user.permissions, user.role);
    const token = jsonwebtoken_1.default.sign({
        sub: user.id,
        role: user.role,
        etablissementId: user.etablissementId,
    }, JWT_SECRET, { expiresIn: "2h" });
    res.json({
        token,
        user: {
            id: user.id,
            role: user.role,
            etablissement_id: user.etablissementId,
            nom: user.nom,
            email: user.identifiant,
            domaine: user.domaine,
            permissions,
        },
    });
});
exports.authRouter.post("/logout", (_req, res) => {
    res.json({ message: "Déconnexion réalisée côté client (token à supprimer)" });
});
exports.authRouter.get("/me", auth_1.authMiddleware, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Non authentifié" });
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            nom: true,
            identifiant: true,
            contactEmail: true,
            role: true,
            etablissementId: true,
            domaine: true,
            permissions: true,
        },
    });
    if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
    }
    res.json({
        id: user.id,
        nom: user.nom,
        email: user.identifiant,
        contactEmail: user.contactEmail,
        role: user.role,
        etablissementId: user.etablissementId,
        domaine: user.domaine,
        permissions: (0, permissions_1.normalizePermissions)(user.permissions, user.role),
    });
});
