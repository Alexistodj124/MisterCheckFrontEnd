import { useEffect, useMemo, useState } from "react";
import { useInventory } from "../store/inventoryStore";
import { useClients } from "../store/clientStore";
import { useQuotes } from "../store/quoteStore";
import "./CotizacionNueva.css";

function createRowId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `row-${ts}-${rand}`;
}

function toMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0.00";
  return x.toFixed(2);
}

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ProductPickerModal({
  open,
  products,
  categories,
  selectedCategory,
  query,
  onCategoryChange,
  onQueryChange,
  onSelect,
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="pickerOverlay" role="presentation" onClick={onClose}>
      <div
        className="pickerModal"
        role="dialog"
        aria-modal="true"
        aria-label="Buscar producto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pickerTop">
          <div>
            <div className="pickerTitle">Buscar producto</div>
            <p className="pickerSubtitle">
              Filtra por categoria, nombre o SKU para elegir mas rapido.
            </p>
          </div>

          <button type="button" className="iconBtn" onClick={onClose} aria-label="Cerrar">
            X
          </button>
        </div>

        <div className="pickerControls">
          <label className="field">
            <span className="fieldLabel">Categoria</span>
            <select
              className="fieldInput"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "Todas" : category}
                </option>
              ))}
            </select>
          </label>

          <label className="field pickerSearch">
            <span className="fieldLabel">Buscar</span>
            <input
              className="fieldInput"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Nombre, SKU o categoria"
              inputMode="search"
              autoFocus
            />
          </label>
        </div>

        <div className="pickerResults" aria-label="Resultados de productos">
          {products.length === 0 ? (
            <div className="empty pickerEmpty">
              No hay productos que coincidan con la busqueda.
            </div>
          ) : (
            products.map((product) => (
              <button
                key={product.id}
                type="button"
                className="pickerItem"
                onClick={() => onSelect(product.id)}
              >
                <div className="pickerItemMain">
                  <span className="pickerItemName">{product.name}</span>
                  <span className="pickerItemMeta">SKU: {product.sku || "-"}</span>
                </div>
                <div className="pickerItemSide">
                  <span className="pickerItemCategory">{product.category || "Sin categoria"}</span>
                  <span className="pickerItemCost">${toMoney(product.cost)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function CotizacionNueva() {
  const { products } = useInventory();
  const { clients, addClient } = useClients();
  const { addQuote } = useQuotes();

  const [clientName, setClientName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [projectPrice, setProjectPrice] = useState("0");

  const [rows, setRows] = useState([]);

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedQuote, setSavedQuote] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRowId, setPickerRowId] = useState("");
  const [pickerCategory, setPickerCategory] = useState("all");
  const [pickerQuery, setPickerQuery] = useState("");

  const productById = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = normalize(pickerQuery);
    return products
      .filter((p) => (pickerCategory === "all" ? true : p.category === pickerCategory))
      .filter((p) => {
        if (!q) return true;
        return normalize(`${p.name} ${p.sku} ${p.category}`).includes(q);
      });
  }, [products, pickerCategory, pickerQuery]);

  const totals = useMemo(() => {
    const itemsSubtotal = rows.reduce((sum, r) => {
      const p = productById.get(r.productId);
      const qty = Number(r.qty) || 0;
      const cost = Number(p?.cost) || 0;
      return sum + qty * cost;
    }, 0);

    const project = Number(projectPrice) || 0;
    const total = itemsSubtotal + project;
    return { itemsSubtotal, project, total };
  }, [rows, productById, projectPrice]);

  const openPicker = (rowId = "") => {
    setSaved(false);
    setSavedQuote(null);
    if (products.length === 0) {
      setError("No hay productos en inventario. Agrega productos primero.");
      return;
    }
    setError("");
    setPickerRowId(rowId);
    setPickerCategory("all");
    setPickerQuery("");
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setPickerRowId("");
  };

  const onSelectProduct = (productId) => {
    setSaved(false);
    setSavedQuote(null);
    if (pickerRowId) {
      setRows((prev) => prev.map((r) => (r.id === pickerRowId ? { ...r, productId } : r)));
    } else {
      setRows((prev) => [...prev, { id: createRowId(), productId, qty: 1 }]);
    }
    closePicker();
  };

  const removeRow = (id) => {
    setSaved(false);
    setSavedQuote(null);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id, patch) => {
    setSaved(false);
    setSavedQuote(null);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const onSaveClient = async () => {
    try {
      const added = await addClient(clientName);
      if (added) setClientName(added.name);
    } catch {
      // ignore
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSavedQuote(null);

    const c = clientName.trim();
    const d = projectDesc.trim();
    const days = Number(deliveryDays);
    const proj = Number(projectPrice);

    if (!c) return setError("Selecciona o escribe un cliente.");
    if (!d) return setError("Agrega una descripcion del proyecto.");
    if (!Number.isFinite(days) || days <= 0)
      return setError("Tiempo de entrega invalido (dias).");
    if (!Number.isFinite(proj) || proj < 0)
      return setError("Precio del proyecto invalido.");
    if (rows.length === 0) return setError("Agrega al menos un producto.");

    for (const r of rows) {
      const p = productById.get(r.productId);
      const qty = Number(r.qty);
      if (!p) return setError("Hay un producto invalido en la lista.");
      if (!Number.isFinite(qty) || qty <= 0)
        return setError("Todas las cantidades deben ser mayores a 0.");
    }

    const items = rows.map((r) => {
      const p = productById.get(r.productId);
      return {
        productId: r.productId,
        name: String(p?.name || ""),
        unitCost: Number(p?.cost) || 0,
        qty: Number(r.qty) || 0,
      };
    });

    try {
      const created = await addQuote({
        clientName: c,
        projectDesc: d,
        deliveryDays: days,
        projectPrice: proj,
        items,
      });
      setSavedQuote(created);
      setSaved(true);
    } catch (err) {
      setError(String(err?.message || "No se pudo crear la cotizacion."));
    }
  };

  return (
    <section className="q">
      <header className="qHeader">
        <div>
          <h1 className="qTitle">Crear cotizacion</h1>
          <p className="qSubtitle">
            Agrega productos, cantidades, tiempo de entrega (en dias) y precio del
            proyecto.
          </p>
        </div>
      </header>

      <form className="qGrid" onSubmit={onSubmit}>
        <div className="qCard">
          <div className="qCardTitle">Datos del proyecto</div>
          <div className="qCardSub">Cliente, descripcion y entrega.</div>

          <div className="clientRow">
            <label className="field clientGrow">
              <span className="fieldLabel">Cliente</span>
              <input
                className="fieldInput"
                list="client-list"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Escribe o selecciona un cliente"
              />
              <datalist id="client-list">
                {clients.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </label>

            <button type="button" className="btnGhost" onClick={onSaveClient}>
              Agregar cliente
            </button>
          </div>

          <label className="field">
            <span className="fieldLabel">Descripcion del proyecto</span>
            <textarea
              className="fieldText"
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              placeholder="Describe el alcance, materiales, notas..."
              rows={5}
            />
          </label>

          <div className="row2">
            <label className="field">
              <span className="fieldLabel">Tiempo de entrega (dias)</span>
              <input
                className="fieldInput"
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                inputMode="numeric"
                placeholder="7"
              />
            </label>

            <label className="field">
              <span className="fieldLabel">Precio del proyecto</span>
              <input
                className="fieldInput"
                value={projectPrice}
                onChange={(e) => setProjectPrice(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
              />
            </label>
          </div>

          <div className="totals">
            <div className="totLine">
              <span className="totLabel">Subtotal productos</span>
              <span className="totValue">{toMoney(totals.itemsSubtotal)}</span>
            </div>
            <div className="totLine">
              <span className="totLabel">Precio proyecto</span>
              <span className="totValue">{toMoney(totals.project)}</span>
            </div>
            <div className="totLine totStrong">
              <span className="totLabel">Total</span>
              <span className="totValue">{toMoney(totals.total)}</span>
            </div>
          </div>
        </div>

        <div className="qCard">
          <div className="qCardTop">
            <div>
              <div className="qCardTitle">Productos</div>
              <div className="qCardSub">Lista ilimitada con cantidad.</div>
            </div>

            <button type="button" className="btn" onClick={() => openPicker()}>
              Agregar producto
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="empty">
              No hay productos agregados. Presiona "Agregar producto".
            </div>
          ) : (
            <div className="list" aria-label="Lista de productos">
              <div className="listHead">
                <div>Producto</div>
                <div className="hideSm">Costo</div>
                <div>Cantidad</div>
                <div className="hideSm">Total</div>
                <div />
              </div>

              {rows.map((r) => {
                const p = productById.get(r.productId);
                const cost = Number(p?.cost) || 0;
                const qty = Number(r.qty) || 0;
                const line = cost * qty;

                return (
                  <div className="listRow" key={r.id}>
                    <div className="productCell">
                      <div className="productSummary">
                        <div className="productName">{p?.name || "Producto no disponible"}</div>
                        <div className="productMeta">
                          <span>SKU: {p?.sku || "-"}</span>
                          <span className="dot" aria-hidden="true" />
                          <span>{p?.category || "Sin categoria"}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btnGhost productPickerBtn"
                        onClick={() => openPicker(r.id)}
                      >
                        Cambiar
                      </button>
                    </div>

                    <div className="cell hideSm">{toMoney(cost)}</div>

                    <label className="field">
                      <span className="sr">Cantidad</span>
                      <input
                        className="fieldInput"
                        value={String(r.qty)}
                        onChange={(e) => updateRow(r.id, { qty: e.target.value })}
                        inputMode="numeric"
                      />
                    </label>

                    <div className="cell hideSm">{toMoney(line)}</div>

                    <button
                      type="button"
                      className="iconBtn"
                      aria-label="Quitar"
                      onClick={() => removeRow(r.id)}
                    >
                      X
                    </button>

                    <div className="onlySm rowMeta">
                      <span>Unit: {toMoney(cost)}</span>
                      <span>Total: {toMoney(line)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error ? <div className="error">{error}</div> : null}
            {saved ? (
              <div className="success">
                Cotizacion creada{savedQuote?.number ? ` (#${savedQuote.number})` : ""}. Se
                guardo en el sistema.
              </div>
            ) : null}

          <div className="actions">
            <button
              type="button"
              className="btnGhost"
              onClick={() => {
                setClientName("");
                setProjectDesc("");
                setDeliveryDays("7");
                setProjectPrice("0");
                setRows([]);
                setError("");
                setSaved(false);
                setSavedQuote(null);
                closePicker();
              }}
            >
              Limpiar
            </button>
            <button type="submit" className="btn">
              Generar cotizacion
            </button>
          </div>
        </div>
      </form>

      <ProductPickerModal
        open={pickerOpen}
        products={filteredProducts}
        categories={categories}
        selectedCategory={pickerCategory}
        query={pickerQuery}
        onCategoryChange={setPickerCategory}
        onQueryChange={setPickerQuery}
        onSelect={onSelectProduct}
        onClose={closePicker}
      />
    </section>
  );
}
