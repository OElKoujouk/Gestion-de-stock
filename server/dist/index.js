"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const bootstrap_1 = require("./bootstrap");
const PORT = process.env.PORT || 4000;
(0, bootstrap_1.ensureSuperAdmin)()
    .then(() => {
    app_1.app.listen(PORT, () => {
        console.log(`API multi-tenant démarrée sur http://localhost:${PORT}`);
    });
})
    .catch((error) => {
    console.error("Impossible d'initialiser le super-admin", error);
    process.exit(1);
});
