"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demandesRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
const role_1 = require("../middleware/role");
exports.demandesRouter = (0, express_1.Router)();
const generateReference = () => {
    const randomPart = Math.random().toString(36).replace("0.", "").slice(0, 6).toUpperCase().padEnd(6, "X");
    return `CMD-${randomPart}`;
};
const createUniqueReference = async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const reference = generateReference();
        const existing = await prisma_1.prisma.demande.findUnique({ where: { reference } });
        if (!existing)
            return reference;
    }
    throw new Error("Impossible de generer une reference unique pour la demande");
};
exports.demandesRouter.post("/", (0, role_1.allowRoles)("agent", "responsable", "admin"), async (req, res) => {
    if (!req.tenantId || !req.user)
        return res.status(400).json({ message: "Tenant requis" });
    const { items } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Une demande doit contenir au moins un article" });
    }
    let reference;
    try {
        reference = await createUniqueReference();
    }
    catch (error) {
        return res.status(500).json({ message: "Generation de reference impossible" });
    }
    const agent = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, nom: true, contactEmail: true, etablissementId: true },
    });
    if (!agent) {
        return res.status(401).json({ message: "Utilisateur introuvable" });
    }
    if (agent.etablissementId !== req.tenantId) {
        return res.status(403).json({ message: "Utilisateur non rattache a cet etablissement" });
    }
    const demande = await prisma_1.prisma.demande.create({
        data: {
            etablissementId: req.tenantId,
            agentId: agent.id,
            agentNom: agent?.nom ?? null,
            agentEmail: agent?.contactEmail ?? null,
            statut: "en_attente",
            reference,
            items: {
                createMany: {
                    data: items.map((item) => ({
                        articleId: item.articleId,
                        quantiteDemandee: item.quantite,
                        quantitePreparee: 0,
                    })),
                },
            },
        },
        include: { items: true },
    });
    res.status(201).json(demande);
});
exports.demandesRouter.get("/", (0, role_1.allowRoles)("superadmin", "agent", "responsable", "admin"), async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: "Utilisateur non authentifié" });
    const where = {};
    if (req.user.role === "superadmin") {
        if (typeof req.query.etablissementId === "string" && req.query.etablissementId.length > 0) {
            where.etablissementId = req.query.etablissementId;
        }
    }
    else {
        if (!req.tenantId) {
            return res.status(400).json({ message: "Tenant requis" });
        }
        where.etablissementId = req.tenantId;
        if (req.user.role === "agent") {
            where.agentId = req.user.id;
        }
    }
    const demandes = await prisma_1.prisma.demande.findMany({
        where,
        include: {
            items: true,
            agent: { select: { id: true, nom: true, contactEmail: true } },
            etablissement: { select: { id: true, nom: true } },
        },
    });
    res.json(demandes);
});
exports.demandesRouter.get("/:id", (0, role_1.allowRoles)("superadmin", "agent", "responsable", "admin"), async (req, res) => {
    const demande = await prisma_1.prisma.demande.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
        include: {
            items: true,
            agent: { select: { id: true, nom: true, contactEmail: true } },
            etablissement: { select: { id: true, nom: true } },
        },
    });
    if (!demande)
        return res.status(404).json({ message: "Demande introuvable" });
    res.json(demande);
});
exports.demandesRouter.get("/toutes", (0, role_1.allowRoles)("responsable", "admin"), async (req, res) => {
    if (!req.tenantId)
        return res.status(400).json({ message: "Tenant requis" });
    const demandes = await prisma_1.prisma.demande.findMany({
        where: { etablissementId: req.tenantId },
        include: {
            items: true,
            agent: { select: { id: true, nom: true, contactEmail: true } },
            etablissement: { select: { id: true, nom: true } },
        },
    });
    res.json(demandes);
});
exports.demandesRouter.patch("/:id", (0, role_1.allowRoles)("responsable", "admin"), async (req, res) => {
    const demande = await prisma_1.prisma.demande.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
        include: { items: true },
    });
    if (!demande)
        return res.status(404).json({ message: "Demande introuvable" });
    const { statut, items } = req.body;
    if (items) {
        await Promise.all(items.map((item) => prisma_1.prisma.demandeItem.update({
            where: { id: item.itemId },
            data: { quantitePreparee: item.quantitePreparee },
        })));
    }
    const updatedDemande = await prisma_1.prisma.demande.update({
        where: { id: demande.id },
        data: { statut: statut ?? demande.statut },
        include: { items: true },
    });
    if (statut === "preparee" || statut === "modifiee") {
        await prisma_1.prisma.$transaction(updatedDemande.items.map((item) => prisma_1.prisma.article.update({
            where: { id: item.articleId },
            data: { quantite: { decrement: item.quantitePreparee } },
        })));
    }
    res.json(updatedDemande);
});
exports.demandesRouter.patch("/:id/cancel", (0, role_1.allowRoles)("agent"), async (req, res) => {
    if (!req.user || !req.tenantId)
        return res.status(400).json({ message: "Tenant requis" });
    const demande = await prisma_1.prisma.demande.findFirst({
        where: { id: req.params.id, etablissementId: req.tenantId, agentId: req.user.id },
    });
    if (!demande)
        return res.status(404).json({ message: "Demande introuvable" });
    if (demande.statut !== "en_attente") {
        return res.status(400).json({ message: "Seules les demandes en attente peuvent être annulées par l'agent" });
    }
    const updated = await prisma_1.prisma.demande.update({
        where: { id: demande.id },
        data: { statut: "refusee" },
        include: { items: true },
    });
    res.json(updated);
});
exports.demandesRouter.patch("/:id/refuse", (0, role_1.allowRoles)("responsable", "admin"), async (req, res) => {
    const demande = await prisma_1.prisma.demande.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
        include: { items: true },
    });
    if (!demande)
        return res.status(404).json({ message: "Demande introuvable" });
    const updated = await prisma_1.prisma.demande.update({
        where: { id: demande.id },
        data: { statut: "refusee" },
        include: { items: true },
    });
    res.json(updated);
});
