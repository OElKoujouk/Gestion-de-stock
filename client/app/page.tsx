"use client";

import { useEffect, useMemo, useState } from "react";

import { MobileNav } from "@/components/layout/MobileNav";
import { NavGroup, Sidebar } from "@/components/layout/Sidebar";
import { AuthSection, type RoleSelection } from "@/components/sections/AuthSection";
import { AdminEstablishmentSection } from "@/components/sections/AdminEstablishmentSection";
import { AgentSection } from "@/components/sections/AgentSection";
import { InternalOrdersSection } from "@/components/sections/InternalOrdersSection";
import { MovementsSection } from "@/components/sections/MovementsSection";
import { ProductsSection } from "@/components/sections/ProductsSection";
import { StatsSection } from "@/components/sections/StatsSection";
import { SuperAdminSection } from "@/components/sections/SuperAdminSection";
import { StoreManagerSection } from "@/components/sections/StoreManagerSection";
import { SupplierOrdersSection } from "@/components/sections/SupplierOrdersSection";
import { UsersSection } from "@/components/sections/UsersSection";
import { AuthProvider } from "@/context/auth-context";
import { setAccessToken } from "@/lib/api";
import { cn } from "@/lib/utils";

const SECTION_ORDER = [
  "superAdmin",
  "admin",
  "responsable",
  "agent",
  "products",
  "movements",
  "internalOrders",
  "supplierOrders",
  "users",
  "stats",
  "auth",
] as const;

type SectionId = (typeof SECTION_ORDER)[number];

const baseNavGroups: NavGroup<SectionId>[] = [
  {
    title: "Roles utilisateurs",
    items: [
      { id: "superAdmin", label: "Super-Admin", icon: "🛡️" },
      { id: "admin", label: "Mon établissement", icon: "🏢" },
      { id: "responsable", label: "Responsable magasin", icon: "🧰" },
      { id: "agent", label: "Agent d'entretien", icon: "🧹" },
    ],
  },
  {
    title: "Operations metiers",
    items: [
      { id: "products", label: "Produits", icon: "📦" },
      { id: "movements", label: "Mouvements", icon: "🔁" },
      { id: "internalOrders", label: "Commandes internes", icon: "🧾" },
      { id: "supplierOrders", label: "Commandes fournisseurs", icon: "🚚" },
      { id: "users", label: "Utilisateurs", icon: "👥" },
      { id: "stats", label: "Statistiques", icon: "📊" },
      { id: "auth", label: "Authentification", icon: "🔐" },
    ],
  },
];

const publicNavGroups: NavGroup<SectionId>[] = [
  {
    title: "Connexion",
    items: [{ id: "auth", label: "Authentification", icon: "🔐" }],
  },
];

const TOKEN_STORAGE_KEY = "gestion-stock:token";
const ROLE_STORAGE_KEY = "gestion-stock:role";

const sectionComponents: Record<SectionId, React.ComponentType> = {
  superAdmin: SuperAdminSection,
  admin: AdminEstablishmentSection,
  responsable: StoreManagerSection,
  agent: AgentSection,
  products: ProductsSection,
  movements: MovementsSection,
  internalOrders: InternalOrdersSection,
  supplierOrders: SupplierOrdersSection,
  users: UsersSection,
  stats: StatsSection,
  auth: AuthSection,
};

function isSectionId(value: string): value is SectionId {
  return SECTION_ORDER.includes(value as SectionId);
}

function isRoleSelection(value: string | null): value is RoleSelection {
  return value === "superAdmin" || value === "admin" || value === "responsable" || value === "agent";
}

const ROLE_SECTIONS: Record<RoleSelection, SectionId[]> = {
  superAdmin: ["superAdmin", "products", "movements", "internalOrders", "supplierOrders", "users", "stats"],
  admin: ["admin", "products", "movements", "internalOrders", "supplierOrders", "users", "stats"],
  responsable: ["responsable", "products", "movements", "internalOrders", "stats"],
  agent: ["agent", "internalOrders"],
};

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleSelection | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("auth");

  const sectionsToDisplay = useMemo(() => {
    if (isAuthenticated && currentRole) {
      return ROLE_SECTIONS[currentRole] ?? ["auth"];
    }
    return ["auth"] as SectionId[];
  }, [isAuthenticated, currentRole]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    const storedRole = sessionStorage.getItem(ROLE_STORAGE_KEY);
    if (storedToken && isRoleSelection(storedRole)) {
      setAccessToken(storedToken);
      setIsAuthenticated(true);
      setCurrentRole(storedRole);
      const allowedSections = ROLE_SECTIONS[storedRole] ?? ["auth"];
      setActiveSection(allowedSections[0]);
    } else {
      const initialHash = window.location.hash.replace("#", "");
      if (isSectionId(initialHash)) {
        setActiveSection(initialHash);
      }
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
        setActiveSection(sectionsToDisplay[0]);
        return;
      }
      setActiveSection(newHash);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [isAuthenticated, sectionsToDisplay]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.hash = activeSection;
    }
  }, [activeSection]);

  const handleLogin = (token: string, role: RoleSelection) => {
    setAccessToken(token);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      sessionStorage.setItem(ROLE_STORAGE_KEY, role);
    }
    const allowedSections = ROLE_SECTIONS[role] ?? ["auth"];
    setIsAuthenticated(true);
    setCurrentRole(role);
    setActiveSection(allowedSections[0]);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(ROLE_STORAGE_KEY);
    }
    setAccessToken(null);
    setIsAuthenticated(false);
    setCurrentRole(null);
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
    const allowed = new Set<SectionId>(ROLE_SECTIONS[currentRole] ?? ["auth"]);
    return baseNavGroups.map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed.has(item.id)),
    }));
  }, [isAuthenticated, currentRole]);

  const roleLabelMap: Record<RoleSelection, string> = {
    superAdmin: "Super-Admin",
    admin: "Admin établissement",
    responsable: "Responsable magasin",
    agent: "Agent",
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar groups={sidebarGroups} active={activeSection} onSelect={setActiveSection} />
      <div className="flex flex-1 flex-col lg:ml-64">
        <MobileNav groups={sidebarGroups} active={activeSection} onSelect={setActiveSection} />
        <AuthProvider value={{ role: currentRole, isAuthenticated }}>
          <main className="flex-1 space-y-10 px-4 py-6 sm:px-6 lg:px-10">
            {isAuthenticated && currentRole ? (
              <div className="flex flex-wrap items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <p>
                  Connecté en tant que <span className="font-semibold text-slate-900">{roleLabelMap[currentRole]}</span>
                </p>
                <button type="button" onClick={handleLogout} className="text-sm font-semibold text-slate-900">
                  Se déconnecter
                </button>
              </div>
            ) : null}
            {sectionList
              .filter(({ id }) => sectionsToDisplay.includes(id))
              .map(({ id, Component }) => (
                <section
                  key={id}
                  id={id}
                  className={cn("space-y-6 transition-opacity duration-200", activeSection !== id && "hidden")}
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
