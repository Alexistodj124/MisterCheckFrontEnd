import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import "./AppLayout.css";
import { useAuth } from "../auth/AuthProvider";
import { usePermissions } from "../auth/PermissionsProvider";
import logoMC from "../img/logoMC.png";

// Each link declares the permission needed to see it. Links without `perm`
// are always visible. The menu is filtered per role so users only see the
// sections they can actually use.
const links = [
  { to: "/", label: "Inicio" },
  { to: "/inventario", label: "Inventario", perm: "products:read" },
  { to: "/inventario/nuevo", label: "Agregar producto", perm: "products:create" },
  { to: "/cotizaciones/nueva", label: "Cotizaciones", perm: "quotes:create" },
  { to: "/agenda", label: "Agenda", perm: "agenda:read" },
  { to: "/clientes", label: "Clientes", perm: "clients:read" },
  { to: "/reportes", label: "Reportes", perm: "quotes:read" },
  { to: "/herramientas", label: "Herramientas", perm: "tools:read" },
  { to: "/herramientas/asignar", label: "Asignaciones", perm: "assignments:write" },
  { to: "/proyectos/asignar", label: "Proyectos", perm: "project-assignments:write" },
  { to: "/configuracion", label: "Configuracion" },
];

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, auth, login, logout } = useAuth();
  const { can, loaded } = usePermissions();

  // While permissions load, only show unrestricted links to avoid showing
  // sections the user may not be allowed to see.
  const visibleLinks = links.filter(
    (l) => !l.perm || (loaded && can(l.perm))
  );

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
            {visibleLinks.map((l) => (
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
