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

const ToolContext = createContext(null);

export function ToolProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshTools = useCallback(async (params) => {
    setError("");
    setLoading(true);
    try {
      const data = await apiGet("/api/tools", params);
      setTools(Array.isArray(data?.items) ? data.items : []);
      return data;
    } catch (e) {
      setError(String(e?.message || "No se pudieron cargar las herramientas."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setTools([]);
      setError("");
      setLoading(false);
      return;
    }
    refreshTools();
  }, [isAuthenticated, refreshTools]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const onAssignmentsChange = () => {
      refreshTools();
    };
    window.addEventListener("mistercheck:assignmentsChanged", onAssignmentsChange);
    return () => window.removeEventListener("mistercheck:assignmentsChanged", onAssignmentsChange);
  }, [isAuthenticated, refreshTools]);

  const addTool = useCallback(async (draft) => {
    setError("");
    const payload = {
      name: String(draft?.name || "").trim(),
      category: String(draft?.category || "").trim(),
      stock: Math.floor(Number(draft?.stock) || 0),
      notes: String(draft?.notes || "").trim(),
    };
    const created = await apiPost("/api/tools", payload);
    if (created && created.id) {
      setTools((prev) => [created, ...prev]);
    } else {
      await refreshTools();
    }
    return created;
  }, [refreshTools]);

  const updateTool = useCallback(async (id, patch) => {
    setError("");
    const payload = { ...patch };
    delete payload.inUse;
    delete payload.available;
    const updated = await apiPatch(`/api/tools/${id}`, payload);
    if (updated && updated.id) {
      setTools((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } else {
      await refreshTools();
    }
    return updated;
  }, [refreshTools]);

  const removeTool = useCallback(async (id) => {
    setError("");
    await apiDelete(`/api/tools/${id}`);
    setTools((prev) => prev.filter((t) => t.id !== id));
    return true;
  }, []);

  const value = useMemo(() => {
    return {
      tools,
      setTools,
      loading,
      error,
      refreshTools,
      addTool,
      updateTool,
      removeTool,
    };
  }, [tools, loading, error, refreshTools, addTool, updateTool, removeTool]);

  return <ToolContext.Provider value={value}>{children}</ToolContext.Provider>;
}

export function useTools() {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error("useTools must be used within ToolProvider");
  return ctx;
}
