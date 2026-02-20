import { useEffect, useMemo, useState } from "react";
import { useTools } from "../store/toolStore";
import "./Herramientas.css";

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function clampInt(n, min) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return min;
  return Math.max(min, x);
}

function availableCount(t) {
  const stock = Number(t?.stock) || 0;
  const inUse = Number(t?.inUse) || 0;
  return Math.max(0, stock - inUse);
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="modalOverlay" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalTop">
          <div className="modalTitle">{title}</div>
          <button type="button" className="iconBtn" onClick={onClose} aria-label="Cerrar">
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Herramientas() {
  const { tools, addTool, updateTool } = useTools();

  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    stock: "0",
    inUse: "0",
    notes: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setModalOpen(false);
    };
    if (modalOpen) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [modalOpen]);

  const categories = useMemo(() => {
    const set = new Set(tools.map((t) => t.category).filter(Boolean));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [tools]);

  const stats = useMemo(() => {
    const base = { items: tools.length, stock: 0, inUse: 0, available: 0 };
    for (const t of tools) {
      const s = Number(t?.stock) || 0;
      const u = Number(t?.inUse) || 0;
      base.stock += s;
      base.inUse += Math.min(u, s);
      base.available += Math.max(0, s - u);
    }
    return base;
  }, [tools]);

  const filtered = useMemo(() => {
    const q = normalize(query);

    return tools
      .filter((t) => (category === "all" ? true : t.category === category))
      .filter((t) => {
        if (status === "all") return true;
        const avail = availableCount(t);
        const inUse = Number(t?.inUse) || 0;
        const stock = Number(t?.stock) || 0;
        if (status === "disponible") return avail > 0;
        if (status === "en_uso") return inUse > 0;
        if (status === "sin_stock") return stock === 0;
        if (status === "ocupada") return stock > 0 && avail === 0;
        return true;
      })
      .filter((t) => {
        if (!q) return true;
        const hay = normalize(`${t.name} ${t.category} ${t.notes}`);
        return hay.includes(q);
      })
      .slice()
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [tools, category, status, query]);

  const openAdd = () => {
    setError("");
    setEditingId(null);
    setForm({ name: "", category: "", stock: "0", inUse: "0", notes: "" });
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setError("");
    setEditingId(t.id);
    setForm({
      name: t.name || "",
      category: t.category || "",
      stock: String(t.stock ?? "0"),
      inUse: String(t.inUse ?? "0"),
      notes: t.notes || "",
    });
    setModalOpen(true);
  };

  const onSave = (e) => {
    e.preventDefault();
    setError("");

    const name = String(form.name || "").trim();
    const cat = String(form.category || "").trim();
    const stock = clampInt(form.stock, 0);
    const inUse = clampInt(form.inUse, 0);

    if (!name) return setError("El nombre es requerido.");
    if (!cat) return setError("La categoria es requerida.");
    if (inUse > stock) return setError("En uso no puede ser mayor al stock.");

    const payload = {
      name,
      category: cat,
      stock,
      inUse,
      notes: String(form.notes || "").trim(),
    };

    if (editingId) updateTool(editingId, payload);
    else addTool(payload);

    setModalOpen(false);
  };

  return (
    <section className="tools">
      <header className="toolsHeader">
        <div>
          <h1 className="toolsTitle">Herramientas</h1>
          <p className="toolsSubtitle">
            Control de herramientas: stock, disponibles y en uso.
          </p>
        </div>

        <div className="toolsHeaderRight">
          <div className="toolsStats" aria-label="Estadisticas">
            <div className="statPill">
              <span className="statLabel">Herramientas</span>
              <span className="statValue">{stats.items}</span>
            </div>
            <div className="statPill statInfo">
              <span className="statLabel">Stock</span>
              <span className="statValue">{stats.stock}</span>
            </div>
            <div className="statPill statOk">
              <span className="statLabel">Disponibles</span>
              <span className="statValue">{stats.available}</span>
            </div>
            <div className="statPill statWarn">
              <span className="statLabel">En uso</span>
              <span className="statValue">{stats.inUse}</span>
            </div>
          </div>

          <div className="toolsActions">
            <button type="button" className="btn" onClick={openAdd}>
              Agregar herramienta
            </button>
          </div>
        </div>
      </header>

      <div className="toolsControls">
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

        <label className="control">
          <span className="controlLabel">Estado</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="controlField"
          >
            <option value="all">Todas</option>
            <option value="disponible">Con disponibles</option>
            <option value="ocupada">Sin disponibles</option>
            <option value="en_uso">En uso</option>
            <option value="sin_stock">Sin stock</option>
          </select>
        </label>

        <label className="control controlGrow">
          <span className="controlLabel">Buscar</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="controlField"
            placeholder="Buscar herramienta..."
            inputMode="search"
          />
        </label>

        <button
          type="button"
          className="btnGhost"
          onClick={() => {
            setCategory("all");
            setStatus("all");
            setQuery("");
          }}
        >
          Limpiar
        </button>
      </div>

      <div className="toolsCard">
        <div className="toolsHead" aria-label="Encabezado">
          <div>Herramienta</div>
          <div className="hideSm">Categoria</div>
          <div className="colNum">Stock</div>
          <div className="colNum">Disponibles</div>
          <div className="colNum">En uso</div>
          <div className="colActions">Acciones</div>
        </div>

        <div className="toolsTable" role="table" aria-label="Herramientas">
          {filtered.length === 0 ? (
            <div className="toolsEmpty">No hay herramientas para el filtro actual.</div>
          ) : (
            filtered.map((t) => {
              const stock = Number(t.stock) || 0;
              const inUse = Math.min(Number(t.inUse) || 0, stock);
              const avail = Math.max(0, stock - inUse);
              const level = stock === 0 ? "danger" : avail === 0 ? "warn" : "ok";

              return (
                <div className="toolsRow" key={t.id} role="row">
                  <div className="cellMain" role="cell">
                    <div className="tName">{t.name}</div>
                    <div className="tMeta">
                      <span className="onlySm">{t.category}</span>
                      {t.notes ? (
                        <>
                          <span className="dot" aria-hidden="true" />
                          <span className="note">{t.notes}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="cell hideSm" role="cell">
                    {t.category}
                  </div>

                  <div className="cell colNum" role="cell">
                    <span className={`numPill ${level}`}>{stock}</span>
                  </div>

                  <div className="cell colNum" role="cell">
                    <span className={`numPill ${avail > 0 ? "ok" : "warn"}`}>{avail}</span>
                  </div>

                  <div className="cell colNum" role="cell">
                    <span className={`numPill ${inUse > 0 ? "info" : "neutral"}`}>{inUse}</span>
                  </div>

                  <div className="cell colActions" role="cell">
                    <button type="button" className="btnGhost" onClick={() => openEdit(t)}>
                      Editar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? "Editar herramienta" : "Agregar herramienta"}
        onClose={() => setModalOpen(false)}
      >
        <form className="modalBody" onSubmit={onSave}>
          <label className="modalField">
            <span className="modalLabel">Nombre</span>
            <input
              className="modalInput"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ej: Rotomartillo"
            />
          </label>

          <label className="modalField">
            <span className="modalLabel">Categoria</span>
            <input
              className="modalInput"
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              placeholder="Ej: Electricas"
              list="tools-cat-list"
            />
            <datalist id="tools-cat-list">
              {categories
                .filter((c) => c !== "all")
                .map((c) => (
                  <option key={c} value={c} />
                ))}
            </datalist>
          </label>

          <div className="modalGrid2">
            <label className="modalField">
              <span className="modalLabel">Stock</span>
              <input
                className="modalInput"
                value={form.stock}
                onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                inputMode="numeric"
                placeholder="0"
              />
            </label>

            <label className="modalField">
              <span className="modalLabel">En uso</span>
              <input
                className="modalInput"
                value={form.inUse}
                onChange={(e) => setForm((p) => ({ ...p, inUse: e.target.value }))}
                inputMode="numeric"
                placeholder="0"
              />
            </label>
          </div>

          <div className="modalHint">
            Disponibles: {Math.max(0, clampInt(form.stock, 0) - clampInt(form.inUse, 0))}
          </div>

          <label className="modalField">
            <span className="modalLabel">Notas (opcional)</span>
            <textarea
              className="modalText"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Ej: ubicacion, accesorios, observaciones"
              rows={3}
            />
          </label>

          {error ? <div className="error">{error}</div> : null}

          <div className="modalActions">
            <button type="button" className="btnGhost" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn">
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
