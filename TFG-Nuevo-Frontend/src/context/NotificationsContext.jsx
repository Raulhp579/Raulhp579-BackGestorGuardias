import { createContext, useContext, useMemo, useState } from "react";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
    const [items, setItems] = useState([]); // {id, text, time, read}
    const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

    function addNotification(text) {
        const now = new Date();
        const time = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

        const newItem = {
            id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
            text,
            time,
            read: false,
        };

        setItems((prev) => [newItem, ...prev]);
    }

    function markAllRead() {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }

    function clearAll() {
        setItems([]);
    }

    const value = useMemo(
        () => ({ items, unreadCount, addNotification, markAllRead, clearAll }),
        [items, unreadCount]
    );

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
    const ctx = useContext(NotificationsContext);
    if (!ctx) throw new Error("useNotifications debe usarse dentro de NotificationsProvider");
    return ctx;
}