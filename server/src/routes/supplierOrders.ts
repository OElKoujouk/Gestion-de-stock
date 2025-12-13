import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { allowRoles } from "../middleware/role";

export const supplierOrdersRouter = Router();

supplierOrdersRouter.use(allowRoles("admin", "responsable", "superadmin"));

supplierOrdersRouter.get("/", async (req, res) => {
  if (req.user?.role === "superadmin") {
    const etablissementId = req.query.etablissementId ? String(req.query.etablissementId) : undefined;
    const orders = await prisma.supplierOrder.findMany({
      where: etablissementId ? { etablissementId } : undefined,
      include: { items: true, supplier: true },
    });
    return res.json(orders);
  }
  if (!req.tenantId) return res.status(400).json({ message: "Tenant requis" });
  const orders = await prisma.supplierOrder.findMany({
    where: { etablissementId: req.tenantId },
    include: { items: true, supplier: true },
  });
  res.json(orders);
});

supplierOrdersRouter.post("/", async (req, res) => {
  const isSuperAdmin = req.user?.role === "superadmin";
  const bodyTenant = (req.body as { etablissementId?: string | null }).etablissementId ?? null;
  const tenantId = req.tenantId ?? (isSuperAdmin ? bodyTenant : null);
  if (!tenantId) return res.status(400).json({ message: "Tenant requis" });
  const { fournisseur, supplierId, items } = req.body as {
    fournisseur?: string;
    supplierId?: string | null;
    items?: Array<{ articleId: string; quantite: number }>;
  };
  if (!fournisseur && !supplierId) {
    return res.status(400).json({ message: "Fournisseur requis" });
  }
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Items requis" });
  }
  let supplierName = fournisseur?.trim() || "";
  let supplierRef: string | null = null;

  if (supplierId) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, etablissementId: tenantId },
    });
    if (!supplier) return res.status(404).json({ message: "Fournisseur introuvable" });
    supplierName = supplier.nom;
    supplierRef = supplier.id;
  }
  if (!supplierName) {
    return res.status(400).json({ message: "Nom du fournisseur requis" });
  }

  const articles = await prisma.article.findMany({
    where: { id: { in: items.map((i) => i.articleId) }, etablissementId: tenantId },
    select: { id: true },
  });
  if (articles.length !== items.length) {
    return res.status(400).json({ message: "Articles invalides pour ce magasin" });
  }

  const order = await prisma.supplierOrder.create({
    data: {
      etablissementId: tenantId,
      fournisseur: supplierName,
      supplierId: supplierRef,
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
    include: { items: true, supplier: true },
  });
  res.status(201).json(order);
});

supplierOrdersRouter.patch("/:id", async (req, res) => {
  const { items, statut } = req.body as {
    items?: Array<{ articleId: string; quantite: number }>;
    statut?: "en_cours" | "recue";
  };
  const order = await prisma.supplierOrder.findFirst({
    where: { id: req.params.id, ...(req.tenantId ? { etablissementId: req.tenantId } : {}) },
    include: { items: true, supplier: true },
  });
  if (!order) return res.status(404).json({ message: "Commande introuvable" });

  const operations: Prisma.PrismaPromise<unknown>[] = [];

  // Replace items if provided (before reception)
  if (items && Array.isArray(items) && items.length > 0) {
    operations.push(
      prisma.supplierOrderItem.deleteMany({ where: { commandeId: order.id } }),
      prisma.supplierOrderItem.createMany({
        data: items.map((item) => ({
          commandeId: order.id,
          articleId: item.articleId,
          quantite: item.quantite,
        })),
      }),
    );
  }

  if (statut) {
    operations.push(
      prisma.supplierOrder.update({
        where: { id: order.id },
        data: { statut },
      }),
    );
  }

  if (operations.length === 0) {
    return res.status(400).json({ message: "Aucune modification demandee" });
  }

  await prisma.$transaction(operations);

  const fresh = await prisma.supplierOrder.findUnique({
    where: { id: order.id },
    include: { items: true, supplier: true },
  });

  if (statut === "recue" && fresh) {
    await prisma.$transaction(
      fresh.items.map((item) =>
        prisma.article.update({
          where: { id: item.articleId },
          data: { quantite: { increment: item.quantite } },
        }),
      ),
    );
  }

  res.json(fresh);
});

supplierOrdersRouter.delete("/:id", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentification requise" });
  }

  const isSuperAdmin = req.user.role === "superadmin";

  const order = await prisma.supplierOrder.findFirst({
    where: { id: req.params.id, ...(isSuperAdmin ? {} : { etablissementId: req.tenantId }) },
  });

  if (!order) {
    return res.status(404).json({ message: "Commande introuvable" });
  }

  if (!isSuperAdmin && (!req.tenantId || order.etablissementId !== req.tenantId)) {
    return res.status(403).json({ message: "Acces refuse pour ce tenant" });
  }

  await prisma.$transaction([
    prisma.supplierOrderItem.deleteMany({ where: { commandeId: order.id } }),
    prisma.supplierOrder.delete({ where: { id: order.id } }),
  ]);

  res.status(204).send();
});
