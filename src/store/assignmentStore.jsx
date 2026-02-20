/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "mistercheck.assignments.v1";

function createId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `a-${ts}-${rand}`;
}

function readInitialAssignments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function clampInt(n, min) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return min;
  return Math.max(min, x);
}

const AssignmentContext = createContext(null);

export function AssignmentProvider({ children }) {
  const [assignments, setAssignments] = useState(readInitialAssignments);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
    } catch {
      // ignore storage write errors
    }
  }, [assignments]);

  const value = useMemo(() => {
    const assignTool = ({ workerId, toolId, qty }) => {
      const w = String(workerId || "").trim();
      const t = String(toolId || "").trim();
      const q = clampInt(qty, 1);
      if (!w || !t) return null;

      const nowIso = new Date().toISOString();
      let created = null;

      setAssignments((prev) => {
        const idx = prev.findIndex((a) => a.workerId === w && a.toolId === t);
        if (idx === -1) {
          created = { id: createId(), workerId: w, toolId: t, qty: q, assignedAt: nowIso };
          return [created, ...prev];
        }

        const next = prev.slice();
        const cur = next[idx];
        next[idx] = {
          ...cur,
          qty: clampInt((Number(cur?.qty) || 0) + q, 1),
          assignedAt: nowIso,
        };
        created = next[idx];
        return next;
      });

      return created;
    };

    const unassignTool = ({ workerId, toolId, qty }) => {
      const w = String(workerId || "").trim();
      const t = String(toolId || "").trim();
      const q = clampInt(qty, 1);
      if (!w || !t) return;

      setAssignments((prev) => {
        const idx = prev.findIndex((a) => a.workerId === w && a.toolId === t);
        if (idx === -1) return prev;
        const cur = prev[idx];
        const nextQty = (Number(cur?.qty) || 0) - q;
        if (nextQty <= 0) return prev.filter((a) => a.id !== cur.id);
        const next = prev.slice();
        next[idx] = { ...cur, qty: nextQty };
        return next;
      });
    };

    const removeToolFromWorker = ({ workerId, toolId }) => {
      const w = String(workerId || "").trim();
      const t = String(toolId || "").trim();
      if (!w || !t) return;
      setAssignments((prev) => prev.filter((a) => !(a.workerId === w && a.toolId === t)));
    };

    return {
      assignments,
      setAssignments,
      assignTool,
      unassignTool,
      removeToolFromWorker,
    };
  }, [assignments]);

  return (
    <AssignmentContext.Provider value={value}>{children}</AssignmentContext.Provider>
  );
}

export function useAssignments() {
  const ctx = useContext(AssignmentContext);
  if (!ctx)
    throw new Error("useAssignments must be used within AssignmentProvider");
  return ctx;
}
