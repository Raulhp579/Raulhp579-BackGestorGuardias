/**
 * Hook para acceder a información de autenticación y roles del usuario
 * Los roles se guardan en sessionStorage al hacer login
 */
export function useAuth() {
    const token = localStorage.getItem("token");
    const rolesJson = sessionStorage.getItem("roles");
    const roles = rolesJson ? JSON.parse(rolesJson) : [];

    const isAuthenticated = !!token;
    const isAdmin = roles.includes("admin");

    return {
        token,
        roles,
        isAuthenticated,
        isAdmin,
    };
}
