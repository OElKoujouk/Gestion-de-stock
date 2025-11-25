import { createContext, useContext } from "react";

import type { RoleSelection } from "@/components/sections/AuthSection";

type AuthContextValue = {
  role: RoleSelection | null;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue>({ role: null, isAuthenticated: false });

export function AuthProvider({ value, children }: { value: AuthContextValue; children: React.ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
