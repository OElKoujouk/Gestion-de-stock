import type { Role as PrismaRole } from "@prisma/client";

export type Role = PrismaRole;

export type RequestUser = {
  id: string;
  role: Role;
  etablissementId: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      tenantId?: string | null;
    }
  }
}
