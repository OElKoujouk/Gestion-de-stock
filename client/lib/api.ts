import type { UserPermissions } from "@/lib/permissions";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then((data) => data.message ?? response.statusText)
      .catch(() => response.statusText);
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  login: (payload: { email: string; password: string }) =>
    request<{
      token: string;
      user: { id: string; role: string; etablissement_id: string | null; nom: string; permissions: UserPermissions };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () =>
    request<{ id: string; nom: string; email: string; role: string; etablissementId: string | null; permissions: UserPermissions }>(
      "/auth/me",
    ),
  stats: () => request("/articles"),
  getArticles: (params?: { etablissementId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.etablissementId) {
      searchParams.set("etablissementId", params.etablissementId);
    }
    const query = searchParams.toString();
    return request<
      Array<{
        id: string;
        nom: string;
        quantite: number;
        referenceFournisseur: string | null;
        seuilAlerte: number;
        categorieId?: string | null;
        etablissementId: string;
      }>
    >(`/articles${query ? `?${query}` : ""}`);
  },
  createArticle: (payload: {
    nom: string;
    categorieId?: string | null;
    quantite: number;
    referenceFournisseur: string;
    seuilAlerte: number;
    description?: string | null;
    conditionnement?: string | null;
    etablissementId?: string;
  }) =>
    request<{ id: string; nom: string; quantite: number; referenceFournisseur: string; seuilAlerte: number }>("/articles", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteArticle: (id: string) =>
    request<void>(`/articles/${id}`, {
      method: "DELETE",
    }),
  adjustArticleStock: (id: string, variation: number) =>
    request<{ id: string; nom: string; quantite: number; referenceFournisseur: string; seuilAlerte: number }>(`/articles/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ variation }),
    }),
  updateArticle: (
    id: string,
    payload: Partial<{
      nom: string;
      categorieId: string | null;
      quantite: number;
      referenceFournisseur: string | null;
      seuilAlerte: number;
      description?: string | null;
      conditionnement?: string | null;
    }>,
  ) =>
    request<{
      id: string;
      nom: string;
      quantite: number;
      referenceFournisseur: string | null;
      seuilAlerte: number;
      categorieId: string | null;
      etablissementId: string;
    }>(`/articles/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getCategories: (params?: { etablissementId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.etablissementId) {
      searchParams.set("etablissementId", params.etablissementId);
    }
    const query = searchParams.toString();
    return request<Array<{ id: string; nom: string }>>(`/categories${query ? `?${query}` : ""}`);
  },
  createCategory: (payload: { nom: string; etablissementId?: string }) =>
    request<{ id: string; nom: string }>("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCategory: (id: string, payload: { nom: string }) =>
    request<{ id: string; nom: string }>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteCategory: (id: string) =>
    request<void>(`/categories/${id}`, {
      method: "DELETE",
    }),
  getDemandes: (params?: { etablissementId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.etablissementId) {
      searchParams.set("etablissementId", params.etablissementId);
    }
    const query = searchParams.toString();
    return request<
      Array<{
        id: string;
        statut: "en_attente" | "preparee" | "modifiee" | "refusee";
        items: Array<{ id: string; articleId: string; quantiteDemandee: number; quantitePreparee: number }>;
        agent?: { id: string; nom: string; contactEmail?: string | null };
        createdAt?: string;
        updatedAt?: string;
      }>
    >(`/demandes${query ? `?${query}` : ""}`);
  },
  createDemande: (payload: { items: Array<{ articleId: string; quantite: number }> }) =>
    request<{ id: string }>(`/demandes`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  cancelDemande: (id: string) =>
    request(`/demandes/${id}/cancel`, {
      method: "PATCH",
    }),
  refuseDemande: (id: string) =>
    request(`/demandes/${id}/refuse`, {
      method: "PATCH",
    }),
  updateDemande: (
    id: string,
    payload: {
      statut?: "en_attente" | "preparee" | "modifiee" | "refusee";
      items?: Array<{ itemId: string; quantitePreparee: number }>;
    },
  ) =>
    request(`/demandes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getEstablishments: () =>
    request<Array<{ id: string; nom: string; createdAt: string; adresse: string | null; codePostal: string | null; ville: string | null }>>(
      "/etablissements",
    ),
  createEstablishment: (payload: { nom: string; adresse?: string | null; codePostal?: string | null; ville?: string | null }) =>
    request<{ id: string; nom: string; createdAt: string; adresse: string | null; codePostal: string | null; ville: string | null }>(
      "/etablissements",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  updateEstablishment: (id: string, payload: { nom: string; adresse?: string | null; codePostal?: string | null; ville?: string | null }) =>
    request<{ id: string; nom: string; createdAt: string; adresse: string | null; codePostal: string | null; ville: string | null }>(
      `/etablissements/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    ),
  deleteEstablishment: (id: string) =>
    request<void>(`/etablissements/${id}`, {
      method: "DELETE",
    }),
  getUsers: () =>
    request<
      Array<{
        id: string;
        nom: string;
        identifiant: string;
        contactEmail?: string | null;
        role: string;
        etablissementId: string | null;
        actif: boolean;
        permissions: UserPermissions;
      }>
    >("/users"),
  createUser: (payload: {
    nom: string;
    identifiant: string;
    contactEmail?: string | null;
    motDePasse: string;
    role: string;
    etablissementId?: string | null;
    permissions?: UserPermissions;
  }) =>
    request<{
      id: string;
      nom: string;
      identifiant: string;
      contactEmail?: string | null;
      role: string;
      etablissementId: string | null;
      permissions: UserPermissions;
    }>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateUser: (
    id: string,
    payload: {
      nom: string;
      identifiant: string;
      contactEmail?: string | null;
      role: string;
      actif: boolean;
      etablissementId?: string | null;
      permissions?: UserPermissions;
    },
  ) =>
    request<{
      id: string;
      nom: string;
      identifiant: string;
      contactEmail?: string | null;
      role: string;
      etablissementId: string | null;
      actif: boolean;
      permissions: UserPermissions;
    }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  createSupplierOrder: (payload: { fournisseur: string; items: Array<{ articleId: string; quantite: number }> }) =>
    request<{
      id: string;
      fournisseur: string;
      statut: string;
      etablissementId: string;
      supplierId?: string | null;
      supplier?: { id: string; nom: string; adresse: string | null };
      items: Array<{ id: string; articleId: string; quantite: number }>;
    }>("/fournisseurs/commandes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getSupplierOrders: () =>
    request<
      Array<{
        id: string;
      fournisseur: string;
      statut: "en_cours" | "recue";
      createdAt?: string;
      updatedAt?: string;
      supplierId?: string | null;
      supplier?: { id: string; nom: string; adresse: string | null };
      items: Array<{ id: string; articleId: string; quantite: number }>;
    }>
    >("/fournisseurs/commandes"),
  updateSupplierOrder: (id: string, payload: { statut?: "en_cours" | "recue"; items?: Array<{ articleId: string; quantite: number }> }) =>
    request<{
      id: string;
      fournisseur: string;
      statut: "en_cours" | "recue";
      supplierId?: string | null;
      supplier?: { id: string; nom: string; adresse: string | null };
      items: Array<{ id: string; articleId: string; quantite: number }>;
    }>(`/fournisseurs/commandes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getSuppliers: () =>
    request<Array<{ id: string; nom: string; adresse: string | null }>>("/fournisseurs"),
  createSupplier: (payload: { nom: string; adresse?: string | null }) =>
    request<{ id: string; nom: string; adresse: string | null }>("/fournisseurs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateSupplier: (id: string, payload: { nom: string; adresse?: string | null }) =>
    request<{ id: string; nom: string; adresse: string | null }>(`/fournisseurs/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: string) =>
    request<void>(`/users/${id}`, {
      method: "DELETE",
    }),
};
