"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.establishmentsRouter = void 0;
const express_1 = require("express");
const role_1 = require("../middleware/role");
const prisma_1 = require("../prisma");
exports.establishmentsRouter = (0, express_1.Router)();
exports.establishmentsRouter.use((0, role_1.allowRoles)("superadmin", "admin"));
exports.establishmentsRouter.get("/", async (_req, res) => {
    const establishments = await prisma_1.prisma.establishment.findMany({
        orderBy: { createdAt: "desc" },
    });
    res.json(establishments);
});
exports.establishmentsRouter.post("/", async (req, res) => {
    const { nom, adresse, codePostal, ville } = req.body;
    if (!nom) {
        return res.status(400).json({ message: "Nom requis" });
    }
    const establishment = await prisma_1.prisma.establishment.create({
        data: {
            nom,
            adresse: adresse ?? null,
            codePostal: codePostal ?? null,
            ville: ville ?? null,
        },
    });
    res.status(201).json(establishment);
});
exports.establishmentsRouter.put("/:id", async (req, res) => {
    const { nom, adresse, codePostal, ville } = req.body;
    if (!nom) {
        return res.status(400).json({ message: "Nom requis" });
    }
    try {
        const establishment = await prisma_1.prisma.establishment.update({
            where: { id: req.params.id },
            data: {
                nom,
                adresse: adresse ?? null,
                codePostal: codePostal ?? null,
                ville: ville ?? null,
            },
        });
        res.json(establishment);
    }
    catch {
        res.status(404).json({ message: "Etablissement introuvable" });
    }
});
exports.establishmentsRouter.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await prisma_1.prisma.$transaction(async (tx) => {
            const existing = await tx.establishment.findUnique({ where: { id } });
            if (!existing) {
                throw new Error("NOT_FOUND");
            }
            // Supprimer toutes les données liées avant de supprimer l'établissement.
            await tx.demandeItem.deleteMany({ where: { demande: { etablissementId: id } } });
            await tx.demande.deleteMany({ where: { etablissementId: id } });
            await tx.supplierOrderItem.deleteMany({ where: { commande: { etablissementId: id } } });
            await tx.supplierOrder.deleteMany({ where: { etablissementId: id } });
            await tx.movement.deleteMany({ where: { etablissementId: id } });
            await tx.article.deleteMany({ where: { etablissementId: id } });
            await tx.category.deleteMany({ where: { etablissementId: id } });
            await tx.user.deleteMany({ where: { etablissementId: id } });
            await tx.establishment.delete({ where: { id } });
        });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof Error && error.message === "NOT_FOUND") {
            res.status(404).json({ message: "Etablissement introuvable" });
            return;
        }
        res.status(500).json({ message: "Impossible de supprimer l'etablissement" });
    }
});
