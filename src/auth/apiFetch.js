import { readAuth, isExpired } from "./tokenStorage";

export const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").trim() || "";

export async function apiFetch(path, options) {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const auth = readAuth();
  const token = auth && !isExpired(auth) ? String(auth.accessToken || "") : "";

  const headers = new Headers(options?.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && options?.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const resp = await fetch(url, { ...options, headers });
  return resp;
}
