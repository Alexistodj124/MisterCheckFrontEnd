import { useMemo, useState } from "react";
import { useClients } from "../store/clientStore";
import "./Clientes.css";

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function Clientes() {
  const { clients, addClient, updateClient, removeClient, loading, error } = useClients();
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [localError, setLocalError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query);
    return clients
      .filter((c) => {
        if (!q) return true;
        return normalize(c?.name).includes(q);
      })
      .slice()
      .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
  }, [clients, query]);

  const onAdd = async () => {
    setLocalError("");
    const name = String(newName || "").trim();
    if (!name) return setLocalError("El nombre es requerido.");
    try {
      const created = await addClient(name);
      if (!created) return setLocalError("No se pudo crear (puede que ya exista).");
      setNewName("");
    } catch (e) {
      setLocalError(String(e?.message || "No se pudo crear el cliente."));
    }
  };

  const onStartEdit = (c) => {
    setLocalError("");
    setEditingId(c.id);
    setEditingName(String(c?.name || ""));
  };

  const onSaveEdit = async () => {
    setLocalError("");
    if (!editingId) return;
    const name = String(editingName || "").trim();
    if (!name) return setLocalError("El nombre es requerido.");
    try {
      await updateClient(editingId, { name });
      setEditingId(null);
      setEditingName("");
    } catch (e) {
      setLocalError(String(e?.message || "No se pudo guardar."));
    }
  };

  return (
    <section className="cli">
      <header className="cliHeader">
        <div>
          <h1 className="cliTitle">Clientes</h1>
          <p className="cliSubtitle">Alta, edicion y consulta rapida.</p>
        </div>
        <div className="cliHeaderRight">
          <div className="statPill">
            <span className="statLabel">Clientes</span>
            <span className="statValue">{clients.length}</span>
          </div>
        </div>
      </header>

      <div className="cliControls">
        <label className="control controlGrow">
          <span className="controlLabel">Buscar</span>
          <input
            className="controlField"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente..."
            inputMode="search"
          />
        </label>
        <button type="button" className="btnGhost" onClick={() => setQuery("")}>
          Limpiar
        </button>
      </div>

      <div className="cliCard">
        <div className="cliAddRow">
          <input
            className="cliAddInput"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del cliente"
          />
          <button type="button" className="btn" onClick={onAdd} disabled={loading}>
            Agregar
          </button>
        </div>

        {localError || error ? <div className="error">{localError || error}</div> : null}

        <div className="cliHead" aria-label="Encabezado">
          <div>Cliente</div>
          <div className="colActions">Acciones</div>
        </div>

        <div className="cliTable" role="table" aria-label="Clientes">
          {filtered.length === 0 ? (
            <div className="cliEmpty">{loading ? "Cargando..." : "No hay clientes."}</div>
          ) : (
            filtered.map((c) => {
              const isEditing = editingId === c.id;
              return (
                <div className="cliRow" key={c.id} role="row">
                  <div className="cellMain" role="cell">
                    {isEditing ? (
                      <input
                        className="cliEditInput"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div className="cliName">{c.name}</div>
                    )}
                  </div>

                  <div className="cell colActions" role="cell">
                    {isEditing ? (
                      <>
                        <button type="button" className="btn" onClick={onSaveEdit}>
                          Guardar
                        </button>
                        <button
                          type="button"
                          className="btnGhost"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                            setLocalError("");
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="btnGhost" onClick={() => onStartEdit(c)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btnGhost btnDangerSoft"
                          onClick={async () => {
                            setLocalError("");
                            try {
                              await removeClient(c.id);
                            } catch (e) {
                              setLocalError(String(e?.message || "No se pudo eliminar."));
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
