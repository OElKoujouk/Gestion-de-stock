import { createContext, useContext } from "react";

import type { AbilityKey, UserPermissions } from "@/lib/permissions";
import type { RoleSelection } from "@/types/roles";

type AuthContextValue = {
  role: RoleSelection | null;
  isAuthenticated: boolean;
  permissions: UserPermissions | null;
  hasAbility: (ability: AbilityKey) => boolean;
};

const AuthContext = createContext<AuthContextValue>({
  role: null,
  isAuthenticated: false,
  permissions: null,
  hasAbility: () => false,
});

export function AuthProvider({ value, children }: { value: AuthContextValue; children: React.ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
