import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultClients } from "./defaultClients";

const STORAGE_KEY = "mistercheck.clients.v1";

function readInitialClients() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultClients;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultClients;
    return parsed;
  } catch {
    return defaultClients;
  }
}

function createId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `c-${ts}-${rand}`;
}

const ClientContext = createContext(null);

export function ClientProvider({ children }) {
  const [clients, setClients] = useState(readInitialClients);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    } catch {
      // ignore storage write errors
    }
  }, [clients]);

  const value = useMemo(() => {
    const addClient = (name) => {
      const n = String(name || "").trim();
      if (!n) return null;

      const exists = clients.some(
        (c) => String(c.name || "").toLowerCase() === n.toLowerCase()
      );
      if (exists) return null;

      const next = { id: createId(), name: n };
      setClients((prev) => [next, ...prev]);
      return next;
    };

    return { clients, setClients, addClient };
  }, [clients]);

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useClients() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useClients must be used within ClientProvider");
  return ctx;
}
