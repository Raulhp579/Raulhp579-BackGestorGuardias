import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * ProtectedRoute: Componente que protege rutas que requieren autenticación y rol de admin
 * Si el usuario no está autenticado o no es admin, redirige a /login
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
    const { isAuthenticated, isAdmin } = useAuth();

    // Si no está autenticado, redirige a login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si requiere admin y no lo es, redirige a home
    if (requireAdmin && !isAdmin) {
        return <Navigate to="/home" replace />;
    }

    // Si cumple todas las condiciones, renderiza el componente
    return children;
}
