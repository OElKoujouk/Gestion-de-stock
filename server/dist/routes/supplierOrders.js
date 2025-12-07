"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierOrdersRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
const role_1 = require("../middleware/role");
exports.supplierOrdersRouter = (0, express_1.Router)();
exports.supplierOrdersRouter.use((0, role_1.allowRoles)("admin", "responsable"));
exports.supplierOrdersRouter.get("/", async (req, res) => {
    if (!req.tenantId)
        return res.status(400).json({ message: "Tenant requis" });
    const orders = await prisma_1.prisma.supplierOrder.findMany({
        where: { etablissementId: req.tenantId },
        include: { items: true, supplier: true },
    });
    res.json(orders);
});
exports.supplierOrdersRouter.post("/", async (req, res) => {
    if (!req.tenantId)
        return res.status(400).json({ message: "Tenant requis" });
    const { fournisseur, supplierId, items } = req.body;
    if (!fournisseur && !supplierId) {
        return res.status(400).json({ message: "Fournisseur requis" });
    }
    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Items requis" });
    }
    let supplierName = fournisseur?.trim() || "";
    let supplierRef = null;
    if (supplierId) {
        const supplier = await prisma_1.prisma.supplier.findFirst({
            where: { id: supplierId, etablissementId: req.tenantId },
        });
        if (!supplier)
            return res.status(404).json({ message: "Fournisseur introuvable" });
        supplierName = supplier.nom;
        supplierRef = supplier.id;
    }
    if (!supplierName) {
        return res.status(400).json({ message: "Nom du fournisseur requis" });
    }
    const order = await prisma_1.prisma.supplierOrder.create({
        data: {
            etablissementId: req.tenantId,
            fournisseur: supplierName,
            supplierId: supplierRef,
            statut: "en_cours",
            items: {
                createMany: {
                    data: items.map((item) => ({
                        articleId: item.articleId,
                        quantite: item.quantite,
                    })),
                },
            },
        },
        include: { items: true, supplier: true },
    });
    res.status(201).json(order);
});
exports.supplierOrdersRouter.patch("/:id", async (req, res) => {
    const { items, statut } = req.body;
    const order = await prisma_1.prisma.supplierOrder.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
        include: { items: true, supplier: true },
    });
    if (!order)
        return res.status(404).json({ message: "Commande introuvable" });
    const operations = [];
    // Replace items if provided (before reception)
    if (items && Array.isArray(items) && items.length > 0) {
        operations.push(prisma_1.prisma.supplierOrderItem.deleteMany({ where: { commandeId: order.id } }), prisma_1.prisma.supplierOrderItem.createMany({
            data: items.map((item) => ({
                commandeId: order.id,
                articleId: item.articleId,
                quantite: item.quantite,
            })),
        }));
    }
    if (statut) {
        operations.push(prisma_1.prisma.supplierOrder.update({
            where: { id: order.id },
            data: { statut },
        }));
    }
    if (operations.length === 0) {
        return res.status(400).json({ message: "Aucune modification demandée" });
    }
    await prisma_1.prisma.$transaction(operations);
    const fresh = await prisma_1.prisma.supplierOrder.findUnique({
        where: { id: order.id },
        include: { items: true, supplier: true },
    });
    if (statut === "recue" && fresh) {
        await prisma_1.prisma.$transaction(fresh.items.map((item) => prisma_1.prisma.article.update({
            where: { id: item.articleId },
            data: { quantite: { increment: item.quantite } },
        })));
    }
    res.json(fresh);
});
