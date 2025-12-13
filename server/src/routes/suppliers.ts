import { Router } from "express";
import { prisma } from "../prisma";
import { allowRoles } from "../middleware/role";

export const suppliersRouter = Router();

suppliersRouter.use(allowRoles("admin", "responsable", "superadmin"));

suppliersRouter.get("/", async (req, res) => {
  const etablissementId =
    req.user?.role === "superadmin"
      ? req.query.etablissementId
        ? String(req.query.etablissementId)
        : null
      : req.tenantId;

  if (!etablissementId) return res.status(400).json({ message: "Tenant requis" });

  const suppliers = await prisma.supplier.findMany({
    where: { etablissementId },
    orderBy: { nom: "asc" },
  });
  res.json(suppliers);
});

suppliersRouter.post("/", async (req, res) => {
  if (!req.tenantId) return res.status(400).json({ message: "Tenant requis" });
  const { nom, adresse } = req.body as { nom?: string; adresse?: string | null };
  if (!nom) return res.status(400).json({ message: "Nom requis" });
  const supplier = await prisma.supplier.create({
    data: {
      nom: nom.trim(),
      adresse: adresse?.trim() || null,
      etablissementId: req.tenantId,
    },
  });
  res.status(201).json(supplier);
});

suppliersRouter.put("/:id", async (req, res) => {
  if (!req.tenantId) return res.status(400).json({ message: "Tenant requis" });
  const { nom, adresse } = req.body as { nom?: string; adresse?: string | null };
  if (!nom) return res.status(400).json({ message: "Nom requis" });
  const existing = await prisma.supplier.findFirst({
    where: { id: req.params.id, etablissementId: req.tenantId },
  });
  if (!existing) return res.status(404).json({ message: "Fournisseur introuvable" });
  const updated = await prisma.supplier.update({
    where: { id: req.params.id },
    data: { nom: nom.trim(), adresse: adresse?.trim() ?? null },
  });
  res.json(updated);
});

suppliersRouter.delete("/:id", async (req, res) => {
  if (!req.tenantId) return res.status(400).json({ message: "Tenant requis" });
  const existing = await prisma.supplier.findFirst({
    where: { id: req.params.id, etablissementId: req.tenantId },
  });
  if (!existing) return res.status(404).json({ message: "Fournisseur introuvable" });
  await prisma.supplier.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
