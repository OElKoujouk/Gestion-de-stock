"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.articlesRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
exports.articlesRouter = (0, express_1.Router)();
exports.articlesRouter.get("/", async (req, res) => {
    const { categorie, reference_fournisseur, nom } = req.query;
    const where = {};
    if (req.tenantId) {
        where.etablissementId = req.tenantId;
    }
    if (categorie) {
        where.categorieId = String(categorie);
    }
    if (reference_fournisseur) {
        where.referenceFournisseur = String(reference_fournisseur);
    }
    if (nom) {
        where.nom = { contains: String(nom) };
    }
    const articles = await prisma_1.prisma.article.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });
    res.json(articles);
});
exports.articlesRouter.post("/", async (req, res) => {
    if (!req.tenantId)
        return res.status(400).json({ message: "Tenant requis" });
    const { nom, categorieId, quantite, referenceFournisseur, seuilAlerte, description, conditionnement } = req.body;
    if (!nom || quantite === undefined || !referenceFournisseur || seuilAlerte === undefined) {
        return res.status(400).json({ message: "Champs requis manquants" });
    }
    const article = await prisma_1.prisma.article.create({
        data: {
            etablissementId: req.tenantId,
            nom,
            categorieId: categorieId ?? null,
            quantite,
            referenceFournisseur,
            seuilAlerte,
            description,
            conditionnement,
        },
    });
    res.status(201).json(article);
});
exports.articlesRouter.get("/:id", async (req, res) => {
    const article = await prisma_1.prisma.article.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    });
    if (!article)
        return res.status(404).json({ message: "Article introuvable" });
    res.json(article);
});
exports.articlesRouter.put("/:id", async (req, res) => {
    const existing = await prisma_1.prisma.article.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    });
    if (!existing) {
        return res.status(404).json({ message: "Article introuvable" });
    }
    const article = await prisma_1.prisma.article.update({
        where: { id: existing.id },
        data: req.body,
    });
    res.json(article);
});
exports.articlesRouter.delete("/:id", async (req, res) => {
    const existing = await prisma_1.prisma.article.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    });
    if (!existing) {
        return res.status(404).json({ message: "Article introuvable" });
    }
    await prisma_1.prisma.article.delete({ where: { id: existing.id } });
    res.status(204).send();
});
