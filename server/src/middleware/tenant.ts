import type { NextFunction, Request, Response } from "express";

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Utilisateur non authentifie" });
  }

  if (req.user.role === "superadmin") {
    req.tenantId = null;
    return next();
  }

  // Autoriser la consultation des etablissements pour choisir un magasin,
  // meme si l'utilisateur n'a pas encore de tenant associe.
  if (!req.user.etablissementId) {
    if (req.method === "GET" && req.path.startsWith("/etablissements")) {
      req.tenantId = null;
      return next();
    }
    return res.status(400).json({ message: "Aucun etablissement associe" });
  }

  req.tenantId = req.user.etablissementId;
  next();
}
