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
  getEstablishments: () => request<Array<{ id: string; nom: string; createdAt: string }>>("/etablissements"),
  createEstablishment: (payload: { nom: string }) =>
    request<{ id: string; nom: string; createdAt: string }>("/etablissements", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getUsers: () =>
    request<Array<{ id: string; nom: string; email: string; role: string; etablissementId: string | null; actif: boolean }>>("/users"),
  createUser: (payload: { nom: string; email: string; motDePasse: string; role: string; etablissementId?: string | null }) =>
    request<{ id: string; nom: string; email: string; role: string; etablissementId: string | null }>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
