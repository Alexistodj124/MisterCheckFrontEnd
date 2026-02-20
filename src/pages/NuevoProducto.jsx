import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInventory } from "../store/inventoryStore";
import "./NuevoProducto.css";

const MAX_IMAGE_BYTES = 900 * 1024;

function formatBytes(n) {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const kb = n / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function NuevoProducto() {
  const navigate = useNavigate();
  const { products, addProduct } = useInventory();

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const uploadRef = useRef(null);
  const cameraRef = useRef(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState(() => categories[0] || "");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [notes, setNotes] = useState("");

  const [imageName, setImageName] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");

  const [error, setError] = useState("");

  const onPickFile = (file) => {
    setError("");
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) {
      setError("Selecciona una imagen valida.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError(
        `La imagen es muy grande (${formatBytes(file.size)}). Maximo ${formatBytes(
          MAX_IMAGE_BYTES
        )}.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(String(reader.result || ""));
      setImageName(file.name || "imagen");
    };
    reader.onerror = () => setError("No se pudo leer la imagen.");
    reader.readAsDataURL(file);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");

    const n = name.trim();
    const c = category.trim();
    const s = Number(stock);
    const co = Number(cost);

    if (!n) return setError("El nombre es requerido.");
    if (!c) return setError("La categoria es requerida.");
    if (!Number.isFinite(co) || co < 0) return setError("Costo invalido.");
    if (!Number.isFinite(s) || s < 0) return setError("Cantidad/stock invalido.");

    addProduct({
      name: n,
      sku: sku.trim(),
      category: c,
      cost: co,
      stock: Math.floor(s),
      imageDataUrl,
      notes: notes.trim(),
    });

    navigate("/inventario");
  };

  return (
    <section className="np">
      <header className="npHeader">
        <div>
          <h1 className="npTitle">Agregar producto</h1>
          <p className="npSubtitle">
            Crea un nuevo producto (solo front-end por ahora).
          </p>
        </div>

        <div className="npActions">
          <Link to="/inventario" className="btnGhost">
            Volver
          </Link>
        </div>
      </header>

      <div className="npGrid">
        <div className="npCard">
          <div className="npCardTitle">Imagen</div>
          <div className="npCardSub">Sube una imagen o toma una foto.</div>

          <div className="imgBox">
            {imageDataUrl ? (
              <img className="imgPreview" src={imageDataUrl} alt={name || "Producto"} />
            ) : (
              <div className="imgPlaceholder">
                <div className="imgHint">Sin imagen</div>
                <div className="imgHintSmall">PNG/JPG/WebP</div>
              </div>
            )}
          </div>

          <div className="imgButtons">
            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              className="srOnly"
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="srOnly"
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />

            <button type="button" className="btnGhost" onClick={() => uploadRef.current?.click()}>
              Subir imagen
            </button>
            <button type="button" className="btnGhost" onClick={() => cameraRef.current?.click()}>
              Tomar foto
            </button>
            <button
              type="button"
              className="btnDanger"
              disabled={!imageDataUrl}
              onClick={() => {
                setImageDataUrl("");
                setImageName("");
                if (uploadRef.current) uploadRef.current.value = "";
                if (cameraRef.current) cameraRef.current.value = "";
              }}
            >
              Quitar
            </button>
          </div>

          {imageName ? <div className="imgMeta">{imageName}</div> : null}
          <div className="imgNote">
            Nota: se guarda como base64 (limitado a {formatBytes(MAX_IMAGE_BYTES)}).
          </div>
        </div>

        <form className="npCard" onSubmit={onSubmit}>
          <div className="npCardTitle">Datos</div>
          <div className="npCardSub">Nombre, costo, cantidad y categoria.</div>

          <label className="field">
            <span className="fieldLabel">Nombre</span>
            <input
              className="fieldInput"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Galletas de chocolate"
            />
          </label>

          <div className="row2">
            <label className="field">
              <span className="fieldLabel">SKU (opcional)</span>
              <input
                className="fieldInput"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej: GAL-CHO-12"
              />
            </label>

            <label className="field">
              <span className="fieldLabel">Categoria</span>
              <input
                className="fieldInput"
                list="cat-list"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: Despensa"
              />
              <datalist id="cat-list">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
          </div>

          <div className="row2">
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
              <span className="fieldLabel">Cantidad / Stock</span>
              <input
                className="fieldInput"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                inputMode="numeric"
                placeholder="0"
              />
            </label>
          </div>

          <label className="field">
            <span className="fieldLabel">Notas (opcional)</span>
            <textarea
              className="fieldText"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: proveedor, vencimiento, etc..."
              rows={4}
            />
          </label>

          {error ? <div className="error">{error}</div> : null}

          <div className="actions">
            <Link to="/inventario" className="btnGhost">
              Cancelar
            </Link>
            <button type="submit" className="btn">
              Guardar producto
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
