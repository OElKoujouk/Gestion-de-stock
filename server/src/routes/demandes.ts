import { Router } from "express";
import type { Prisma } from "@prisma/client";

import { prisma } from "../prisma";
import { allowRoles } from "../middleware/role";

export const demandesRouter = Router();

const buildAgentInitials = (nom?: string | null) => {
  const raw = (nom ?? "").trim();
  if (!raw) return "AG";
  const parts = raw.split(/[\s-]+/).filter(Boolean);
  const initials = parts.map((part) => part[0]).join("");
  const fallback = raw.slice(0, 2);
  return (initials || fallback || "AG").toUpperCase().slice(0, 3).padEnd(2, "X");
};

const buildReference = (nom: string | null | undefined, sequence: number) => {
  const initials = buildAgentInitials(nom);
  const seq = sequence.toString().padStart(2, "0");
  return `CMD-${initials}-${seq}`;
};

const createDemandeWithReference = async (
  agent: { id: string; nom: string | null; contactEmail: string | null },
  tenantId: string,
  items: Array<{ articleId: string; quantite: number }>,
) => {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const demande = await prisma.$transaction(async (tx) => {
        const updatedAgent = await tx.user.update({
          where: { id: agent.id },
          data: { demandeSequence: { increment: 1 } },
          select: { demandeSequence: true },
        });

        const reference = buildReference(agent.nom, updatedAgent.demandeSequence);

        return tx.demande.create({
          data: {
            etablissementId: tenantId,
            agentId: agent.id,
            agentNom: agent.nom,
            agentEmail: agent.contactEmail,
            statut: "en_attente",
            reference,
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
      });

      return demande;
    } catch (error) {
      lastError = error;
      const isUniqueError =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        (error.meta?.target as string[]).includes("reference");
      if (isUniqueError) {
        // Retry with the next sequence value
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("Impossible de generer une reference unique pour la demande");
};

demandesRouter.post("/", allowRoles("agent", "responsable", "admin"), async (req, res) => {
  if (!req.tenantId || !req.user) return res.status(400).json({ message: "Tenant requis" });
  const { items } = req.body as { items?: Array<{ articleId: string; quantite: number }> };
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Une demande doit contenir au moins un article" });
  }

  const agent = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, nom: true, contactEmail: true, etablissementId: true },
  });
  if (!agent) {
    return res.status(401).json({ message: "Utilisateur introuvable" });
  }
  if (agent.etablissementId !== req.tenantId) {
    return res.status(403).json({ message: "Utilisateur non rattache a cet etablissement" });
  }

  try {
    const demande = await createDemandeWithReference(
      { id: agent.id, nom: agent.nom ?? null, contactEmail: agent.contactEmail ?? null },
      req.tenantId,
      items,
    );
    res.status(201).json(demande);
  } catch (error) {
    return res.status(500).json({ message: "Generation de reference impossible" });
  }
});

demandesRouter.get("/", allowRoles("superadmin", "agent", "responsable", "admin"), async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Utilisateur non authentifié" });
  const where: Prisma.DemandeWhereInput = {};

  if (req.user.role === "superadmin") {
    if (typeof req.query.etablissementId === "string" && req.query.etablissementId.length > 0) {
      where.etablissementId = req.query.etablissementId;
    }
  } else {
    if (!req.tenantId) {
      return res.status(400).json({ message: "Tenant requis" });
    }
    where.etablissementId = req.tenantId;
    if (req.user.role === "agent") {
      where.agentId = req.user.id;
    }
  }

  const demandes = await prisma.demande.findMany({
    where,
    include: {
      items: true,
      agent: { select: { id: true, nom: true, contactEmail: true } },
      validatedBy: { select: { id: true, nom: true } },
      etablissement: { select: { id: true, nom: true } },
    },
  });
  res.json(demandes);
});

demandesRouter.get("/:id", allowRoles("superadmin", "agent", "responsable", "admin"), async (req, res) => {
  const demande = await prisma.demande.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    include: {
      items: true,
      agent: { select: { id: true, nom: true, contactEmail: true } },
      validatedBy: { select: { id: true, nom: true } },
      etablissement: { select: { id: true, nom: true } },
    },
  });
  if (!demande) return res.status(404).json({ message: "Demande introuvable" });
  res.json(demande);
});

demandesRouter.get("/toutes", allowRoles("responsable", "admin"), async (req, res) => {
  if (!req.tenantId) return res.status(400).json({ message: "Tenant requis" });
  const demandes = await prisma.demande.findMany({
    where: { etablissementId: req.tenantId },
    include: {
      items: true,
      agent: { select: { id: true, nom: true, contactEmail: true } },
      validatedBy: { select: { id: true, nom: true } },
      etablissement: { select: { id: true, nom: true } },
    },
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
  const updateData: Prisma.DemandeUpdateInput = { statut: statut ?? demande.statut };
  if (statut === "preparee" || statut === "modifiee" || statut === "refusee") {
    updateData.validatedById = req.user?.id ?? null;
    const validator = req.user?.id
      ? await prisma.user.findUnique({ where: { id: req.user.id }, select: { nom: true } })
      : null;
    updateData.validatedByNom = validator?.nom ?? null;
  }

  const updatedDemande = await prisma.demande.update({
    where: { id: demande.id },
    data: updateData,
    include: { items: true, validatedBy: { select: { id: true, nom: true } } },
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
