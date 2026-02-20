/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultTools } from "./defaultTools";

const STORAGE_KEY = "mistercheck.tools.v1";

function createId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `t-${ts}-${rand}`;
}

function readInitialTools() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultTools;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultTools;
    return parsed;
  } catch {
    return defaultTools;
  }
}

function clampInt(n, min) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return min;
  return Math.max(min, x);
}

function normalizeTool(draft, id) {
  const stock = clampInt(draft?.stock, 0);
  const inUse = clampInt(draft?.inUse, 0);
  return {
    id,
    name: String(draft?.name || "").trim(),
    category: String(draft?.category || "").trim(),
    stock,
    inUse: Math.min(inUse, stock),
    notes: String(draft?.notes || "").trim(),
  };
}

const ToolContext = createContext(null);

export function ToolProvider({ children }) {
  const [tools, setTools] = useState(readInitialTools);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
    } catch {
      // ignore storage write errors
    }
  }, [tools]);

  const value = useMemo(() => {
    const addTool = (draft) => {
      const next = normalizeTool(draft, createId());
      setTools((prev) => [next, ...prev]);
      return next;
    };

    const updateTool = (id, patch) => {
      setTools((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          return normalizeTool({ ...t, ...patch }, t.id);
        })
      );
    };

    return { tools, setTools, addTool, updateTool };
  }, [tools]);

  return <ToolContext.Provider value={value}>{children}</ToolContext.Provider>;
}

export function useTools() {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error("useTools must be used within ToolProvider");
  return ctx;
}
