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

const AgendaContext = createContext(null);

export function AgendaProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshEvents = useCallback(async (params) => {
    setError("");
    setLoading(true);
    try {
      const data = await apiGet("/api/agenda/events", params);
      setEvents(Array.isArray(data?.items) ? data.items : []);
      return data;
    } catch (e) {
      setError(String(e?.message || "No se pudieron cargar los eventos."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setEvents([]);
      setError("");
      setLoading(false);
      return;
    }
    refreshEvents();
  }, [isAuthenticated, refreshEvents]);

  const addEvent = useCallback(async (draft) => {
    setError("");
    const title = String(draft?.title || "").trim();
    const kind = String(draft?.kind || "dated").trim() || "dated";
    const payload = {
      title,
      kind,
      weekday: draft?.weekday,
      date: typeof draft?.date === "string" ? draft.date.trim() : "",
      start: String(draft?.start || "09:00").trim(),
      end: String(draft?.end || "10:00").trim(),
      tone: String(draft?.tone || "").trim(),
      workerId: typeof draft?.workerId === "string" ? draft.workerId.trim() : "",
      category: typeof draft?.category === "string" ? draft.category.trim() : "general",
    };
    const created = await apiPost("/api/agenda/events", payload);
    if (created && created.id) {
      setEvents((prev) => [created, ...prev]);
    } else {
      await refreshEvents();
    }
    return created;
  }, [refreshEvents]);

  const updateEvent = useCallback(async (id, patch) => {
    setError("");
    const updated = await apiPatch(`/api/agenda/events/${id}`, patch);
    if (updated && updated.id) {
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } else {
      await refreshEvents();
    }
    return updated;
  }, [refreshEvents]);

  const removeEvent = useCallback(async (id) => {
    setError("");
    await apiDelete(`/api/agenda/events/${id}`);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    return true;
  }, []);

  const value = useMemo(() => {
    return {
      events,
      setEvents,
      loading,
      error,
      refreshEvents,
      addEvent,
      updateEvent,
      removeEvent,
    };
  }, [events, loading, error, refreshEvents, addEvent, updateEvent, removeEvent]);

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
}

export function useAgenda() {
  const ctx = useContext(AgendaContext);
  if (!ctx) throw new Error("useAgenda must be used within AgendaProvider");
  return ctx;
}
