import { Router } from "express";
import { prisma } from "../prisma";
import { allowRoles } from "../middleware/role";

export const establishmentsRouter = Router();

establishmentsRouter.use(allowRoles("superadmin"));

establishmentsRouter.get("/", async (_req, res) => {
  const establishments = await prisma.establishment.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(establishments);
});

establishmentsRouter.post("/", async (req, res) => {
  const { nom } = req.body as { nom?: string };
  if (!nom) {
    return res.status(400).json({ message: "Nom requis" });
  }
  const establishment = await prisma.establishment.create({
    data: { nom },
  });
  res.status(201).json(establishment);
});

establishmentsRouter.put("/:id", async (req, res) => {
  try {
    const establishment = await prisma.establishment.update({
      where: { id: req.params.id },
      data: { nom: req.body.nom },
    });
    res.json(establishment);
  } catch {
    res.status(404).json({ message: "Établissement introuvable" });
  }
});

establishmentsRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.establishment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: "Établissement introuvable" });
  }
});
