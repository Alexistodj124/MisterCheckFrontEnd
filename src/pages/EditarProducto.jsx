import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useInventory } from "../store/inventoryStore";
import "./EditarProducto.css";

export default function EditarProducto() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, updateProduct } = useInventory();

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  const [name, setName] = useState(product?.name || "");
  const [category, setCategory] = useState(product?.category || "");
  const [stock, setStock] = useState(String(product?.stock ?? ""));
  const [cost, setCost] = useState(String(product?.cost ?? ""));

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!product) {
    return (
      <section className="edit">
        <h1 className="editTitle">Producto no encontrado</h1>
        <p className="editSubtitle">
          El producto ya no existe o el id es invalido.
        </p>
        <Link to="/inventario" className="btn">Volver al inventario</Link>
      </section>
    );
  }

  const onSave = async (e) => {
    e.preventDefault();
    setError("");

    const n = name.trim();
    const c = category.trim();
    const s = Number(stock);
    const co = Number(cost);

    if (!n) return setError("El nombre es requerido.");
    if (!c) return setError("La categoria es requerida.");
    if (!Number.isFinite(co) || co < 0) return setError("Costo invalido.");
    if (!Number.isFinite(s) || s < 0) return setError("Stock invalido.");

    setSaving(true);
    try {
      await updateProduct(product.id, {
        name: n,
        category: c,
        cost: co,
        stock: Math.floor(s),
      });
      navigate("/inventario");
    } catch (err) {
      setError(String(err?.message || "No se pudo guardar el producto."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="edit">
      <header className="editHeader">
        <div>
          <h1 className="editTitle">Editar producto</h1>
          <p className="editSubtitle">
            Actualiza informacion del producto y stock.
          </p>
        </div>

        <div className="editMeta">
          <div className="metaPill">
            <span className="metaLabel">ID</span>
            <span className="metaValue">{product.id}</span>
          </div>
          <div className="metaPill">
            <span className="metaLabel">SKU</span>
            <span className="metaValue">{product.sku}</span>
          </div>
        </div>
      </header>

      <form className="editCard" onSubmit={onSave}>
        <label className="field">
          <span className="fieldLabel">Nombre</span>
          <input
            className="fieldInput"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del producto"
          />
        </label>

        <label className="field">
          <span className="fieldLabel">Categoria</span>
          <input
            className="fieldInput"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ej: Despensa"
          />
        </label>

        <label className="field">
          <span className="fieldLabel">Costo</span>
          <input
            className="fieldInput"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </label>

        <label className="field">
          <span className="fieldLabel">Stock</span>
          <input
            className="fieldInput"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            inputMode="numeric"
            placeholder="0"
          />
        </label>

        {error ? <div className="error">{error}</div> : null}

        <div className="actions">
          <Link to="/inventario" className="btnGhost">Cancelar</Link>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </section>
  );
}
