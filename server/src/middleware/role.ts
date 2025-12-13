import type { NextFunction, Request, Response } from "express";
import type { Role } from "../types";

export function allowRoles(...allowed: Role[]) {
  return function roleGuard(req: Request, res: Response, next: NextFunction) {
    if (!req.user) return res.status(403).json({ message: "Accès refusé" });
    if (req.user.role === "superadmin") return next();
    if (!allowed.includes(req.user.role)) return res.status(403).json({ message: "Accès refusé" });
    next();
  };
}
