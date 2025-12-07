import { Router } from "express";
import { prisma } from "../prisma";
import { requireAbility } from "../middleware/permissions";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (req, res) => {
  const { etablissementId } = req.query;
  const where = req.tenantId ? { etablissementId: req.tenantId } : etablissementId ? { etablissementId: String(etablissementId) } : undefined;
  const categories = await prisma.category.findMany({
    where,
    orderBy: { nom: "asc" },
  });
  res.json(categories);
});

categoriesRouter.post("/", requireAbility("manageCategories"), async (req, res) => {
  const { nom, etablissementId } = req.body as { nom?: string; etablissementId?: string | null };
  if (!nom) return res.status(400).json({ message: "Nom requis" });
  const tenantId = req.tenantId ?? etablissementId;
  if (!tenantId) return res.status(400).json({ message: "Tenant requis" });
  const category = await prisma.category.create({
    data: {
      nom,
      etablissementId: tenantId,
    },
  });
  res.status(201).json(category);
});

categoriesRouter.put("/:id", requireAbility("manageCategories"), async (req, res) => {
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

categoriesRouter.delete("/:id", requireAbility("manageCategories"), async (req, res) => {
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
  });
  if (!existing) return res.status(404).json({ message: "Catégorie introuvable" });
  await prisma.category.delete({ where: { id: existing.id } });
  res.status(204).send();
});
