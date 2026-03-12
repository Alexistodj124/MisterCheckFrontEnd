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
import { apiGet, apiPost } from "../api/http";

const AssignmentContext = createContext(null);

function emitAssignmentsChanged() {
  try {
    window.dispatchEvent(new CustomEvent("mistercheck:assignmentsChanged"));
  } catch {
    // ignore
  }
}

export function AssignmentProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshAssignments = useCallback(async (params) => {
    setError("");
    setLoading(true);
    try {
      const data = await apiGet("/api/assignments", params);
      setAssignments(Array.isArray(data?.items) ? data.items : []);
      return data;
    } catch (e) {
      setError(String(e?.message || "No se pudieron cargar las asignaciones."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setAssignments([]);
      setError("");
      setLoading(false);
      return;
    }
    refreshAssignments();
  }, [isAuthenticated, refreshAssignments]);

  const assignTool = useCallback(async ({ workerId, toolId, qty }) => {
    setError("");
    const payload = {
      workerId: String(workerId || "").trim(),
      toolId: String(toolId || "").trim(),
      qty: Math.floor(Number(qty) || 1),
    };
    const created = await apiPost("/api/assignments", payload);
    if (created && created.id) {
      setAssignments((prev) => {
        const idx = prev.findIndex(
          (a) => a.workerId === created.workerId && a.toolId === created.toolId
        );
        if (idx === -1) return [created, ...prev];
        const next = prev.slice();
        next[idx] = created;
        return next;
      });
    } else {
      await refreshAssignments();
    }
    emitAssignmentsChanged();
    return created;
  }, [refreshAssignments]);

  const unassignTool = useCallback(async ({ workerId, toolId, qty }) => {
    setError("");
    const payload = {
      workerId: String(workerId || "").trim(),
      toolId: String(toolId || "").trim(),
      qty: Math.floor(Number(qty) || 1),
    };
    const data = await apiPost("/api/assignments/return", payload);
    const item = data && data.item ? data.item : null;

    setAssignments((prev) => {
      const idx = prev.findIndex(
        (a) => a.workerId === payload.workerId && a.toolId === payload.toolId
      );
      if (!item) {
        if (idx === -1) return prev;
        return prev.filter((a) => !(a.workerId === payload.workerId && a.toolId === payload.toolId));
      }
      if (idx === -1) return [item, ...prev];
      const next = prev.slice();
      next[idx] = item;
      return next;
    });

    emitAssignmentsChanged();
    return item;
  }, []);

  const value = useMemo(() => {
    return {
      assignments,
      setAssignments,
      loading,
      error,
      refreshAssignments,
      assignTool,
      unassignTool,
    };
  }, [assignments, loading, error, refreshAssignments, assignTool, unassignTool]);

  return <AssignmentContext.Provider value={value}>{children}</AssignmentContext.Provider>;
}

export function useAssignments() {
  const ctx = useContext(AssignmentContext);
  if (!ctx) throw new Error("useAssignments must be used within AssignmentProvider");
  return ctx;
}
