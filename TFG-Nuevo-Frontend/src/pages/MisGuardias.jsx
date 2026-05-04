import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getProfile } from "../services/ProfileService";
import { getWorkerDutiesPaginated } from "../services/DutyService";
import SwapRequestModal from "../components/SwapRequestModal";
import { punchClock, getLastThreePunches } from "../services/FichajeService";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/MisGuardias.css";
import Joyride, { STATUS } from "react-joyride-react-19";

// Fix leaflet icon default behavior
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function MisGuardias() {
    const navigate = useNavigate();
    const [duties, setDuties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }
    const [searchParams, setSearchParams] = useSearchParams();

    // View State
    const [activeView, setActiveView] = useState("guardias"); // 'guardias' | 'fichar'
    // Fichar state
    const [recentPunches, setRecentPunches] = useState([]);
    const [isPunching, setIsPunching] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Map & Location State
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState("");
    const mapRef = useRef(null);
    const userMarkerRef = useRef(null);
    const mapContainerRef = useRef(null);


    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Filters
    const [searchDate, setSearchDate] = useState("");

    // User info
    const [workerId, setWorkerId] = useState(null);

    // Joyride Steps
    const [runTour, setRunTour] = useState(false);
    const tourSteps = [
        {
            target: ".tour-mg-tabs",
            content: "Paso 4: Este es tu portal personal. Puedes alternar entre ver tus próximas guardias y la pantalla para fichar.",
            disableBeacon: true,
        },
        {
            target: ".tour-mg-export",
            content: "Sincroniza todas tus guardias con Google Calendar para tenerlas siempre a mano en tu móvil.",
        },
        {
            target: ".tour-mg-clock",
            content: "Cuando llegues a tu puesto, usa este botón para fichar con tu ubicación GPS. ¡Es muy sencillo!",
        },
    ];

    useEffect(() => {
        const phase = localStorage.getItem("tutorial_phase");
        if (phase === "PHASE_MIS_GUARDIAS") {
            setRunTour(true);
        }
    }, []);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            // Pasamos a la fase 5: Home
            localStorage.setItem("tutorial_phase", "PHASE_HOME");
            setRunTour(false);
            navigate("/home");
        }
    };

    // Modal state
    const [selectedDuty, setSelectedDuty] = useState(null);
    const [dutyModalOpen, setDutyModalOpen] = useState(false);
    const [swapModalOpen, setSwapModalOpen] = useState(false);
    const [confirmPunchModalOpen, setConfirmPunchModalOpen] = useState(false);

    // Leer ?status= al volver del callback de Google
    useEffect(() => {
        const status = searchParams.get("status");
        if (status === "success") {
            setToast({ type: "success", message: "¡Guardia exportada a Google Calendar!" });
            setSearchParams({}, { replace: true });
        } else if (status === "error") {
            const msg = searchParams.get("message") || "Error al exportar a Google Calendar";
            setToast({ type: "error", message: decodeURIComponent(msg) });
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    // Auto-cerrar toast tras 4 segundos
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(t);
    }, [toast]);

    useEffect(() => {
        // Load user profile to get worker_id
        async function loadUser() {
            try {
                const profile = await getProfile();
                if (profile && profile.worker_id) {
                    setWorkerId(profile.worker_id);
                } else {
                    setError(
                        "No se pudo obtener la información del trabajador.",
                    );
                    setLoading(false);
                }
            } catch (e) {
                console.error(e);
                setError("Error al cargar perfil.");
                setLoading(false);
            }
        }
        loadUser();
    }, []);

    useEffect(() => {
        if (!workerId) return;

        fetchDuties();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workerId, page, searchDate]);

    async function fetchDuties() {
        setLoading(true);
        setError("");
        try {
            const data = await getWorkerDutiesPaginated(
                workerId,
                page,
                searchDate,
            );

            // Laravel paginate response structure: { data: [...], current_page, last_page, total, ... }
            if (data && data.data) {
                setDuties(data.data);
                setTotalPages(data.last_page);
                setTotalRecords(data.total);
            } else {
                setDuties([]);
            }
        } catch (e) {
            console.error(e);
            setError("Error al cargar las guardias.");
        } finally {
            setLoading(false);
        }
    }

    function handleDateChange(e) {
        setSearchDate(e.target.value);
        setPage(1);
    }

    function handlePrevPage() {
        if (page > 1) setPage((p) => p - 1);
    }

    function handleNextPage() {
        if (page < totalPages) setPage((p) => p + 1);
    }

    // Fichar logics & Map initialization
    useEffect(() => {
        let timer;
        let watchId;
        if (activeView === 'fichar') {
            loadRecentPunches();
            timer = setInterval(() => setCurrentTime(new Date()), 1000);

            // Re-init map if container exists
            setTimeout(() => {
                if (mapContainerRef.current && !mapRef.current) {
                    const map = L.map(mapContainerRef.current).setView([37.8802566, -4.8040947], 16);

                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '© OpenStreetMap'
                    }).addTo(map);

                    L.circle([37.8802566, -4.8040947], {
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.2,
                        radius: 300
                    }).addTo(map).bindPopup("MEDAC Arena (Área de Fichaje)").openPopup();

                    mapRef.current = map;
                }
            }, 100);

            // Get Geolocation
            if ("geolocation" in navigator) {
                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        setUserLocation({ lat, lng });
                        setLocationError("");

                        // Update Marker
                        if (mapRef.current) {
                            if (userMarkerRef.current) {
                                userMarkerRef.current.setLatLng([lat, lng]);
                            } else {
                                userMarkerRef.current = L.circleMarker([lat, lng], {
                                    radius: 8,
                                    fillColor: "#22c55e",
                                    color: "#fff",
                                    weight: 2,
                                    opacity: 1,
                                    fillOpacity: 1
                                }).addTo(mapRef.current).bindPopup("Tu ubicación actual");
                            }
                        }
                    },
                    (error) => {
                        console.error("Error obteniendo ubicación:", error);
                        setLocationError("No pudimos obtener tu ubicación. Por favor, asegúrate de dar permisos de GPS al navegador.");
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            } else {
                setLocationError("Tu navegador no soporta geolocalización.");
            }
        }

        return () => {
            clearInterval(timer);
            if (watchId !== undefined && "geolocation" in navigator) {
                navigator.geolocation.clearWatch(watchId);
            }
            if (activeView !== 'fichar' && mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                userMarkerRef.current = null;
            }
        };
    }, [activeView]);

    const loadRecentPunches = async () => {
        try {
            const data = await getLastThreePunches();
            setRecentPunches(data);
        } catch (error) {
            console.error("Error cargando últimos fichajes", error);
        }
    };

    const handlePunch = async () => {
        if (!userLocation) {
            setToast({ type: "error", message: "Necesitamos conocer tu ubicación exacta para poder fichar. Asegúrate de permitir el acceso GPS." });
            return;
        }

        const isPunchingIn = !recentPunches[0] || recentPunches[0].type !== 0;

        if (isPunchingIn && workerId) {
            setIsPunching(true);
            try {
                const d = new Date();
                const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                const res = await getWorkerDutiesPaginated(workerId, 1, todayStr);

                if (res && res.data && res.data.length === 0) {
                    setIsPunching(false);
                    setConfirmPunchModalOpen(true);
                    return;
                }
            } catch (err) {
                console.error("Error verificando guardia de hoy", err);
            }
        }

        await executePunch();
    };

    const executePunch = async () => {
        setIsPunching(true);
        setConfirmPunchModalOpen(false);
        try {
            await punchClock({ latitude: userLocation.lat, longitude: userLocation.lng });
            setToast({ type: "success", message: "Fichaje registrado correctamente." });
            loadRecentPunches();
        } catch (error) {
            setToast({ type: "error", message: error.message || "Error al registrar el fichaje." });
        } finally {
            setIsPunching(false);
        }
    };

    // Modal helpers
    function openModal(duty) {
        setSelectedDuty(duty);
        setDutyModalOpen(true);
    }

    function closeModal() {
        setDutyModalOpen(false);
        setSelectedDuty(null);
    }

    const handleExportAll = () => {
        if (!workerId) return;
        window.location.href = `/api/google/redirect?duty_id=all&worker_id=${workerId}`;
    };

    const handleExportOne = (dutyId) => {
        window.location.href = `/api/google/redirect?duty_id=${dutyId}`;
    };

    const handleSwapRequest = () => {
        setDutyModalOpen(false);
        setSwapModalOpen(true);
    };

    return (
        <div className="mgPage">
            {toast && (
                <div className={`mgToast mgToast--${toast.type}`}>
                    <span className="material-icons-outlined">
                        {toast.type === "success" ? "check_circle" : "error"}
                    </span>
                    <span>{toast.message}</span>
                    <button className="mgToastClose" onClick={() => setToast(null)}>
                        <span className="material-icons">close</span>
                    </button>
                </div>
            )}
            <div className="mgContainer">
                {/* Header Section */}
                <div className="mgHeader">
                    <div>
                        <h1 className="mgTitle">Control de Guardia</h1>
                        <div className="mgSubtitle">
                            Gestión de turnos y registro de jornada
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mgTabs tour-mg-tabs">
                    <button
                        className={`mgTabBtn ${activeView === 'guardias' ? 'active' : ''}`}
                        onClick={() => setActiveView('guardias')}
                    >
                        <span className="material-icons-outlined">event</span>
                        Próximas Guardias
                    </button>
                    <button
                        className={`mgTabBtn ${activeView === 'fichar' ? 'active' : ''}`}
                        onClick={() => setActiveView('fichar')}
                    >
                        <span className="material-icons-outlined">fingerprint</span>
                        Fichar
                    </button>
                </div>

                {activeView === 'guardias' ? (
                <>
                    {/* Actions & Filters Bar */}
                    <div className="mgActionsBar">
                        <div className="mgStats">
                            <span className="material-icons-outlined mgStatsIcon">
                                assignment
                            </span>
                            <span>{totalRecords} Registros</span>
                        </div>

                        <button className="mgExportAllBtn tour-mg-export" onClick={handleExportAll}>
                                <span className="material-icons-outlined">calendar_today</span>
                                <span>Exportar a Google Calendar</span>
                            </button>

                            <div className="mgFilterGroup">
                                <span className="material-icons-outlined mgFilterIcon">
                                    calendar_today
                                </span>
                                <input
                                    type="date"
                                    className="mgDateInput"
                                    value={searchDate}
                                    onChange={handleDateChange}
                                    placeholder="Buscar por fecha"
                                />
                                {searchDate && (
                                    <button
                                        className="mgClearBtn"
                                        onClick={() => {
                                            setSearchDate("");
                                            setPage(1);
                                        }}
                                        title="Limpiar filtro"
                                    >
                                        <span className="material-icons">close</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Main Content Card */}
                        <div className="mgCard">
                            <div className="mgTableContainer">
                                {loading ? (
                                    <div className="mgEmpty">
                                        <span
                                            className="material-icons-outlined mgEmptyIcon"
                                            style={{
                                                animation: "spin 1s linear infinite",
                                            }}
                                        >
                                            sync
                                        </span>
                                        <span>Cargando datos...</span>
                                    </div>
                                ) : error ? (
                                    <div className="mgEmpty">
                                        <span
                                            className="material-icons-outlined mgEmptyIcon"
                                            style={{ color: "#EF4444" }}
                                        >
                                            error
                                        </span>
                                        <span>{error}</span>
                                    </div>
                                ) : duties.length === 0 ? (
                                    <div className="mgEmpty">
                                        <span className="material-icons-outlined mgEmptyIcon">
                                            event_busy
                                        </span>
                                        <span>No se encontraron guardias.</span>
                                    </div>
                                ) : (
                                    <table className="mgTable">
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Tipo</th>
                                                <th>Especialidad</th>
                                                <th>Jefe de Guardia</th>
                                                <th style={{ textAlign: "center" }}>
                                                    Detalles
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {duties.map((duty) => (
                                                <tr key={duty.id}>
                                                    <td>
                                                        <div className="mgDateCell">
                                                            <span className="mgDay">
                                                                {new Date(
                                                                    duty.date,
                                                                ).getDate()}
                                                            </span>
                                                            <span className="mgMonthYear">
                                                                {new Date(
                                                                    duty.date,
                                                                ).toLocaleDateString(
                                                                    "es-ES",
                                                                    {
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    },
                                                                )}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`mgPill ${duty.duty_type?.toLowerCase()}`}
                                                        >
                                                            {duty.duty_type}
                                                        </span>
                                                    </td>
                                                    <td>{duty.speciality || "-"}</td>
                                                    <td>
                                                        {duty.is_chief ? (
                                                            <span className="mgChiefBadge">
                                                                <span className="material-icons">
                                                                    star
                                                                </span>
                                                                Jefe
                                                            </span>
                                                        ) : (
                                                            duty.chief_worker || "-"
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <button
                                                            className="mgActionBtn"
                                                            onClick={() =>
                                                                openModal(duty)
                                                            }
                                                            title="Ver ficha completa"
                                                        >
                                                            <span className="material-icons-outlined">
                                                                visibility
                                                            </span>
                                                        </button>
                                                        <button
                                                            className="mgActionBtn mgExportRowBtn"
                                                            onClick={() =>
                                                                handleExportOne(duty.id)
                                                            }
                                                            title="Exportar a Google Calendar"
                                                        >
                                                            <span className="material-icons-outlined">
                                                                event
                                                            </span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mgPagination">
                                    <span className="mgPageInfo">
                                        {page} / {totalPages}
                                    </span>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            className="mgPageBtn"
                                            onClick={handlePrevPage}
                                            disabled={page === 1}
                                        >
                                            <span className="material-icons">
                                                chevron_left
                                            </span>
                                        </button>
                                        <button
                                            className="mgPageBtn"
                                            onClick={handleNextPage}
                                            disabled={page === totalPages}
                                        >
                                            <span className="material-icons">
                                                chevron_right
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="mgFicharLayout">
                        <div className="mgClockCard">
                            <div className="mgClockHeader">
                                <div className="mgCurrentTime">
                                    {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="mgCurrentDate">
                                    {currentTime.toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                <div className="mgClockStatus">
                                    {recentPunches.length > 0 ? (
                                        recentPunches[0].type === 0 ? (
                                            <span className="mgStatusIn">Estás trabajando</span>
                                        ) : (
                                            <span className="mgStatusOut">Fuera de turno</span>
                                        )
                                    ) : (
                                        <span className="mgStatusNone">Ningún fichaje reciente</span>
                                    )}
                                </div>
                            </div>

                            <div className="mgClockAction">
                                <button 
                                    className={`mgBigPunchBtn ${recentPunches[0]?.type === 0 ? 'mgBtnOut' : 'mgBtnIn'} tour-mg-clock`}
                                    onClick={handlePunch}
                                    disabled={isPunching}
                                >
                                    <span className="material-icons-outlined mgPunchIcon">
                                        fingerprint
                                    </span>
                                    {isPunching ? "Registrando..." : (
                                        recentPunches[0]?.type === 0 ? "Fichar Salida" : "Fichar Entrada"
                                    )}
                                </button>
                            </div>

                            <div className="mgRecentPunches">
                                <h3>Últimos Fichajes</h3>
                                {recentPunches.length > 0 ? (
                                    <ul className="mgPunchList">
                                        {recentPunches.map((f, i) => (
                                            <li key={i} className="mgPunchListItem">
                                                <span className={`mgPunchDot ${f.type === 0 ? 'in' : 'out'}`}></span>
                                                <span className="mgPunchType">{f.type === 0 ? "Entrada" : "Salida"}</span>
                                                <span className="mgPunchTime">
                                                    {new Date(f.date_time).toLocaleString("es-ES", {
                                                        day: "2-digit", month: "long", hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mgNoPunches">No hay fichajes en el sistema.</p>
                                )}
                            </div>
                        </div>

                        <div className="mgMapPlaceholder" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                            {locationError ? (
                                <div style={{ padding: 40, textAlign: 'center', color: '#b91c1c' }}>
                                    <span className="material-icons-outlined" style={{ fontSize: 48, marginBottom: 15 }}>location_off</span>
                                    <h3>Error de Ubicación</h3>
                                    <p>{locationError}</p>
                                </div>
                            ) : (
                                <>
                                    <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
                                    {!userLocation && (
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.85)', zIndex: 1000 }}>
                                            <span className="material-icons-outlined mgMapIcon" style={{ animation: 'spin 1.5s linear infinite' }}>my_location</span>
                                            <h3 style={{ marginTop: 15, fontWeight: 600 }}>Calculando tu ubicación...</h3>
                                            <p style={{ marginTop: 5, color: 'var(--muted)' }}>Por favor espera mientras el GPS establece tu posición exacta.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Premium Modal */}
            {dutyModalOpen && selectedDuty && (
                <div
                    className="mgModalOverlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    <div className="mgModalCard">
                        <div className="mgModalHeader">
                            <h3 className="mgModalTitle">Detalle de Guardia</h3>
                            <button
                                className="mgModalClose"
                                onClick={closeModal}
                            >
                                <span className="material-icons-outlined">
                                    close
                                </span>
                            </button>
                        </div>

                        <div className="mgModalBody">
                            <div className="mgModalDateDisplay">
                                <span className="material-icons-outlined mgModalDateIcon">
                                    event
                                </span>
                                <span className="mgModalFullDate">
                                    {new Date(
                                        selectedDuty.date,
                                    ).toLocaleDateString("es-ES", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>

                            <div className="mgModalGrid">
                                <div className="mgModalItem">
                                    <span className="mgModalLabel">
                                        <span className="material-icons-outlined">
                                            work
                                        </span>
                                        Tipo
                                    </span>
                                    <span className="mgModalValue">
                                        {selectedDuty.duty_type}
                                    </span>
                                </div>

                                {selectedDuty.speciality && (
                                    <div className="mgModalItem">
                                        <span className="mgModalLabel">
                                            <span className="material-icons-outlined">
                                                local_hospital
                                            </span>
                                            Especialidad
                                        </span>
                                        <span className="mgModalValue">
                                            {selectedDuty.speciality}
                                        </span>
                                    </div>
                                )}

                                <div className="mgModalItem">
                                    <span className="mgModalLabel">
                                        <span className="material-icons-outlined">
                                            person
                                        </span>
                                        Trabajador
                                    </span>
                                    <span className="mgModalValue">
                                        {selectedDuty.worker || "-"}
                                    </span>
                                </div>

                                <div className="mgModalItem">
                                    <span className="mgModalLabel">
                                        <span className="material-icons-outlined">
                                            supervisor_account
                                        </span>
                                        Jefe de Guardia
                                    </span>
                                    <span className="mgModalValue">
                                        {selectedDuty.is_chief
                                            ? "Tú (Jefe de Guardia)"
                                            : selectedDuty.chief_worker || "-"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mgModalFooter" style={{ gap: '12px' }}>
                            <button className="mgBtn mgBtn--secondary" onClick={closeModal}>
                                Cerrar
                            </button>
                            {!selectedDuty.is_chief && (
                                <button className="mgBtn mgBtn--primary" onClick={handleSwapRequest}>
                                    <span className="material-icons-outlined">swap_horiz</span>
                                    Solicitar Cambio
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {swapModalOpen && selectedDuty && (
                <SwapRequestModal
                    dutyFrom={selectedDuty}
                    onClose={() => setSwapModalOpen(false)}
                    onSuccess={() => setToast({ type: "success", message: "Solicitud enviada correctamente" })}
                />
            )}

            {/* Premium Modal for Warning NO Shift */}
            {confirmPunchModalOpen && (
                <div
                    className="mgModalOverlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isPunching) setConfirmPunchModalOpen(false);
                    }}
                >
                    <div className="mgModalCard" style={{ maxWidth: '480px' }}>
                        <div className="mgModalHeader">
                            <h3 className="mgModalTitle" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c' }}>
                                <span className="material-icons-outlined">warning_amber</span>
                                Sin Guardia Asignada
                            </h3>
                        </div>

                        <div className="mgModalBody">
                            <div style={{ marginBottom: '16px', lineHeight: '1.5', color: 'var(--text)', fontSize: '15px' }}>
                                <strong>Actualmente no tienes ningún turno de guardia planificado para el día de hoy.</strong>
                            </div>
                            <div style={{ padding: '16px', background: '#FEF2F2', borderRadius: '8px', color: '#991B1B', fontSize: '14px', lineHeight: '1.6' }}>
                                Si decides continuar y realizar el fichaje, el sistema <strong>creará automáticamente una nueva guardia</strong> asociada a tu jornada para reflejar este periodo de trabajo no agendado.
                                <br /><br />
                                <span style={{ fontWeight: 600 }}>¿Estás seguro de que deseas continuar con el fichaje?</span>
                            </div>
                        </div>

                        <div className="mgModalFooter" style={{ justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                className="mgBtn"
                                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}
                                onClick={() => setConfirmPunchModalOpen(false)}
                                disabled={isPunching}
                            >
                                Cancelar
                            </button>
                            <button
                                className="mgBtn"
                                style={{ background: '#b91c1c', color: 'white', border: 'none' }}
                                onClick={executePunch}
                                disabled={isPunching}
                            >
                                {isPunching ? "Procesando..." : "Sí, fichar y crear guardia"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Joyride Tour */}
            <Joyride
                steps={tourSteps}
                run={runTour}
                continuous
                showProgress
                showSkipButton={true}
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        zIndex: 10000,
                        primaryColor: "#3b82f6",
                    },
                }}
                locale={{
                    back: "Atrás",
                    close: "Cerrar",
                    last: "Finalizar Tour",
                    next: "Siguiente",
                    skip: "Saltar tutorial",
                }}
            />
        </div>
    );
}
