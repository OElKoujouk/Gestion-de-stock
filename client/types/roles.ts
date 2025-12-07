export type RoleSelection = "superAdmin" | "admin" | "responsable" | "agent";

export function mapApiRoleToSelection(role: string): RoleSelection {
  const roleMap: Record<string, RoleSelection> = {
    superadmin: "superAdmin",
    superAdmin: "superAdmin",
    admin: "admin",
    responsable: "responsable",
    agent: "agent",
  };
  return roleMap[role] ?? "admin";
}

