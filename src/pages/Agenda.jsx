import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAgenda } from "../store/agendaStore";
import { useWorkers } from "../store/workerStore";
import "./Agenda.css";

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 19;
const HOUR_HEIGHT = 64;

const dayNames = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const agendaCategories = [
  { value: "all", label: "Todas" },
  { value: "proyecto", label: "Visita de proyecto" },
  { value: "cotizacion", label: "Visita de cotizacion" },
  { value: "general", label: "General" },
];

function categoryToTone(cat) {
  if (cat === "proyecto") return "accent";
  if (cat === "cotizacion") return "blue";
  return "gray";
}

function categoryLabel(cat) {
  const found = agendaCategories.find((c) => c.value === cat);
  return found ? found.label : "General";
}

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

function fmtDayMonth(d) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
  }).format(d);
}

function fmtWeekRange(days) {
  if (!Array.isArray(days) || days.length === 0) return "";
  const first = days[0];
  const last = days[days.length - 1];
  return `${fmtDayMonth(first)} - ${fmtDayMonth(last)}`;
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

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(value, maxChars = 20) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars || !current) {
      current = next;
      return;
    }
    lines.push(current);
    current = word;
  });

  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function renderSvgText(lines, x, y, lineHeight, className) {
  if (!Array.isArray(lines) || lines.length === 0) return "";
  const tspans = lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight;
      return `<tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join("");
  return `<text x="${x}" y="${y}" class="${className}">${tspans}</text>`;
}

function buildScheduleImageSvg({ worker, weekLabel, days, eventsByDay }) {
  const width = 1560;
  const height = 980;
  const headerHeight = 130;
  const leftCol = 120;
  const topGrid = 220;
  const gridBottom = 900;
  const gridHeight = gridBottom - topGrid;
  const dayWidth = (width - leftCol - 56) / 7;
  const pxPerMin = gridHeight / ((DAY_END_HOUR - DAY_START_HOUR) * 60);
  const hourCount = DAY_END_HOUR - DAY_START_HOUR;
  const hours = Array.from({ length: hourCount + 1 }, (_, i) => DAY_START_HOUR + i);

  const palette = {
    accent: { fill: "#f0b429", stroke: "#f7cf69", tag: "#6a4a00" },
    blue: { fill: "#3d98ff", stroke: "#7bbcff", tag: "#0a3b70" },
    gray: { fill: "#b7c2e6", stroke: "#d7dff5", tag: "#30415f" },
  };

  const bg = [
    `<rect width="${width}" height="${height}" rx="32" fill="#09101d" />`,
    `<rect width="${width}" height="${height}" rx="32" fill="url(#bgGlow)" opacity="0.9" />`,
  ].join("");

  const gridLines = hours
    .map((hour, index) => {
      const y = topGrid + index * (gridHeight / hourCount);
      const label = `${String(hour).padStart(2, "0")}:00`;
      return [
        `<line x1="${leftCol}" y1="${y}" x2="${width - 28}" y2="${y}" stroke="rgba(183,194,230,.18)" />`,
        `<text x="36" y="${y + 5}" class="hourLabel">${label}</text>`,
      ].join("");
    })
    .join("");

  const dayColumns = days
    .map((day, index) => {
      const x = leftCol + index * dayWidth;
      const header = [
        `<rect x="${x + 8}" y="${headerHeight + 22}" width="${dayWidth - 16}" height="70" rx="20" fill="rgba(255,255,255,.04)" stroke="rgba(183,194,230,.16)" />`,
        `<text x="${x + 24}" y="${headerHeight + 50}" class="dayLabel">${escapeXml(dayNames[index])}</text>`,
        `<text x="${x + 24}" y="${headerHeight + 78}" class="dateLabel">${escapeXml(fmtDayMonth(day))}</text>`,
        `<line x1="${x}" y1="${topGrid}" x2="${x}" y2="${gridBottom}" stroke="rgba(183,194,230,.12)" />`,
      ].join("");

      const items = (eventsByDay[index] || [])
        .map((event) => {
          const startMin = parseTimeToMinutes(event.start);
          const endMin = parseTimeToMinutes(event.end);
          if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) return "";

          const dayStartMin = DAY_START_HOUR * 60;
          const dayEndMin = DAY_END_HOUR * 60;
          const s = clamp(startMin, dayStartMin, dayEndMin);
          const en = clamp(endMin, dayStartMin, dayEndMin);
          const dur = Math.max(35, en - s);
          const y = topGrid + (s - dayStartMin) * pxPerMin;
          const h = dur * pxPerMin;
          const tone = palette[event.tone || "blue"] || palette.blue;
          const titleLines = wrapText(event.title, 18);
          const metaLabel = `${event.start} - ${event.end}`;

          return [
            `<rect x="${x + 10}" y="${y}" width="${dayWidth - 20}" height="${h}" rx="18" fill="${tone.fill}" fill-opacity="0.18" stroke="${tone.stroke}" stroke-opacity="0.95" />`,
            renderSvgText(titleLines, x + 24, y + 28, 20, "eventTitle"),
            `<text x="${x + 24}" y="${y + Math.min(h - 28, 92)}" class="eventMeta">${escapeXml(metaLabel)}</text>`,
            `<rect x="${x + 24}" y="${y + h - 34}" width="122" height="22" rx="11" fill="${tone.tag}" fill-opacity="0.16" stroke="${tone.stroke}" stroke-opacity="0.55" />`,
            `<text x="${x + 36}" y="${y + h - 19}" class="eventTag">${escapeXml(categoryLabel(event.category))}</text>`,
          ].join("");
        })
        .join("");

      return header + items;
    })
    .join("");

  const empty = eventsByDay.every((items) => items.length === 0)
    ? `<rect x="${leftCol + 18}" y="${topGrid + 140}" width="${width - leftCol - 54}" height="120" rx="24" fill="rgba(255,255,255,.03)" stroke="rgba(183,194,230,.14)" stroke-dasharray="8 8" />
       <text x="${leftCol + 52}" y="${topGrid + 188}" class="emptyTitle">Sin actividades para esta semana</text>
       <text x="${leftCol + 52}" y="${topGrid + 220}" class="emptyText">Puedes copiar esta imagen y compartirla como evidencia del horario del trabajador.</text>`
    : "";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bgGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#173154" />
          <stop offset="55%" stop-color="#0b1629" />
          <stop offset="100%" stop-color="#102741" />
        </linearGradient>
        <style>
          text { font-family: Arial, sans-serif; fill: #edf3ff; }
          .title { font-size: 40px; font-weight: 700; }
          .sub { font-size: 18px; fill: #b7c2e6; }
          .worker { font-size: 24px; font-weight: 700; }
          .dayLabel { font-size: 22px; font-weight: 700; }
          .dateLabel { font-size: 16px; fill: #b7c2e6; }
          .hourLabel { font-size: 16px; fill: #8ea0c4; }
          .eventTitle { font-size: 19px; font-weight: 700; }
          .eventMeta { font-size: 15px; fill: #dce6ff; }
          .eventTag { font-size: 13px; fill: #edf3ff; font-weight: 600; }
          .emptyTitle { font-size: 28px; font-weight: 700; }
          .emptyText { font-size: 18px; fill: #b7c2e6; }
        </style>
      </defs>
      ${bg}
      <text x="42" y="64" class="title">Horario semanal</text>
      <text x="42" y="98" class="sub">${escapeXml(weekLabel)}</text>
      <text x="1260" y="62" text-anchor="end" class="worker">${escapeXml(worker?.name || "Trabajador")}</text>
      <text x="1260" y="95" text-anchor="end" class="sub">${escapeXml(worker?.role || "Sin rol")}</text>
      ${gridLines}
      <line x1="${width - 28}" y1="${topGrid}" x2="${width - 28}" y2="${gridBottom}" stroke="rgba(183,194,230,.12)" />
      ${dayColumns}
      ${empty}
    </svg>
  `;
}

