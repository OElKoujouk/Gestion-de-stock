"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { MobileNav } from "@/components/layout/MobileNav";
import { NavGroup, Sidebar } from "@/components/layout/Sidebar";
import { AuthSection } from "@/components/sections/AuthSection";
import { AdminEstablishmentSection } from "@/components/sections/AdminEstablishmentSection";
import { AgentSection } from "@/components/sections/AgentSection";
import { MovementsSection } from "@/components/sections/MovementsSection";
import { ProductsSection } from "@/components/sections/ProductsSection";
import { StoreManagerSection } from "@/components/sections/StoreManagerSection";
import { SupplierOrdersSection } from "@/components/sections/SupplierOrdersSection";
import { UsersSection } from "@/components/sections/UsersSection";
import { AuthProvider } from "@/context/auth-context";
import { api, setAccessToken } from "@/lib/api";
import {
  normalizePermissions,
  SECTION_ORDER,
  type SectionId,
  type UserPermissions,
  type AbilityKey,
  defaultPermissionsForRole,
  hasAbility as checkAbility,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { mapApiRoleToSelection, type RoleSelection } from "@/types/roles";

const NAV_ICONS: Record<SectionId, string> = {
  establishments: "🏢",
  admin: "🏠",
  responsable: "🧰",
  agent: "🧹",
  products: "📦",
  movements: "🔁",
  supplierOrders: "🚚",
  users: "👥",
  auth: "🔐",
};

const baseNavGroups: NavGroup<SectionId>[] = [
  {
    title: "Navigation",
    items: [
      { id: "establishments", label: "Etablissements", icon: NAV_ICONS.establishments },
      { id: "admin", label: "Mon etablissement", icon: NAV_ICONS.admin },
      { id: "responsable", label: "Commandes agent", icon: NAV_ICONS.responsable },
      { id: "agent", label: "Agent d'entretien", icon: NAV_ICONS.agent },
      { id: "products", label: "Produits", icon: NAV_ICONS.products },
      { id: "movements", label: "Historique / Mouvements", icon: NAV_ICONS.movements },
      { id: "supplierOrders", label: "Commandes fournisseurs", icon: NAV_ICONS.supplierOrders },
      { id: "users", label: "Utilisateurs", icon: NAV_ICONS.users },
      { id: "auth", label: "Authentification", icon: NAV_ICONS.auth },
    ],
  },
];

const publicNavGroups: NavGroup<SectionId>[] = [
  {
    title: "Connexion",
    items: [{ id: "auth", label: "Authentification", icon: NAV_ICONS.auth }],
  },
];

const TOKEN_STORAGE_KEY = "gestion-stock:token";
const ROLE_STORAGE_KEY = "gestion-stock:role";
const USER_NAME_STORAGE_KEY = "gestion-stock:user-name";
const PERMISSIONS_STORAGE_KEY = "gestion-stock:permissions";

const sectionComponents: Record<SectionId, React.ComponentType> = {
  establishments: AdminEstablishmentSection,
  admin: AdminEstablishmentSection,
  responsable: StoreManagerSection,
  agent: AgentSection,
  products: ProductsSection,
  movements: MovementsSection,
  supplierOrders: SupplierOrdersSection,
  users: UsersSection,
  auth: AuthSection,
};

function isSectionId(value: string): value is SectionId {
  return SECTION_ORDER.includes(value as SectionId);
}

function isRoleSelection(value: string | null): value is RoleSelection {
  return value === "superAdmin" || value === "admin" || value === "responsable" || value === "agent";
}

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleSelection | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("auth");
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);

  const sectionsToDisplay = useMemo(() => {
    if (isAuthenticated && currentRole) {
      const allowed =
        permissions?.allowedSections?.length ? permissions.allowedSections : defaultPermissionsForRole(currentRole).allowedSections;
      return allowed;
    }
    return ["auth"] as SectionId[];
  }, [isAuthenticated, currentRole, permissions]);

  // Section active sécurisée (évite le setState dans un effect)
  const safeActiveSection = useMemo<SectionId>(() => {
    if (sectionsToDisplay.includes(activeSection)) {
      return activeSection;
    }
    return sectionsToDisplay[0] ?? "auth";
  }, [activeSection, sectionsToDisplay]);

  const hasAbility = useCallback(
    (ability: AbilityKey) => {
      return checkAbility(permissions ?? undefined, ability);
    },
    [permissions],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    const storedRole = sessionStorage.getItem(ROLE_STORAGE_KEY);
    const initialHash = window.location.hash.replace("#", "");
    const storedName = sessionStorage.getItem(USER_NAME_STORAGE_KEY);

    if (storedToken && isRoleSelection(storedRole)) {
      setAccessToken(storedToken);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
      setCurrentRole(storedRole);
      setCurrentUserName(storedName ?? null);

      const storedPermissionsRaw = sessionStorage.getItem(PERMISSIONS_STORAGE_KEY);
      const storedPermissions = storedPermissionsRaw ? (JSON.parse(storedPermissionsRaw) as UserPermissions) : null;

      if (storedPermissions) {
        setPermissions(storedPermissions);
      }

      const allowedSections =
        storedPermissions?.allowedSections?.length
          ? storedPermissions.allowedSections
          : defaultPermissionsForRole(storedRole).allowedSections;

      setActiveSection(allowedSections[0] ?? "auth");
    } else if (isSectionId(initialHash)) {
      setActiveSection(initialHash);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleHashChange = () => {
      const newHash = window.location.hash.replace("#", "");

      if (!isAuthenticated && newHash !== "auth") {
        setActiveSection("auth");
        return;
      }

      if (!isSectionId(newHash)) {
        return;
      }

      if (isAuthenticated && !sectionsToDisplay.includes(newHash)) {
        setActiveSection(sectionsToDisplay[0] ?? "auth");
        return;
      }

      setActiveSection(newHash);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [isAuthenticated, sectionsToDisplay]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.hash = safeActiveSection;
    }
  }, [safeActiveSection]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  }, [safeActiveSection]);

  useEffect(() => {
    if (!isAuthenticated || !currentRole) return;

    api
      .me()
      .then((user) => {
        const normalized = normalizePermissions(user.permissions, mapApiRoleToSelection(user.role));
        setPermissions(normalized);
        sessionStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(normalized));
      })
      .catch(() => null);
  }, [isAuthenticated, currentRole]);

  const handleLogin = (token: string, role: RoleSelection, userName: string, userPermissions?: UserPermissions) => {
    setAccessToken(token);

    if (typeof window !== "undefined") {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      sessionStorage.setItem(ROLE_STORAGE_KEY, role);
      sessionStorage.setItem(USER_NAME_STORAGE_KEY, userName);

      if (userPermissions) {
        sessionStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(userPermissions));
      } else {
        sessionStorage.removeItem(PERMISSIONS_STORAGE_KEY);
      }
    }

    const normalizedPermissions = userPermissions ? normalizePermissions(userPermissions, role) : defaultPermissionsForRole(role);

    setPermissions(normalizedPermissions);

    const allowedSections = normalizedPermissions.allowedSections;

    setIsAuthenticated(true);
    setCurrentRole(role);
    setCurrentUserName(userName);
    setActiveSection(allowedSections[0] ?? "auth");
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(ROLE_STORAGE_KEY);
      sessionStorage.removeItem(USER_NAME_STORAGE_KEY);
      sessionStorage.removeItem(PERMISSIONS_STORAGE_KEY);
    }

    setAccessToken(null);
    setIsAuthenticated(false);
    setCurrentRole(null);
    setCurrentUserName(null);
    setPermissions(null);
    setActiveSection("auth");
  };

  const sectionList = useMemo(
    () =>
      SECTION_ORDER.map((sectionId) => ({
        id: sectionId,
        Component: sectionComponents[sectionId],
      })),
    [],
  );

  const sidebarGroups = useMemo(() => {
    if (!isAuthenticated) {
      return publicNavGroups;
    }

    if (!currentRole) {
      return baseNavGroups;
    }

    const allowed = new Set<SectionId>(
      permissions?.allowedSections?.length ? permissions.allowedSections : defaultPermissionsForRole(currentRole).allowedSections,
    );

    return baseNavGroups.map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed.has(item.id)),
    }));
  }, [isAuthenticated, currentRole, permissions]);

  const roleLabelMap: Record<RoleSelection, string> = {
    superAdmin: "Super-admin",
    admin: "Admin etablissement",
    responsable: "Responsable magasin",
    agent: "Agent",
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar groups={sidebarGroups} active={safeActiveSection} onSelect={setActiveSection} />
      <div className="flex flex-1 flex-col lg:ml-72">
        <MobileNav groups={sidebarGroups} active={safeActiveSection} onSelect={setActiveSection} />
        <AuthProvider value={{ role: currentRole, isAuthenticated, permissions, hasAbility }}>
          <main className="flex-1 space-y-5 px-4 py-6 sm:px-6 lg:px-12">
            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-emerald-100 to-emerald-200 px-4 py-4 shadow-sm shadow-emerald-200/60">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Tableau de bord</h1>
                  <p className="text-sm text-emerald-900">
                    {isAuthenticated && currentRole ? (
                      <>
                        Connecte en tant que <span className="font-semibold">{roleLabelMap[currentRole]}</span>
                        {currentUserName ? ` · ${currentUserName}` : ""}
                      </>
                    ) : (
                      "Connexion requise pour accéder aux sections"
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-xs text-slate-800">
                  <span className="rounded-full bg-emerald-200 px-3 py-1 font-semibold text-emerald-900">
                    {sidebarGroups.flatMap((g) => g.items).find((i) => i.id === safeActiveSection)?.label ?? "Authentification"}
                  </span>
                  {isAuthenticated && currentRole ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 font-semibold text-emerald-900 hover:bg-white"
                    >
                      Se deconnecter
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {sectionList
              .filter(({ id }) => sectionsToDisplay.includes(id))
              .map(({ id, Component }) => (
                <section
                  key={id}
                  id={id}
                  className={cn("space-y-6 transition-opacity duration-200", safeActiveSection !== id && "hidden")}
                >
                  {id === "auth" ? <AuthSection onAuthenticated={handleLogin} /> : <Component />}
                </section>
              ))}
          </main>
        </AuthProvider>
      </div>
    </div>
  );
}
