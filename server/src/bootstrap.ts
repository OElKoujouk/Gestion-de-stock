import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SUPER_ADMIN_EMAIL = "admin-s";
const SUPER_ADMIN_PASSWORD = "admin";

export async function ensureSuperAdmin() {
  const existing = await prisma.user.findUnique({ where: { identifiant: SUPER_ADMIN_EMAIL } });
  if (existing) {
    if (!existing.permissions) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          permissions: {
            allowedSections: ["establishments", "responsable", "products", "movements", "supplierOrders", "users"],
            abilities: {
              manageCategories: true,
              manageProducts: true,
              manageSupplierOrders: true,
              manageMovements: true,
            },
          },
        },
      });
    }
    return;
  }

  const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

  await prisma.user.create({
    data: {
      nom: "Super Admin",
      identifiant: SUPER_ADMIN_EMAIL,
      contactEmail: "admin-s@example.com",
      motDePasse: hashedPassword,
      role: "superadmin",
      actif: true,
      etablissementId: null,
      permissions: {
        allowedSections: ["establishments", "responsable", "products", "movements", "supplierOrders", "users"],
        abilities: {
          manageCategories: true,
          manageProducts: true,
          manageSupplierOrders: true,
          manageMovements: true,
        },
      },
    },
  });

  console.log("Super-admin par défaut créé (identifiant: admin-s / mdp: admin)");
}
