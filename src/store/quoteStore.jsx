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

const QuoteContext = createContext(null);

export function QuoteProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshQuotes = useCallback(async (params) => {
    setError("");
    setLoading(true);
    try {
      const data = await apiGet("/api/quotes", params);
      setQuotes(Array.isArray(data?.items) ? data.items : []);
      return data;
    } catch (e) {
      setError(String(e?.message || "No se pudieron cargar las cotizaciones."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setQuotes([]);
      setError("");
      setLoading(false);
      return;
    }
    refreshQuotes();
  }, [isAuthenticated, refreshQuotes]);

  const addQuote = useCallback(async (draft) => {
    setError("");
    const payload = {
      clientName: String(draft?.clientName || "").trim(),
      projectDesc: String(draft?.projectDesc || "").trim(),
      deliveryDays: Number(draft?.deliveryDays) || 0,
      projectPrice: Number(draft?.projectPrice) || 0,
      items: Array.isArray(draft?.items) ? draft.items : [],
    };
    const created = await apiPost("/api/quotes", payload);
    if (created && created.id) {
      setQuotes((prev) => [created, ...prev]);
    } else {
      await refreshQuotes();
    }
    return created;
  }, [refreshQuotes]);

  const updateQuote = useCallback(async (id, patch) => {
    setError("");
    const updated = await apiPatch(`/api/quotes/${id}`, patch);
    if (updated && updated.id) {
      setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
    } else {
      await refreshQuotes();
    }
    return updated;
  }, [refreshQuotes]);

  const setQuoteStatus = useCallback(async (id, status) => {
    setError("");
    const updated = await apiPatch(`/api/quotes/${id}/status`, { status });
    if (updated && updated.id) {
      setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
    } else {
      await refreshQuotes();
    }
    return updated;
  }, [refreshQuotes]);

  const setQuoteProgress = useCallback(async (id, progressPct) => {
    setError("");
    const updated = await apiPatch(`/api/quotes/${id}/progress`, { progressPct });
    if (updated && updated.id) {
      setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
    } else {
      await refreshQuotes();
    }
    return updated;
  }, [refreshQuotes]);

  const removeQuote = useCallback(async (id) => {
    setError("");
    await apiDelete(`/api/quotes/${id}`);
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    return true;
  }, []);

  const value = useMemo(() => {
    return {
      quotes,
      setQuotes,
      loading,
      error,
      refreshQuotes,
      addQuote,
      updateQuote,
      setQuoteStatus,
      setQuoteProgress,
      removeQuote,
    };
  }, [
    quotes,
    loading,
    error,
    refreshQuotes,
    addQuote,
    updateQuote,
    setQuoteStatus,
    setQuoteProgress,
    removeQuote,
  ]);

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuotes() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuotes must be used within QuoteProvider");
  return ctx;
}
