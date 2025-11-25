"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../prisma");
const role_1 = require("../middleware/role");
exports.usersRouter = (0, express_1.Router)();
exports.usersRouter.use((0, role_1.allowRoles)("superadmin", "admin"));
exports.usersRouter.get("/", async (req, res) => {
    const where = req.tenantId ? { etablissementId: req.tenantId } : undefined;
    const users = await prisma_1.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            nom: true,
            email: true,
            role: true,
            actif: true,
            etablissementId: true,
            createdAt: true,
        },
    });
    res.json(users);
});
exports.usersRouter.post("/", async (req, res) => {
    const { nom, email, motDePasse, role, actif, etablissementId } = req.body;
    if (!nom || !email || !motDePasse || !role) {
        return res.status(400).json({ message: "Champs requis manquants" });
    }
    const hashedPassword = await bcryptjs_1.default.hash(motDePasse, 10);
    const assignedTenant = req.tenantId ?? etablissementId ?? null;
    const user = await prisma_1.prisma.user.create({
        data: {
            nom,
            email,
            motDePasse: hashedPassword,
            role: role,
            actif: actif ?? true,
            etablissementId: assignedTenant,
        },
    });
    res.status(201).json({ id: user.id, nom: user.nom, email: user.email, role: user.role, etablissementId: user.etablissementId });
});
exports.usersRouter.put("/:id", async (req, res) => {
    const existing = await prisma_1.prisma.user.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    });
    if (!existing)
        return res.status(404).json({ message: "Utilisateur introuvable" });
    const data = { ...req.body };
    if (data.motDePasse) {
        data.motDePasse = await bcryptjs_1.default.hash(data.motDePasse, 10);
    }
    const user = await prisma_1.prisma.user.update({
        where: { id: existing.id },
        data,
    });
    res.json({ id: user.id, nom: user.nom, email: user.email, role: user.role, actif: user.actif });
});
exports.usersRouter.patch("/:id/activation", async (req, res) => {
    const existing = await prisma_1.prisma.user.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    });
    if (!existing)
        return res.status(404).json({ message: "Utilisateur introuvable" });
    const user = await prisma_1.prisma.user.update({
        where: { id: existing.id },
        data: { actif: Boolean(req.body.actif) },
    });
    res.json({ id: user.id, actif: user.actif });
});
exports.usersRouter.delete("/:id", async (req, res) => {
    const existing = await prisma_1.prisma.user.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    });
    if (!existing)
        return res.status(404).json({ message: "Utilisateur introuvable" });
    await prisma_1.prisma.user.delete({ where: { id: existing.id } });
    res.status(204).send();
});
