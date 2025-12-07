import { Router } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { allowRoles } from "../middleware/role";
import { mergePermissionsUpdate, normalizePermissions } from "../permissions";

export const usersRouter = Router();

usersRouter.use(allowRoles("superadmin", "admin"));

usersRouter.get("/", async (req, res) => {
  const where = req.tenantId ? { etablissementId: req.tenantId } : undefined;
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nom: true,
      identifiant: true,
      contactEmail: true,
      role: true,
      actif: true,
      etablissementId: true,
      createdAt: true,
      permissions: true,
    },
  });
  res.json(users.map((user) => ({ ...user, permissions: normalizePermissions(user.permissions, user.role) })));
});

usersRouter.post("/", async (req, res) => {
  const { nom, identifiant, contactEmail, motDePasse, role, actif, etablissementId, permissions } = req.body as {
    nom?: string;
    identifiant?: string;
    contactEmail?: string | null;
    motDePasse?: string;
    role?: string;
    actif?: boolean;
    etablissementId?: string | null;
    permissions?: unknown;
  };
  if (!nom || !identifiant || !motDePasse || !role) {
    return res.status(400).json({ message: "Champs requis manquants" });
  }
  const hashedPassword = await bcrypt.hash(motDePasse, 10);
  const assignedTenant = req.tenantId ?? etablissementId ?? null;
  if ((role === "admin" || role === "responsable") && !assignedTenant) {
    return res.status(400).json({ message: "Un etablissement est requis pour ce role" });
  }
  let user;
  try {
    const computedPermissions = mergePermissionsUpdate(permissions as any, role as any);
    user = await prisma.user.create({
      data: {
        nom,
        identifiant,
        contactEmail: contactEmail ?? null,
        motDePasse: hashedPassword,
        role: role as any,
        actif: actif ?? true,
        etablissementId: assignedTenant,
        permissions: computedPermissions,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ message: "Identifiant deja utilise" });
    }
    throw error;
  }
  res
    .status(201)
    .json({
      id: user.id,
      nom: user.nom,
      identifiant: user.identifiant,
      contactEmail: user.contactEmail,
      role: user.role,
      etablissementId: user.etablissementId,
      permissions: normalizePermissions(user.permissions, user.role),
    });
});

usersRouter.put("/:id", async (req, res) => {
  const existing = await prisma.user.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
  });
  if (!existing) return res.status(404).json({ message: "Utilisateur introuvable" });

  const { nom, identifiant, contactEmail, role, actif, motDePasse, etablissementId, permissions } = req.body as {
    nom?: string;
    identifiant?: string;
    contactEmail?: string | null;
    role?: string;
    actif?: boolean;
    motDePasse?: string;
    etablissementId?: string | null;
    permissions?: unknown;
  };

  if (!nom || !identifiant || !role) {
    return res.status(400).json({ message: "Nom, identifiant et rôle sont obligatoires" });
  }

  const data: any = {
    nom,
    identifiant,
    contactEmail: typeof contactEmail === "undefined" ? existing.contactEmail : contactEmail ?? null,
    role,
  };

  if (typeof actif === "boolean") {
    data.actif = actif;
  }

  if (motDePasse) {
    data.motDePasse = await bcrypt.hash(motDePasse, 10);
  }

  data.permissions = mergePermissionsUpdate(permissions as any, role as any);

  if (!req.tenantId) {
    const assignedTenant = typeof etablissementId === "undefined" ? existing.etablissementId : etablissementId ?? null;
    if ((role === "admin" || role === "responsable") && !assignedTenant) {
      return res.status(400).json({ message: "Un etablissement est requis pour ce role" });
    }
    data.etablissementId = assignedTenant;
  }

  const user = await prisma.user.update({
    where: { id: existing.id },
    data,
  });

  res.json({
    id: user.id,
    nom: user.nom,
      identifiant: user.identifiant,
      contactEmail: user.contactEmail,
      role: user.role,
      actif: user.actif,
      etablissementId: user.etablissementId,
      permissions: normalizePermissions(user.permissions, user.role),
    });
});

usersRouter.patch("/:id/activation", async (req, res) => {
  const existing = await prisma.user.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
  });
  if (!existing) return res.status(404).json({ message: "Utilisateur introuvable" });
  const user = await prisma.user.update({
    where: { id: existing.id },
    data: { actif: Boolean(req.body.actif) },
  });
  res.json({ id: user.id, actif: user.actif });
});

usersRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.user.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
  });
  if (!existing) return res.status(404).json({ message: "Utilisateur introuvable" });

  const tenantFilter = req.tenantId ? { etablissementId: req.tenantId } : {};

  await prisma.$transaction(async (tx) => {
    // Sauvegarder le nom/email sur les demandes avant de détacher/supprimer (raw pour eviter les soucis de client genere)
    if (!req.tenantId) {
      await tx.$executeRawUnsafe("UPDATE demandes SET agent_nom = ?, agent_email = ? WHERE agent_id = ?", existing.nom, existing.contactEmail, existing.id);
    } else {
      await tx.$executeRawUnsafe(
        "UPDATE demandes SET agent_nom = ?, agent_email = ? WHERE agent_id = ? AND etablissement_id = ?",
        existing.nom,
        existing.contactEmail,
        existing.id,
        req.tenantId,
      );
    }

    // Supprimer les demandes en cours (en_attente, modifiee) + leurs items
    const pendingDemandes = await tx.demande.findMany({
      where: { agentId: existing.id, statut: { in: ["en_attente", "modifiee"] }, ...tenantFilter },
      select: { id: true },
    });
    const pendingIds = pendingDemandes.map((d) => d.id);
    if (pendingIds.length > 0) {
      await tx.demandeItem.deleteMany({ where: { demandeId: { in: pendingIds } } });
      await tx.demande.deleteMany({ where: { id: { in: pendingIds } } });
    }

    // Détacher les demandes historisées pour conserver la trace
    // (raw SQL pour éviter les problèmes de génération de client lors du changement de nullabilité)
    if (!req.tenantId) {
      await tx.$executeRawUnsafe("UPDATE demandes SET agent_id = NULL WHERE agent_id = ?", existing.id);
    } else {
      await tx.$executeRawUnsafe("UPDATE demandes SET agent_id = NULL WHERE agent_id = ? AND etablissement_id = ?", existing.id, req.tenantId);
    }

    // Supprimer l'utilisateur
    await tx.user.delete({ where: { id: existing.id } });
  });

  res.status(204).send();
});
