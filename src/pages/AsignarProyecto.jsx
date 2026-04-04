import { useMemo, useState } from "react";
import { useWorkers } from "../store/workerStore";
import { useQuotes } from "../store/quoteStore";
import { useProjectAssignments } from "../store/projectAssignmentStore";
import "./AsignarProyecto.css";

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function AsignarProyecto() {
  const { workers } = useWorkers();
  const { quotes } = useQuotes();
  const { projectAssignments, assignWorkerToProject, unassignWorkerFromProject } =
    useProjectAssignments();

  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const activeQuotes = useMemo(
    () =>
      quotes
        .filter((q) => q.status === "en_curso")
        .slice()
        .sort((a, b) => Number(a.number) - Number(b.number)),
    [quotes]
  );

  // Map workerId -> assignment
  const assignmentByWorker = useMemo(() => {
    const map = new Map();
    projectAssignments.forEach((a) => map.set(a.workerId, a));
    return map;
  }, [projectAssignments]);

  const filteredWorkers = useMemo(() => {
    const q = normalize(query);
    return workers
      .filter((w) => {
        if (!q) return true;
        return normalize(`${w.name} ${w.role || ""}`).includes(q);
      })
      .slice()
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [workers, query]);

  const stats = useMemo(() => {
    let libre = 0;
    let enEste = 0;
    let enOtro = 0;
    for (const w of workers) {
      const a = assignmentByWorker.get(w.id);
      if (!a) {
        libre++;
      } else if (selectedQuoteId && a.quoteId === selectedQuoteId) {
        enEste++;
      } else {
        enOtro++;
      }
    }
    return { libre, enEste, enOtro };
  }, [workers, assignmentByWorker, selectedQuoteId]);

  const onAssign = async (worker) => {
    setError("");
    if (!selectedQuoteId) {
      setError("Selecciona un proyecto primero.");
      return;
    }
    try {
      await assignWorkerToProject({ workerId: worker.id, quoteId: selectedQuoteId });
    } catch (e) {
      setError(String(e?.message || "No se pudo asignar el trabajador."));
    }
  };

  const onUnassign = async (assignment) => {
    setError("");
    try {
      await unassignWorkerFromProject(assignment.id);
    } catch (e) {
      setError(String(e?.message || "No se pudo desasignar el trabajador."));
    }
  };

  return (
    <section className="ap">
      <header className="apHeader">
        <div>
          <h1 className="apTitle">Trabajadores en proyectos</h1>
          <p className="apSubtitle">
            Asigna trabajadores a proyectos en curso. Un trabajador solo puede estar en un proyecto a la vez.
          </p>
        </div>

        <div className="apStats">
          <div className="statPill statOk">
            <span className="statLabel">Libres</span>
            <span className="statValue">{stats.libre}</span>
          </div>
          {selectedQuoteId ? (
            <div className="statPill statAccent">
              <span className="statLabel">En este proyecto</span>
              <span className="statValue">{stats.enEste}</span>
            </div>
          ) : null}
          <div className="statPill statWarn">
            <span className="statLabel">En otro proyecto</span>
            <span className="statValue">{stats.enOtro}</span>
          </div>
        </div>
      </header>

      <div className="apControls">
        <label className="control controlGrow">
          <span className="controlLabel">Proyecto en curso</span>
          <select
            value={selectedQuoteId}
            onChange={(e) => setSelectedQuoteId(e.target.value)}
            className="controlField"
          >
            <option value="">Todos los proyectos</option>
            {activeQuotes.map((q) => (
              <option key={q.id} value={q.id}>
                #{q.number} — {q.clientName}
                {q.projectDesc ? ` · ${q.projectDesc}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="control controlGrow">
          <span className="controlLabel">Buscar trabajador</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="controlField"
            placeholder="Buscar por nombre o rol..."
            inputMode="search"
          />
        </label>

        <button
          type="button"
          className="btnGhost"
          onClick={() => {
            setQuery("");
            setError("");
          }}
        >
          Limpiar
        </button>
      </div>

      {error ? <div className="apError">{error}</div> : null}

      {activeQuotes.length === 0 ? (
        <div className="apEmpty">No hay proyectos en curso. Inicia un proyecto primero.</div>
      ) : null}

      <div className="apWorkerList">
        {filteredWorkers.length === 0 ? (
          <div className="apEmpty">No hay trabajadores que coincidan.</div>
        ) : (
          filteredWorkers.map((worker) => {
            const assignment = assignmentByWorker.get(worker.id);
            const isOnThisProject =
              assignment && selectedQuoteId && assignment.quoteId === selectedQuoteId;
            const isOnOtherProject =
              assignment && (!selectedQuoteId || assignment.quoteId !== selectedQuoteId);
            const isFree = !assignment;

            let stateClass = "workerFree";
            if (isOnThisProject) stateClass = "workerOnThis";
            else if (isOnOtherProject) stateClass = "workerOnOther";

            return (
              <div key={worker.id} className={`workerCard ${stateClass}`}>
                <div className="workerInfo">
                  <div className="workerName">{worker.name}</div>
                  {worker.role ? (
                    <div className="workerRole">{worker.role}</div>
                  ) : null}
                  {isOnThisProject ? (
                    <div className="workerStatus statusOnThis">En este proyecto</div>
                  ) : isOnOtherProject ? (
                    <div className="workerStatus statusOnOther">
                      En: #{assignment.quoteNumber} — {assignment.quoteClientName}
                    </div>
                  ) : (
                    <div className="workerStatus statusFree">Libre</div>
                  )}
                </div>

                <div className="workerActions">
                  {isFree ? (
                    <button
                      type="button"
                      className="btn"
                      disabled={!selectedQuoteId}
                      onClick={() => onAssign(worker)}
                    >
                      Asignar
                    </button>
                  ) : isOnThisProject ? (
                    <button
                      type="button"
                      className="btnGhost"
                      onClick={() => onUnassign(assignment)}
                    >
                      Desasignar
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
