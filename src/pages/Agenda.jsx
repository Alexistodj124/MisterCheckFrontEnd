import { useMemo, useState } from "react";
import { useAgenda } from "../store/agendaStore";
import "./Agenda.css";

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 19;
const HOUR_HEIGHT = 64;

const dayNames = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

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

export default function Agenda() {
  const { events } = useAgenda();
  const [weekOffset, setWeekOffset] = useState(0);

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

  return (
    <section className="ag">
      <header className="agHeader">
        <div>
          <h1 className="agTitle">Agenda</h1>
          <p className="agSubtitle">Calendario semanal por horario.</p>
        </div>

        <div className="agActions">
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
                    {eventsByWeekday[i].map((e) => {
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
    </section>
  );
}
