"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-token";
function authMiddleware(req, res, next) {
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
        const user = {
            id: payload.sub,
            role: payload.role,
            etablissementId: payload.etablissementId,
        };
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Token invalide" });
    }
}
