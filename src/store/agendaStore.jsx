import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultAgendaEvents } from "./defaultAgenda";

const STORAGE_KEY = "mistercheck.agenda.v1";

function readInitialEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAgendaEvents;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultAgendaEvents;
    return parsed;
  } catch {
    return defaultAgendaEvents;
  }
}

function createId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `e-${ts}-${rand}`;
}

const AgendaContext = createContext(null);

export function AgendaProvider({ children }) {
  const [events, setEvents] = useState(readInitialEvents);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // ignore storage write errors
    }
  }, [events]);

  const value = useMemo(() => {
    const addEvent = (draft) => {
      const next = {
        id: createId(),
        title: String(draft?.title || "").trim(),
        weekday: Number(draft?.weekday) || 0,
        start: String(draft?.start || "09:00").trim(),
        end: String(draft?.end || "10:00").trim(),
        tone: String(draft?.tone || "blue").trim(),
      };
      setEvents((prev) => [next, ...prev]);
      return next;
    };

    return { events, setEvents, addEvent };
  }, [events]);

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
}

export function useAgenda() {
  const ctx = useContext(AgendaContext);
  if (!ctx) throw new Error("useAgenda must be used within AgendaProvider");
  return ctx;
}
