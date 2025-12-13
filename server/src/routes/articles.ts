import { Router } from "express";
import type { Prisma } from "@prisma/client";

import { prisma } from "../prisma";
import { requireAbility } from "../middleware/permissions";

export const articlesRouter = Router();

articlesRouter.get("/", async (req, res) => {
  const { categorie, reference_fournisseur, nom, etablissementId, ownerId } = req.query;
  const where: Prisma.ArticleWhereInput = {};
  if (req.tenantId) {
    where.etablissementId = req.tenantId;
  } else if (etablissementId) {
    where.etablissementId = String(etablissementId);
  }
  if (categorie) {
    where.categorieId = String(categorie);
  }
  if (req.user?.role === "responsable") {
    where.ownerId = req.user.id;
  } else if (ownerId && typeof ownerId === "string" && ownerId.length > 0) {
    // Filtrage par domaine/responsable pour les agents/admins.
    where.ownerId = ownerId;
  }
  if (reference_fournisseur) {
    where.referenceFournisseur = String(reference_fournisseur);
  }
  if (nom) {
    where.nom = { contains: String(nom) };
  }
  const articles = await prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  res.json(articles);
});

articlesRouter.post("/", requireAbility("manageProducts"), async (req, res) => {
  const { nom, categorieId, quantite, referenceFournisseur, seuilAlerte, description, etablissementId } = req.body;
  if (!nom || quantite === undefined || seuilAlerte === undefined) {
    return res.status(400).json({ message: "Champs requis manquants" });
  }
  const tenantId = req.tenantId ?? etablissementId;
  if (!tenantId) {
    return res.status(400).json({ message: "Tenant requis" });
  }
  const isResponsable = req.user?.role === "responsable";
  let ownerId: string | null = null;
  if (categorieId) {
    const category = await prisma.category.findFirst({
      where: {
        id: categorieId,
        etablissementId: tenantId,
        ...(isResponsable && req.user ? { ownerId: req.user.id } : {}),
      },
    });
    if (!category) {
      return res.status(isResponsable ? 403 : 404).json({ message: isResponsable ? "Catégorie non autorisée pour ce responsable" : "Catégorie introuvable" });
    }
    ownerId = category.ownerId ?? ownerId;
  }
  if (isResponsable && req.user) {
    ownerId = req.user.id;
  }

  const data: Prisma.ArticleCreateInput = {
    etablissement: { connect: { id: tenantId } },
    nom,
    quantite,
    referenceFournisseur: referenceFournisseur ?? "",
    seuilAlerte,
    description,
  };
  if (categorieId) {
    data.categorie = { connect: { id: categorieId } };
  }
  if (ownerId) {
    data.owner = { connect: { id: ownerId } };
  }

  const article = await prisma.article.create({ data });
  res.status(201).json(article);
});

articlesRouter.get("/:id", async (req, res) => {
  const article = await prisma.article.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
  });
  if (!article) {
    return res.status(404).json({ message: "Article introuvable" });
  }
  res.json(article);
});

articlesRouter.put("/:id", requireAbility("manageProducts"), async (req, res) => {
  const existing = await prisma.article.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
  });
  if (!existing) {
    return res.status(404).json({ message: "Article introuvable" });
  }
  const payload = req.body as Partial<{
    nom: string;
    categorieId: string | null;
    quantite: number;
    referenceFournisseur: string | null;
    seuilAlerte: number;
    description: string | null;
  }>;

  const isResponsable = req.user?.role === "responsable";
  if (payload.categorieId !== undefined) {
    if (payload.categorieId === null) {
      // autoriser la dissociation
    } else if (isResponsable) {
      const category = await prisma.category.findFirst({
        where: { id: payload.categorieId, etablissementId: existing.etablissementId, ownerId: req.user?.id },
      });
      if (!category) {
        return res.status(403).json({ message: "Catégorie non autorisée pour ce responsable" });
      }
    } else {
      const category = await prisma.category.findFirst({
        where: { id: payload.categorieId, etablissementId: existing.etablissementId },
      });
      if (!category) {
        return res.status(404).json({ message: "Catégorie introuvable" });
      }
    }
  }
  if (isResponsable && req.user && existing.ownerId !== req.user.id) {
    return res.status(403).json({ message: "Produit non autorisé pour ce responsable" });
  }

  const data: Prisma.ArticleUpdateInput = {};
  if (payload.nom !== undefined) data.nom = payload.nom;
  if (payload.categorieId !== undefined) {
    data.categorie = payload.categorieId ? { connect: { id: payload.categorieId } } : { disconnect: true };
  }
  if (isResponsable && req.user) {
    data.owner = { connect: { id: req.user.id } };
  }
  if (payload.quantite !== undefined) data.quantite = payload.quantite;
  if (payload.referenceFournisseur !== undefined) data.referenceFournisseur = payload.referenceFournisseur ?? "";
  if (payload.seuilAlerte !== undefined) data.seuilAlerte = payload.seuilAlerte;
  if (payload.description !== undefined) data.description = payload.description;
  const article = await prisma.article.update({
    where: { id: existing.id },
    data,
  });
  res.json(article);
});

articlesRouter.delete("/:id", requireAbility("manageProducts"), async (req, res) => {
  const existing = await prisma.article.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
  });
  if (!existing) {
    return res.status(404).json({ message: "Article introuvable" });
  }
  await prisma.$transaction([
    prisma.demandeItem.deleteMany({ where: { articleId: existing.id } }),
    prisma.supplierOrderItem.deleteMany({ where: { articleId: existing.id } }),
    prisma.movement.deleteMany({ where: { articleId: existing.id } }),
    prisma.article.delete({ where: { id: existing.id } }),
  ]);
  res.status(204).send();
});

articlesRouter.patch("/:id/stock", requireAbility("manageProducts"), async (req, res) => {
  const existing = await prisma.article.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
  });
  if (!existing) {
    return res.status(404).json({ message: "Article introuvable" });
  }
  const { variation } = req.body as { variation?: number };
  if (typeof variation !== "number" || Number.isNaN(variation)) {
    return res.status(400).json({ message: "Variation de stock requise" });
  }
  const newQuantity = existing.quantite + variation;
  if (newQuantity < 0) {
    return res.status(400).json({ message: "Stock négatif interdit" });
  }
  const article = await prisma.article.update({
    where: { id: existing.id },
    data: { quantite: newQuantity },
  });
  res.json(article);
});
