import { useEffect, useState } from 'react';
import logoMC from '../../img/logoMC.png';
import './LandingPage.css';

/* ─── Inline SVG Icons ───────────────────────────────────────── */
const Icon = {
  Shield: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Award: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
  FileCheck: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/>
    </svg>
  ),
  Layers: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Droplet: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  PaintRoller: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="14" height="6" rx="1"/><path d="M17 6h3a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/><line x1="12" y1="12" x2="12" y2="20"/><line x1="9" y1="20" x2="15" y2="20"/>
    </svg>
  ),
  Wrench: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  Building: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Settings: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Sparkle: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c-1 4-4 5-5 8 0 3 2 5 5 5s5-2 5-5c-1-3-4-4-5-8z"/><path d="M12 16v6"/><path d="M8 20h8"/>
    </svg>
  ),
  ShieldOff: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v5"/><line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
  ),
  Shovel: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22l10-10"/><path d="M16 8l-2 2-4-4 2-2a4 4 0 0 1 4 4z"/><path d="M10 12l6 6a2 2 0 0 0 3-3l-6-6"/>
    </svg>
  ),
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Roof: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 10 12 2 21 10"/><rect x="5" y="10" width="14" height="12" rx="1"/>
    </svg>
  ),
  Wall: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="4" rx="1"/><rect x="2" y="10" width="9" height="4" rx="1"/><rect x="13" y="10" width="9" height="4" rx="1"/><rect x="2" y="16" width="20" height="4" rx="1"/>
    </svg>
  ),
  Water: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><path d="M8 16s1 2 4 2 4-2 4-2" strokeOpacity="0.6"/>
    </svg>
  ),
  Tool: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  Outdoor: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Phone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.09 6.09l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/>
    </svg>
  ),
  Mail: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/>
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  WaIcon: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  ),
  MailSend: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  ClipboardList: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  Clock: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  CreditCard: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  PlusCircle: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
};

/* ─── Data ───────────────────────────────────────────────────── */
const TRUST_ITEMS = [
  { icon: <Icon.FileCheck />, label: 'Cotización formal',    text: 'Documento detallado con alcances, tiempos y condiciones. Sin letra pequeña.' },
  { icon: <Icon.Award />,     label: 'Garantía por trabajo', text: 'Cada proyecto incluye garantía según el tipo de trabajo realizado.' },
  { icon: <Icon.Shield />,    label: 'Aprobación por escrito', text: 'Ningún trabajo adicional se ejecuta sin su aprobación previa.' },
  { icon: <Icon.Layers />,    label: 'Solución integral',    text: 'Evaluamos, cotizamos y ejecutamos. Un solo equipo, todo el proceso.' },
];

const SERVICES = [
  { icon: <Icon.Droplet />,    title: 'Impermeabilización',          desc: 'Protección total para terrazas, techos, teja, paredes y áreas expuestas. Sellado elastomérico y soluciones preventivas contra filtraciones.' },
  { icon: <Icon.PaintRoller />,title: 'Pintura profesional',         desc: 'Pintura de paredes interiores y exteriores, terrazas y áreas de obra. Preparación de superficie, acabado uniforme y duradero.' },
  { icon: <Icon.Wrench />,     title: 'Reparación de grietas',       desc: 'Diagnóstico y sellado de grietas en paredes, losas y superficies. Trabajo correctivo y preventivo para garantizar durabilidad.' },
  { icon: <Icon.Building />,   title: 'Muros y obra civil',          desc: 'Levantado de muros perimetrales, muros de contención, rampas, muros prefabricados y blocon. Construcción sólida y técnica.' },
  { icon: <Icon.Settings />,   title: 'Mantenimiento correctivo',    desc: 'Mantenimiento de ventanas, drenajes y aplicación de silicón. Atención rápida a fallas y detalles que afectan su propiedad.' },
  { icon: <Icon.Sparkle />,    title: 'Limpieza hidroneumática',     desc: 'Limpieza profunda con equipo especializado. Eliminación de moho, hongos, algas y musgo en terrazas, techos y fachadas.' },
  { icon: <Icon.ShieldOff />,  title: 'Eliminación de humedad',      desc: 'Tratamiento específico contra moho, hongos y filtraciones activas. Diagnóstico en sitio y solución definitiva.' },
  { icon: <Icon.Shovel />,     title: 'Excavación y adoquín',        desc: 'Excavación, relleno y compactación. Instalación de adoquín y trabajos de obra exterior bajo especificaciones del proyecto.' },
];

