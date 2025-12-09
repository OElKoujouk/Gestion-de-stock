import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "./middleware/auth";
import { tenantMiddleware } from "./middleware/tenant";
import { apiRouter } from "./router";

export const app = express();

// On fait confiance au proxy Nginx pour les IP (nécessaire pour le rate limiting)
app.set("trust proxy", 1);

app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: false,
  }),
);

// Limite les tentatives de login pour freiner le bruteforce
const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", loginLimiter);

// L'ensemble des routes de l'API est monté sous /api pour correspondre au proxy Nginx.
app.use("/api", apiRouter(authMiddleware, tenantMiddleware));
