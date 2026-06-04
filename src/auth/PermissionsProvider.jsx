/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthProvider";
import { apiGet } from "../api/http";

const PermissionsContext = createContext(null);

/**
 * Loads the current user's effective permissions from GET /api/me and exposes
 * helpers to gate UI. The backend is always the source of truth (returns 403);
 * this is only to hide/show controls so the app looks clean per role.
 *
 * A permission list containing "*" means full access (master role).
 */
export function PermissionsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      setPermissions([]);
      setGroups([]);
      setLoaded(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    apiGet("/api/me")
      .then((data) => {
        if (cancelled) return;
        setPermissions(Array.isArray(data?.permissions) ? data.permissions : []);
        setGroups(Array.isArray(data?.groups) ? data.groups : []);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        // Fail closed: if we cannot determine permissions, grant nothing.
        setPermissions([]);
        setGroups([]);
        setLoaded(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const isMaster = useMemo(() => permissions.includes("*"), [permissions]);

  const can = useCallback(
    (perm) => {
      if (!perm) return true;
      if (permissions.includes("*")) return true;
      return permissions.includes(perm);
    },
    [permissions]
  );

  const canAny = useCallback(
    (perms) => {
      if (!Array.isArray(perms) || perms.length === 0) return true;
      if (permissions.includes("*")) return true;
      return perms.some((p) => permissions.includes(p));
    },
    [permissions]
  );

  const value = useMemo(
    () => ({ permissions, groups, loading, loaded, isMaster, can, canAny }),
    [permissions, groups, loading, loaded, isMaster, can, canAny]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissions must be used within PermissionsProvider");
  }
  return ctx;
}
