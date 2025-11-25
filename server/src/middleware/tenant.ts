import type { NextFunction, Request, Response } from "express";

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Utilisateur non authentifié" });
  }

  if (req.user.role === "superadmin") {
    req.tenantId = null;
    return next();
  }

  if (!req.user.etablissementId) {
    return res.status(400).json({ message: "Aucun établissement associé" });
  }

  req.tenantId = req.user.etablissementId;
  next();
}
