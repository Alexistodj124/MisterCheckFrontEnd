import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useInventory } from "../store/inventoryStore";
import "./Inventario.css";

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function Inventario() {
  const { products } = useInventory();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [editMode, setEditMode] = useState(false);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return products
      .filter((p) => (category === "all" ? true : p.category === category))
      .filter((p) => {
        if (!q) return true;
        const hay = normalize(`${p.name} ${p.sku} ${p.category}`);
        return hay.includes(q);
      });
  }, [products, category, query]);

  const lowStockCount = useMemo(
    () => products.filter((p) => Number(p.stock) <= 5).length,
    [products]
  );

  return (
    <section className="inv">
      <header className="invHeader">
        <div>
          <h1 className="invTitle">Inventario</h1>
          <p className="invSubtitle">
            Productos disponibles y su stock. Filtra por categoria o busca por
            nombre / SKU.
          </p>
        </div>

        <div className="invHeaderRight">
          <div className="invStats" aria-label="Estadisticas">
            <div className="statPill">
              <span className="statLabel">Productos</span>
              <span className="statValue">{products.length}</span>
            </div>
            <div className="statPill statWarn">
              <span className="statLabel">Bajo stock</span>
              <span className="statValue">{lowStockCount}</span>
            </div>
          </div>

          <button
            type="button"
            className={editMode ? "btn" : "btnGhost"}
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? "Listo" : "Editar productos"}
          </button>
        </div>
      </header>

      <div className="invControls">
        <label className="control">
          <span className="controlLabel">Categoria</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="controlField"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "Todas" : c}
              </option>
            ))}
          </select>
        </label>

        <label className="control controlGrow">
          <span className="controlLabel">Buscar</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="controlField"
            placeholder="Buscar producto o SKU..."
            inputMode="search"
          />
        </label>

        <button
          type="button"
          className="btnGhost"
          onClick={() => {
            setQuery("");
            setCategory("all");
          }}
        >
          Limpiar
        </button>
      </div>

      <div className={"invCard" + (editMode ? "" : " noActions")}>
        <div className="invTableHead" aria-label="Encabezado">
          <div>Producto</div>
          <div className="hideSm">Categoria</div>
          <div className="colStock">Stock</div>
          {editMode ? <div className="colActions">Acciones</div> : null}
        </div>

        <div className="invTable" role="table" aria-label="Productos">
          {filtered.length === 0 ? (
            <div className="invEmpty">
              No hay productos que coincidan con el filtro.
            </div>
          ) : (
            filtered.map((p) => {
              const stock = Number(p.stock) || 0;
              const level = stock <= 2 ? "danger" : stock <= 5 ? "warn" : "ok";

              return (
                <div className="invRow" key={p.id} role="row">
                  <div className="cellMain" role="cell">
                    <div className="pName">{p.name}</div>
                    <div className="pMeta">
                      <span className="sku">SKU: {p.sku}</span>
                      <span className="dot" aria-hidden="true" />
                      <span className="onlySm">{p.category}</span>
                    </div>
                  </div>

                  <div className="cell hideSm" role="cell">
                    {p.category}
                  </div>

                  <div className="cell colStock" role="cell">
                    <span className={`stockPill ${level}`}>{stock}</span>
                  </div>

                  {editMode ? (
                    <div className="cell colActions" role="cell">
                      <Link to={`/inventario/editar/${p.id}`} className="btn">
                        Editar
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
