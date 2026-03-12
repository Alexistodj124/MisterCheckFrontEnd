const KEY = "mistercheck.auth.v1";

export function readAuth() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeAuth(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function isExpired(auth) {
  const exp = Number(auth?.expiresAt || 0);
  if (!Number.isFinite(exp) || exp <= 0) return true;
  return Date.now() >= exp - 30_000;
}
