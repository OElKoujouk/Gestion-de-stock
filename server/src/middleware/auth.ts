import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import type { RequestUser } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-token";

type JwtPayload = {
  sub: string;
  role: Role;
  etablissementId: string | null;
};

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  if (!authorization) {
    return res.status(401).json({ message: "Token requis" });
  }
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({ message: "Format de token invalide" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user: RequestUser = {
      id: payload.sub,
      role: payload.role,
      etablissementId: payload.etablissementId,
    };
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide" });
  }
}
