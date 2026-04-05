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
import { apiDelete, apiFetchFile, apiGet, apiPatch, apiPost } from "../api/http";

const QuoteContext = createContext(null);

export function QuoteProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [templates, setTemplates] = useState([]);
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
      setTemplates([]);
      setError("");
      setLoading(false);
      return;
    }
    refreshQuotes();
  }, [isAuthenticated, refreshQuotes]);

  const refreshTemplates = useCallback(async () => {
    setError("");
    try {
      const data = await apiGet("/api/quote-templates");
      setTemplates(Array.isArray(data?.items) ? data.items : []);
      return data;
    } catch (e) {
      setError(String(e?.message || "No se pudieron cargar las plantillas."));
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshTemplates();
  }, [isAuthenticated, refreshTemplates]);

  const addQuote = useCallback(async (draft) => {
    setError("");
    const created = await apiPost("/api/quotes", draft || {});
    if (created && created.id) {
      setQuotes((prev) => [created, ...prev]);
    } else {
      await refreshQuotes();
    }
    return created;
  }, [refreshQuotes]);

  const getQuote = useCallback(async (id) => {
    setError("");
    const quote = await apiGet(`/api/quotes/${id}`);
    if (quote?.id) {
      setQuotes((prev) => {
        const existing = prev.some((q) => q.id === quote.id);
        return existing ? prev.map((q) => (q.id === quote.id ? quote : q)) : [quote, ...prev];
      });
    }
    return quote;
  }, []);

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

  const createTemplate = useCallback(async (draft) => {
    setError("");
    const created = await apiPost("/api/quote-templates", draft || {});
    if (created?.id) {
      setTemplates((prev) => [created, ...prev.filter((template) => template.id !== created.id)]);
    } else {
      await refreshTemplates();
    }
    return created;
  }, [refreshTemplates]);

  const updateTemplate = useCallback(async (id, patch) => {
    setError("");
    const updated = await apiPatch(`/api/quote-templates/${id}`, patch || {});
    if (updated?.id) {
      setTemplates((prev) => prev.map((template) => (template.id === id ? updated : template)));
    } else {
      await refreshTemplates();
    }
    return updated;
  }, [refreshTemplates]);

  const downloadQuotePdf = useCallback(async (id) => {
    setError("");
    const resp = await apiFetchFile(`/api/quotes/${id}/pdf`, { method: "GET" });
    const blob = await resp.blob();
    const header = resp.headers.get("Content-Disposition") || "";
    const match = header.match(/filename="?([^";]+)"?/i);
    const filename = match?.[1] || `cotizacion-${id}.pdf`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }, []);

  const value = useMemo(() => {
    return {
      quotes,
      setQuotes,
      templates,
      setTemplates,
      loading,
      error,
      refreshQuotes,
      refreshTemplates,
      addQuote,
      getQuote,
      updateQuote,
      setQuoteStatus,
      setQuoteProgress,
      removeQuote,
      createTemplate,
      updateTemplate,
      downloadQuotePdf,
    };
  }, [
    quotes,
    templates,
    loading,
    error,
    refreshQuotes,
    refreshTemplates,
    addQuote,
    getQuote,
    updateQuote,
    setQuoteStatus,
    setQuoteProgress,
    removeQuote,
    createTemplate,
    updateTemplate,
    downloadQuotePdf,
  ]);

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuotes() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuotes must be used within QuoteProvider");
  return ctx;
}
