import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";

import Login from "../pages/Login";
import HomeDashboard from "../pages/HomeDashboard";
import Guardias from "../pages/GestionGuardias";
import Calculos from "../pages/CalculosDocumentos";

// Nuevas páginas legales
import AvisoLegal from "../pages/AvisoLegal";
import Privacidad from "../pages/Privacidad";

// import PanelAdmin from "../pages/PanelAdministracion";

export default function AppRouter() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<Login />} />

      {/* Privadas con layout (Header + Sidebar + Footer si lo metes en AppLayout) */}
      <Route element={<AppLayout />}>
        <Route path="/home" element={<HomeDashboard />} />
        <Route path="/guardias" element={<Guardias />} />
        <Route
          path="/calculos"
          element={
            <ProtectedRoute requireAdmin={true}>
              <Calculos />
            </ProtectedRoute>
          }
        />

        {/* Legales (también dentro del layout para mantener header/sidebar) */}
        <Route path="/aviso-legal" element={<AvisoLegal />} />
        <Route path="/privacidad" element={<Privacidad />} />

        {/* <Route path="/panelAdmin" element={<PanelAdmin />} /> */}
      </Route>

      {/* Default */}
      <Route path="/" element={<Navigate to="/Home" replace />} />
      <Route path="*" element={<Navigate to="/Home" replace />} />
    </Routes>
  );
}
