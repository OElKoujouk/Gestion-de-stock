import { Router } from "express";
import { prisma } from "../prisma";
import { allowRoles } from "../middleware/role";

export const supplierOrdersRouter = Router();

supplierOrdersRouter.use(allowRoles("admin", "responsable"));

supplierOrdersRouter.get("/", async (req, res) => {
  if (!req.tenantId) return res.status(400).json({ message: "Tenant requis" });
  const orders = await prisma.supplierOrder.findMany({
    where: { etablissementId: req.tenantId },
    include: { items: true },
  });
  res.json(orders);
});

supplierOrdersRouter.post("/", async (req, res) => {
  if (!req.tenantId) return res.status(400).json({ message: "Tenant requis" });
  const { fournisseur, items } = req.body as { fournisseur?: string; items?: Array<{ articleId: string; quantite: number }> };
  if (!fournisseur || !items || items.length === 0) {
    return res.status(400).json({ message: "Fournisseur et items requis" });
  }
  const order = await prisma.supplierOrder.create({
    data: {
      etablissementId: req.tenantId,
      fournisseur,
      statut: "en_cours",
      items: {
        createMany: {
          data: items.map((item) => ({
            articleId: item.articleId,
            quantite: item.quantite,
          })),
        },
      },
    },
    include: { items: true },
  });
  res.status(201).json(order);
});

supplierOrdersRouter.patch("/:id", async (req, res) => {
  const order = await prisma.supplierOrder.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    include: { items: true },
  });
  if (!order) return res.status(404).json({ message: "Commande introuvable" });
  const { statut } = req.body as { statut: "en_cours" | "recue" };
  const updated = await prisma.supplierOrder.update({
    where: { id: order.id },
    data: { statut },
    include: { items: true },
  });
  if (statut === "recue") {
    await prisma.$transaction(
      updated.items.map((item) =>
        prisma.article.update({
          where: { id: item.articleId },
          data: { quantite: { increment: item.quantite } },
        }),
      ),
    );
  }
  res.json(updated);
});
