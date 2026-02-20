/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultQuotes } from "./defaultQuotes";

const STORAGE_KEY = "mistercheck.quotes.v1";

function createId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `q-${ts}-${rand}`;
}

function readInitialQuotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultQuotes;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultQuotes;
    return parsed;
  } catch {
    return defaultQuotes;
  }
}

const QuoteContext = createContext(null);

export function QuoteProvider({ children }) {
  const [quotes, setQuotes] = useState(readInitialQuotes);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
    } catch {
      // ignore storage write errors
    }
  }, [quotes]);

  const value = useMemo(() => {
    const addQuote = (draft) => {
      let created = null;

      setQuotes((prev) => {
        const maxNumber = prev.reduce(
          (max, q) => (Number(q?.number) > max ? Number(q.number) : max),
          1000
        );

        created = {
          id: createId(),
          number: maxNumber + 1,
          status: "pendiente",
          clientName: String(draft?.clientName || "").trim(),
          projectDesc: String(draft?.projectDesc || "").trim(),
          deliveryDays: Number(draft?.deliveryDays) || 0,
          projectPrice: Number(draft?.projectPrice) || 0,
          createdAt: new Date().toISOString(),
          items: Array.isArray(draft?.items)
            ? draft.items.map((it) => ({
                productId: String(it?.productId || ""),
                name: String(it?.name || "").trim(),
                unitCost: Number(it?.unitCost) || 0,
                qty: Number(it?.qty) || 0,
              }))
            : [],
        };

        return [created, ...prev];
      });

      return created;
    };

    const updateQuote = (id, patch) => {
      setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    };

    const setQuoteStatus = (id, status) => {
      const next = String(status || "");
      const nowIso = new Date().toISOString();

      setQuotes((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q;
          if (q.status === next) return q;

          const patch = { status: next };
          if (next === "en_curso") {
            if (!q.startedAt) patch.startedAt = nowIso;
            if (typeof q.progressPct !== "number") patch.progressPct = 0;
            if (!q.progressUpdatedAt) patch.progressUpdatedAt = nowIso;
          }
          if (next === "completada") {
            if (!q.completedAt) patch.completedAt = nowIso;
            patch.progressPct = 100;
            patch.progressUpdatedAt = nowIso;
          }
          return { ...q, ...patch };
        })
      );
    };

    const removeQuote = (id) => {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    };

    return { quotes, setQuotes, addQuote, updateQuote, setQuoteStatus, removeQuote };
  }, [quotes]);

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuotes() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuotes must be used within QuoteProvider");
  return ctx;
}
