import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./AppLayout.css";

const links = [
  { to: "/", label: "Inicio" },
  { to: "/inventario", label: "Inventario" },
  { to: "/inventario/nuevo", label: "Agregar producto" },
  { to: "/cotizaciones/nueva", label: "Cotizaciones" },
  { to: "/clientes", label: "Clientes" },
  { to: "/reportes", label: "Reportes" },
  { to: "/configuracion", label: "Configuracion" },
];

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">
            <span className="brandMark" aria-hidden="true" />
            <span className="brandText">MisterCheck</span>
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
