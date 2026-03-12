import { cognitoConfig } from "./cognitoConfig";
import { createPkcePair } from "./pkce";

const PKCE_KEY = "mistercheck.pkce.verifier.v1";

function qs(params) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    u.set(k, String(v));
  });
  return u.toString();
}

export async function startHostedLogin() {
  if (!cognitoConfig.domain || !cognitoConfig.clientId) {
    throw new Error("Missing Cognito config (domain/clientId)");
  }

  const { verifier, challenge } = await createPkcePair();
  sessionStorage.setItem(PKCE_KEY, verifier);

  const url = `${cognitoConfig.domain}/oauth2/authorize?${qs({
    client_id: cognitoConfig.clientId,
    response_type: "code",
    scope: cognitoConfig.scopes,
    redirect_uri: cognitoConfig.redirectUri,
    ui_locales: cognitoConfig.uiLocales || undefined,
    code_challenge: challenge,
    code_challenge_method: "S256",
  })}`;

  window.location.assign(url);
}

export async function exchangeCodeForTokens(code) {
  const verifier = sessionStorage.getItem(PKCE_KEY) || "";
  if (!verifier) throw new Error("Missing PKCE verifier (session)" );
  sessionStorage.removeItem(PKCE_KEY);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: cognitoConfig.clientId,
    code: String(code || ""),
    redirect_uri: cognitoConfig.redirectUri,
    code_verifier: verifier,
  });

  const resp = await fetch(`${cognitoConfig.domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Token exchange failed (${resp.status}): ${text}`);
  }

  return resp.json();
}

export function hostedLogout() {
  if (!cognitoConfig.domain || !cognitoConfig.clientId) {
    window.location.assign("/");
    return;
  }

  const url = `${cognitoConfig.domain}/logout?${qs({
    client_id: cognitoConfig.clientId,
    logout_uri: cognitoConfig.logoutUri,
  })}`;
  window.location.assign(url);
}