async function svgToPngFile(svgMarkup) {
  const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo renderizar la imagen."));
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo preparar la imagen.");
    ctx.drawImage(image, 0, 0);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("No se pudo exportar la imagen."));
      }, "image/png");
    });

    return {
      blob,
      url: URL.createObjectURL(blob),
    };
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function ModalPortal({ children }) {
  return createPortal(children, document.body);
}

export default function Agenda() {
  const { events, addEvent } = useAgenda();
  const { workers, addWorker } = useWorkers();
  const [weekOffset, setWeekOffset] = useState(0);

  const [filterWorkerId, setFilterWorkerId] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [assignOpen, setAssignOpen] = useState(false);
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  const [aTitle, setATitle] = useState("");
  const [aDate, setADate] = useState(toISODateLocal(new Date()));
  const [aStart, setAStart] = useState("09:00");
  const [aEnd, setAEnd] = useState("10:00");
  const [aWorkerId, setAWorkerId] = useState(workers[0]?.id || "");
  const [aCategory, setACategory] = useState("proyecto");

  const [wName, setWName] = useState("");
  const [wRole, setWRole] = useState("");

  const [modalError, setModalError] = useState("");
  const [printWorkerId, setPrintWorkerId] = useState("");
  const [printImageUrl, setPrintImageUrl] = useState("");
  const [printError, setPrintError] = useState("");
  const [printBusy, setPrintBusy] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  const printWorker = useMemo(
    () => workers.find((worker) => worker.id === printWorkerId) || null,
    [workers, printWorkerId]
  );

  const printEventsByDay = useMemo(() => {
    if (!printWorkerId) return Array.from({ length: 7 }, () => []);

    return days.map((day, index) => {
      const dateKey = toISODateLocal(day);
      const dated = eventsByDate.get(dateKey) || [];
      const recurring = eventsByWeekday[index] || [];
      return [...dated, ...recurring]
        .filter((event) => event.workerId === printWorkerId)
        .sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start));
    });
  }, [days, eventsByDate, eventsByWeekday, printWorkerId]);

  const matchesFilters = (e) => {
    const workerId = typeof e?.workerId === "string" ? e.workerId.trim() : "";
    const category = typeof e?.category === "string" && e.category.trim() ? e.category.trim() : "general";

    if (filterWorkerId !== "all") {
      if (filterWorkerId === "unassigned") {
        if (workerId) return false;
      } else {
        if (workerId !== filterWorkerId) return false;
      }
    }

    if (filterCategory !== "all") {
      if (category !== filterCategory) return false;
    }

    return true;
  };

  useEffect(() => {
    if (!assignOpen && !workerModalOpen && !printOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (workerModalOpen) setWorkerModalOpen(false);
        else if (printOpen) setPrintOpen(false);
        else setAssignOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assignOpen, workerModalOpen, printOpen]);

  useEffect(() => {
    const open = assignOpen || workerModalOpen || printOpen;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [assignOpen, workerModalOpen, printOpen]);

  useEffect(() => {
    if (!printOpen) return undefined;
    if (!printWorkerId && workers[0]?.id) setPrintWorkerId(workers[0].id);
    return undefined;
  }, [printOpen, printWorkerId, workers]);

  useEffect(() => {
    let active = true;

    async function generatePrintImage() {
      if (!printOpen || !printWorkerId) {
        setPrintImageUrl("");
        setPrintError("");
        return;
      }

      setPrintBusy(true);
      setPrintError("");
      setCopySuccess(false);

      try {
        const svg = buildScheduleImageSvg({
          worker: printWorker,
          weekLabel: fmtWeekRange(days),
          days,
          eventsByDay: printEventsByDay,
        });
        const file = await svgToPngFile(svg);
        if (!active) {
          URL.revokeObjectURL(file.url);
          return;
        }

        setPrintImageUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return file.url;
        });
      } catch (err) {
        if (!active) return;
        setPrintError(String(err?.message || "No se pudo generar la imagen."));
      } finally {
        if (active) setPrintBusy(false);
      }
    }

    generatePrintImage();

    return () => {
      active = false;
    };
  }, [printOpen, printWorkerId, printWorker, days, printEventsByDay]);

  useEffect(() => {
    return () => {
      if (printImageUrl) URL.revokeObjectURL(printImageUrl);
    };
  }, [printImageUrl]);

  const openAssign = () => {
    setModalError("");
    setATitle("");

    const todayIso = toISODateLocal(new Date());
    const inWeek = days.some((d) => toISODateLocal(d) === todayIso);
    setADate(inWeek ? todayIso : toISODateLocal(days[0]));

    setAStart("09:00");
    setAEnd("10:00");
    setAWorkerId(workers[0]?.id || "");
    setACategory("proyecto");
    setAssignOpen(true);
  };

  const openPrintModal = () => {
    setPrintError("");
    setCopySuccess(false);
    const nextWorkerId =
      workers.some((worker) => worker.id === filterWorkerId) ? filterWorkerId : workers[0]?.id || "";
    setPrintWorkerId(nextWorkerId);
    setPrintOpen(true);
  };

  const copyImageToClipboard = async () => {
    if (!printImageUrl) return;
    setPrintError("");
    setCopySuccess(false);

    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        throw new Error("Tu navegador no permite copiar imagenes directamente.");
      }
      const response = await fetch(printImageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type || "image/png"]: blob,
        }),
      ]);
      setCopySuccess(true);
    } catch (err) {
      setPrintError(
        String(err?.message || "No se pudo copiar la imagen. Revisa permisos del portapapeles.")
      );
    }
  };

  const saveAssignment = async (e) => {
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

    try {
      await addEvent({
        title,
        kind: "dated",
        date,
        start,
        end,
        category: aCategory,
        tone: categoryToTone(aCategory),
        workerId,
      });
      setAssignOpen(false);
    } catch (err) {
      setModalError(String(err?.message || "No se pudo guardar el evento."));
    }
  };

  const saveWorker = async (e) => {
    e.preventDefault();
    setModalError("");

    const name = wName.trim();
    const role = wRole.trim();
    if (!name) return setModalError("El nombre del trabajador es requerido.");

    const created = await addWorker({ name, role });
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
          <button type="button" className="btnGhost" onClick={openPrintModal}>
            Imprimir trabajador
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

      <div className="agFilters">
        <label className="agControl">
          <span className="agControlLabel">Trabajador</span>
          <select
            className="agControlField"
            value={filterWorkerId}
            onChange={(e) => setFilterWorkerId(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="unassigned">Sin asignar</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}{w.role ? ` (${w.role})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="agControl">
          <span className="agControlLabel">Categoria</span>
          <select
            className="agControlField"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {agendaCategories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btnGhost"
          onClick={() => {
            setFilterWorkerId("all");
            setFilterCategory("all");
          }}
        >
          Limpiar
        </button>
      </div>

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
                      return [...dated, ...recurring].filter(matchesFilters);
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
                          <div className="evtTag">
                            {categoryLabel(
                              typeof e?.category === "string" && e.category.trim()
                                ? e.category.trim()
                                : "general"
                            )}
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

                <label className="field">
                  <span className="fieldLabel">Categoria</span>
                  <select
                    className="fieldInput"
                    value={aCategory}
                    onChange={(e) => setACategory(e.target.value)}
                  >
                    <option value="proyecto">Visita de proyecto</option>
                    <option value="cotizacion">Visita de cotizacion</option>
                    <option value="general">General</option>
                  </select>
                </label>

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
                  <div className="agModalSub">Se guarda en el sistema</div>
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

      {printOpen ? (
        <ModalPortal>
          <div
            className="agModal"
            role="dialog"
            aria-modal="true"
            aria-label="Imprimir horario por trabajador"
          >
            <button
              type="button"
              className="agModalOverlay"
              onClick={() => setPrintOpen(false)}
              aria-label="Cerrar"
            />
            <div className="agModalCard agPrintCard">
              <div className="agModalTop">
                <div>
                  <div className="agModalTitle">Imprimir por trabajador</div>
                  <div className="agModalSub">Se genera una imagen de la semana seleccionada.</div>
                </div>
                <button
                  type="button"
                  className="iconBtn"
                  onClick={() => setPrintOpen(false)}
                  aria-label="Cerrar"
                >
                  X
                </button>
              </div>

              <div className="agModalBody agPrintBody">
                <div className="agPrintControls">
                  <label className="field agPrintWorkerField">
                    <span className="fieldLabel">Trabajador</span>
                    <select
                      className="fieldInput"
                      value={printWorkerId}
                      onChange={(e) => setPrintWorkerId(e.target.value)}
                    >
                      {workers.map((worker) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.name}
                          {worker.role ? ` (${worker.role})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="agPrintWeek">
                    <span className="fieldLabel">Semana</span>
                    <strong>{fmtWeekRange(days)}</strong>
                  </div>

                  <button
                    type="button"
                    className="btn"
                    onClick={copyImageToClipboard}
                    disabled={!printImageUrl || printBusy || workers.length === 0}
                  >
                    Copiar imagen
                  </button>
                </div>

                {printError ? <div className="error">{printError}</div> : null}
                {copySuccess ? (
                  <div className="success">La imagen ya se copio al portapapeles.</div>
                ) : null}

                {workers.length === 0 ? (
                  <div className="empty agPrintEmpty">Agrega un trabajador antes de imprimir.</div>
                ) : printBusy ? (
                  <div className="empty agPrintEmpty">Generando imagen...</div>
                ) : printImageUrl ? (
                  <div className="agPrintPreviewWrap">
                    <img
                      className="agPrintPreview"
                      src={printImageUrl}
                      alt={`Horario semanal de ${printWorker?.name || "trabajador"}`}
                    />
                  </div>
                ) : (
                  <div className="empty agPrintEmpty">No se pudo generar la vista previa.</div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </section>
  );
}
