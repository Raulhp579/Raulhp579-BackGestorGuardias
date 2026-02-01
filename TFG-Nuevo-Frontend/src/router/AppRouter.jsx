import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";

import Home from "../pages/Home";
import Login from "../pages/Login";
import HomeDashboard from "../pages/HomeDashboard";
import Guardias from "../pages/GestionGuardias";
import GestionUsuarios from "../pages/GestionUsuarios";
import PerfilUsuario from "../pages/PerfilUsuario";

// Nuevas páginas legales
import AvisoLegal from "../pages/AvisoLegal";
import Privacidad from "../pages/Privacidad";

// import PanelAdmin from "../pages/PanelAdministracion";

export default function AppRouter() {
    return (
        <Routes>
            {/* Público */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            {/* Privadas con layout (Header + Sidebar + Footer) */}
            <Route element={<AppLayout />}>
                <Route path="/home" element={<HomeDashboard />} />
                <Route path="/perfil" element={<PerfilUsuario />} />
                <Route path="/guardias" element={<Guardias />} />
                <Route path="/usuarios" element={<GestionUsuarios />} />

                {/* Legales (también dentro del layout para mantener header/sidebar) */}
                <Route path="/aviso-legal" element={<AvisoLegal />} />
                <Route path="/privacidad" element={<Privacidad />} />

                {/* <Route path="/panelAdmin" element={<PanelAdmin />} /> */}
            </Route>

            {/* Default */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
