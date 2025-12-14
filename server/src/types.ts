import type { Role as PrismaRole } from "@prisma/client";
import type { UserPermissions } from "./permissions";

export type Role = PrismaRole;

export type RequestUser = {
  id: string;
  role: Role;
  etablissementId: string | null;
  permissions: UserPermissions;
  domaine?: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      tenantId?: string | null;
    }
  }
}
