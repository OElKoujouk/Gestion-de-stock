"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.establishmentsRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
const role_1 = require("../middleware/role");
exports.establishmentsRouter = (0, express_1.Router)();
exports.establishmentsRouter.use((0, role_1.allowRoles)("superadmin"));
exports.establishmentsRouter.get("/", async (_req, res) => {
    const establishments = await prisma_1.prisma.establishment.findMany({
        orderBy: { createdAt: "desc" },
    });
    res.json(establishments);
});
exports.establishmentsRouter.post("/", async (req, res) => {
    const { nom } = req.body;
    if (!nom) {
        return res.status(400).json({ message: "Nom requis" });
    }
    const establishment = await prisma_1.prisma.establishment.create({
        data: { nom },
    });
    res.status(201).json(establishment);
});
exports.establishmentsRouter.put("/:id", async (req, res) => {
    try {
        const establishment = await prisma_1.prisma.establishment.update({
            where: { id: req.params.id },
            data: { nom: req.body.nom },
        });
        res.json(establishment);
    }
    catch {
        res.status(404).json({ message: "Établissement introuvable" });
    }
});
exports.establishmentsRouter.delete("/:id", async (req, res) => {
    try {
        await prisma_1.prisma.establishment.delete({ where: { id: req.params.id } });
        res.status(204).send();
    }
    catch {
        res.status(404).json({ message: "Établissement introuvable" });
    }
});
