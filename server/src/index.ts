import "dotenv/config";
import { app } from "./app";
import { ensureSuperAdmin } from "./bootstrap";

const PORT = process.env.PORT || 4000;

ensureSuperAdmin()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API multi-tenant démarrée sur http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Impossible d'initialiser le super-admin", error);
    process.exit(1);
  });
