/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultWorkers } from "./defaultWorkers";

const STORAGE_KEY = "mistercheck.workers.v1";

function createId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `w-${ts}-${rand}`;
}

function readInitialWorkers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultWorkers;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultWorkers;
    return parsed;
  } catch {
    return defaultWorkers;
  }
}

function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const WorkerContext = createContext(null);

export function WorkerProvider({ children }) {
  const [workers, setWorkers] = useState(readInitialWorkers);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workers));
    } catch {
      // ignore storage write errors
    }
  }, [workers]);

  const value = useMemo(() => {
    const addWorker = (draft) => {
      const name = String(draft?.name || "").trim();
      const role = String(draft?.role || "").trim();
      if (!name) return null;

      const exists = workers.some((w) => norm(w?.name) === norm(name));
      if (exists) return null;

      const next = { id: createId(), name, role };
      setWorkers((prev) => [next, ...prev]);
      return next;
    };

    const removeWorker = (id) => {
      setWorkers((prev) => prev.filter((w) => w.id !== id));
    };

    return { workers, setWorkers, addWorker, removeWorker };
  }, [workers]);

  return <WorkerContext.Provider value={value}>{children}</WorkerContext.Provider>;
}

export function useWorkers() {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error("useWorkers must be used within WorkerProvider");
  return ctx;
}
