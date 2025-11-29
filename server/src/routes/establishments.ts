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
  try {
    await prisma.establishment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: "Etablissement introuvable" });
  }
});
