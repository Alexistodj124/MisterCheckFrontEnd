import { apiFetch } from "../auth/apiFetch";

async function readJsonSafely(resp) {
  const text = await resp.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

function joinUrlSearch(path, params) {
  if (!params || typeof params !== "object") return path;
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && String(v) !== "")
    .map(([k, v]) => [k, String(v)]);
  if (entries.length === 0) return path;
  const u = new URL(path, "http://local");
  for (const [k, v] of entries) u.searchParams.set(k, v);
  const q = u.searchParams.toString();
  return q ? `${path}?${q}` : path;
}

export function withQuery(path, params) {
  return joinUrlSearch(path, params);
}

export async function apiJson(path, options) {
  const resp = await apiFetch(path, options);
  const body = await readJsonSafely(resp);
  if (resp.ok) return body;

  const msg =
    (body && body.error && typeof body.error.message === "string" && body.error.message) ||
    resp.statusText ||
    "Request failed";
  const err = new Error(msg);
  err.status = resp.status;
  err.code = body && body.error ? body.error.code : undefined;
  err.details = body && body.error ? body.error.details : undefined;
  err.body = body;
  throw err;
}

export async function apiGet(path, params) {
  return apiJson(withQuery(path, params), { method: "GET" });
}

export async function apiPost(path, payload) {
  return apiJson(path, {
    method: "POST",
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

export async function apiPatch(path, payload) {
  return apiJson(path, {
    method: "PATCH",
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

export async function apiDelete(path) {
  return apiJson(path, { method: "DELETE" });
}
