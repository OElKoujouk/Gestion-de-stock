"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suppliersRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
const role_1 = require("../middleware/role");
exports.suppliersRouter = (0, express_1.Router)();
exports.suppliersRouter.use((0, role_1.allowRoles)("admin", "responsable", "superadmin"));
exports.suppliersRouter.get("/", async (req, res) => {
    const etablissementId = req.user?.role === "superadmin"
        ? req.query.etablissementId
            ? String(req.query.etablissementId)
            : null
        : req.tenantId;
    if (!etablissementId)
        return res.status(400).json({ message: "Tenant requis" });
    const suppliers = await prisma_1.prisma.supplier.findMany({
        where: { etablissementId },
        orderBy: { nom: "asc" },
    });
    res.json(suppliers);
});
exports.suppliersRouter.post("/", async (req, res) => {
    if (!req.tenantId)
        return res.status(400).json({ message: "Tenant requis" });
    const { nom, adresse } = req.body;
    if (!nom)
        return res.status(400).json({ message: "Nom requis" });
    const supplier = await prisma_1.prisma.supplier.create({
        data: {
            nom: nom.trim(),
            adresse: adresse?.trim() || null,
            etablissementId: req.tenantId,
        },
    });
    res.status(201).json(supplier);
});
exports.suppliersRouter.put("/:id", async (req, res) => {
    if (!req.tenantId)
        return res.status(400).json({ message: "Tenant requis" });
    const { nom, adresse } = req.body;
    if (!nom)
        return res.status(400).json({ message: "Nom requis" });
    const existing = await prisma_1.prisma.supplier.findFirst({
        where: { id: req.params.id, etablissementId: req.tenantId },
    });
    if (!existing)
        return res.status(404).json({ message: "Fournisseur introuvable" });
    const updated = await prisma_1.prisma.supplier.update({
        where: { id: req.params.id },
        data: { nom: nom.trim(), adresse: adresse?.trim() ?? null },
    });
    res.json(updated);
});
exports.suppliersRouter.delete("/:id", async (req, res) => {
    if (!req.tenantId)
        return res.status(400).json({ message: "Tenant requis" });
    const existing = await prisma_1.prisma.supplier.findFirst({
        where: { id: req.params.id, etablissementId: req.tenantId },
    });
    if (!existing)
        return res.status(404).json({ message: "Fournisseur introuvable" });
    await prisma_1.prisma.supplier.delete({ where: { id: req.params.id } });
    res.status(204).send();
});
