import type { NextFunction, Request, Response } from "express";
import { hasAbility } from "../permissions";

export function requireAbility(ability: Parameters<typeof hasAbility>[1]) {
  return function abilityMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.user || !hasAbility(req.user.permissions, ability)) {
      return res.status(403).json({ message: "Accès refusé pour cette action" });
    }
    next();
  };
}

