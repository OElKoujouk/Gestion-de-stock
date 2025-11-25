import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export const movementsRouter = Router();

movementsRouter.get("/", async (req, res) => {
  const { type, article_id, date } = req.query;
  const where: Prisma.MovementWhereInput = {};
  if (req.tenantId) {
    where.etablissementId = req.tenantId;
  }
  if (type) {
    where.type = String(type) as Prisma.MovementWhereInput["type"];
  }
  if (article_id) {
    where.articleId = String(article_id);
  }
  if (date) {
    const day = String(date);
    where.createdAt = {
      gte: new Date(`${day}T00:00:00`),
      lt: new Date(`${day}T23:59:59`),
    };
  }
  const movements = await prisma.movement.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  res.json(movements);
});

movementsRouter.post("/", async (req, res) => {
  if (!req.tenantId || !req.user) return res.status(400).json({ message: "Tenant requis" });
  const { articleId, type, quantite, commentaire } = req.body as {
    articleId?: string;
    type?: "entree" | "sortie";
    quantite?: number;
    commentaire?: string;
  };
  if (!articleId || !type || typeof quantite !== "number") {
    return res.status(400).json({ message: "Champs requis" });
  }
  const article = await prisma.article.findFirst({
    where: { id: articleId, etablissementId: req.tenantId },
  });
  if (!article) {
    return res.status(404).json({ message: "Article introuvable" });
  }
  await prisma.$transaction([
    prisma.movement.create({
      data: {
        articleId,
        etablissementId: req.tenantId,
        userId: req.user.id,
        type,
        quantite,
        commentaire,
      },
    }),
    prisma.article.update({
      where: { id: article.id },
      data: {
        quantite: type === "entree" ? article.quantite + quantite : article.quantite - quantite,
      },
    }),
  ]);
  res.status(201).json({ message: "Mouvement enregistré" });
});
