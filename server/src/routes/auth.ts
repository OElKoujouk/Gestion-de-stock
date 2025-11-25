import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { authMiddleware } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-token";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.motDePasse))) {
    return res.status(401).json({ message: "Identifiants invalides" });
  }
  if (!user.actif) {
    return res.status(403).json({ message: "Compte désactivé" });
  }
  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      etablissementId: user.etablissementId,
    },
    JWT_SECRET,
    { expiresIn: "2h" },
  );
  res.json({
    token,
    user: {
      id: user.id,
      role: user.role,
      etablissement_id: user.etablissementId,
      nom: user.nom,
      email: user.email,
    },
  });
});

authRouter.post("/logout", (_req, res) => {
  res.json({ message: "Déconnexion réalisée côté client (token à supprimer)" });
});

authRouter.get("/me", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      nom: true,
      email: true,
      role: true,
      etablissementId: true,
    },
  });
  if (!user) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }
  res.json(user);
});
