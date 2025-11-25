import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { allowRoles } from "../middleware/role";

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
      email: true,
      role: true,
      actif: true,
      etablissementId: true,
      createdAt: true,
    },
  });
  res.json(users);
});

usersRouter.post("/", async (req, res) => {
  const { nom, email, motDePasse, role, actif, etablissementId } = req.body as {
    nom?: string;
    email?: string;
    motDePasse?: string;
    role?: string;
    actif?: boolean;
    etablissementId?: string | null;
  };
  if (!nom || !email || !motDePasse || !role) {
    return res.status(400).json({ message: "Champs requis manquants" });
  }
  const hashedPassword = await bcrypt.hash(motDePasse, 10);
  const assignedTenant = req.tenantId ?? etablissementId ?? null;
  const user = await prisma.user.create({
    data: {
      nom,
      email,
      motDePasse: hashedPassword,
      role: role as any,
      actif: actif ?? true,
      etablissementId: assignedTenant,
    },
  });
  res.status(201).json({ id: user.id, nom: user.nom, email: user.email, role: user.role, etablissementId: user.etablissementId });
});

usersRouter.put("/:id", async (req, res) => {
  const existing = await prisma.user.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
  });
  if (!existing) return res.status(404).json({ message: "Utilisateur introuvable" });
  const data: any = { ...req.body };
  if (data.motDePasse) {
    data.motDePasse = await bcrypt.hash(data.motDePasse, 10);
  }
  const user = await prisma.user.update({
    where: { id: existing.id },
    data,
  });
  res.json({ id: user.id, nom: user.nom, email: user.email, role: user.role, actif: user.actif });
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
  await prisma.user.delete({ where: { id: existing.id } });
  res.status(204).send();
});
