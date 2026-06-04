import { useEffect, useMemo, useState } from "react";
import { useTools } from "../store/toolStore";
import { useWorkers } from "../store/workerStore";
import { useAssignments } from "../store/assignmentStore";
import { usePermissions } from "../auth/PermissionsProvider";
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

function formatDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
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
  const { workers, addWorker, removeWorker } = useWorkers();
  const { assignments } = useAssignments();
  const { can } = usePermissions();

  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    stock: "0",
    notes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [workersModalOpen, setWorkersModalOpen] = useState(false);
  const [addWorkerModalOpen, setAddWorkerModalOpen] = useState(false);
  const [workerForm, setWorkerForm] = useState({ name: "", role: "" });
  const [workerError, setWorkerError] = useState("");

  const [openToolId, setOpenToolId] = useState(null);

  const editingTool = useMemo(() => {
    if (!editingId) return null;
    return tools.find((t) => t.id === editingId) || null;
  }, [tools, editingId]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setModalOpen(false);
      setWorkersModalOpen(false);
      setAddWorkerModalOpen(false);
    };
    if (modalOpen || workersModalOpen || addWorkerModalOpen) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [modalOpen, workersModalOpen, addWorkerModalOpen]);

  const categories = useMemo(() => {
    const set = new Set(tools.map((t) => t.category).filter(Boolean));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [tools]);

  const workerById = useMemo(() => {
    const map = new Map();
    workers.forEach((w) => map.set(w.id, w));
    return map;
  }, [workers]);

  const assignedByToolId = useMemo(() => {
    const map = new Map();
    for (const a of assignments) {
      if (!a?.toolId) continue;
      const list = map.get(a.toolId) || [];
      list.push(a);
      map.set(a.toolId, list);
    }
    for (const [toolId, list] of map.entries()) {
      list.sort((a, b) => new Date(b?.assignedAt).getTime() - new Date(a?.assignedAt).getTime());
      map.set(toolId, list);
    }
    return map;
  }, [assignments]);

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
    setForm({ name: "", category: "", stock: "0", notes: "" });
    setModalOpen(true);
  };

  const openWorkers = () => {
    setWorkerError("");
    setWorkersModalOpen(true);
  };

  const openAddWorker = () => {
    setWorkerError("");
    setWorkerForm({ name: "", role: "" });
    setAddWorkerModalOpen(true);
  };

  const onSaveWorker = async (e) => {
    e.preventDefault();
    setWorkerError("");
    const name = String(workerForm.name || "").trim();
    const role = String(workerForm.role || "").trim();
    if (!name) return setWorkerError("El nombre es requerido.");

    const created = await addWorker({ name, role });
    if (!created) return setWorkerError("Ese trabajador ya existe.");
    setAddWorkerModalOpen(false);
  };

  const openEdit = (t) => {
    setError("");
    setEditingId(t.id);
    setForm({
      name: t.name || "",
      category: t.category || "",
      stock: String(t.stock ?? "0"),
      notes: t.notes || "",
    });
    setModalOpen(true);
  };

  const onSave = async (e) => {
    e.preventDefault();
    setError("");

    const name = String(form.name || "").trim();
    const cat = String(form.category || "").trim();
    const stock = clampInt(form.stock, 0);

    if (!name) return setError("El nombre es requerido.");
    if (!cat) return setError("La categoria es requerida.");

    const payload = {
      name,
      category: cat,
      stock,
      notes: String(form.notes || "").trim(),
    };

    setSaving(true);
    try {
      if (editingId) await updateTool(editingId, payload);
      else await addTool(payload);
      setModalOpen(false);
    } catch (err) {
      setError(String(err?.message || "No se pudo guardar."));
    } finally {
      setSaving(false);
    }
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
            <button type="button" className="btnGhost" onClick={openWorkers}>
              Trabajadores
            </button>
            {can("tools:create") && (
              <button type="button" className="btn" onClick={openAdd}>
                Agregar herramienta
              </button>
            )}
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

              const isOpen = openToolId === t.id;
              const who = assignedByToolId.get(t.id) || [];

              return (
                <div
                  className={"toolsRow" + (isOpen ? " isOpen" : "")}
                  key={t.id}
                  role="row"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => setOpenToolId((prev) => (prev === t.id ? null : t.id))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenToolId((prev) => (prev === t.id ? null : t.id));
                    }
                  }}
                >
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
                    {can("tools:update") && (
                      <button
                        type="button"
                        className="btnGhost"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(t);
                        }}
                      >
                        Editar
                      </button>
                    )}
                  </div>

                  {isOpen ? (
                    <div className="toolDetails" role="region" aria-label="Detalles">
                      <div className="detailGrid">
                        <div className="detailPill">
                          <span className="detailLabel">Stock</span>
                          <span className="detailValue">{stock}</span>
                        </div>
                        <div className="detailPill">
                          <span className="detailLabel">Disponibles</span>
                          <span className="detailValue">{avail}</span>
                        </div>
                        <div className="detailPill">
                          <span className="detailLabel">En uso</span>
                          <span className="detailValue">{inUse}</span>
                        </div>
                        <div className="detailPill">
                          <span className="detailLabel">Asignaciones</span>
                          <span className="detailValue">{who.length}</span>
                        </div>
                      </div>

                      {t.notes ? <div className="detailNotes">{t.notes}</div> : null}

                      <div className="whoBlock">
                        <div className="whoTitle">Quien la tiene</div>
                        {who.length === 0 ? (
                          <div className="whoEmpty">No hay asignaciones para esta herramienta.</div>
                        ) : (
                          <div className="whoList" role="list" aria-label="Asignadas a">
                            {who.map((a) => {
                              const w = workerById.get(a.workerId);
                              return (
                                <div className="whoRow" key={a.id} role="listitem">
                                  <div className="whoMain">
                                    <div className="whoName">{w?.name || a.workerId}</div>
                                    <div className="whoMeta">
                                      <span>{w?.role || "(Sin rol)"}</span>
                                      <span className="dot" aria-hidden="true" />
                                      <span>Qty: {a.qty}</span>
                                      <span className="dot" aria-hidden="true" />
                                      <span>{formatDateTime(a.assignedAt)}</span>
                                    </div>
                                  </div>
                                  <span className="whoQty">{a.qty}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
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
          </div>

          <div className="modalHint">
            En uso actual: {Math.min(Number(editingTool?.inUse) || 0, Number(editingTool?.stock) || 0)}
            {" · "}
            Disponibles: {Math.max(0, clampInt(form.stock, 0) - (Number(editingTool?.inUse) || 0))}
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
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={workersModalOpen}
        title="Trabajadores"
        onClose={() => setWorkersModalOpen(false)}
      >
        <div className="modalBody">
          <div className="workersTop">
            <div className="workersHint">Total: {workers.length}</div>
            {can("workers:create") && (
              <button type="button" className="btn" onClick={openAddWorker}>
                Agregar trabajador
              </button>
            )}
          </div>

          {workers.length === 0 ? (
            <div className="workersEmpty">No hay trabajadores registrados.</div>
          ) : (
            <div className="workersList" role="list" aria-label="Lista de trabajadores">
              {workers
                .slice()
                .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
                .map((w) => (
                  <div className="workerRow" key={w.id} role="listitem">
                    <div className="workerMain">
                      <div className="workerName">{w.name}</div>
                      <div className="workerRole">{w.role || "(Sin rol)"}</div>
                    </div>
                    {can("workers:delete") && (
                     <button
                       type="button"
                       className="btnGhost btnDangerSoft"
                       onClick={async () => {
                         try {
                           await removeWorker(w.id);
                         } catch {
                           // ignore
                         }
                       }}
                     >
                       Eliminar
                     </button>
                    )}
                  </div>
                ))}
            </div>
          )}

          <div className="modalActions">
            <button type="button" className="btnGhost" onClick={() => setWorkersModalOpen(false)}>
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={addWorkerModalOpen}
        title="Agregar trabajador"
        onClose={() => setAddWorkerModalOpen(false)}
      >
        <form className="modalBody" onSubmit={onSaveWorker}>
          <label className="modalField">
            <span className="modalLabel">Nombre</span>
            <input
              className="modalInput"
              value={workerForm.name}
              onChange={(e) => setWorkerForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ej: Pedro Ramirez"
              autoFocus
            />
          </label>

          <label className="modalField">
            <span className="modalLabel">Rol (opcional)</span>
            <input
              className="modalInput"
              value={workerForm.role}
              onChange={(e) => setWorkerForm((p) => ({ ...p, role: e.target.value }))}
              placeholder="Ej: Tecnico"
            />
          </label>

          {workerError ? <div className="error">{workerError}</div> : null}

          <div className="modalActions">
            <button
              type="button"
              className="btnGhost"
              onClick={() => setAddWorkerModalOpen(false)}
            >
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
