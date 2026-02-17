import { useState, useEffect } from "react";
import { getProfile } from "../services/ProfileService";
import { getWorkerDutiesPaginated } from "../services/DutyService";
import "../styles/MisGuardias.css";
import Button from "../components/Button/Button";

export default function MisGuardias() {
    const [duties, setDuties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    // Modal helpers
    function openModal(duty) {
        setSelectedDuty(duty);
        setDutyModalOpen(true);
    }

    function closeModal() {
        setDutyModalOpen(false);
        setSelectedDuty(null);
    }

    return (
        <div className="mgPage">
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

                {/* Actions & Filters Bar */}
                <div className="mgActionsBar">
                    <div className="mgStats">
                        <span className="material-icons-outlined mgStatsIcon">
                            assignment
                        </span>
                        <span>{totalRecords} Registros</span>
                    </div>

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
                                style={{ background: "none", border: "none", cursor: "pointer" }}
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
                                <Button
                                    variant="secondary"
                                    onClick={handlePrevPage}
                                    disabled={page === 1}
                                    size="sm"
                                    icon="chevron_left"
                                />
                                <Button
                                    variant="secondary"
                                    onClick={handleNextPage}
                                    disabled={page === totalPages}
                                    size="sm"
                                    icon="chevron_right"
                                />
                            </div>
                        </div>
                    )}
                </div>
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
                            <Button variant="primary" onClick={closeModal}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
