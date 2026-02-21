import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAgenda } from "../store/agendaStore";
import { useWorkers } from "../store/workerStore";
import "./Agenda.css";

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 19;
const HOUR_HEIGHT = 64;

const dayNames = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODateLocal(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfWeekMonday(d) {
  const date = new Date(d);
  const jsDay = date.getDay();
  const diff = jsDay === 0 ? -6 : 1 - jsDay;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function fmtDay(d) {
  return String(d.getDate());
}

function parseTimeToMinutes(t) {
  const m = String(t || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return NaN;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
  return hh * 60 + mm;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function ModalPortal({ children }) {
  return createPortal(children, document.body);
}

export default function Agenda() {
  const { events, addEvent } = useAgenda();
  const { workers, addWorker } = useWorkers();
  const [weekOffset, setWeekOffset] = useState(0);

  const [assignOpen, setAssignOpen] = useState(false);
  const [workerModalOpen, setWorkerModalOpen] = useState(false);

  const [aTitle, setATitle] = useState("");
  const [aDate, setADate] = useState(toISODateLocal(new Date()));
  const [aStart, setAStart] = useState("09:00");
  const [aEnd, setAEnd] = useState("10:00");
  const [aWorkerId, setAWorkerId] = useState(workers[0]?.id || "");

  const [wName, setWName] = useState("");
  const [wRole, setWRole] = useState("");

  const [modalError, setModalError] = useState("");

  const weekStart = useMemo(() => {
    const base = startOfWeekMonday(new Date());
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const hourCount = DAY_END_HOUR - DAY_START_HOUR;
  const gridHeight = hourCount * HOUR_HEIGHT;
  const pxPerMin = HOUR_HEIGHT / 60;

  const hours = useMemo(() => {
    return Array.from({ length: hourCount + 1 }, (_, i) => DAY_START_HOUR + i);
  }, [hourCount]);

  const eventsByWeekday = useMemo(() => {
    const buckets = Array.from({ length: 7 }, () => []);
    events.forEach((e) => {
      const hasDate = typeof e?.date === "string" && e.date.trim();
      if (hasDate) return;

      const wd = Number(e.weekday);
      if (!Number.isFinite(wd)) return;
      const idx = clamp(wd, 0, 6);
      buckets[idx].push(e);
    });

    buckets.forEach((arr) => {
      arr.sort((a, b) => {
        const am = parseTimeToMinutes(a.start);
        const bm = parseTimeToMinutes(b.start);
        if (!Number.isFinite(am) || !Number.isFinite(bm)) return 0;
        return am - bm;
      });
    });

    return buckets;
  }, [events]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    events.forEach((e) => {
      const date = typeof e?.date === "string" ? e.date.trim() : "";
      if (!date) return;
      const arr = map.get(date) || [];
      arr.push(e);
      map.set(date, arr);
    });

    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const am = parseTimeToMinutes(a.start);
        const bm = parseTimeToMinutes(b.start);
        if (!Number.isFinite(am) || !Number.isFinite(bm)) return 0;
        return am - bm;
      });
    }

    return map;
  }, [events]);

  const workerById = useMemo(() => {
    const map = new Map();
    workers.forEach((w) => map.set(w.id, w));
    return map;
  }, [workers]);

  useEffect(() => {
    if (!aWorkerId && workers.length > 0) setAWorkerId(workers[0].id);
  }, [aWorkerId, workers]);

  useEffect(() => {
    if (!assignOpen && !workerModalOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (workerModalOpen) setWorkerModalOpen(false);
        else setAssignOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assignOpen, workerModalOpen]);

  useEffect(() => {
    const open = assignOpen || workerModalOpen;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [assignOpen, workerModalOpen]);

  const openAssign = () => {
    setModalError("");
    setATitle("");

    const todayIso = toISODateLocal(new Date());
    const inWeek = days.some((d) => toISODateLocal(d) === todayIso);
    setADate(inWeek ? todayIso : toISODateLocal(days[0]));

    setAStart("09:00");
    setAEnd("10:00");
    setAWorkerId(workers[0]?.id || "");
    setAssignOpen(true);
  };

  const saveAssignment = (e) => {
    e.preventDefault();
    setModalError("");

    const title = aTitle.trim();
    const date = String(aDate || "").trim();
    const start = String(aStart || "").trim();
    const end = String(aEnd || "").trim();
    const workerId = String(aWorkerId || "").trim();

    if (!title) return setModalError("Agrega una actividad.");
    if (!date) return setModalError("Selecciona una fecha.");
    if (!workerId) return setModalError("Selecciona un trabajador.");

    const sm = parseTimeToMinutes(start);
    const em = parseTimeToMinutes(end);
    if (!Number.isFinite(sm) || !Number.isFinite(em))
      return setModalError("Horario invalido.");
    if (em <= sm) return setModalError("La hora de fin debe ser mayor.");

    addEvent({
      title,
      date,
      start,
      end,
      tone: "accent",
      workerId,
    });

    setAssignOpen(false);
  };

  const saveWorker = (e) => {
    e.preventDefault();
    setModalError("");

    const name = wName.trim();
    const role = wRole.trim();
    if (!name) return setModalError("El nombre del trabajador es requerido.");

    const created = addWorker({ name, role });
    if (!created) return setModalError("No se pudo agregar (puede que ya exista).");

    setAWorkerId(created.id);
    setWName("");
    setWRole("");
    setWorkerModalOpen(false);
  };

  return (
    <section className="ag">
      <header className="agHeader">
        <div>
          <h1 className="agTitle">Agenda</h1>
          <p className="agSubtitle">Calendario semanal por horario.</p>
        </div>

        <div className="agActions">
          <button type="button" className="btn" onClick={openAssign}>
            Asignar trabajador
          </button>
          <button type="button" className="btnGhost" onClick={() => setWeekOffset(0)}>
            Semana actual
          </button>
          <button type="button" className="btnGhost" onClick={() => setWeekOffset((w) => w - 1)}>
            Anterior
          </button>
          <button type="button" className="btnGhost" onClick={() => setWeekOffset((w) => w + 1)}>
            Siguiente
          </button>
        </div>
      </header>

      <div className="agCard">
        <div className="calWrap" role="region" aria-label="Calendario semanal">
          <div className="cal" style={{ minWidth: 980 }}>
            <div className="calHead">
              <div className="corner" />
              <div className="dayHeadRow">
                {days.map((d, i) => (
                  <div key={i} className="dayHead">
                    <div className="dayName">{dayNames[i]}</div>
                    <div className="dayDate">{fmtDay(d)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="calBody">
              <div className="timeCol" style={{ height: gridHeight }} aria-hidden="true">
                {hours.map((h) => (
                  <div key={h} className="timeTick" style={{ height: HOUR_HEIGHT }}>
                    <span className="timeLabel">{String(h).padStart(2, "0")}:00</span>
                  </div>
                ))}
              </div>

              <div className="daysRow">
                {days.map((_, i) => (
                  <div
                    key={i}
                    className="dayCol"
                    style={{ height: gridHeight }}
                    aria-label={`Dia ${dayNames[i]}`}
                  >
                    {(() => {
                      const dateKey = toISODateLocal(days[i]);
                      const dated = eventsByDate.get(dateKey) || [];
                      const recurring = eventsByWeekday[i] || [];
                      return [...dated, ...recurring];
                    })().map((e) => {
                      const startMin = parseTimeToMinutes(e.start);
                      const endMin = parseTimeToMinutes(e.end);
                      if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) return null;

                      const dayStartMin = DAY_START_HOUR * 60;
                      const dayEndMin = DAY_END_HOUR * 60;

                      const s = clamp(startMin, dayStartMin, dayEndMin);
                      const en = clamp(endMin, dayStartMin, dayEndMin);
                      const dur = Math.max(20, en - s);

                      const top = (s - dayStartMin) * pxPerMin;
                      const height = dur * pxPerMin;

                      return (
                        <div
                          key={e.id}
                          className={`evt ${e.tone || "blue"}`}
                          style={{ top, height }}
                          title={`${e.title} (${e.start} - ${e.end})`}
                        >
                          <div className="evtTitle">{e.title}</div>
                          <div className="evtTime">
                            {e.start} - {e.end}
                            {e.workerId ? (
                              <span className="evtWorker">
                                {" "}
                                · {workerById.get(e.workerId)?.name || "Trabajador"}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="agHint">
          Tip: en telefono puedes deslizar horizontalmente para ver toda la semana.
        </div>
      </div>

      {assignOpen ? (
        <ModalPortal>
          <div
            className="agModal"
            role="dialog"
            aria-modal="true"
            aria-label="Asignar trabajador"
          >
            <button
              type="button"
              className="agModalOverlay"
              onClick={() => setAssignOpen(false)}
              aria-label="Cerrar"
            />
            <div className="agModalCard">
              <div className="agModalTop">
                <div>
                  <div className="agModalTitle">Asignar trabajador</div>
                  <div className="agModalSub">Fecha y horario especifico</div>
                </div>
                <button
                  type="button"
                  className="iconBtn"
                  onClick={() => setAssignOpen(false)}
                  aria-label="Cerrar"
                >
                  X
                </button>
              </div>

              <form className="agModalBody" onSubmit={saveAssignment}>
                <label className="field">
                  <span className="fieldLabel">Actividad</span>
                  <input
                    className="fieldInput"
                    value={aTitle}
                    onChange={(e) => setATitle(e.target.value)}
                    placeholder="Ej: Visita a obra"
                    autoFocus
                  />
                </label>

                <div className="agRow3">
                  <label className="field">
                    <span className="fieldLabel">Fecha</span>
                    <input
                      className="fieldInput"
                      type="date"
                      value={aDate}
                      onChange={(e) => setADate(e.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span className="fieldLabel">Inicio</span>
                    <input
                      className="fieldInput"
                      type="time"
                      value={aStart}
                      onChange={(e) => setAStart(e.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span className="fieldLabel">Fin</span>
                    <input
                      className="fieldInput"
                      type="time"
                      value={aEnd}
                      onChange={(e) => setAEnd(e.target.value)}
                    />
                  </label>
                </div>

                <div className="agWorkerRow">
                  <label className="field agWorkerGrow">
                    <span className="fieldLabel">Trabajador</span>
                    <select
                      className="fieldInput"
                      value={aWorkerId}
                      onChange={(e) => setAWorkerId(e.target.value)}
                    >
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                          {w.role ? ` (${w.role})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    className="btnGhost"
                    onClick={() => {
                      setModalError("");
                      setWorkerModalOpen(true);
                    }}
                  >
                    Agregar trabajador
                  </button>
                </div>

                {modalError ? <div className="error">{modalError}</div> : null}

                <div className="actions">
                  <button
                    type="button"
                    className="btnGhost"
                    onClick={() => setAssignOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      ) : null}

      {workerModalOpen ? (
        <ModalPortal>
          <div
            className="agModal"
            role="dialog"
            aria-modal="true"
            aria-label="Agregar trabajador"
          >
            <button
              type="button"
              className="agModalOverlay"
              onClick={() => setWorkerModalOpen(false)}
              aria-label="Cerrar"
            />
            <div className="agModalCard">
              <div className="agModalTop">
                <div>
                  <div className="agModalTitle">Agregar trabajador</div>
                  <div className="agModalSub">Se guarda solo en este navegador</div>
                </div>
                <button
                  type="button"
                  className="iconBtn"
                  onClick={() => setWorkerModalOpen(false)}
                  aria-label="Cerrar"
                >
                  X
                </button>
              </div>

              <form className="agModalBody" onSubmit={saveWorker}>
                <label className="field">
                  <span className="fieldLabel">Nombre</span>
                  <input
                    className="fieldInput"
                    value={wName}
                    onChange={(e) => setWName(e.target.value)}
                    placeholder="Ej: Ana Garcia"
                    autoFocus
                  />
                </label>

                <label className="field">
                  <span className="fieldLabel">Rol (opcional)</span>
                  <input
                    className="fieldInput"
                    value={wRole}
                    onChange={(e) => setWRole(e.target.value)}
                    placeholder="Ej: Tecnico"
                  />
                </label>

                {modalError ? <div className="error">{modalError}</div> : null}

                <div className="actions">
                  <button
                    type="button"
                    className="btnGhost"
                    onClick={() => setWorkerModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn">
                    Guardar trabajador
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </section>
  );
}
