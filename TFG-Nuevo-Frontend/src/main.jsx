import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/variables.css";
import "./styles/globalButtons.css";
import "./index.css";
import { loadFullCalendarCss } from "./fullcalendarStyles";
import { NotificationsProvider } from "./context/NotificationsContext";


// Carga CSS de FullCalendar antes de renderizar
loadFullCalendarCss();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationsProvider>
        <App />
      </NotificationsProvider>
    </BrowserRouter>
  </React.StrictMode>
);