"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demandesRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma_1 = require("../prisma");
const role_1 = require("../middleware/role");
exports.demandesRouter = (0, express_1.Router)();
const buildAgentInitials = (nom) => {
    const raw = (nom ?? "").trim();
    if (!raw)
        return "AG";
    const parts = raw.split(/[\s-]+/).filter(Boolean);
    const initials = parts.map((part) => part[0]).join("");
    const fallback = raw.slice(0, 2);
    return (initials || fallback || "AG").toUpperCase().slice(0, 3).padEnd(2, "X");
};
const buildReference = (nom, sequence) => {
    const initials = buildAgentInitials(nom);
    const seq = sequence.toString().padStart(2, "0");
    return `CMD-${initials}-${seq}`;
};
const createDemandeWithReference = async (agent, tenantId, items) => {
    let lastError;
    for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
            const demande = await prisma_1.prisma.$transaction(async (tx) => {
                const updatedAgent = await tx.user.update({
                    where: { id: agent.id },
                    data: { demandeSequence: { increment: 1 } },
                    select: { demandeSequence: true },
                });
                const reference = buildReference(agent.nom, updatedAgent.demandeSequence);
                return tx.demande.create({
                    data: {
                        etablissementId: tenantId,
                        agentId: agent.id,
                        agentNom: agent.nom,
                        agentEmail: agent.contactEmail,
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
            });
            return demande;
        }
        catch (error) {
            lastError = error;
            const isUniqueError = error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002" &&
                Array.isArray(error.meta?.target) &&
                (error.meta?.target).includes("reference");
            if (isUniqueError) {
                // Retry with the next sequence value
                continue;
            }
            throw error;
        }
    }
    throw lastError ?? new Error("Impossible de generer une reference unique pour la demande");
};
exports.demandesRouter.post("/", (0, role_1.allowRoles)("agent", "responsable", "admin"), async (req, res) => {
    if (!req.tenantId || !req.user)
        return res.status(400).json({ message: "Tenant requis" });
    const { items } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Une demande doit contenir au moins un article" });
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
    try {
        const demande = await createDemandeWithReference({ id: agent.id, nom: agent.nom ?? null, contactEmail: agent.contactEmail ?? null }, req.tenantId, items);
        res.status(201).json(demande);
    }
    catch (error) {
        return res.status(500).json({ message: "Generation de reference impossible" });
    }
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
        if (req.user.role === "responsable" && req.user.domaine) {
            where.agent = { domaine: { in: [req.user.domaine] } };
        }
    }
    const demandes = await prisma_1.prisma.demande.findMany({
        where,
        include: {
            items: true,
            agent: { select: { id: true, nom: true, contactEmail: true, domaine: true } },
            validatedBy: { select: { id: true, nom: true } },
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
            agent: { select: { id: true, nom: true, contactEmail: true, domaine: true } },
            validatedBy: { select: { id: true, nom: true } },
            etablissement: { select: { id: true, nom: true } },
        },
    });
    if (!demande)
        return res.status(404).json({ message: "Demande introuvable" });
    if (req.user?.role === "responsable" && req.user.domaine && demande.agent?.domaine && demande.agent.domaine !== req.user.domaine) {
        return res.status(403).json({ message: "Acces refuse pour ce domaine" });
    }
    res.json(demande);
});
exports.demandesRouter.get("/toutes", (0, role_1.allowRoles)("responsable", "admin"), async (req, res) => {
    if (!req.tenantId)
        return res.status(400).json({ message: "Tenant requis" });
    const demandes = await prisma_1.prisma.demande.findMany({
        where: {
            etablissementId: req.tenantId,
            ...(req.user?.role === "responsable" && req.user.domaine ? { agent: { domaine: { in: [req.user.domaine] } } } : {}),
        },
        include: {
            items: true,
            agent: { select: { id: true, nom: true, contactEmail: true, domaine: true } },
            validatedBy: { select: { id: true, nom: true } },
            etablissement: { select: { id: true, nom: true } },
        },
    });
    res.json(demandes);
});
exports.demandesRouter.patch("/:id", (0, role_1.allowRoles)("responsable", "admin"), async (req, res) => {
    const demande = await prisma_1.prisma.demande.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
        include: { items: true, agent: { select: { id: true, domaine: true } } },
    });
    if (!demande)
        return res.status(404).json({ message: "Demande introuvable" });
    if (req.user?.role === "responsable" && req.user.domaine && demande.agent?.domaine && demande.agent.domaine !== req.user.domaine) {
        return res.status(403).json({ message: "Acces refuse pour ce domaine" });
    }
    const { statut, items } = req.body;
    if (items) {
        await Promise.all(items.map((item) => prisma_1.prisma.demandeItem.update({
            where: { id: item.itemId },
            data: { quantitePreparee: item.quantitePreparee },
        })));
    }
    const updateData = { statut: statut ?? demande.statut };
    if (statut === "preparee" || statut === "modifiee" || statut === "refusee") {
        if (req.user?.id) {
            updateData.validatedBy = { connect: { id: req.user.id } };
            const validator = await prisma_1.prisma.user.findUnique({ where: { id: req.user.id }, select: { nom: true } });
            updateData.validatedByNom = validator?.nom ?? null;
        }
        else {
            updateData.validatedBy = { disconnect: true };
            updateData.validatedByNom = null;
        }
    }
    const updatedDemande = await prisma_1.prisma.demande.update({
        where: { id: demande.id },
        data: updateData,
        include: { items: true, validatedBy: { select: { id: true, nom: true } } },
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
        include: { items: true, agent: { select: { id: true, domaine: true } } },
    });
    if (!demande)
        return res.status(404).json({ message: "Demande introuvable" });
    if (req.user?.role === "responsable" && req.user.domaine && demande.agent?.domaine && demande.agent.domaine !== req.user.domaine) {
        return res.status(403).json({ message: "Acces refuse pour ce domaine" });
    }
    const updated = await prisma_1.prisma.demande.update({
        where: { id: demande.id },
        data: { statut: "refusee" },
        include: { items: true },
    });
    res.json(updated);
});
