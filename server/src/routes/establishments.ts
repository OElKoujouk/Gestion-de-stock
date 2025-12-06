import { Router } from "express";

import { allowRoles } from "../middleware/role";
import { prisma } from "../prisma";

export const establishmentsRouter = Router();

establishmentsRouter.use(allowRoles("superadmin", "admin"));

establishmentsRouter.get("/", async (_req, res) => {
  const establishments = await prisma.establishment.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(establishments);
});

establishmentsRouter.post("/", async (req, res) => {
  const { nom, adresse, codePostal, ville } = req.body as {
    nom?: string;
    adresse?: string | null;
    codePostal?: string | null;
    ville?: string | null;
  };
  if (!nom) {
    return res.status(400).json({ message: "Nom requis" });
  }
  const establishment = await prisma.establishment.create({
    data: {
      nom,
      adresse: adresse ?? null,
      codePostal: codePostal ?? null,
      ville: ville ?? null,
    },
  });
  res.status(201).json(establishment);
});

establishmentsRouter.put("/:id", async (req, res) => {
  const { nom, adresse, codePostal, ville } = req.body as {
    nom?: string;
    adresse?: string | null;
    codePostal?: string | null;
    ville?: string | null;
  };
  if (!nom) {
    return res.status(400).json({ message: "Nom requis" });
  }
  try {
    const establishment = await prisma.establishment.update({
      where: { id: req.params.id },
      data: {
        nom,
        adresse: adresse ?? null,
        codePostal: codePostal ?? null,
        ville: ville ?? null,
      },
    });
    res.json(establishment);
  } catch {
    res.status(404).json({ message: "Etablissement introuvable" });
  }
});

establishmentsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.establishment.findUnique({ where: { id } });
      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      // Supprimer toutes les données liées avant de supprimer l'établissement.
      await tx.demandeItem.deleteMany({ where: { demande: { etablissementId: id } } });
      await tx.demande.deleteMany({ where: { etablissementId: id } });
      await tx.supplierOrderItem.deleteMany({ where: { commande: { etablissementId: id } } });
      await tx.supplierOrder.deleteMany({ where: { etablissementId: id } });
      await tx.movement.deleteMany({ where: { etablissementId: id } });
      await tx.article.deleteMany({ where: { etablissementId: id } });
      await tx.category.deleteMany({ where: { etablissementId: id } });
      await tx.user.deleteMany({ where: { etablissementId: id } });

      await tx.establishment.delete({ where: { id } });
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      res.status(404).json({ message: "Etablissement introuvable" });
      return;
    }
    res.status(500).json({ message: "Impossible de supprimer l'etablissement" });
  }
});
