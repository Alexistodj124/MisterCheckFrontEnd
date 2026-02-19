import { useMemo, useState } from "react";
import { useInventory } from "../store/inventoryStore";
import { useClients } from "../store/clientStore";
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

export default function CotizacionNueva() {
  const { products } = useInventory();
  const { clients, addClient } = useClients();

  const [clientName, setClientName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [projectPrice, setProjectPrice] = useState("0");

  const [rows, setRows] = useState(() => {
    const first = products[0]?.id || "";
    return first
      ? [{ id: createRowId(), productId: first, qty: 1 }]
      : [];
  });

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const productById = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

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

  const addRow = () => {
    setSaved(false);
    if (products.length === 0) {
      setError("No hay productos en inventario. Agrega productos primero.");
      return;
    }
    setRows((prev) => [
      ...prev,
      { id: createRowId(), productId: products[0].id, qty: 1 },
    ]);
  };

  const removeRow = (id) => {
    setSaved(false);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id, patch) => {
    setSaved(false);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const onSaveClient = () => {
    const added = addClient(clientName);
    if (added) setClientName(added.name);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);

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

    setSaved(true);
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

            <button type="button" className="btn" onClick={addRow}>
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
                    <label className="field">
                      <span className="sr">Producto</span>
                      <select
                        className="fieldInput"
                        value={r.productId}
                        onChange={(e) => updateRow(r.id, { productId: e.target.value })}
                      >
                        {products.map((p2) => (
                          <option key={p2.id} value={p2.id}>
                            {p2.name}
                          </option>
                        ))}
                      </select>
                    </label>

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
              Cotizacion lista. (Por ahora no se guarda en BDD.)
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
                const first = products[0]?.id || "";
                setRows(first ? [{ id: createRowId(), productId: first, qty: 1 }] : []);
                setError("");
                setSaved(false);
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
    </section>
  );
}
