import { useState, useEffect } from "react";

/**
 * Hook para acceder a información de autenticación y roles del usuario
 * Los roles se guardan en sessionStorage al hacer login
 */
export function useAuth() {
    const [auth, setAuth] = useState(() => ({
        token: localStorage.getItem("token"),
        roles: (() => {
            const rolesJson = sessionStorage.getItem("roles");
            return rolesJson ? JSON.parse(rolesJson) : [];
        })(),
    }));

    useEffect(() => {
        // Leer valores actualizados de storage
        const updateAuth = () => {
            setAuth({
                token: localStorage.getItem("token"),
                roles: (() => {
                    const rolesJson = sessionStorage.getItem("roles");
                    return rolesJson ? JSON.parse(rolesJson) : [];
                })(),
            });
        };

        // Escuchar evento personalizado de auth change
        window.addEventListener("authChange", updateAuth);

        // Escuchar cambios en storage desde otras pestañas
        window.addEventListener("storage", updateAuth);

        return () => {
            window.removeEventListener("authChange", updateAuth);
            window.removeEventListener("storage", updateAuth);
        };
    }, []);

    const isAuthenticated = !!auth.token;
    const isAdmin = auth.roles.includes("admin");

    return {
        token: auth.token,
        roles: auth.roles,
        isAuthenticated,
        isAdmin,
    };
}