const PROCESS_STEPS = [
  { num: '01', title: 'Visita técnica',    desc: 'Evaluamos su propiedad en sitio, sin costo ni compromiso.' },
  { num: '02', title: 'Cotización formal', desc: 'Entregamos documento detallado con alcances y costos.' },
  { num: '03', title: 'Aprobación',        desc: 'Usted revisa, aprueba y definimos fecha de inicio.' },
  { num: '04', title: 'Ejecución',         desc: 'Nuestro equipo trabaja con orden, limpieza y puntualidad.' },
  { num: '05', title: 'Entrega',           desc: 'Verificamos los resultados juntos. Garantía incluida.' },
];

const PROJECTS = [
  { icon: <Icon.Home />,    name: 'Residencias',             sub: 'Mantenimiento y mejora integral' },
  { icon: <Icon.Roof />,    name: 'Terrazas y techos',       sub: 'Impermeabilización y pintura' },
  { icon: <Icon.Wall />,    name: 'Muros perimetrales',      sub: 'Construcción y refuerzo' },
  { icon: <Icon.Water />,   name: 'Filtraciones y humedad',  sub: 'Diagnóstico y solución definitiva' },
  { icon: <Icon.Tool />,    name: 'Mantenimiento correctivo',sub: 'Reparaciones puntuales y preventivas' },
  { icon: <Icon.Outdoor />, name: 'Obra exterior',           sub: 'Adoquín, rampas y excavación' },
];

const CONDITIONS = [
  {
    icon: <Icon.CreditCard />,
    title: 'Forma de pago por proyecto',
    text: 'Se trabaja con anticipo inicial y pagos por avance o al finalizar, según acuerdo establecido en la cotización.',
  },
  {
    icon: <Icon.PlusCircle />,
    title: 'Trabajos adicionales',
    text: 'Cualquier trabajo fuera del alcance cotizado se presenta como propuesta adicional y se ejecuta únicamente con su aprobación.',
  },
  {
    icon: <Icon.Award />,
    title: 'Garantía según trabajo',
    text: 'Cada servicio incluye garantía de acuerdo al tipo de trabajo realizado, especificada en el documento de cotización.',
  },
  {
    icon: <Icon.Clock />,
    title: 'Tiempos estimados',
    text: 'Los plazos de ejecución se definen en la cotización según el alcance del proyecto. Comunicamos cualquier variación con anticipación.',
  },
];

const WA_LINK  = 'https://wa.me/50247488744?text=Hola%2C%20me%20interesa%20solicitar%20una%20cotizaci%C3%B3n%20con%20Mister%20Check.';
const MAIL_LINK = 'mailto:mistercheckguatemala@gmail.com?subject=Solicitud%20de%20cotizaci%C3%B3n%20-%20Mister%20Check';

