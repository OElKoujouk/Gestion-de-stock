"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = apiRouter;
const express_1 = require("express");
const auth_1 = require("./routes/auth");
const establishments_1 = require("./routes/establishments");
const articles_1 = require("./routes/articles");
const categories_1 = require("./routes/categories");
const movements_1 = require("./routes/movements");
const users_1 = require("./routes/users");
const demandes_1 = require("./routes/demandes");
const supplierOrders_1 = require("./routes/supplierOrders");
function apiRouter(authMiddleware, tenantMiddleware) {
    const router = (0, express_1.Router)();
    router.use("/auth", auth_1.authRouter);
    router.use(authMiddleware);
    router.use(tenantMiddleware);
    router.use("/etablissements", establishments_1.establishmentsRouter);
    router.use("/articles", articles_1.articlesRouter);
    router.use("/categories", categories_1.categoriesRouter);
    router.use("/mouvements", movements_1.movementsRouter);
    router.use("/users", users_1.usersRouter);
    router.use("/demandes", demandes_1.demandesRouter);
    router.use("/fournisseurs/commandes", supplierOrders_1.supplierOrdersRouter);
    return router;
}
