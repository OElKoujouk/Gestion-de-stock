"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.movementsRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
exports.movementsRouter = (0, express_1.Router)();
exports.movementsRouter.get("/", async (req, res) => {
    const { type, article_id, date } = req.query;
    const where = {};
    if (req.tenantId) {
        where.etablissementId = req.tenantId;
    }
    if (type) {
        where.type = String(type);
    }
    if (article_id) {
        where.articleId = String(article_id);
    }
    if (date) {
        const day = String(date);
        where.createdAt = {
            gte: new Date(`${day}T00:00:00`),
            lt: new Date(`${day}T23:59:59`),
        };
    }
    const movements = await prisma_1.prisma.movement.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });
    res.json(movements);
});
exports.movementsRouter.post("/", async (req, res) => {
    if (!req.tenantId || !req.user)
        return res.status(400).json({ message: "Tenant requis" });
    const { articleId, type, quantite, commentaire } = req.body;
    if (!articleId || !type || typeof quantite !== "number") {
        return res.status(400).json({ message: "Champs requis" });
    }
    const article = await prisma_1.prisma.article.findFirst({
        where: { id: articleId, etablissementId: req.tenantId },
    });
    if (!article) {
        return res.status(404).json({ message: "Article introuvable" });
    }
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.movement.create({
            data: {
                articleId,
                etablissementId: req.tenantId,
                userId: req.user.id,
                type,
                quantite,
                commentaire,
            },
        }),
        prisma_1.prisma.article.update({
            where: { id: article.id },
            data: {
                quantite: type === "entree" ? article.quantite + quantite : article.quantite - quantite,
            },
        }),
    ]);
    res.status(201).json({ message: "Mouvement enregistré" });
});
