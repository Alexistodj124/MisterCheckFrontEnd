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
import { apiDelete, apiGet, apiPost } from "../api/http";

const ProjectAssignmentContext = createContext(null);

function emitProjectAssignmentsChanged() {
  try {
    window.dispatchEvent(new CustomEvent("mistercheck:projectAssignmentsChanged"));
  } catch {
    // ignore
  }
}

export function ProjectAssignmentProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [projectAssignments, setProjectAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshProjectAssignments = useCallback(async (params) => {
    setError("");
    setLoading(true);
    try {
      const data = await apiGet("/api/project-assignments", params);
      setProjectAssignments(Array.isArray(data?.items) ? data.items : []);
      return data;
    } catch (e) {
      setError(String(e?.message || "No se pudieron cargar las asignaciones de proyecto."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setProjectAssignments([]);
      setError("");
      setLoading(false);
      return;
    }
    refreshProjectAssignments();
  }, [isAuthenticated, refreshProjectAssignments]);

  const assignWorkerToProject = useCallback(async ({ workerId, quoteId }) => {
    setError("");
    const payload = {
      workerId: String(workerId || "").trim(),
      quoteId: String(quoteId || "").trim(),
    };
    const created = await apiPost("/api/project-assignments", payload);
    if (created && created.id) {
      setProjectAssignments((prev) => {
        const idx = prev.findIndex((a) => a.workerId === created.workerId);
        if (idx === -1) return [created, ...prev];
        const next = prev.slice();
        next[idx] = created;
        return next;
      });
    } else {
      await refreshProjectAssignments();
    }
    emitProjectAssignmentsChanged();
    return created;
  }, [refreshProjectAssignments]);

  const unassignWorkerFromProject = useCallback(async (assignmentId) => {
    setError("");
    await apiDelete(`/api/project-assignments/${assignmentId}`);
    setProjectAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    emitProjectAssignmentsChanged();
  }, []);

  const value = useMemo(() => {
    return {
      projectAssignments,
      setProjectAssignments,
      loading,
      error,
      refreshProjectAssignments,
      assignWorkerToProject,
      unassignWorkerFromProject,
    };
  }, [
    projectAssignments,
    loading,
    error,
    refreshProjectAssignments,
    assignWorkerToProject,
    unassignWorkerFromProject,
  ]);

  return (
    <ProjectAssignmentContext.Provider value={value}>
      {children}
    </ProjectAssignmentContext.Provider>
  );
}

export function useProjectAssignments() {
  const ctx = useContext(ProjectAssignmentContext);
  if (!ctx) throw new Error("useProjectAssignments must be used within ProjectAssignmentProvider");
  return ctx;
}
