import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { requireAbility } from "../middleware/permissions";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (req, res) => {
  const { etablissementId, ownerId } = req.query;
  const where: Prisma.CategoryWhereInput = {};
  const tenantId = req.tenantId ?? (etablissementId ? String(etablissementId) : undefined);
  if (tenantId) {
    where.etablissementId = tenantId;
  }
  if (req.user?.role === "responsable") {
    where.ownerId = req.user.id;
  } else if (ownerId && typeof ownerId === "string" && ownerId.length > 0) {
    where.ownerId = ownerId;
  }
  const categories = await prisma.category.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { nom: "asc" },
  });
  res.json(categories);
});

categoriesRouter.post("/", requireAbility("manageCategories"), async (req, res) => {
  const { nom, etablissementId, ownerId } = req.body as { nom?: string; etablissementId?: string | null; ownerId?: string | null };
  if (!nom) return res.status(400).json({ message: "Nom requis" });
  const tenantId = req.tenantId ?? etablissementId;
  if (!tenantId) return res.status(400).json({ message: "Tenant requis" });
  const isResponsable = req.user?.role === "responsable";
  let categoryOwnerId: string | null = null;

  if (isResponsable && req.user) {
    categoryOwnerId = req.user.id;
  } else if (ownerId) {
    const owner = await prisma.user.findFirst({
      where: { id: ownerId, role: "responsable", ...(tenantId ? { etablissementId: tenantId } : {}) },
    });
    if (!owner) {
      return res.status(400).json({ message: "Responsable cible introuvable pour cette catégorie" });
    }
    categoryOwnerId = owner.id;
  }

  const category = await prisma.category.create({
    data: {
      nom,
      etablissementId: tenantId,
      ownerId: categoryOwnerId,
    },
  });
  res.status(201).json(category);
});

categoriesRouter.put("/:id", requireAbility("manageCategories"), async (req, res) => {
  const isResponsable = req.user?.role === "responsable";
  const existing = await prisma.category.findFirst({
    where: {
      id: req.params.id,
      ...(req.tenantId ? { etablissementId: req.tenantId } : {}),
      ...(isResponsable && req.user ? { ownerId: req.user.id } : {}),
    },
  });
  if (!existing) return res.status(404).json({ message: "Catégorie introuvable" });
  const { nom, ownerId } = req.body as { nom?: string; ownerId?: string | null };
  let nextOwnerId: string | null = existing.ownerId ?? null;

  if (!isResponsable && ownerId !== undefined) {
    if (ownerId === null) {
      nextOwnerId = null;
    } else {
      const owner = await prisma.user.findFirst({
        where: { id: ownerId, role: "responsable", ...(existing.etablissementId ? { etablissementId: existing.etablissementId } : {}) },
      });
      if (!owner) {
        return res.status(400).json({ message: "Responsable cible introuvable pour cette catégorie" });
      }
      nextOwnerId = owner.id;
    }
  } else if (isResponsable && req.user) {
    nextOwnerId = req.user.id;
  }

  const category = await prisma.category.update({
    where: { id: existing.id },
    data: { nom: nom ?? existing.nom, ownerId: nextOwnerId },
  });
  res.json(category);
});

categoriesRouter.delete("/:id", requireAbility("manageCategories"), async (req, res) => {
  const isResponsable = req.user?.role === "responsable";
  const existing = await prisma.category.findFirst({
    where: {
      id: req.params.id,
      ...(req.tenantId ? { etablissementId: req.tenantId } : {}),
      ...(isResponsable && req.user ? { ownerId: req.user.id } : {}),
    },
  });
  if (!existing) return res.status(404).json({ message: "Catégorie introuvable" });
  await prisma.category.delete({ where: { id: existing.id } });
  res.status(204).send();
});
