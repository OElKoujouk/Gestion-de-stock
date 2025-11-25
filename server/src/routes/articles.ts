import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export const articlesRouter = Router();

articlesRouter.get("/", async (req, res) => {
  const { categorie, reference_fournisseur, nom } = req.query;
  const where: Prisma.ArticleWhereInput = {};
  if (req.tenantId) {
    where.etablissementId = req.tenantId;
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
  if (!req.tenantId) return res.status(400).json({ message: "Tenant requis" });
  const { nom, categorieId, quantite, referenceFournisseur, seuilAlerte, description, conditionnement } = req.body;
  if (!nom || quantite === undefined || !referenceFournisseur || seuilAlerte === undefined) {
    return res.status(400).json({ message: "Champs requis manquants" });
  }
  const article = await prisma.article.create({
    data: {
      etablissementId: req.tenantId,
      nom,
      categorieId: categorieId ?? null,
      quantite,
      referenceFournisseur,
      seuilAlerte,
      description,
      conditionnement,
    },
  });
  res.status(201).json(article);
});

articlesRouter.get("/:id", async (req, res) => {
  const article = await prisma.article.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
  });
  if (!article) return res.status(404).json({ message: "Article introuvable" });
  res.json(article);
});

articlesRouter.put("/:id", async (req, res) => {
  const existing = await prisma.article.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
  });
  if (!existing) {
    return res.status(404).json({ message: "Article introuvable" });
  }
  const article = await prisma.article.update({
    where: { id: existing.id },
    data: req.body,
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
