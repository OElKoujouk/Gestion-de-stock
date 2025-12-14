"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../prisma");
const permissions_1 = require("../permissions");
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-token";
async function authMiddleware(req, res, next) {
    const authorization = req.header("authorization");
    if (!authorization) {
        return res.status(401).json({ message: "Token requis" });
    }
    const [scheme, token] = authorization.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
        return res.status(401).json({ message: "Format de token invalide" });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const dbUser = await prisma_1.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, role: true, etablissementId: true, permissions: true, domaine: true },
        });
        if (!dbUser) {
            return res.status(401).json({ message: "Utilisateur introuvable" });
        }
        const user = {
            id: dbUser.id,
            role: dbUser.role,
            etablissementId: dbUser.etablissementId,
            permissions: (0, permissions_1.normalizePermissions)(dbUser.permissions, dbUser.role),
            domaine: dbUser.domaine,
        };
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Token invalide" });
    }
}
