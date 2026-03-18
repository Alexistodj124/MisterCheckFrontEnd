import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import "./AppLayout.css";
import { useAuth } from "../auth/AuthProvider";
import logoMC from "../img/logoMC.png";

const links = [
  { to: "/", label: "Inicio" },
  { to: "/inventario", label: "Inventario" },
  { to: "/inventario/nuevo", label: "Agregar producto" },
  { to: "/cotizaciones/nueva", label: "Cotizaciones" },
  { to: "/agenda", label: "Agenda" },
  { to: "/clientes", label: "Clientes" },
  { to: "/reportes", label: "Reportes" },
  { to: "/herramientas", label: "Herramientas" },
  { to: "/herramientas/asignar", label: "Asignaciones" },
  { to: "/configuracion", label: "Configuracion" },
];

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, auth, login, logout } = useAuth();

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">
            <img className="brandLogo" src={logoMC} alt="MisterCheck" />
          </div>

          <div className="topbarAuth" style={{ marginLeft: "auto", marginRight: 12 }}>
            {isAuthenticated ? (
              <button type="button" className="btnGhost" onClick={logout}>
                Cerrar sesion{auth?.email ? ` (${auth.email})` : ""}
              </button>
            ) : (
              <button type="button" className="btn" onClick={login}>
                Iniciar sesion
              </button>
            )}
          </div>

          <button
            type="button"
            className="menuBtn"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="menuIcon" aria-hidden="true" />
            Menu
          </button>

          {menuOpen ? (
            <button
              type="button"
              className="navOverlay"
              aria-label="Cerrar menu"
              onClick={() => setMenuOpen(false)}
            />
          ) : null}

          <nav
            className={"nav" + (menuOpen ? " isOpen" : "")}
            aria-label="Navegacion"
          >
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  "navLink" + (isActive ? " isActive" : "")
                }
                end={l.to === "/"}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
