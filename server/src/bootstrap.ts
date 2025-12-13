import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { defaultPermissionsForRole, normalizePermissions } from "./permissions";

const SUPER_ADMIN_EMAIL = "admin-s";
const SUPER_ADMIN_PASSWORD = "admin";

const isBcryptHash = (value: string) => value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");

async function normalizeUserPasswords() {
  const users = await prisma.user.findMany({
    select: { id: true, motDePasse: true, identifiant: true },
  });
  let updated = 0;
  for (const user of users) {
    if (!isBcryptHash(user.motDePasse)) {
      const hashedPassword = await bcrypt.hash(user.motDePasse, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { motDePasse: hashedPassword },
      });
      updated += 1;
    }
  }
  if (updated > 0) {
    console.log(`Mots de passe normalis\u00e9s (hash\u00e9s) pour ${updated} utilisateur(s).`);
  }
}

export async function ensureSuperAdmin() {
  await normalizeUserPasswords();

  const existing = await prisma.user.findUnique({ where: { identifiant: SUPER_ADMIN_EMAIL } });
  if (existing) {
    const normalizedPermissions = normalizePermissions(existing.permissions, "superadmin");
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        permissions: normalizedPermissions,
      },
    });
    if (!isBcryptHash(existing.motDePasse)) {
      const hashedPassword = await bcrypt.hash(existing.motDePasse || SUPER_ADMIN_PASSWORD, 10);
      await prisma.user.update({
        where: { id: existing.id },
        data: { motDePasse: hashedPassword },
      });
      console.log("Mot de passe du super-admin normalis\u00e9 (hash\u00e9).");
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
      permissions: defaultPermissionsForRole("superadmin"),
    },
  });

  console.log("Super-admin par défaut créé (identifiant: admin-s / mdp: admin)");
}
