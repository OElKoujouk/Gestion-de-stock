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

app.use(apiRouter(authMiddleware, tenantMiddleware));
