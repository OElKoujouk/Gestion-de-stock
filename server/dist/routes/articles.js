"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.articlesRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
exports.articlesRouter = (0, express_1.Router)();
exports.articlesRouter.get("/", async (req, res) => {
    const { categorie, reference_fournisseur, nom, etablissementId } = req.query;
    const where = {};
    if (req.tenantId) {
        where.etablissementId = req.tenantId;
    }
    else if (etablissementId) {
        where.etablissementId = String(etablissementId);
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
    const { nom, categorieId, quantite, referenceFournisseur, seuilAlerte, description, conditionnement, etablissementId } = req.body;
    if (!nom || quantite === undefined || seuilAlerte === undefined) {
        return res.status(400).json({ message: "Champs requis manquants" });
    }
    const tenantId = req.tenantId ?? etablissementId;
    if (!tenantId) {
        return res.status(400).json({ message: "Tenant requis" });
    }
    const data = {
        etablissement: { connect: { id: tenantId } },
        nom,
        quantite,
        referenceFournisseur: referenceFournisseur ?? "",
        seuilAlerte,
        description,
        conditionnement,
    };
    if (categorieId) {
        data.categorie = { connect: { id: categorieId } };
    }
    const article = await prisma_1.prisma.article.create({ data });
    res.status(201).json(article);
});
exports.articlesRouter.get("/:id", async (req, res) => {
    const article = await prisma_1.prisma.article.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    });
    if (!article) {
        return res.status(404).json({ message: "Article introuvable" });
    }
    res.json(article);
});
exports.articlesRouter.put("/:id", async (req, res) => {
    const existing = await prisma_1.prisma.article.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    });
    if (!existing) {
        return res.status(404).json({ message: "Article introuvable" });
    }
    const payload = req.body;
    const data = {};
    if (payload.nom !== undefined)
        data.nom = payload.nom;
    if (payload.categorieId !== undefined) {
        data.categorie = payload.categorieId ? { connect: { id: payload.categorieId } } : { disconnect: true };
    }
    if (payload.quantite !== undefined)
        data.quantite = payload.quantite;
    if (payload.referenceFournisseur !== undefined)
        data.referenceFournisseur = payload.referenceFournisseur ?? "";
    if (payload.seuilAlerte !== undefined)
        data.seuilAlerte = payload.seuilAlerte;
    if (payload.description !== undefined)
        data.description = payload.description;
    if (payload.conditionnement !== undefined)
        data.conditionnement = payload.conditionnement;
    const article = await prisma_1.prisma.article.update({
        where: { id: existing.id },
        data,
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
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.demandeItem.deleteMany({ where: { articleId: existing.id } }),
        prisma_1.prisma.supplierOrderItem.deleteMany({ where: { articleId: existing.id } }),
        prisma_1.prisma.movement.deleteMany({ where: { articleId: existing.id } }),
        prisma_1.prisma.article.delete({ where: { id: existing.id } }),
    ]);
    res.status(204).send();
});
exports.articlesRouter.patch("/:id/stock", async (req, res) => {
    const existing = await prisma_1.prisma.article.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    });
    if (!existing) {
        return res.status(404).json({ message: "Article introuvable" });
    }
    const { variation } = req.body;
    if (typeof variation !== "number" || Number.isNaN(variation)) {
        return res.status(400).json({ message: "Variation de stock requise" });
    }
    const newQuantity = existing.quantite + variation;
    if (newQuantity < 0) {
        return res.status(400).json({ message: "Stock négatif interdit" });
    }
    const article = await prisma_1.prisma.article.update({
        where: { id: existing.id },
        data: { quantite: newQuantity },
    });
    res.json(article);
});
