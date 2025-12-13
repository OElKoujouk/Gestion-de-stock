"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma_1 = require("../prisma");
const role_1 = require("../middleware/role");
const permissions_1 = require("../permissions");
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
            identifiant: true,
            contactEmail: true,
            role: true,
            actif: true,
            etablissementId: true,
            domaine: true,
            createdAt: true,
            permissions: true,
        },
    });
    res.json(users.map((user) => ({ ...user, permissions: (0, permissions_1.normalizePermissions)(user.permissions, user.role) })));
});
exports.usersRouter.post("/", async (req, res) => {
    const { nom, identifiant, contactEmail, motDePasse, role, actif, etablissementId, permissions, domaine } = req.body;
    if (!nom || !identifiant || !motDePasse || !role) {
        return res.status(400).json({ message: "Champs requis manquants" });
    }
    const hashedPassword = await bcryptjs_1.default.hash(motDePasse, 10);
    const assignedTenant = req.tenantId ?? etablissementId ?? null;
    if ((role === "admin" || role === "responsable") && !assignedTenant) {
        return res.status(400).json({ message: "Un etablissement est requis pour ce role" });
    }
    let user;
    try {
        const computedPermissions = (0, permissions_1.mergePermissionsUpdate)(permissions, role);
        user = await prisma_1.prisma.user.create({
            data: {
                nom,
                identifiant,
                contactEmail: contactEmail ?? null,
                motDePasse: hashedPassword,
                role: role,
                actif: actif ?? true,
                etablissementId: assignedTenant,
                domaine: domaine ?? null,
                permissions: computedPermissions,
            },
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return res.status(409).json({ message: "Identifiant deja utilise" });
        }
        throw error;
    }
    res
        .status(201)
        .json({
        id: user.id,
        nom: user.nom,
        identifiant: user.identifiant,
        contactEmail: user.contactEmail,
        role: user.role,
        etablissementId: user.etablissementId,
        domaine: user.domaine,
        permissions: (0, permissions_1.normalizePermissions)(user.permissions, user.role),
    });
});
exports.usersRouter.put("/:id", async (req, res) => {
    const existing = await prisma_1.prisma.user.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    });
    if (!existing)
        return res.status(404).json({ message: "Utilisateur introuvable" });
    const { nom, identifiant, contactEmail, role, actif, motDePasse, etablissementId, permissions, domaine } = req.body;
    if (!nom || !identifiant || !role) {
        return res.status(400).json({ message: "Nom, identifiant et rôle sont obligatoires" });
    }
    const data = {
        nom,
        identifiant,
        contactEmail: typeof contactEmail === "undefined" ? existing.contactEmail : contactEmail ?? null,
        role,
        domaine: typeof domaine === "undefined" ? existing.domaine : domaine ?? null,
    };
    if (typeof actif === "boolean") {
        data.actif = actif;
    }
    if (motDePasse) {
        data.motDePasse = await bcryptjs_1.default.hash(motDePasse, 10);
    }
    data.permissions = (0, permissions_1.mergePermissionsUpdate)(permissions, role);
    if (!req.tenantId) {
        const assignedTenant = typeof etablissementId === "undefined" ? existing.etablissementId : etablissementId ?? null;
        if ((role === "admin" || role === "responsable") && !assignedTenant) {
            return res.status(400).json({ message: "Un etablissement est requis pour ce role" });
        }
        data.etablissementId = assignedTenant;
    }
    const user = await prisma_1.prisma.user.update({
        where: { id: existing.id },
        data,
    });
    res.json({
        id: user.id,
        nom: user.nom,
        identifiant: user.identifiant,
        contactEmail: user.contactEmail,
        role: user.role,
        actif: user.actif,
        etablissementId: user.etablissementId,
        domaine: user.domaine,
        permissions: (0, permissions_1.normalizePermissions)(user.permissions, user.role),
    });
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
    const tenantFilter = req.tenantId ? { etablissementId: req.tenantId } : {};
    await prisma_1.prisma.$transaction(async (tx) => {
        // Sauvegarder le nom/email sur les demandes avant de détacher/supprimer (raw pour eviter les soucis de client genere)
        if (!req.tenantId) {
            await tx.$executeRawUnsafe("UPDATE demandes SET agent_nom = ?, agent_email = ? WHERE agent_id = ?", existing.nom, existing.contactEmail, existing.id);
        }
        else {
            await tx.$executeRawUnsafe("UPDATE demandes SET agent_nom = ?, agent_email = ? WHERE agent_id = ? AND etablissement_id = ?", existing.nom, existing.contactEmail, existing.id, req.tenantId);
        }
        // Supprimer les demandes en cours (en_attente, modifiee) + leurs items
        const pendingDemandes = await tx.demande.findMany({
            where: { agentId: existing.id, statut: { in: ["en_attente", "modifiee"] }, ...tenantFilter },
            select: { id: true },
        });
        const pendingIds = pendingDemandes.map((d) => d.id);
        if (pendingIds.length > 0) {
            await tx.demandeItem.deleteMany({ where: { demandeId: { in: pendingIds } } });
            await tx.demande.deleteMany({ where: { id: { in: pendingIds } } });
        }
        // Détacher les demandes historisées pour conserver la trace
        // (raw SQL pour éviter les problèmes de génération de client lors du changement de nullabilité)
        if (!req.tenantId) {
            await tx.$executeRawUnsafe("UPDATE demandes SET agent_id = NULL WHERE agent_id = ?", existing.id);
        }
        else {
            await tx.$executeRawUnsafe("UPDATE demandes SET agent_id = NULL WHERE agent_id = ? AND etablissement_id = ?", existing.id, req.tenantId);
        }
        // Détacher les validations effectuées par ce responsable/admin
        await tx.demande.updateMany({
            where: { validatedById: existing.id, ...tenantFilter },
            data: { validatedById: null },
        });
        // Détacher la propriété des catégories et articles
        await tx.category.updateMany({
            where: { ownerId: existing.id, ...tenantFilter },
            data: { ownerId: null },
        });
        await tx.article.updateMany({
            where: { ownerId: existing.id, ...tenantFilter },
            data: { ownerId: null },
        });
        // Supprimer les mouvements historisés liés à cet utilisateur pour éviter les contraintes FK
        await tx.movement.deleteMany({ where: { userId: existing.id, ...tenantFilter } });
        // Supprimer l'utilisateur
        await tx.user.delete({ where: { id: existing.id } });
    });
    res.status(204).send();
});
