import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/AppLayout.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getProfile } from "../services/ProfileService";

export default function AppLayout() {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState({
        name: "Usuario",
        email: "",
        avatarUrl: "",
    });
    const navigate = useNavigate();

    // Cargar perfil del usuario al montar el componente
    useEffect(() => {
        async function loadUser() {
            try {
                const profileData = await getProfile();
                if (profileData) {
                    setUser({
                        name: profileData.name ?? "Usuario",
                        email: profileData.email ?? "",
                        avatarUrl: profileData.avatarUrl ?? "",
                    });
                }
            } catch (error) {
                console.error("Error al cargar perfil:", error);
                // Si hay error de autenticación, redirigir al login
                if (
                    error.message?.includes("401") ||
                    error.message?.includes("autenticación")
                ) {
                    navigate("/login");
                }
            }
        }

        loadUser();
    }, [navigate]);

    // logout
    function logout() {
        localStorage.removeItem("token");
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
                    <svg
                        className="appSidebarLogo"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
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
                    <NavLink
                        to="/home"
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            `appNavItem ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="material-icons-outlined">home</span>
                        <span>Inicio</span>
                    </NavLink>

                    <NavLink
                        to="/guardias"
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            `appNavItem ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="material-icons-outlined">
                            calendar_month
                        </span>
                        <span>Gestión de Guardias</span>
                    </NavLink>

                    <NavLink
                        to="/usuarios"
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            `appNavItem ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="material-icons-outlined">
                            calculate
                        </span>
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

                <div className="appSidebarFooter">
                    © 2026 SAS - Junta de Andalucía
                </div>
            </aside>

            {/* Derecha */}
            <div className="appBody">
                <Header
                    onMenuClick={() => setOpen(true)}
                    user={user}
                    onLogout={logout}
                />

                <div
                    className={`appOverlay ${open ? "show" : ""}`}
                    onClick={closeMenu}
                />

                <main className="appMain" onClick={() => open && closeMenu()}>
                    <Outlet />
                </main>
                <Footer />
            </div>
        </div>
    );
}
