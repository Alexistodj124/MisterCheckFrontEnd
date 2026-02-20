import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuotes } from "../store/quoteStore";
import "./Reportes.css";

const MS_DAY = 86400000;
const TODAY_STR = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
})();

function toMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0.00";
  return x.toFixed(2);
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
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

function startOfDayMs(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split("-").map((v) => Number(v));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

function endOfDayMs(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split("-").map((v) => Number(v));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

function dateStrToIsoNoon(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split("-").map((v) => Number(v));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
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

function labelStatus(s) {
  if (s === "pendiente") return "Pendiente";
  if (s === "en_curso") return "En curso";
  if (s === "completada") return "Completada";
  return "-";
}

function statusClass(s) {
  if (s === "pendiente") return "pending";
  if (s === "en_curso") return "progress";
  if (s === "completada") return "done";
  return "neutral";
}

function pluralDia(n) {
  return Math.abs(Number(n)) === 1 ? "dia" : "dias";
}

function daysRemainingLabel(q, nowMs) {
  if (q?.status !== "en_curso") return "-";
  const baseIso = q.startedAt || q.createdAt;
  const baseMs = new Date(baseIso).getTime();
  if (!Number.isFinite(baseMs)) return "-";
  const days = Number(q.deliveryDays) || 0;
  if (!Number.isFinite(days) || days <= 0) return "-";

  const dueMs = baseMs + days * MS_DAY;
  const diff = Math.ceil((dueMs - nowMs) / MS_DAY);
  if (diff >= 0) return `Quedan ${diff} ${pluralDia(diff)}`;
  return `Atrasada ${Math.abs(diff)} ${pluralDia(diff)}`;
}

function totals(q) {
  const itemsSubtotal = Array.isArray(q?.items)
    ? q.items.reduce((sum, it) => {
        const unit = Number(it?.unitCost) || 0;
        const qty = Number(it?.qty) || 0;
        return sum + unit * qty;
      }, 0)
    : 0;
  const project = Number(q?.projectPrice) || 0;
  return { itemsSubtotal, project, total: itemsSubtotal + project };
}

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, x));
}

function progressTone(q, nowMs) {
  if (q?.status !== "en_curso") return "neutral";
  const startedMs = new Date(q?.startedAt || q?.createdAt).getTime();
  const days = Number(q?.deliveryDays) || 0;
  const pct = clamp(q?.progressPct ?? 0, 0, 100);
  if (!Number.isFinite(startedMs) || !Number.isFinite(days) || days <= 0) return "neutral";

  const elapsedDays = (nowMs - startedMs) / MS_DAY;
  const expected = clamp((elapsedDays / days) * 100, 0, 100);
  const overdue = elapsedDays > days + 0.01;
  const delta = pct - expected;

  if (pct >= 100) return "ok";
  if (overdue && pct < 100) return "bad";
  if (delta >= -5) return "ok";
  if (delta >= -15) return "warn";
  return "bad";
}

