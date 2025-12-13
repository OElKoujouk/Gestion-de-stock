"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
const permissions_1 = require("../middleware/permissions");
exports.categoriesRouter = (0, express_1.Router)();
exports.categoriesRouter.get("/", async (req, res) => {
    const { etablissementId, ownerId } = req.query;
    const where = {};
    const tenantId = req.tenantId ?? (etablissementId ? String(etablissementId) : undefined);
    if (tenantId) {
        where.etablissementId = tenantId;
    }
    if (req.user?.role === "responsable") {
        where.ownerId = req.user.id;
    }
    else if (ownerId && typeof ownerId === "string" && ownerId.length > 0) {
        where.ownerId = ownerId;
    }
    const categories = await prisma_1.prisma.category.findMany({
        where: Object.keys(where).length ? where : undefined,
        orderBy: { nom: "asc" },
    });
    res.json(categories);
});
exports.categoriesRouter.post("/", (0, permissions_1.requireAbility)("manageCategories"), async (req, res) => {
    const { nom, etablissementId, ownerId } = req.body;
    if (!nom)
        return res.status(400).json({ message: "Nom requis" });
    const tenantId = req.tenantId ?? etablissementId;
    if (!tenantId)
        return res.status(400).json({ message: "Tenant requis" });
    const isResponsable = req.user?.role === "responsable";
    let categoryOwnerId = null;
    if (isResponsable && req.user) {
        categoryOwnerId = req.user.id;
    }
    else if (ownerId) {
        const owner = await prisma_1.prisma.user.findFirst({
            where: { id: ownerId, role: "responsable", ...(tenantId ? { etablissementId: tenantId } : {}) },
        });
        if (!owner) {
            return res.status(400).json({ message: "Responsable cible introuvable pour cette catégorie" });
        }
        categoryOwnerId = owner.id;
    }
    const category = await prisma_1.prisma.category.create({
        data: {
            nom,
            etablissementId: tenantId,
            ownerId: categoryOwnerId,
        },
    });
    res.status(201).json(category);
});
exports.categoriesRouter.put("/:id", (0, permissions_1.requireAbility)("manageCategories"), async (req, res) => {
    const isResponsable = req.user?.role === "responsable";
    const existing = await prisma_1.prisma.category.findFirst({
        where: {
            id: req.params.id,
            ...(req.tenantId ? { etablissementId: req.tenantId } : {}),
            ...(isResponsable && req.user ? { ownerId: req.user.id } : {}),
        },
    });
    if (!existing)
        return res.status(404).json({ message: "Catégorie introuvable" });
    const { nom, ownerId } = req.body;
    let nextOwnerId = existing.ownerId ?? null;
    if (!isResponsable && ownerId !== undefined) {
        if (ownerId === null) {
            nextOwnerId = null;
        }
        else {
            const owner = await prisma_1.prisma.user.findFirst({
                where: { id: ownerId, role: "responsable", ...(existing.etablissementId ? { etablissementId: existing.etablissementId } : {}) },
            });
            if (!owner) {
                return res.status(400).json({ message: "Responsable cible introuvable pour cette catégorie" });
            }
            nextOwnerId = owner.id;
        }
    }
    else if (isResponsable && req.user) {
        nextOwnerId = req.user.id;
    }
    const category = await prisma_1.prisma.category.update({
        where: { id: existing.id },
        data: { nom: nom ?? existing.nom, ownerId: nextOwnerId },
    });
    res.json(category);
});
exports.categoriesRouter.delete("/:id", (0, permissions_1.requireAbility)("manageCategories"), async (req, res) => {
    const isResponsable = req.user?.role === "responsable";
    const existing = await prisma_1.prisma.category.findFirst({
        where: {
            id: req.params.id,
            ...(req.tenantId ? { etablissementId: req.tenantId } : {}),
            ...(isResponsable && req.user ? { ownerId: req.user.id } : {}),
        },
    });
    if (!existing)
        return res.status(404).json({ message: "Catégorie introuvable" });
    await prisma_1.prisma.category.delete({ where: { id: existing.id } });
    res.status(204).send();
});
