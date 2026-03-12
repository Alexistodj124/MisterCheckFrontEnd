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

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshProducts = useCallback(async (params) => {
    setError("");
    setLoading(true);
    try {
      const data = await apiGet("/api/products", params);
      setProducts(Array.isArray(data?.items) ? data.items : []);
      return data;
    } catch (e) {
      setError(String(e?.message || "No se pudieron cargar los productos."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setProducts([]);
      setError("");
      setLoading(false);
      return;
    }
    refreshProducts();
  }, [isAuthenticated, refreshProducts]);

  const addProduct = useCallback(async (draft) => {
    setError("");
    const payload = {
      name: String(draft?.name || "").trim(),
      sku: String(draft?.sku || "").trim(),
      category: String(draft?.category || "").trim(),
      cost: Number(draft?.cost) || 0,
      stock: Math.floor(Number(draft?.stock) || 0),
      imageDataUrl: typeof draft?.imageDataUrl === "string" ? draft.imageDataUrl : "",
      notes: String(draft?.notes || "").trim(),
    };

    const created = await apiPost("/api/products", payload);
    if (created && created.id) {
      setProducts((prev) => [created, ...prev]);
    } else {
      await refreshProducts();
    }
    return created;
  }, [refreshProducts]);

  const updateProduct = useCallback(async (id, patch) => {
    setError("");
    const payload = { ...patch };
    const updated = await apiPatch(`/api/products/${id}`, payload);
    if (updated && updated.id) {
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } else {
      await refreshProducts();
    }
    return updated;
  }, [refreshProducts]);

  const removeProduct = useCallback(async (id) => {
    setError("");
    await apiDelete(`/api/products/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    return true;
  }, []);

  const value = useMemo(() => {
    return {
      products,
      setProducts,
      loading,
      error,
      refreshProducts,
      addProduct,
      updateProduct,
      removeProduct,
    };
  }, [products, loading, error, refreshProducts, addProduct, updateProduct, removeProduct]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
