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
        include: { items: true },
    });
    res.json(orders);
});
exports.supplierOrdersRouter.post("/", async (req, res) => {
    if (!req.tenantId)
        return res.status(400).json({ message: "Tenant requis" });
    const { fournisseur, items } = req.body;
    if (!fournisseur || !items || items.length === 0) {
        return res.status(400).json({ message: "Fournisseur et items requis" });
    }
    const order = await prisma_1.prisma.supplierOrder.create({
        data: {
            etablissementId: req.tenantId,
            fournisseur,
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
        include: { items: true },
    });
    res.status(201).json(order);
});
exports.supplierOrdersRouter.patch("/:id", async (req, res) => {
    const order = await prisma_1.prisma.supplierOrder.findFirst({
        where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
        include: { items: true },
    });
    if (!order)
        return res.status(404).json({ message: "Commande introuvable" });
    const { statut } = req.body;
    const updated = await prisma_1.prisma.supplierOrder.update({
        where: { id: order.id },
        data: { statut },
        include: { items: true },
    });
    if (statut === "recue") {
        await prisma_1.prisma.$transaction(updated.items.map((item) => prisma_1.prisma.article.update({
            where: { id: item.articleId },
            data: { quantite: { increment: item.quantite } },
        })));
    }
    res.json(updated);
});
