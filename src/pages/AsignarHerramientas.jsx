import { useMemo, useState } from "react";
import { useTools } from "../store/toolStore";
import { useWorkers } from "../store/workerStore";
import { useAssignments } from "../store/assignmentStore";
import "./AsignarHerramientas.css";

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

function availableCount(t) {
  const stock = Number(t?.stock) || 0;
  const inUse = Number(t?.inUse) || 0;
  return Math.max(0, stock - inUse);
}

export default function AsignarHerramientas() {
  const { tools, updateTool } = useTools();
  const { workers } = useWorkers();
  const { assignments, assignTool, unassignTool } = useAssignments();

  const [workerId, setWorkerId] = useState("");
  const [toolCategory, setToolCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [qtyDraft, setQtyDraft] = useState(() => ({}));
  const [returnDraft, setReturnDraft] = useState(() => ({}));
  const [error, setError] = useState("");

  const worker = useMemo(
    () => workers.find((w) => w.id === workerId) || null,
    [workers, workerId]
  );

  const toolById = useMemo(() => {
    const map = new Map();
    tools.forEach((t) => map.set(t.id, t));
    return map;
  }, [tools]);

  const categories = useMemo(() => {
    const set = new Set(tools.map((t) => t.category).filter(Boolean));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [tools]);

  const workerAssignments = useMemo(() => {
    if (!workerId) return [];
    return assignments
      .filter((a) => a.workerId === workerId)
      .slice()
      .sort((a, b) => String(a.toolId).localeCompare(String(b.toolId)));
  }, [assignments, workerId]);

  const stats = useMemo(() => {
    const base = { stock: 0, inUse: 0, available: 0 };
    for (const t of tools) {
      const stock = Number(t?.stock) || 0;
      const inUse = Math.min(Number(t?.inUse) || 0, stock);
      base.stock += stock;
      base.inUse += inUse;
      base.available += Math.max(0, stock - inUse);
    }
    return base;
  }, [tools]);

  const filteredTools = useMemo(() => {
    const q = normalize(query);
    return tools
      .filter((t) => (toolCategory === "all" ? true : t.category === toolCategory))
      .filter((t) => {
        if (!q) return true;
        const hay = normalize(`${t.name} ${t.category} ${t.notes}`);
        return hay.includes(q);
      })
      .slice()
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [tools, toolCategory, query]);

  const onAssign = (tool) => {
    setError("");
    if (!workerId) return setError("Selecciona un trabajador primero.");

    const avail = availableCount(tool);
    const draft = qtyDraft[tool.id];
    const qty = clampInt(draft == null || draft === "" ? 1 : draft, 1);
    if (qty > avail) return setError("No hay suficientes disponibles para asignar.");

    const curInUse = Number(tool?.inUse) || 0;
    updateTool(tool.id, { inUse: curInUse + qty });
    assignTool({ workerId, toolId: tool.id, qty });
    setQtyDraft((prev) => ({ ...prev, [tool.id]: "" }));
  };

  const onReturn = (a) => {
    setError("");
    const tool = toolById.get(a.toolId);
    if (!tool) return;

    const max = Number(a?.qty) || 0;
    const draft = returnDraft[a.toolId];
    const qty = clampInt(draft == null || draft === "" ? max : draft, 1);
    if (qty > max) return setError("No puedes devolver mas de lo asignado.");

    const curInUse = Number(tool?.inUse) || 0;
    updateTool(tool.id, { inUse: Math.max(0, curInUse - qty) });
    unassignTool({ workerId, toolId: tool.id, qty });
    setReturnDraft((prev) => ({ ...prev, [tool.id]: "" }));
  };

  return (
    <section className="assign">
      <header className="assignHeader">
        <div>
          <h1 className="assignTitle">Asignar herramientas</h1>
          <p className="assignSubtitle">
            Selecciona un trabajador y asigna una o varias herramientas.
          </p>
        </div>

        <div className="assignHeaderRight">
          <div className="assignStats" aria-label="Estadisticas">
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
        </div>
      </header>

      <div className="assignControls">
        <label className="control controlGrow">
          <span className="controlLabel">Trabajador</span>
          <select
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
            className="controlField"
          >
            <option value="">Selecciona...</option>
            {workers
              .slice()
              .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}{w.role ? ` - ${w.role}` : ""}
                </option>
              ))}
          </select>
        </label>

        <label className="control">
          <span className="controlLabel">Categoria</span>
          <select
            value={toolCategory}
            onChange={(e) => setToolCategory(e.target.value)}
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
          <span className="controlLabel">Buscar herramienta</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="controlField"
            placeholder="Buscar..."
            inputMode="search"
          />
        </label>

        <button
          type="button"
          className="btnGhost"
          onClick={() => {
            setToolCategory("all");
            setQuery("");
          }}
        >
          Limpiar
        </button>
      </div>

      {error ? <div className="assignError">{error}</div> : null}

      <div className="assignGrid">
        <div className="assignCard">
          <div className="cardTitle">Asignadas</div>
          <div className="cardSub">
            {worker ? `Trabajador: ${worker.name}` : "Selecciona un trabajador."}
          </div>

          {workerAssignments.length === 0 ? (
            <div className="empty">No hay herramientas asignadas.</div>
          ) : (
            <div className="aList" aria-label="Herramientas asignadas">
              <div className="aHead">
                <div>Herramienta</div>
                <div className="colNum">Qty</div>
                <div className="hideSm">Ultima</div>
                <div className="colActions">Accion</div>
              </div>

              {workerAssignments.map((a) => {
                const t = toolById.get(a.toolId);
                const max = Number(a?.qty) || 0;
                const retValue = returnDraft[a.toolId] || "";
                return (
                  <div className="aRow" key={a.id}>
                    <div className="cellMain">
                      <div className="tName">{t?.name || a.toolId}</div>
                      <div className="tMeta">
                        <span className="onlySm">{formatDateTime(a.assignedAt)}</span>
                        {t?.category ? (
                          <>
                            <span className="dot" aria-hidden="true" />
                            <span>{t.category}</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="cell colNum">
                      <span className="numPill info">{max}</span>
                    </div>

                    <div className="cell hideSm">{formatDateTime(a.assignedAt)}</div>

                    <div className="cell colActions">
                      <div className="returnBox">
                        <input
                          className="qtyInput"
                          inputMode="numeric"
                          value={retValue}
                          onChange={(e) =>
                            setReturnDraft((prev) => ({
                              ...prev,
                              [a.toolId]: e.target.value,
                            }))
                          }
                          placeholder={String(max)}
                          aria-label="Cantidad a devolver"
                        />
                        <button
                          type="button"
                          className="btnGhost"
                          onClick={() => onReturn(a)}
                        >
                          Devolver
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="assignCard">
          <div className="cardTitle">Catalogo</div>
          <div className="cardSub">Asigna herramientas disponibles.</div>

          {filteredTools.length === 0 ? (
            <div className="empty">No hay herramientas que coincidan.</div>
          ) : (
            <div className="tList" aria-label="Catalogo de herramientas">
              <div className="tHead">
                <div>Herramienta</div>
                <div className="hideSm">Categoria</div>
                <div className="colNum">Disp.</div>
                <div className="colActions">Asignar</div>
              </div>

              {filteredTools.map((t) => {
                const avail = availableCount(t);
                const level = avail === 0 ? "warn" : "ok";
                const qv = qtyDraft[t.id] || "";
                return (
                  <div className="tRow" key={t.id}>
                    <div className="cellMain">
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

                    <div className="cell hideSm">{t.category}</div>

                    <div className="cell colNum">
                      <span className={`numPill ${level}`}>{avail}</span>
                    </div>

                    <div className="cell colActions">
                      <div className="assignBox">
                        <input
                          className="qtyInput"
                          inputMode="numeric"
                          value={qv}
                          onChange={(e) =>
                            setQtyDraft((prev) => ({
                              ...prev,
                              [t.id]: e.target.value,
                            }))
                          }
                          placeholder="1"
                          aria-label="Cantidad a asignar"
                        />
                        <button
                          type="button"
                          className={avail === 0 ? "btnGhost" : "btn"}
                          disabled={avail === 0}
                          onClick={() => onAssign(t)}
                        >
                          Asignar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
