import type { RequestHandler } from "express";
import { Router } from "express";
import { authRouter } from "./routes/auth";
import { establishmentsRouter } from "./routes/establishments";
import { articlesRouter } from "./routes/articles";
import { categoriesRouter } from "./routes/categories";
import { movementsRouter } from "./routes/movements";
import { usersRouter } from "./routes/users";
import { demandesRouter } from "./routes/demandes";
import { supplierOrdersRouter } from "./routes/supplierOrders";

export function apiRouter(authMiddleware: RequestHandler, tenantMiddleware: RequestHandler) {
  const router = Router();

  router.use("/auth", authRouter);

  router.use(authMiddleware);
  router.use(tenantMiddleware);

  router.use("/etablissements", establishmentsRouter);
  router.use("/articles", articlesRouter);
  router.use("/categories", categoriesRouter);
  router.use("/mouvements", movementsRouter);
  router.use("/users", usersRouter);
  router.use("/demandes", demandesRouter);
  router.use("/fournisseurs/commandes", supplierOrdersRouter);

  return router;
}
