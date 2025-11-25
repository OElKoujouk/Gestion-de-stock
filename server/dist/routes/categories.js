"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
exports.categoriesRouter = (0, express_1.Router)();
exports.categoriesRouter.get("/", async (req, res) => {
    const categories = await prisma_1.prisma.category.findMany({
        where: req.tenantId ? { etablissementId: req.tenantId } : undefined,
        orderBy: { nom: "asc" },
    });
    res.json(categories);
});
exports.categoriesRouter.post("/", async (req, res) => {
    if (!req.tenantId)
        return res.status(400).json({ message: "Tenant requis" });
    const { nom } = req.body;
    if (!nom)
        return res.status(400).json({ message: "Nom requis" });
    const category = await prisma_1.prisma.category.create({
        data: {
            nom,
            etablissementId: req.tenantId,
        },
    });
    res.status(201).json(category);
});
exports.categoriesRouter.put("/:id", async (req, res) => {
    const existing = await prisma_1.prisma.category.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    });
    if (!existing)
        return res.status(404).json({ message: "Catégorie introuvable" });
    const category = await prisma_1.prisma.category.update({
        where: { id: existing.id },
        data: { nom: req.body.nom ?? existing.nom },
    });
    res.json(category);
});
exports.categoriesRouter.delete("/:id", async (req, res) => {
    const existing = await prisma_1.prisma.category.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    });
    if (!existing)
        return res.status(404).json({ message: "Catégorie introuvable" });
    await prisma_1.prisma.category.delete({ where: { id: existing.id } });
    res.status(204).send();
});
