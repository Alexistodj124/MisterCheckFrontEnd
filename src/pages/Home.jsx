import { Link } from "react-router-dom";
import "./Home.css";

const items = [
  { to: "/inventario", title: "Inventario", desc: "Productos disponibles y stock." },
  {
    to: "/inventario/nuevo",
    title: "Agregar producto",
    desc: "Carga de nuevos productos e imagen.",
  },
  {
    to: "/cotizaciones/nueva",
    title: "Cotizaciones",
    desc: "Crea cotizaciones por cliente.",
  },
  { to: "/clientes", title: "Clientes", desc: "Alta, edicion y consulta rapida." },
  { to: "/reportes", title: "Reportes", desc: "Resumenes y exportaciones." },
  { to: "/configuracion", title: "Configuracion", desc: "Preferencias del sistema." },
];

export default function Home() {
  return (
    <section className="home">
      <div className="hero">
        <h1 className="title">Menu principal</h1>
        <p className="subtitle">Elige una seccion para comenzar.</p>
      </div>

      <div className="grid">
        {items.map((it) => (
          <Link key={it.to} to={it.to} className="card">
            <div className="cardTitle">{it.title}</div>
            <div className="cardDesc">{it.desc}</div>
            <div className="cardCta">Entrar</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
