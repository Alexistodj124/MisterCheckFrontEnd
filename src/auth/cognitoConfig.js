function normDomain(d) {
  const raw = String(d || "").trim();
  if (!raw) return "";
  if (raw.startsWith("https://") || raw.startsWith("http://")) return raw.replace(/\/$/, "");
  return `https://${raw.replace(/\/$/, "")}`;
}

function normScopes(s) {
  const raw = String(s || "").trim();
  if (!raw) return "openid email profile";
  return raw.replace(/,/g, " ").split(/\s+/).filter(Boolean).join(" ");
}

export const cognitoConfig = {
  domain: normDomain(import.meta.env.VITE_COGNITO_DOMAIN),
  clientId: String(import.meta.env.VITE_COGNITO_CLIENT_ID || "").trim(),
  redirectUri: String(
    import.meta.env.VITE_COGNITO_REDIRECT_URI || `${window.location.origin}/auth/callback`
  ).trim(),
  logoutUri: String(
    import.meta.env.VITE_COGNITO_LOGOUT_URI || `${window.location.origin}/`
  ).trim(),
  scopes: normScopes(import.meta.env.VITE_COGNITO_SCOPES),
  uiLocales: String(import.meta.env.VITE_COGNITO_UI_LOCALES || "").trim(),
};
