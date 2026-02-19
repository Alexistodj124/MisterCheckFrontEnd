import { NavLink, Outlet } from "react-router-dom";
import "./AppLayout.css";

const links = [
  { to: "/", label: "Inicio" },
  { to: "/inventario", label: "Inventario" },
  { to: "/clientes", label: "Clientes" },
  { to: "/reportes", label: "Reportes" },
  { to: "/configuracion", label: "Configuracion" },
];

export default function AppLayout() {
  return (
    <div className="appShell">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">
            <span className="brandMark" aria-hidden="true" />
            <span className="brandText">MisterCheck</span>
          </div>

          <nav className="nav">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  "navLink" + (isActive ? " isActive" : "")
                }
                end={l.to === "/"}
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
