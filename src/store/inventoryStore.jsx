import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultProducts } from "./defaultProducts";

const STORAGE_KEY = "mistercheck.inventory.v1";

function readInitialProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProducts;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultProducts;
    return parsed;
  } catch {
    return defaultProducts;
  }
}

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const [products, setProducts] = useState(readInitialProducts);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch {
      // ignore storage write errors
    }
  }, [products]);

  const value = useMemo(() => {
    const updateProduct = (id, patch) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    };

    return { products, setProducts, updateProduct };
  }, [products]);

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
