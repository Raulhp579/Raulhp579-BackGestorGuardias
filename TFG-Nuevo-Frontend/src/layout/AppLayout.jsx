import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import "../styles/AppLayout.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getProfile } from "../services/ProfileService";
import { getNotifications } from "../services/NotificationService";
import { useAuth } from "../hooks/useAuth";

const POLL_INTERVAL_MS = 15000;

export default function AppLayout() {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState({
        name: "Usuario",
        email: "",
        avatarUrl: "",
    });
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [toast, setToast] = useState(null);
    const prevUnreadRef = useRef(0);
    const firstLoadRef = useRef(true);
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === "/";

    const loadNotifications = useCallback(async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
            const newUnread = data.filter(n => !n.read_at).length;
            if (!firstLoadRef.current && newUnread > prevUnreadRef.current) {
                setToast("Tienes una nueva notificación de intercambio de guardia");
                setTimeout(() => setToast(null), 5000);
            }
            prevUnreadRef.current = newUnread;
            firstLoadRef.current = false;
            setUnreadCount(newUnread);
        } catch (e) {
            console.error("Error loading notifications", e);
        }
    }, []);

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
                if (
                    error.message?.includes("401") ||
                    error.message?.includes("autenticación")
                ) {
                    navigate("/login");
                }
            }
        }

        loadUser();
        loadNotifications();

        let interval = null;
        const startPolling = () => {
            if (interval) return;
            interval = setInterval(loadNotifications, POLL_INTERVAL_MS);
        };
        const stopPolling = () => {
            if (!interval) return;
            clearInterval(interval);
            interval = null;
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                loadNotifications();
                startPolling();
            } else {
                stopPolling();
            }
        };

        if (document.visibilityState === "visible") startPolling();
        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("notificationsRead", loadNotifications);

        return () => {
            stopPolling();
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("notificationsRead", loadNotifications);
        };
    }, [navigate, loadNotifications]);

    useEffect(() => {
        if (!isAdmin) return;

        const globalDone = localStorage.getItem("global_tutorial_done");
        if (globalDone) return;

        const phase = localStorage.getItem("tutorial_phase");
        const pathname = location.pathname;

        if (!phase) {
            if (pathname !== "/usuarios") {
                navigate("/usuarios");
            }
        } else if (phase === "PHASE_GUARDS") {
            if (pathname !== "/guardias") {
                navigate("/guardias");
            }
        } else if (phase === "PHASE_FICHAJES") {
            if (pathname !== "/fichajes") {
                navigate("/fichajes");
            }
        } else if (phase === "PHASE_MIS_GUARDIAS") {
            if (pathname !== "/mis-guardias") {
                navigate("/mis-guardias");
            }
        } else if (phase === "PHASE_HOME") {
            if (pathname !== "/home") {
                navigate("/home");
            }
        }
    }, [location.pathname, navigate, isAdmin]);

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("auth");
        sessionStorage.removeItem("roles");

        window.dispatchEvent(
            new CustomEvent("authChange", { detail: { roles: [] } }),
        );

        navigate("/login");
    }

    function closeMenu() {
        setOpen(false);
    }

    return (
        <div className="appShell">
            {toast && (
                <div className="appToast">
                    <span className="material-icons-outlined">notifications</span>
                    {toast}
                </div>
            )}

            {!isHome && (
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
                            <span className="material-icons-outlined">
                                close
                            </span>
                        </button>
                    </div>

                    <nav className="appNav">
                        {isAdmin && (
                            <>
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
                                    <span>Guardias</span>
                                </NavLink>

                                <NavLink
                                    to="/usuarios"
                                    onClick={closeMenu}
                                    className={({ isActive }) =>
                                        `appNavItem ${isActive ? "active" : ""}`
                                    }
                                >
                                    <span className="material-icons-outlined">
                                        group
                                    </span>
                                    <span>Usuarios</span>
                                </NavLink>

                                <NavLink
                                    to="/fichajes"
                                    onClick={closeMenu}
                                    className={({ isActive }) =>
                                        `appNavItem ${isActive ? "active" : ""}`
                                    }
                                >
                                    <span className="material-icons-outlined">
                                        history_toggle_off
                                    </span>
                                    <span>Fichajes</span>
                                </NavLink>

                                <div className="appNavDivider" />
                            </>
                        )}

                        <NavLink
                            to="/home"
                            onClick={closeMenu}
                            className={({ isActive }) =>
                                `appNavItem ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="material-icons-outlined">
                                calendar_today
                            </span>
                            <span>Calendario</span>
                        </NavLink>

                        <NavLink
                            to="/mis-guardias"
                            onClick={closeMenu}
                            className={({ isActive }) =>
                                `appNavItem ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="material-icons-outlined">
                                history_toggle_off
                            </span>
                            <span>Control de Guardia</span>
                        </NavLink>

                        <NavLink
                            to="/solicitudes"
                            onClick={closeMenu}
                            className={({ isActive }) =>
                                `appNavItem ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="material-icons-outlined">
                                forum
                            </span>
                            <span>Solicitudes</span>
                            {unreadCount > 0 && <span className="appNavBadge">{unreadCount}</span>}
                        </NavLink>

                        <a
                            href="#"
                            className="appNavItem"
                            onClick={(e) => {
                                e.preventDefault();
                                closeMenu();
                                logout();
                            }}
                        >
                            <span className="material-icons-outlined">
                                logout
                            </span>
                            <span>Cerrar Sesión</span>
                        </a>
                    </nav>

                    <div className="appSidebarFooter">
                        © 2026 SAS - Junta de Andalucía
                    </div>
                </aside>
            )}

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
