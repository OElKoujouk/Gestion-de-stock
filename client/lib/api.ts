const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
    request<{ token: string; user: { id: string; role: string; etablissement_id: string | null } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => request<{ id: string; nom: string; email: string; role: string; etablissementId: string | null }>("/auth/me"),
  stats: () => request("/articles"),
  getArticles: (params?: { etablissementId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.etablissementId) {
      searchParams.set("etablissementId", params.etablissementId);
    }
    const query = searchParams.toString();
    return request<Array<{ id: string; nom: string; quantite: number; referenceFournisseur: string; seuilAlerte: number }>>(
      `/articles${query ? `?${query}` : ""}`,
    );
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
    request<Array<{ id: string; nom: string; email: string; role: string; etablissementId: string | null; actif: boolean }>>("/users"),
  createUser: (payload: { nom: string; email: string; motDePasse: string; role: string; etablissementId?: string | null }) =>
    request<{ id: string; nom: string; email: string; role: string; etablissementId: string | null }>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateUser: (id: string, payload: { nom: string; email: string; role: string; actif: boolean; etablissementId?: string | null }) =>
    request<{ id: string; nom: string; email: string; role: string; etablissementId: string | null; actif: boolean }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: string) =>
    request<void>(`/users/${id}`, {
      method: "DELETE",
    }),
};
