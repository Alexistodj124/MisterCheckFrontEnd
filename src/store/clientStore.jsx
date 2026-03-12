/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../auth/AuthProvider";
import { apiDelete, apiGet, apiPatch, apiPost } from "../api/http";

const ClientContext = createContext(null);

export function ClientProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshClients = useCallback(async (params) => {
    setError("");
    setLoading(true);
    try {
      const data = await apiGet("/api/clients", params);
      setClients(Array.isArray(data?.items) ? data.items : []);
      return data;
    } catch (e) {
      setError(String(e?.message || "No se pudieron cargar los clientes."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setClients([]);
      setError("");
      setLoading(false);
      return;
    }
    refreshClients();
  }, [isAuthenticated, refreshClients]);

  const addClient = useCallback(async (name) => {
    setError("");
    const n = String(name || "").trim();
    if (!n) return null;

    try {
      const created = await apiPost("/api/clients", { name: n });
      if (created && created.id) {
        setClients((prev) => [created, ...prev]);
      } else {
        await refreshClients();
      }
      return created;
    } catch (e) {
      if (Number(e?.status) === 409) {
        const data = await apiGet("/api/clients", { query: n });
        const items = Array.isArray(data?.items) ? data.items : [];
        const existing = items.find(
          (c) => String(c?.name || "").toLowerCase() === n.toLowerCase()
        );
        await refreshClients();
        return existing || null;
      }
      setError(String(e?.message || "No se pudo crear el cliente."));
      return null;
    }
  }, [refreshClients]);

  const updateClient = useCallback(async (id, patch) => {
    setError("");
    const updated = await apiPatch(`/api/clients/${id}`, patch);
    if (updated && updated.id) {
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } else {
      await refreshClients();
    }
    return updated;
  }, [refreshClients]);

  const removeClient = useCallback(async (id) => {
    setError("");
    await apiDelete(`/api/clients/${id}`);
    setClients((prev) => prev.filter((c) => c.id !== id));
    return true;
  }, []);

  const value = useMemo(() => {
    return {
      clients,
      setClients,
      loading,
      error,
      refreshClients,
      addClient,
      updateClient,
      removeClient,
    };
  }, [clients, loading, error, refreshClients, addClient, updateClient, removeClient]);

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useClients() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useClients must be used within ClientProvider");
  return ctx;
}
