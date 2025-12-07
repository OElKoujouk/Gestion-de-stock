import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/auth";
import { tenantMiddleware } from "./middleware/tenant";
import { apiRouter } from "./router";

export const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: false,
  }),
);

// L'ensemble des routes de l'API est monté sous /api pour correspondre au proxy Nginx.
app.use("/api", apiRouter(authMiddleware, tenantMiddleware));
