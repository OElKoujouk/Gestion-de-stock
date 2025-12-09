"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("./middleware/auth");
const tenant_1 = require("./middleware/tenant");
const router_1 = require("./router");
exports.app = (0, express_1.default)();
// On fait confiance au proxy Nginx pour les IP (nécessaire pour le rate limiting)
exports.app.set("trust proxy", 1);
exports.app.use(express_1.default.json());
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: false,
}));
// Limite les tentatives de login pour freiner le bruteforce
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60_000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
});
exports.app.use("/api/auth/login", loginLimiter);
// L'ensemble des routes de l'API est monté sous /api pour correspondre au proxy Nginx.
exports.app.use("/api", (0, router_1.apiRouter)(auth_1.authMiddleware, tenant_1.tenantMiddleware));
