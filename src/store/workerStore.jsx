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

const WorkerContext = createContext(null);

export function WorkerProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshWorkers = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiGet("/api/workers");
      setWorkers(Array.isArray(data?.items) ? data.items : []);
      return data;
    } catch (e) {
      setError(String(e?.message || "No se pudieron cargar los trabajadores."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setWorkers([]);
      setError("");
      setLoading(false);
      return;
    }
    refreshWorkers();
  }, [isAuthenticated, refreshWorkers]);

  const addWorker = useCallback(async (draft) => {
    setError("");
    const name = String(draft?.name || "").trim();
    const role = String(draft?.role || "").trim();
    if (!name) return null;

    try {
      const created = await apiPost("/api/workers", { name, role });
      if (created && created.id) {
        setWorkers((prev) => [created, ...prev]);
        return created;
      }
      await refreshWorkers();
      return created;
    } catch (e) {
      if (Number(e?.status) === 409) return null;
      setError(String(e?.message || "No se pudo crear el trabajador."));
      return null;
    }
  }, [refreshWorkers]);

  const updateWorker = useCallback(async (id, patch) => {
    setError("");
    const updated = await apiPatch(`/api/workers/${id}`, patch);
    if (updated && updated.id) {
      setWorkers((prev) => prev.map((w) => (w.id === id ? updated : w)));
    } else {
      await refreshWorkers();
    }
    return updated;
  }, [refreshWorkers]);

  const removeWorker = useCallback(async (id) => {
    setError("");
    await apiDelete(`/api/workers/${id}`);
    setWorkers((prev) => prev.filter((w) => w.id !== id));
    return true;
  }, []);

  const value = useMemo(() => {
    return {
      workers,
      setWorkers,
      loading,
      error,
      refreshWorkers,
      addWorker,
      updateWorker,
      removeWorker,
    };
  }, [workers, loading, error, refreshWorkers, addWorker, updateWorker, removeWorker]);

  return <WorkerContext.Provider value={value}>{children}</WorkerContext.Provider>;
}

export function useWorkers() {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error("useWorkers must be used within WorkerProvider");
  return ctx;
}
