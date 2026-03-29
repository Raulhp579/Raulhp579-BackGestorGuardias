import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getProfile } from "../services/ProfileService";
import { getWorkerDutiesPaginated } from "../services/DutyService";
import { punchClock, getLastThreePunches } from "../services/FichajeService";
import "../styles/MisGuardias.css";

export default function MisGuardias() {
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


    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Filters
    const [searchDate, setSearchDate] = useState("");

    // User info
    const [workerId, setWorkerId] = useState(null);

    // Modal state
    const [selectedDuty, setSelectedDuty] = useState(null);
    const [dutyModalOpen, setDutyModalOpen] = useState(false);

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
    }, []);

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

    // Fichar logics
    useEffect(() => {
        let timer;
        if (activeView === 'fichar') {
            loadRecentPunches();
            timer = setInterval(() => setCurrentTime(new Date()), 1000);
        }
        return () => clearInterval(timer);
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
        setIsPunching(true);
        try {
            await punchClock();
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
                        <h1 className="mgTitle">Mis Guardias</h1>
                        <div className="mgSubtitle">
                            Historial y próximas asignaciones
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mgTabs">
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

                        <button className="mgExportAllBtn" onClick={handleExportAll}>
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
                                    className={`mgBigPunchBtn ${recentPunches[0]?.type === 0 ? 'mgBtnOut' : 'mgBtnIn'}`}
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

                        <div className="mgMapPlaceholder">
                            <div className="mgMapIconWrap">
                                <span className="material-icons-outlined mgMapIcon">map</span>
                            </div>
                            <h3>El mapa se mostrará aquí</h3>
                            <p>En este espacio insertaremos tu mapa próximamente para validación de ubicación.</p>
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

                        <div className="mgModalFooter">
                            <button className="mgBtn" onClick={closeModal}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
