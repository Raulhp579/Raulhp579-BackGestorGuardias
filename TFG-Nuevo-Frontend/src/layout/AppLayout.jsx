import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/AppLayout.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // 1) auth y user: 
  const rawAuth = localStorage.getItem("auth");

  let authData = null;
  try {
    const parsed = rawAuth ? JSON.parse(rawAuth) : null;
    authData = parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    authData = null;
  }

  const user = {
    name: authData?.name ?? "Usuario",
    email: authData?.email ?? "",
    avatarUrl: authData?.avatarUrl ?? "",
  };

  // 2) logout 
  function logout() {
    localStorage.removeItem("auth");
    navigate("/login");
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="appShell">
      {/* Sidebar */}
      <aside className={`appSidebar ${open ? "open" : ""}`}>
        <div className="appSidebarBrand">
          <svg className="appSidebarLogo" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2L2 22h20L12 2zm0 3.8L18.4 20H5.6L12 5.8z"></path>
          </svg>

          <h1 className="appSidebarTitle">
            Junta de <br /> Andalucía
          </h1>

          <button
            className="appIconBtn ghost closeOnlyMobile"
            onClick={closeMenu}
            aria-label="Cerrar menú"
            type="button"
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <nav className="appNav">
          <NavLink to="/home" onClick={closeMenu} className={({ isActive }) => `appNavItem ${isActive ? "active" : ""}`}>
            <span className="material-icons-outlined">home</span>
            <span>Inicio</span>
          </NavLink>

          <NavLink to="/guardias" onClick={closeMenu} className={({ isActive }) => `appNavItem ${isActive ? "active" : ""}`}>
            <span className="material-icons-outlined">calendar_month</span>
            <span>Gestión de Guardias</span>
          </NavLink>

          <NavLink to="/calculos" onClick={closeMenu} className={({ isActive }) => `appNavItem ${isActive ? "active" : ""}`}>
            <span className="material-icons-outlined">calculate</span>
            <span>Administrar usuarios</span>
          </NavLink>

          <div className="appNavDivider" />

          <button
            className="appNavItem danger"
            onClick={() => {
              closeMenu();
              logout();
            }}
            type="button"
          >
            <span className="material-icons-outlined">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </nav>

        <div className="appSidebarFooter">© 2026 SAS - Junta de Andalucía</div>
      </aside>

      {/* Derecha */}
      <div className="appBody">
        {/* 3) Aquí ya existe "user" */}
        <Header
          onMenuClick={() => setOpen(true)}
          user={user}
          onLogout={logout}
        />

        <div className={`appOverlay ${open ? "show" : ""}`} onClick={closeMenu} />

        <main className="appMain" onClick={() => open && closeMenu()}>
          <Outlet />
        </main>
        <Footer />
      </div>     
    </div>
    
  );
}