import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/http";
import { API_BASE_URL } from "../auth/apiFetch";
import { usePermissions } from "../auth/PermissionsProvider";
import { useAgenda } from "../store/agendaStore";
import { useAssignments } from "../store/assignmentStore";
import { useClients } from "../store/clientStore";
import { useInventory } from "../store/inventoryStore";
import { useQuotes } from "../store/quoteStore";
import { useTools } from "../store/toolStore";
import { useWorkers } from "../store/workerStore";

export default function Configuracion() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [seeding, setSeeding] = useState(false);

  const { isMaster } = usePermissions();

  const { refreshProducts } = useInventory();
  const { refreshClients } = useClients();
  const { refreshQuotes } = useQuotes();
  const { refreshTools } = useTools();
  const { refreshWorkers } = useWorkers();
  const { refreshAssignments } = useAssignments();
  const { refreshEvents } = useAgenda();

  useEffect(() => {
    let alive = true;
    setError("");
    apiGet("/api/me")
      .then((data) => {
        if (!alive) return;
        setMe(data);
      })
      .catch((e) => {
        if (!alive) return;
        setError(String(e?.message || "No se pudo cargar /api/me"));
      });
    return () => {
      alive = false;
    };
  }, []);

  const seedDemo = async () => {
    setError("");
    setSeeding(true);
    try {
      await apiPost("/api/admin/seed-demo", {});
      await Promise.all([
        refreshProducts(),
        refreshClients(),
        refreshQuotes(),
        refreshTools(),
        refreshWorkers(),
        refreshAssignments(),
        refreshEvents(),
      ]);
    } catch (e) {
      setError(String(e?.message || "No se pudo ejecutar seed-demo."));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <section style={{ padding: 28 }}>
      <h1 style={{ fontSize: 28, margin: 0 }}>Configuracion</h1>
      <p style={{ marginTop: 6, color: "var(--muted)" }}>
        Conexion y utilidades.
      </p>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--stroke)",
          borderRadius: 16,
          padding: 14,
        }}>
          <div style={{ fontWeight: 700 }}>API</div>
          <div style={{ marginTop: 8, color: "var(--muted)" }}>
            Base URL: <code>{API_BASE_URL || "(sin configurar)"}</code>
          </div>
        </div>

        <div style={{
          background: "var(--card)",
          border: "1px solid var(--stroke)",
          borderRadius: 16,
          padding: 14,
        }}>
          <div style={{ fontWeight: 700 }}>/api/me</div>
          {me ? (
            <div style={{ marginTop: 8, color: "var(--muted)" }}>
              <div>Usuario: <code>{me.username || me.email || me.sub || "-"}</code></div>
              <div>Grupos: <code>{Array.isArray(me.groups) ? me.groups.join(", ") : ""}</code></div>
            </div>
          ) : (
            <div style={{ marginTop: 8, color: "var(--muted)" }}>Cargando...</div>
          )}
        </div>

        <div style={{
          background: "var(--card)",
          border: "1px solid var(--stroke)",
          borderRadius: 16,
          padding: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontWeight: 700 }}>Datos demo</div>
            <div style={{ marginTop: 6, color: "var(--muted)" }}>
              Crea datos iniciales si la base de datos esta vacia.
            </div>
          </div>
          {isMaster && (
            <button type="button" className="btn" onClick={seedDemo} disabled={seeding}>
              {seeding ? "Cargando..." : "Seed demo"}
            </button>
          )}
        </div>

        {error ? <div className="error">{error}</div> : null}
      </div>
    </section>
  );
}
