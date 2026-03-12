/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";
import { clearAuth, isExpired, readAuth, writeAuth } from "./tokenStorage";
import { decodeJwtPayload } from "./jwt";
import { hostedLogout, startHostedLogin } from "./cognitoClient";

const AuthContext = createContext(null);

function normalizeAuth(raw) {
  if (!raw || typeof raw !== "object") return null;
  const accessToken = typeof raw.accessToken === "string" ? raw.accessToken : "";
  const idToken = typeof raw.idToken === "string" ? raw.idToken : "";
  const refreshToken = typeof raw.refreshToken === "string" ? raw.refreshToken : "";
  const expiresAt = Number(raw.expiresAt || 0);
  if (!accessToken || !Number.isFinite(expiresAt) || expiresAt <= 0) return null;
  const idPayload = idToken ? decodeJwtPayload(idToken) : null;
  return {
    accessToken,
    idToken,
    refreshToken,
    expiresAt,
    email: typeof idPayload?.email === "string" ? idPayload.email : "",
  };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => normalizeAuth(readAuth()));

  const value = useMemo(() => {
    const isAuthenticated = auth && !isExpired(auth);

    const login = async () => {
      await startHostedLogin();
    };

    const setTokensFromCognito = (tokenResponse) => {
      const accessToken = String(tokenResponse?.access_token || "");
      const idToken = String(tokenResponse?.id_token || "");
      const refreshToken = String(tokenResponse?.refresh_token || "");
      const expiresIn = Number(tokenResponse?.expires_in || 0);
      if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
        throw new Error("Invalid token response");
      }
      const expiresAt = Date.now() + expiresIn * 1000;
      const next = normalizeAuth({ accessToken, idToken, refreshToken, expiresAt });
      setAuth(next);
      writeAuth(next);
      return next;
    };

    const logout = () => {
      clearAuth();
      setAuth(null);
      hostedLogout();
    };

    const getAccessToken = () => {
      if (!auth || isExpired(auth)) return "";
      return auth.accessToken;
    };

    return { auth, isAuthenticated, login, logout, setTokensFromCognito, getAccessToken };
  }, [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