/* ─── Navbar ─────────────────────────────────────────────────── */
function Navbar({ scrolled }) {
  const [open, setOpen] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setOpen(false);
  };

  const navItems = [
    { label: 'Servicios',  id: 'servicios' },
    { label: 'Proceso',    id: 'proceso'   },
    { label: 'Proyectos',  id: 'proyectos' },
    { label: 'Contacto',   id: 'contacto'  },
  ];

  return (
    <>
      <header className={`lNav${scrolled ? ' scrolled' : ''}`} role="banner">
        <div className="lNavInner">
          <img src={logoMC} alt="Mister Check" className="lNavLogo" />

          <nav className="lNavLinks" aria-label="Navegación principal">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="lNavBtn"
                onClick={() => scrollTo(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="lNavCta">
            Solicitar cotización <Icon.ArrowRight />
          </a>

          <button
            type="button"
            className={`lHamburger${open ? ' open' : ''}`}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="lHamLine" />
            <span className="lHamLine" />
            <span className="lHamLine" />
          </button>
        </div>
      </header>

      <div className={`lMobileMenu${open ? ' open' : ''}`} role="navigation" aria-label="Menú móvil">
        {navItems.map((item) => (
          <button key={item.id} type="button" className="lMobileNavBtn" onClick={() => scrollTo(item.id)}>
            {item.label}
          </button>
        ))}
        <div className="lMobileCtaRow">
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="lMobileCtaBtn green">
            <Icon.WaIcon /> WhatsApp — Cotizar ahora
          </a>
          <a href={MAIL_LINK} className="lMobileCtaBtn blue">
            <Icon.MailSend /> Enviar correo
          </a>
        </div>
      </div>
    </>
  );
}

/* ─── Hero ───────────────────────────────────────────────────── */
function HeroSection() {
  const scrollToServices = () =>
    document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="inicio" className="lHero" aria-label="Inicio">
      <div className="lHeroInner">
        {/* Text side */}
        <div>
          <div className="lHeroBadge reveal">
            <span className="lHeroBadgeDot" />
            Proyectos y Multiservicios · Guatemala
          </div>

          <h1 className="lHeroH1 reveal" style={{ transitionDelay: '0.08s' }}>
            Protegemos y<br />
            <em>transformamos</em><br />
            su propiedad
          </h1>

          <p className="lHeroSub reveal" style={{ transitionDelay: '0.16s' }}>
            Impermeabilización, pintura, muros, mantenimiento correctivo y obra civil ligera.
            Cotización formal, aprobación por escrito y garantía en cada proyecto.
          </p>

          <div className="lHeroActions reveal" style={{ transitionDelay: '0.22s' }}>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="lBtnPrimary">
              <Icon.WaIcon /> Solicitar cotización
            </a>
            <button type="button" className="lBtnSecondary" onClick={scrollToServices}>
              Ver servicios <Icon.ArrowRight />
            </button>
          </div>
        </div>

        {/* Visual panel */}
        <div className="lHeroVisual">
          <div className="lHeroOrbit1" aria-hidden="true" />
          <div className="lHeroOrbit2" aria-hidden="true" />

          <div className="lHeroCard reveal-right" style={{ transitionDelay: '0.15s' }}>
            <div className="lHeroCardHeader">
              <div className="lHeroCardDots">
                <span className="lHeroCardDot r" />
                <span className="lHeroCardDot y" />
                <span className="lHeroCardDot g" />
              </div>
              <span className="lHeroCardTitle">SERVICIOS INCLUIDOS</span>
            </div>

            {[
              { cls: 'blue',  emoji: '💧', name: 'Impermeabilización',       tag: 'Activo' },
              { cls: 'green', emoji: '🎨', name: 'Pintura profesional',       tag: 'Activo' },
              { cls: 'warm',  emoji: '🏗️', name: 'Muros y obra civil',        tag: 'Activo' },
              { cls: 'cyan',  emoji: '🔧', name: 'Mantenimiento correctivo',  tag: 'Activo' },
              { cls: 'blue',  emoji: '✨', name: 'Limpieza hidroneumática',   tag: 'Activo' },
            ].map((s) => (
              <div className="lHeroServiceRow" key={s.name}>
                <div className={`lHeroServiceIcon ${s.cls}`} aria-hidden="true">
                  {s.emoji}
                </div>
                <span className="lHeroServiceName">{s.name}</span>
                <span className="lHeroServiceTag">{s.tag}</span>
              </div>
            ))}

            <div className="lHeroCardFooter">
              <span className="lHeroCardFooterLabel">Mister Check · Guatemala</span>
              <span className="lHeroCardBadge">
                <Icon.Check /> Con garantía
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Trust Bar ──────────────────────────────────────────────── */
function TrustSection() {
  return (
    <section className="lTrust" aria-label="Nuestros diferenciales">
      <div className="lTrustGrid">
        {TRUST_ITEMS.map((item, i) => (
          <div
            key={item.label}
            className="lTrustCard reveal"
            style={{ transitionDelay: `${i * 0.09}s` }}
          >
            <div className="lTrustIconWrap" aria-hidden="true">{item.icon}</div>
            <p className="lTrustLabel">{item.label}</p>
            <p className="lTrustText">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Services ───────────────────────────────────────────────── */
function ServicesSection() {
  return (
    <section id="servicios" className="lSec" aria-label="Servicios">
      <div className="lContainer">
        <div className="lSecHeader center">
          <span className="lSecTag reveal">Lo que hacemos</span>
          <h2 className="lSecTitle reveal" style={{ transitionDelay: '0.06s' }}>
            Servicios especializados<br />para cada necesidad
          </h2>
          <p className="lSecDesc reveal" style={{ transitionDelay: '0.12s' }}>
            Desde impermeabilización y pintura hasta construcción y mantenimiento correctivo.
            Cada trabajo se cotiza formalmente y se ejecuta con rigor técnico.
          </p>
        </div>

        <div className="lServicesGrid">
          {SERVICES.map((s, i) => (
            <div
              key={s.title}
              className="lServiceCard reveal"
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              <div className="lServiceIconWrap" aria-hidden="true">{s.icon}</div>
              <h3 className="lServiceCardTitle">{s.title}</h3>
              <p className="lServiceCardDesc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Process ────────────────────────────────────────────────── */
function ProcessSection() {
  return (
    <section id="proceso" className="lSec lSecAlt" aria-label="Cómo trabajamos">
      <div className="lContainer">
        <div className="lSecHeader center">
          <span className="lSecTag reveal">Nuestro proceso</span>
          <h2 className="lSecTitle reveal" style={{ transitionDelay: '0.06s' }}>
            Así trabajamos, paso a paso
          </h2>
          <p className="lSecDesc reveal" style={{ transitionDelay: '0.12s' }}>
            Un proceso claro, ordenado y sin sorpresas. Desde la visita técnica hasta la entrega
            con garantía. Usted siempre sabe qué se hace, cuándo y por qué.
          </p>
        </div>

        <div className="lProcessTrack" role="list">
          {PROCESS_STEPS.map((step, i) => (
            <div
              key={step.num}
              className="lProcessStep reveal"
              style={{ transitionDelay: `${i * 0.09}s` }}
              role="listitem"
            >
              <div className="lProcessNum" aria-hidden="true">{step.num}</div>
              <div className="lProcessBody">
                <p className="lProcessStepTitle">{step.title}</p>
                <p className="lProcessStepDesc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Projects ───────────────────────────────────────────────── */
function ProjectsSection() {
  return (
    <section id="proyectos" className="lSec" aria-label="Tipos de proyecto">
      <div className="lContainer">
        <div className="lSecHeader">
          <span className="lSecTag reveal">Alcance de trabajo</span>
          <h2 className="lSecTitle reveal" style={{ transitionDelay: '0.06s' }}>
            Proyectos que ejecutamos
          </h2>
          <p className="lSecDesc reveal" style={{ transitionDelay: '0.12s' }}>
            Trabajamos en una amplia variedad de tipos de proyecto. Si tiene una necesidad específica,
            contáctenos y le enviamos cotización formal sin compromiso.
          </p>
        </div>

        <div className="lProjectsGrid">
          {PROJECTS.map((p, i) => (
            <div
              key={p.name}
              className="lProjectCard reveal"
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              <div className="lProjectCardBg" aria-hidden="true" />
              <div className="lProjectCardPattern" aria-hidden="true" />
              <div className="lProjectCardOverlay" aria-hidden="true" />
              <div className="lProjectCardContent">
                <div className="lProjectCardIconRow" aria-hidden="true">{p.icon}</div>
                <p className="lProjectCardName">{p.name}</p>
                <p className="lProjectCardSub">{p.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Conditions ─────────────────────────────────────────────── */
function ConditionsSection() {
  return (
    <section className="lSec lSecDark" aria-label="Condiciones comerciales">
      <div className="lContainer">
        <div className="lSecHeader center">
          <span className="lSecTag reveal">Transparencia total</span>
          <h2 className="lSecTitle reveal" style={{ transitionDelay: '0.06s' }}>
            Cómo operamos comercialmente
          </h2>
          <p className="lSecDesc reveal" style={{ transitionDelay: '0.12s' }}>
            Queremos que conozca exactamente cómo funciona cada proyecto antes de comenzar.
            Sin sorpresas, sin letra pequeña.
          </p>
        </div>

        <div className="lCondGrid">
          {CONDITIONS.map((c, i) => (
            <div
              key={c.title}
              className="lCondCard reveal"
              style={{ transitionDelay: `${i * 0.09}s` }}
            >
              <div className="lCondIconWrap" aria-hidden="true">{c.icon}</div>
              <div>
                <p className="lCondTitle">{c.title}</p>
                <p className="lCondText">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ──────────────────────────────────────────────── */
function CtaSection() {
  return (
    <section id="contacto" className="lCtaSection" aria-label="Contacto">
      <div className="lContainer">
        <h2 className="lCtaTitle reveal">
          ¿Listo para empezar<br />su <em>próximo proyecto</em>?
        </h2>
        <p className="lCtaSub reveal" style={{ transitionDelay: '0.08s' }}>
          Contáctenos hoy para coordinar una visita técnica gratuita y recibir
          su cotización formal. Respuesta rápida garantizada.
        </p>

        <div className="lCtaButtons reveal" style={{ transitionDelay: '0.14s' }}>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="lBtnWa">
            <Icon.WaIcon /> Escribir por WhatsApp
          </a>
          <a href={MAIL_LINK} className="lBtnEmail">
            <Icon.MailSend /> Enviar correo
          </a>
        </div>

        <p className="lCtaNote reveal" style={{ transitionDelay: '0.2s' }}>
          Atención disponible de lunes a sábado · Respuesta en menos de 24 horas
        </p>
        <p className="lCtaContact reveal" style={{ transitionDelay: '0.24s' }}>
          <strong>Carlos Solórzano</strong> — Gerente de Proyectos · 4748 8744
        </p>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────── */
function FooterSection() {
  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <footer className="lFooter" role="contentinfo">
      <div className="lFooterTop">
        {/* Brand col */}
        <div className="lFooterBrandCol">
          <img src={logoMC} alt="Mister Check" className="lFooterLogo" />
          <p className="lFooterBrandDesc">
            Empresa guatemalteca especializada en proyectos de impermeabilización, pintura,
            construcción y multiservicios. Cotización formal sin compromiso.
          </p>
        </div>

        {/* Nav col */}
        <div>
          <span className="lFooterColTitle">Navegación</span>
          <div className="lFooterLinks">
            {[
              { label: 'Servicios',  id: 'servicios' },
              { label: 'Proceso',    id: 'proceso'   },
              { label: 'Proyectos',  id: 'proyectos' },
              { label: 'Contacto',   id: 'contacto'  },
            ].map((l) => (
              <button key={l.id} type="button" className="lFooterNavBtn" onClick={() => scrollTo(l.id)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact col */}
        <div>
          <span className="lFooterColTitle">Contacto</span>

          <div className="lFooterContactRow">
            <span className="lFooterContactIcon"><Icon.Phone /></span>
            <span className="lFooterContactText">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer">4748 8744</a>
            </span>
          </div>

          <div className="lFooterContactRow">
            <span className="lFooterContactIcon"><Icon.Mail /></span>
            <span className="lFooterContactText">
              <a href={MAIL_LINK}>mistercheckguatemala@gmail.com</a>
            </span>
          </div>

          <div className="lFooterContactRow">
            <span className="lFooterContactIcon"><Icon.User /></span>
            <span className="lFooterContactText">
              Carlos Solórzano<br />Gerente de Proyectos
            </span>
          </div>

          <div className="lFooterContactRow">
            <span className="lFooterContactIcon"><Icon.MapPin /></span>
            <span className="lFooterContactText">Guatemala</span>
          </div>
        </div>
      </div>

      <div className="lFooterBottom">
        <p className="lFooterCopy">
          © {new Date().getFullYear()} <strong>Mister Check</strong> · Proyectos y Multiservicios. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  /* Navbar scroll detection */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* IntersectionObserver for reveal animations */
  useEffect(() => {
    const selectors = '.landing .reveal, .landing .reveal-left, .landing .reveal-right';
    const els = document.querySelectorAll(selectors);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* SEO — page title */
  useEffect(() => {
    const prev = document.title;
    document.title = 'Mister Check | Impermeabilización, pintura, muros y multiservicios en Guatemala';
    const meta = document.createElement('meta');
    meta.name = 'description';
    meta.content = 'Mister Check — Proyectos y Multiservicios en Guatemala. Impermeabilización, pintura, reparación de grietas, muros, mantenimiento correctivo y obra civil. Cotización formal sin compromiso.';
    document.head.appendChild(meta);
    return () => {
      document.title = prev;
      meta.remove();
    };
  }, []);

  return (
    <div className="landing">
      <Navbar scrolled={scrolled} />
      <HeroSection />
      <TrustSection />
      <ServicesSection />
      <ProcessSection />
      <ProjectsSection />
      <ConditionsSection />
      <CtaSection />
      <FooterSection />
    </div>
  );
}
