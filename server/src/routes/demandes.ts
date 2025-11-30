import { Router } from "express";
import { prisma } from "../prisma";
import { allowRoles } from "../middleware/role";

export const demandesRouter = Router();

demandesRouter.post("/", allowRoles("agent", "responsable", "admin"), async (req, res) => {
  if (!req.tenantId || !req.user) return res.status(400).json({ message: "Tenant requis" });
  const { items } = req.body as { items?: Array<{ articleId: string; quantite: number }> };
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Une demande doit contenir au moins un article" });
  }
  const demande = await prisma.demande.create({
    data: {
      etablissementId: req.tenantId,
      agentId: req.user.id,
      statut: "en_attente",
      items: {
        createMany: {
          data: items.map((item) => ({
            articleId: item.articleId,
            quantiteDemandee: item.quantite,
            quantitePreparee: 0,
          })),
        },
      },
    },
    include: { items: true },
  });
  res.status(201).json(demande);
});

demandesRouter.get("/", allowRoles("agent", "responsable", "admin"), async (req, res) => {
  if (!req.tenantId || !req.user) return res.status(400).json({ message: "Tenant requis" });
  const where = {
    etablissementId: req.tenantId,
    ...(req.user.role === "agent" ? { agentId: req.user.id } : {}),
  };
  const demandes = await prisma.demande.findMany({
    where,
    include: { items: true, agent: { select: { id: true, nom: true, email: true } } },
  });
  res.json(demandes);
});

demandesRouter.get("/:id", allowRoles("agent", "responsable", "admin"), async (req, res) => {
  const demande = await prisma.demande.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    include: { items: true, agent: { select: { id: true, nom: true, email: true } } },
  });
  if (!demande) return res.status(404).json({ message: "Demande introuvable" });
  res.json(demande);
});

demandesRouter.get("/toutes", allowRoles("responsable", "admin"), async (req, res) => {
  if (!req.tenantId) return res.status(400).json({ message: "Tenant requis" });
  const demandes = await prisma.demande.findMany({
    where: { etablissementId: req.tenantId },
    include: { items: true, agent: { select: { id: true, nom: true, email: true } } },
  });
  res.json(demandes);
});

demandesRouter.patch("/:id", allowRoles("responsable", "admin"), async (req, res) => {
  const demande = await prisma.demande.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    include: { items: true },
  });
  if (!demande) return res.status(404).json({ message: "Demande introuvable" });
  const { statut, items } = req.body as { statut?: "en_attente" | "preparee" | "modifiee" | "refusee"; items?: Array<{ itemId: string; quantitePreparee: number }> };
  if (items) {
    await Promise.all(
      items.map((item) =>
        prisma.demandeItem.update({
          where: { id: item.itemId },
          data: { quantitePreparee: item.quantitePreparee },
        }),
      ),
    );
  }
  const updatedDemande = await prisma.demande.update({
    where: { id: demande.id },
    data: { statut: statut ?? demande.statut },
    include: { items: true },
  });

  if (statut === "preparee" || statut === "modifiee") {
    await prisma.$transaction(
      updatedDemande.items.map((item) =>
        prisma.article.update({
          where: { id: item.articleId },
          data: { quantite: { decrement: item.quantitePreparee } },
        }),
      ),
    );
  }

  res.json(updatedDemande);
});

demandesRouter.patch("/:id/cancel", allowRoles("agent"), async (req, res) => {
  if (!req.user || !req.tenantId) return res.status(400).json({ message: "Tenant requis" });
  const demande = await prisma.demande.findFirst({
    where: { id: req.params.id, etablissementId: req.tenantId, agentId: req.user.id },
  });
  if (!demande) return res.status(404).json({ message: "Demande introuvable" });
  if (demande.statut !== "en_attente") {
    return res.status(400).json({ message: "Seules les demandes en attente peuvent être annulées par l'agent" });
  }
  const updated = await prisma.demande.update({
    where: { id: demande.id },
    data: { statut: "refusee" },
    include: { items: true },
  });
  res.json(updated);
});

demandesRouter.patch("/:id/refuse", allowRoles("responsable", "admin"), async (req, res) => {
  const demande = await prisma.demande.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    include: { items: true },
  });
  if (!demande) return res.status(404).json({ message: "Demande introuvable" });
  const updated = await prisma.demande.update({
    where: { id: demande.id },
    data: { statut: "refusee" },
    include: { items: true },
  });
  res.json(updated);
});
