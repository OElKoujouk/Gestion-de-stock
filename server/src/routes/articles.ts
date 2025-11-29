import { Router } from "express";
import type { Prisma } from "@prisma/client";

import { prisma } from "../prisma";

export const articlesRouter = Router();

articlesRouter.get("/", async (req, res) => {
  const { categorie, reference_fournisseur, nom, etablissementId } = req.query;
  const where: Prisma.ArticleWhereInput = {};
  if (req.tenantId) {
    where.etablissementId = req.tenantId;
  } else if (etablissementId) {
    where.etablissementId = String(etablissementId);
  }
  if (categorie) {
    where.categorieId = String(categorie);
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

articlesRouter.post("/", async (req, res) => {
  const { nom, categorieId, quantite, referenceFournisseur, seuilAlerte, description, conditionnement, etablissementId } =
    req.body;
  if (!nom || quantite === undefined || seuilAlerte === undefined) {
    return res.status(400).json({ message: "Champs requis manquants" });
  }
  const tenantId = req.tenantId ?? etablissementId;
  if (!tenantId) {
    return res.status(400).json({ message: "Tenant requis" });
  }
  const data: Prisma.ArticleCreateInput = {
    etablissement: { connect: { id: tenantId } },
    nom,
    quantite,
    referenceFournisseur: referenceFournisseur ?? "",
    seuilAlerte,
    description,
    conditionnement,
  };
  if (categorieId) {
    data.categorie = { connect: { id: categorieId } };
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

articlesRouter.put("/:id", async (req, res) => {
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
    conditionnement: string | null;
  }>;

  const data: Prisma.ArticleUpdateInput = {};
  if (payload.nom !== undefined) data.nom = payload.nom;
  if (payload.categorieId !== undefined) {
    data.categorie = payload.categorieId ? { connect: { id: payload.categorieId } } : { disconnect: true };
  }
  if (payload.quantite !== undefined) data.quantite = payload.quantite;
  if (payload.referenceFournisseur !== undefined) data.referenceFournisseur = payload.referenceFournisseur ?? "";
  if (payload.seuilAlerte !== undefined) data.seuilAlerte = payload.seuilAlerte;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.conditionnement !== undefined) data.conditionnement = payload.conditionnement;

  const article = await prisma.article.update({
    where: { id: existing.id },
    data,
  });
  res.json(article);
});

articlesRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.article.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
  });
  if (!existing) {
    return res.status(404).json({ message: "Article introuvable" });
  }
  await prisma.article.delete({ where: { id: existing.id } });
  res.status(204).send();
});

articlesRouter.patch("/:id/stock", async (req, res) => {
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
