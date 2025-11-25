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
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-token";
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
    }
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcryptjs_1.default.compare(password, user.motDePasse))) {
        return res.status(401).json({ message: "Identifiants invalides" });
    }
    if (!user.actif) {
        return res.status(403).json({ message: "Compte désactivé" });
    }
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
            email: user.email,
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
            email: true,
            role: true,
            etablissementId: true,
        },
    });
    if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
    }
    res.json(user);
});