export default function Reportes() {
  const { quotes, setQuoteStatus, updateQuote } = useQuotes();
  const [status, setStatus] = useState("all");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [startModalId, setStartModalId] = useState(null);
  const [startModalDate, setStartModalDate] = useState(TODAY_STR);

  const [progressModalId, setProgressModalId] = useState(null);
  const [progressModalPct, setProgressModalPct] = useState("0");

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setStartModalId(null);
      setProgressModalId(null);
    };
    if (startModalId || progressModalId) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [startModalId, progressModalId]);

  const counts = useMemo(() => {
    const base = { total: quotes.length, pendiente: 0, en_curso: 0, completada: 0 };
    for (const q of quotes) {
      if (q?.status === "pendiente") base.pendiente += 1;
      if (q?.status === "en_curso") base.en_curso += 1;
      if (q?.status === "completada") base.completada += 1;
    }
    return base;
  }, [quotes]);

  const filtered = useMemo(() => {
    const fromMs = startOfDayMs(start);
    const toMs = endOfDayMs(end);

    return quotes
      .filter((q) => {
        if (status === "all") return true;
        return q?.status === status;
      })
      .filter((q) => {
        if (!fromMs && !toMs) return true;
        const ms = new Date(q?.createdAt).getTime();
        if (!Number.isFinite(ms)) return false;
        if (fromMs && ms < fromMs) return false;
        if (toMs && ms > toMs) return false;
        return true;
      })
      .slice()
      .sort((a, b) => new Date(b?.createdAt).getTime() - new Date(a?.createdAt).getTime());
  }, [quotes, status, start, end]);

  const openStartModal = (q) => {
    setStartModalId(q.id);
    setStartModalDate(TODAY_STR);
  };

  const confirmStartPending = () => {
    if (!startModalId) return;
    const iso = dateStrToIsoNoon(startModalDate);
    if (!iso) return;
    const nowIso = new Date().toISOString();

    updateQuote(startModalId, {
      status: "en_curso",
      startedAt: iso,
      progressPct: 0,
      progressUpdatedAt: nowIso,
    });

    setStartModalId(null);
  };

  const openProgressModal = (q) => {
    setProgressModalId(q.id);
    setProgressModalPct(String(clamp(q?.progressPct ?? 0, 0, 100)));
  };

  const confirmProgress = () => {
    if (!progressModalId) return;
    const pct = clamp(progressModalPct, 0, 100);
    updateQuote(progressModalId, {
      progressPct: pct,
      progressUpdatedAt: new Date().toISOString(),
    });
    setProgressModalId(null);
  };

  return (
    <section className="rep">
      <header className="repHeader">
        <div>
          <h1 className="repTitle">Reportes</h1>
          <p className="repSubtitle">
            Todas las cotizaciones. Filtra por estado y por rango de fechas.
          </p>
        </div>

        <div className="repHeaderRight">
          <div className="repStats" aria-label="Estadisticas">
            <div className="statPill">
              <span className="statLabel">Cotizaciones</span>
              <span className="statValue">{counts.total}</span>
            </div>
            <div className="statPill statWarn">
              <span className="statLabel">Pendientes</span>
              <span className="statValue">{counts.pendiente}</span>
            </div>
            <div className="statPill statInfo">
              <span className="statLabel">En curso</span>
              <span className="statValue">{counts.en_curso}</span>
            </div>
            <div className="statPill statOk">
              <span className="statLabel">Completadas</span>
              <span className="statValue">{counts.completada}</span>
            </div>
          </div>

          <div className="repActions">
            <Link to="/cotizaciones/nueva" className="btn">
              Nueva cotizacion
            </Link>
          </div>
        </div>
      </header>

      <div className="repControls">
        <label className="control">
          <span className="controlLabel">Estado</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="controlField"
          >
            <option value="all">Todas</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_curso">En curso</option>
            <option value="completada">Completada</option>
          </select>
        </label>

        <label className="control">
          <span className="controlLabel">Desde</span>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="controlField"
          />
        </label>

        <label className="control">
          <span className="controlLabel">Hasta</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="controlField"
          />
        </label>

        <button
          type="button"
          className="btnGhost"
          onClick={() => {
            setStatus("all");
            setStart("");
            setEnd("");
          }}
        >
          Limpiar
        </button>
      </div>

      <div className="repCard">
        <div className="repHead" aria-label="Encabezado">
          <div>Cotizacion</div>
          <div>Cliente</div>
          <div>Estado</div>
          <div className="hideSm">Fecha</div>
          <div className="colTotal">Total</div>
          <div className="hideSm">Entrega</div>
          <div className="hideSm">Acciones</div>
        </div>

        <div className="repTable" role="table" aria-label="Cotizaciones">
          {filtered.length === 0 ? (
            <div className="repEmpty">No hay cotizaciones para el filtro actual.</div>
          ) : (
            filtered.map((q) => {
              const t = totals(q);
              const remaining = daysRemainingLabel(q, nowMs);
              const pending = q.status === "pendiente";
              const inProgress = q.status === "en_curso";
              const tone = progressTone(q, nowMs);
              const lastUpdate = q?.progressUpdatedAt
                ? formatDateTime(q.progressUpdatedAt)
                : "-";
              const pctShown = clamp(q?.progressPct ?? 0, 0, 100);

              return (
                <div
                  className={
                    "repRow" + (inProgress ? ` tone ${tone}` : "")
                  }
                  key={q.id}
                  role="row"
                >
                  <div className="cellMain" role="cell">
                    <div className="qName">#{q.number}</div>
                    <div className="qMeta">
                      <span className="desc">{q.projectDesc || "(Sin descripcion)"}</span>
                      <span className="dot" aria-hidden="true" />
                      <span className="onlySm">{formatDate(q.createdAt)}</span>
                    </div>
                  </div>

                  <div className="cell" role="cell">
                    {q.clientName || "-"}
                  </div>

                  <div className="cell" role="cell">
                    <span className={`statusPill ${statusClass(q.status)}`}>
                      <select
                        className="statusSelect"
                        value={q.status}
                        onChange={(e) => setQuoteStatus(q.id, e.target.value)}
                        aria-label="Cambiar estado"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_curso">En curso</option>
                        <option value="completada">Completada</option>
                      </select>
                      <span className="statusText">{labelStatus(q.status)}</span>
                    </span>
                  </div>

                  <div className="cell hideSm" role="cell">
                    {formatDate(q.createdAt)}
                  </div>

                  <div className="cell colTotal" role="cell">
                    {toMoney(t.total)}
                  </div>

                  <div className="cell hideSm" role="cell">
                    {remaining}
                  </div>

                  <div className="cell hideSm" role="cell">
                    {pending ? (
                      <div className="startBox">
                        <button
                          type="button"
                          className="btnGhost startBtn"
                          onClick={() => openStartModal(q)}
                        >
                          Poner en curso
                        </button>
                      </div>
                    ) : inProgress ? (
                      <div className="progEdit" aria-label="Avance">
                        <div className="progRow">
                          <div className="progSummary">
                            <span className="progSummaryLabel">Avance</span>
                            <span className="progSummaryValue">{pctShown}%</span>
                          </div>
                          <button
                            type="button"
                            className="btnGhost progBtn"
                            onClick={() => openProgressModal(q)}
                          >
                            Actualizar
                          </button>
                        </div>
                        <div className="progMeta">Ultima actualizacion: {lastUpdate}</div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </div>

                  <div className="onlySm rowMeta">
                    <span>Total: {toMoney(t.total)}</span>
                    <span>Entrega: {remaining}</span>
                    {pending ? (
                      <span className="startInline">
                        <button
                          type="button"
                          className="btnGhost startBtn"
                          onClick={() => openStartModal(q)}
                        >
                          Poner en curso
                        </button>
                      </span>
                    ) : inProgress ? (
                      <span className="progEdit">
                        <span className="progRow">
                          <span className="progSummary">
                            <span className="progSummaryLabel">Avance</span>
                            <span className="progSummaryValue">{pctShown}%</span>
                          </span>
                          <button
                            type="button"
                            className="btnGhost progBtn"
                            onClick={() => openProgressModal(q)}
                          >
                            Actualizar
                          </button>
                        </span>
                        <span className="progMeta">Ultima actualizacion: {lastUpdate}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal
        open={Boolean(startModalId)}
        title="Poner en curso"
        onClose={() => setStartModalId(null)}
      >
        <div className="modalBody">
          <label className="modalField">
            <span className="modalLabel">Fecha de inicio</span>
            <input
              type="date"
              className="modalInput"
              value={startModalDate}
              onChange={(e) => setStartModalDate(e.target.value)}
            />
          </label>
          <div className="modalActions">
            <button type="button" className="btnGhost" onClick={() => setStartModalId(null)}>
              Cancelar
            </button>
            <button type="button" className="btn" onClick={confirmStartPending}>
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(progressModalId)}
        title="Actualizar avance"
        onClose={() => setProgressModalId(null)}
      >
        <div className="modalBody">
          <label className="modalField">
            <span className="modalLabel">Porcentaje de avance</span>
            <div className="modalPctRow">
              <input
                className="modalInput modalPct"
                inputMode="numeric"
                value={String(progressModalPct)}
                onChange={(e) => setProgressModalPct(e.target.value)}
                placeholder="0"
              />
              <span className="modalPctUnit">%</span>
            </div>
          </label>
          <div className="modalActions">
            <button
              type="button"
              className="btnGhost"
              onClick={() => setProgressModalId(null)}
            >
              Cancelar
            </button>
            <button type="button" className="btn" onClick={confirmProgress}>
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
