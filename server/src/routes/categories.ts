import { Router } from "express";
import { prisma } from "../prisma";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (req, res) => {
  const categories = await prisma.category.findMany({
    where: req.tenantId ? { etablissementId: req.tenantId } : undefined,
    orderBy: { nom: "asc" },
  });
  res.json(categories);
});

categoriesRouter.post("/", async (req, res) => {
  if (!req.tenantId) return res.status(400).json({ message: "Tenant requis" });
  const { nom } = req.body as { nom?: string };
  if (!nom) return res.status(400).json({ message: "Nom requis" });
  const category = await prisma.category.create({
    data: {
      nom,
      etablissementId: req.tenantId,
    },
  });
  res.status(201).json(category);
});

categoriesRouter.put("/:id", async (req, res) => {
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
  });
  if (!existing) return res.status(404).json({ message: "Catégorie introuvable" });
  const category = await prisma.category.update({
    where: { id: existing.id },
    data: { nom: req.body.nom ?? existing.nom },
  });
  res.json(category);
});

categoriesRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
  });
  if (!existing) return res.status(404).json({ message: "Catégorie introuvable" });
  await prisma.category.delete({ where: { id: existing.id } });
  res.status(204).send();
});
