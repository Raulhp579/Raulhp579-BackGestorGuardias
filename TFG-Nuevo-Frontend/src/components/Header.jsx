import { useMemo, useState } from "react";
import "../components/style/Header.css";
import { useNotifications } from "../context/NotificationsContext";

function getInitials(name = "") {
    const clean = name.trim();
    if (!clean) return "";
    const parts = clean.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
}

export default function Header({ onMenuClick, user, onLogout, onProfile }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const { items, unreadCount, markAllRead, clearAll } = useNotifications();
    const [notifOpen, setNotifOpen] = useState(false);

    const displayName = user?.name ?? "Usuario";
    const avatarUrl = user?.avatarUrl ?? "";
    const initials = useMemo(() => getInitials(displayName), [displayName]);

    return (
        <header className="cdHeader">
            <div className="cdHeaderInner">
                {/* IZQUIERDA: hamburguesa móvil */}
                <div className="cdHeaderLeft">
                    <button
                        className="cdIconBtn cdMenuBtn"
                        type="button"
                        aria-label="Abrir menú"
                        onClick={onMenuClick}
                    >
                        <span className="material-icons-outlined">menu</span>
                    </button>
                </div>

                {/* CENTRO */}
                <div className="cdBrand cdBrandCenter">
                    <svg className="cdLogo" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 2L2 22h20L12 2zm0 3.8L18.4 20H5.6L12 5.8z" />
                    </svg>
                    <span>GuardiApp</span>
                </div>

                {/* DERECHA */}
                <div className="cdHeaderRight">
                    <div className="cdNotifWrap">
                        <button
                            className="cdIconBtn cdNotifBtn"
                            aria-label="Notificaciones"
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={notifOpen}
                            onClick={() => {
                                setNotifOpen((v) => !v);
                                // si lo abres, marca como leído
                                if (!notifOpen) markAllRead();
                            }}
                        >
                            <span className="material-icons-outlined">notifications</span>

                            {unreadCount > 0 && (
                                <span className="cdNotifBadge" aria-label={`${unreadCount} notificaciones sin leer`}>
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </button>

                        {notifOpen && (
                            <>
                                <div className="cdMenuOverlay" onClick={() => setNotifOpen(false)} />

                                <div className="cdNotifMenu" role="menu" aria-label="Lista de notificaciones">
                                    <div className="cdNotifHeader">
                                        <div className="cdNotifTitle">Notificaciones</div>
                                        <button className="cdNotifClear" type="button" onClick={clearAll}>
                                            Limpiar
                                        </button>
                                    </div>

                                    {items.length === 0 ? (
                                        <div className="cdNotifEmpty">No hay notificaciones.</div>
                                    ) : (
                                        <div className="cdNotifList">
                                            {items.slice(0, 6).map((n) => (
                                                <div className="cdNotifItem" key={n.id}>
                                                    <div className="cdNotifText">{n.text}</div>
                                                    <div className="cdNotifTime">a las {n.time}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="cdAvatarWrap">
                        <button
                            className="cdAvatarBtn"
                            type="button"
                            aria-label="Abrir perfil"
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((v) => !v)}
                        >
                            {avatarUrl ? (
                                <img className="cdAvatarImg" src={avatarUrl} alt={`Foto de ${displayName}`} />
                            ) : initials ? (
                                <span className="cdAvatarInitials">{initials}</span>
                            ) : (
                                <span className="material-icons-outlined cdAvatarPersonIcon">person</span>
                            )}
                        </button>

                        {menuOpen && (
                            <>
                                <div className="cdMenuOverlay" onClick={() => setMenuOpen(false)} />
                                <div className="cdMenu" role="menu">
                                    <div className="cdMenuHeader">
                                        <div className="cdMenuName">{displayName}</div>
                                        {user?.email && <div className="cdMenuEmail">{user.email}</div>}
                                    </div>

                            {/* en algun momento lo metemos
                                    <button
                                        className="cdMenuItem"
                                        type="button"
                                        role="menuitem"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onProfile?.();
                                        }}
                                    >
                                        <span className="material-icons-outlined">account_circle</span>
                                        Perfil
                                    </button>

                                    <button
                                        className="cdMenuItem"
                                        type="button"
                                        role="menuitem"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <span className="material-icons-outlined">settings</span>
                                        Ajustes
                                    </button> */}

                                    <div className="cdMenuDivider" />

                                    <button
                                        className="cdMenuItem danger"
                                        type="button"
                                        role="menuitem"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onLogout?.();
                                        }}
                                    >
                                        <span className="material-icons-outlined">logout</span>
                                        Cerrar sesión
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}