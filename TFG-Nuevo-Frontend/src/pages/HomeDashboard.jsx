import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import "../styles/HomeDashboard.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useNotifications } from "../context/NotificationsContext";

import { getDuties, createDuty } from "../services/DutyService";
import { getSpecialities } from "../services/SpecialitiesService";
import { importExcel } from "../services/importExcelService";
import { getWorkers } from "../services/workerService";
import Joyride, { STATUS } from "react-joyride-react-19";

function normalizeTime(t) {
    if (!t) return "";
    const s = String(t).trim();
    if (/^\d{2}:\d{2}$/.test(s)) return s;
    if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0, 5);
    return s.slice(0, 5);
}

function getInitials(name) {
    const n = String(name || "").trim();
    if (!n) return "";
    const parts = n.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const second = parts.length > 1 ? parts[1][0] : "";
    return (first + second).toUpperCase();
}

export default function HomeDashboard() {
    const { addNotification } = useNotifications();

    const [specialities, setSpecialities] = useState([]);

    // ✅ NUEVO: workers para id_worker
    const [workers, setWorkers] = useState([]);
    const [workersLoading, setWorkersLoading] = useState(false);
    const [workersError, setWorkersError] = useState("");

    // estados que usas en el modal de importación
    const [importOpen, setImportOpen] = useState(false);
    const [specialitiesLoading, setSpecialitiesLoading] = useState(false);
    const [specialitiesError, setSpecialitiesError] = useState("");

    const [idSpeciality, setIdSpeciality] = useState("");
    const [importMonth, setImportMonth] = useState("01");
    const [importYear, setImportYear] = useState(String(new Date().getFullYear()));

    const [excelFile, setExcelFile] = useState(null);
    const fileInputRef = useRef(null);

    const [isDragging, setIsDragging] = useState(false);
    const [importUploading, setImportUploading] = useState(false);
    const [importMsg, setImportMsg] = useState("");

    // Buscador por nombre (backend: /api/duties?name=...)
    const [searchName, setSearchName] = useState("");
    const [debouncedName, setDebouncedName] = useState("");

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedName(searchName.trim());
        }, 350);
        return () => clearTimeout(t);
    }, [searchName]);

    const months = useMemo(
        () => [
            { value: "01", label: "Enero" },
            { value: "02", label: "Febrero" },
            { value: "03", label: "Marzo" },
            { value: "04", label: "Abril" },
            { value: "05", label: "Mayo" },
            { value: "06", label: "Junio" },
            { value: "07", label: "Julio" },
            { value: "08", label: "Agosto" },
            { value: "09", label: "Septiembre" },
            { value: "10", label: "Octubre" },
            { value: "11", label: "Noviembre" },
            { value: "12", label: "Diciembre" },
        ],
        []
    );

    const years = useMemo(() => {
        const start = 2020;
        const end = 2030;
        const arr = [];
        for (let y = start; y <= end; y++) arr.push(String(y));
        return arr;
    }, []);

    // FullCalendar control
    const calendarRef = useRef(null);
    const [monthLabel, setMonthLabel] = useState("");

    // ✅ NUEVO: rango visible actual (para stats del mes visible)
    const [viewRange, setViewRange] = useState({ start: "", end: "" });

    function getMonthYearFromCalendar() {
        const api = calendarRef.current?.getApi();
        const d = api?.getDate() ?? new Date();
        const year = String(d.getFullYear());
        const month = String(d.getMonth() + 1).padStart(2, "0");
        return { year, month };
    }

    // cargar especialidades al montar (para el modal de nueva guardia)
    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const data = await getSpecialities();
                const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                if (alive) setSpecialities(arr);
            } catch (e) {
                console.error(e);
                if (alive) setSpecialities([]);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    // ✅ NUEVO: cargar workers al montar (para id_worker)
    useEffect(() => {
        let alive = true;

        (async () => {
            setWorkersLoading(true);
            setWorkersError("");

            try {
                const data = await getWorkers();
                const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                if (alive) setWorkers(arr);
            } catch (e) {
                console.error(e);
                if (alive) {
                    setWorkers([]);
                    setWorkersError("No se pudieron cargar los trabajadores.");
                }
            } finally {
                if (alive) setWorkersLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    // Helpers Excel
    function isExcelFile(file) {
        if (!file) return false;

        const validExtensions = [".xls", ".xlsx"];
        const hasValidExtension = validExtensions.some(
            (ext) => file.name && file.name.toLowerCase().endsWith(ext)
        );

        const validMimeTypes = [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel.sheet.macroEnabled.12",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
        ];
        const hasValidMimeType = validMimeTypes.includes(file.type);

        return hasValidExtension || hasValidMimeType;
    }

    async function importDutysExcel({ file, year, month, idSpeciality }) {
        if (!file) return setImportMsg("No se ha seleccionado ningún archivo");
        if (!year || !month || !idSpeciality) return setImportMsg("Por favor, seleccione año, mes y especialidad");

        try {
            setImportMsg("Procesando archivo...");

            await importExcel({ file, year, month, idSpeciality });

            setImportMsg("Archivo importado correctamente");
            setExcelFile(null);

            await loadDutiesForCurrentView();

            addNotification(`Se han importado guardias desde Excel (${new Date().toLocaleTimeString()}).`);
        } catch (error) {
            setImportMsg(error?.message || "Error al importar el archivo");
        }
    }

    function syncTitle() {
        const api = calendarRef.current?.getApi();
        if (!api) return;
        setMonthLabel(api.view.title);
    }

    function goPrev() {
        const api = calendarRef.current?.getApi();
        api?.prev();
    }

    function goNext() {
        const api = calendarRef.current?.getApi();
        api?.next();
    }

    // BD: cargar guardias reales
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [eventsError, setEventsError] = useState("");

    // ✅ helper: eventos dentro del rango visible
    const eventsInView = useMemo(() => {
        if (!viewRange.start || !viewRange.end) return events;
        return events.filter((e) => e.start && e.start >= viewRange.start && e.start < viewRange.end);
    }, [events, viewRange]);

    // ✅ STATS usando solo el mes visible (rango visible)
    const stats = useMemo(() => {
        const totalVisible = eventsInView.length;
        const continuidadVisible = eventsInView.filter((e) => e.extendedProps?.type === "CA").length;
        const alertas = events.filter((e) => !e.start).length;

        return [
            { title: "Continuidad Asistida", value: String(continuidadVisible), note: "En el mes visible", icon: "people", accent: "blue" },
            { title: "Total Guardias", value: String(totalVisible), note: "En el mes visible", icon: "bar_chart", accent: "green" },
            { title: "Alertas", value: String(alertas), note: "Eventos sin fecha", icon: "warning", accent: "red" },
        ];
    }, [events, eventsInView]);

    function mapDutyToEvent(d) {
        const id = String(d.id ?? d.uuid ?? (crypto?.randomUUID ? crypto.randomUUID() : Date.now()));

        const date = String(d.date ?? "");
        const typeUpper = String(d.duty_type ?? "").toUpperCase();

        const workerName = String(d.worker ?? "").trim();
        const specialityName = String(d.speciality ?? "").trim();

        const jefe = Boolean(d.is_chief);

        const title = `${workerName} · ${typeUpper}${specialityName ? ` · ${specialityName}` : ""}`;

        return {
            id,
            title,
            start: date, // YYYY-MM-DD
            allDay: true,
            extendedProps: {
                type: typeUpper,
                jefe,
                raw: d,
            },
        };
    }

    async function callGetDuties(start, end, name) {
        try {
            return await getDuties({ start, end, name });
        } catch (_) {
            return await getDuties(start, end, name);
        }
    }

    const loadDutiesForCurrentView = useCallback(async () => {
        const api = calendarRef.current?.getApi();
        if (!api) return;

        const start = api.view.activeStart.toISOString().slice(0, 10);
        const end = api.view.activeEnd.toISOString().slice(0, 10);

        // ✅ guarda rango visible para stats
        setViewRange({ start, end });

        setEventsLoading(true);
        setEventsError("");

        try {
            const data = await callGetDuties(start, end, debouncedName);
            const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
            setEvents(arr.map(mapDutyToEvent));
        } catch (e) {
            console.error(e);
            setEventsError("No se pudieron cargar las guardias desde la base de datos.");
            setEvents([]);
        } finally {
            setEventsLoading(false);
        }
    }, [debouncedName]);

    useEffect(() => {
        syncTitle();
        setTimeout(() => {
            loadDutiesForCurrentView();
        }, 0);
    }, [loadDutiesForCurrentView]);

    useEffect(() => {
        loadDutiesForCurrentView();
    }, [debouncedName, loadDutiesForCurrentView]);

    // Filtros
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterType, setFilterType] = useState("ALL");

    const filteredEvents = useMemo(() => {
        if (filterType === "ALL") return events;
        return events.filter((e) => e.extendedProps?.type === filterType);
    }, [events, filterType]);

    // Modal Nueva Guardia
    const [newOpen, setNewOpen] = useState(false);
    const [newType, setNewType] = useState("CA");
    const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [newTime, setNewTime] = useState("15:00");

    // se mantiene porque lo tienes en UI
    const [newName, setNewName] = useState("");

    const [newIdSpeciality, setNewIdSpeciality] = useState("");

    // ✅ id del worker requerido por backend
    const [newWorkerId, setNewWorkerId] = useState("");

    function openNewGuardiaModal(prefilledDate) {
        if (prefilledDate) setNewDate(prefilledDate);
        setNewName("");
        setNewIdSpeciality("");
        setNewWorkerId("");
        setNewOpen(true);
    }

    // Joyride Steps
    const [runTour, setRunTour] = useState(false);
    const tourSteps = [
        {
            target: ".tour-import-excel",
            content: "Aquí puedes importar las guardias desde un archivo Excel. Asegúrate de seleccionar el mes, año y especialidad correctos.",
            disableBeacon: true,
        },
        {
            target: ".tour-new-guard",
            content: "Utiliza este botón para añadir manualmente una nueva guardia si no está en el Excel.",
        },
        {
            target: ".tour-filters",
            content: "Filtra las guardias visibles por tipo (Continuidad, Presencia Física, Localizada) para ver solo lo que te interesa.",
        },
    ];

    useEffect(() => {
        const tutorialDone = localStorage.getItem("homeDashboardTutorialDone");
        if (!tutorialDone) {
            setRunTour(true);
        }
    }, []);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            localStorage.setItem("homeDashboardTutorialDone", "true");
            setRunTour(false);
        }
    };

    // ✅ crear duty como espera el backend (id_worker requerido)
    async function addGuardia() {
        if (!newDate) return;

        if (!newIdSpeciality) {
            addNotification("La especialidad es obligatoria.");
            return;
        }

        if (!newWorkerId) {
            addNotification("Debes seleccionar un trabajador.");
            return;
        }

        try {
            normalizeTime(newTime);

            const payload = {
                date: newDate,
                duty_type: newType,
                id_speciality: Number(newIdSpeciality),
                id_worker: Number(newWorkerId),
                id_chief_worker: null,
            };

            const created = await createDuty(payload);
            console.log("CREATED DUTY =>", created);

            await loadDutiesForCurrentView();

            addNotification(`Guardia creada correctamente (${new Date().toLocaleTimeString()}).`);
            setNewOpen(false);
        } catch (e) {
            console.error(e);
            addNotification(e?.message || "Error creando la guardia");
        }
    }

    async function openImportModal() {
        const { year, month } = getMonthYearFromCalendar();
        setImportYear(years.includes(year) ? year : years[years.length - 1]);
        setImportMonth(month);

        setImportMsg("");
        setExcelFile(null);
        setIdSpeciality("");
        setImportOpen(true);

        setSpecialitiesLoading(true);
        setSpecialitiesError("");

        try {
            const data = await getSpecialities();
            const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
            setSpecialities(arr);
        } catch (e) {
            console.error(e);
            setSpecialities([]);
            setSpecialitiesError("No se pudieron cargar las especialidades.");
        } finally {
            setSpecialitiesLoading(false);
        }
    }

    function closeImportModal() {
        setImportOpen(false);
        setIsDragging(false);
    }

    function onPickExcelFile(e) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (!isExcelFile(file)) {
            setImportMsg("Solo se permiten archivos .xls o .xlsx");
            setExcelFile(null);
            return;
        }

        setExcelFile(file);
        setImportMsg("");
    }

    function onDragOver(e) {
        e.preventDefault();
        setIsDragging(true);
    }

    function onDragLeave(e) {
        e.preventDefault();
        setIsDragging(false);
    }

    function onDrop(e) {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        if (!isExcelFile(file)) {
            setImportMsg("Solo se permiten archivos .xls o .xlsx");
            setExcelFile(null);
            return;
        }

        setExcelFile(file);
        setImportMsg("");
    }

    async function submitImport() {
        if (!excelFile) return setImportMsg("Debes adjuntar un archivo Excel.");
        if (!isExcelFile(excelFile)) return setImportMsg("Solo se permiten archivos .xls o .xlsx");
        if (!idSpeciality) return setImportMsg("Debes seleccionar una especialidad.");
        if (!importYear || !importMonth) return setImportMsg("Debes seleccionar año y mes.");

        const maxMB = 10;
        if (excelFile.size > maxMB * 1024 * 1024) return setImportMsg(`El archivo supera ${maxMB}MB`);

        setImportUploading(true);
        setImportMsg("");

        try {
            await importDutysExcel({
                file: excelFile,
                year: importYear,
                month: importMonth,
                idSpeciality: idSpeciality,
            });
        } catch (e) {
            setImportMsg(`Error al subir: ${e.message}`);
        } finally {
            setImportUploading(false);
        }
    }

    return (
        <div className="hdContent">
            {/* Cards stats */}
            <section className="hdStats">
                {stats.map((s) => (
                    <div className="hdStatCard" key={s.title}>
                        <div>
                            <div className="hdStatTitle">{s.title}</div>
                            <div className="hdStatValue">{s.value}</div>
                            <div className={`hdStatNote ${s.accent}`}>{s.note}</div>
                        </div>
                        <div className={`hdStatIcon ${s.accent}`}>
                            <span className="material-icons-outlined">{s.icon}</span>
                        </div>
                    </div>
                ))}
            </section>

            {/* Calendar card */}
            <section className="hdCalendarCard">
                <div className="hdCalendarTop">
                    <div className="hdMonthPicker">
                        <button className="hdMiniBtn" aria-label="Mes anterior" type="button" onClick={goPrev}>
                            <span className="material-icons-outlined">chevron_left</span>
                        </button>

                        <span className="hdMonthLabel">{monthLabel || "..."}</span>

                        <button className="hdMiniBtn" aria-label="Mes siguiente" type="button" onClick={goNext}>
                            <span className="material-icons-outlined">chevron_right</span>
                        </button>
                    </div>

                    {/* 🔎 INPUT CENTRADO */}
                    <div className="hdSearchWrap" role="search" aria-label="Buscar por nombre">
                        <div className="hdSearch">
                            <span className="material-icons-outlined hdSearchIcon" aria-hidden="true">
                                search
                            </span>

                            <input
                                className="hdSearchInput"
                                type="text"
                                placeholder="Buscar por nombre..."
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                            />

                            {searchName && (
                                <button
                                    type="button"
                                    className="hdSearchClear"
                                    onClick={() => setSearchName("")}
                                    aria-label="Limpiar búsqueda"
                                    title="Limpiar"
                                >
                                    <span className="material-icons-outlined">close</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="hdActions" style={{ position: "relative" }}>
                        {/* IMPORTAR EXCEL */}
                        <button className="hdBtn primary hdBtnSm tour-import-excel" type="button" onClick={openImportModal}>
                            <span className="material-icons-outlined">table_view</span>
                            <span className="hideOnMobile">Importar Excel</span>
                            <span className="showOnMobile">Excel</span>
                        </button>

                        {/* MODAL IMPORTAR EXCEL */}
                        {importOpen && (
                            <div className="hdModalOverlay" role="dialog" aria-modal="true">
                                <div className="hdModalCard">
                                    <div className="hdModalHead">
                                        <div className="hdModalTitle">Importar guardias desde Excel</div>
                                        <button className="hdModalClose" type="button" onClick={closeImportModal} aria-label="Cerrar">
                                            <span className="material-icons-outlined">close</span>
                                        </button>
                                    </div>

                                    <div className="hdModalBody">
                                        <label className="hdField">
                                            <span>Especialidad</span>

                                            {specialitiesLoading ? (
                                                <div className="hdControl">Cargando especialidades...</div>
                                            ) : specialitiesError ? (
                                                <div className="hdControl">{specialitiesError}</div>
                                            ) : (
                                                <select className="hdControl" value={idSpeciality} onChange={(e) => setIdSpeciality(e.target.value)}>
                                                    <option value="">-- Selecciona una especialidad --</option>
                                                    {specialities.map((s) => (
                                                        <option key={s.id} value={String(s.id)}>
                                                            {s.name} (id: {s.id})
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </label>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                            <label className="hdField">
                                                <span>Mes</span>
                                                <select className="hdControl" value={importMonth} onChange={(e) => setImportMonth(e.target.value)}>
                                                    {months.map((m) => (
                                                        <option key={m.value} value={m.value}>
                                                            {m.label} ({m.value})
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>

                                            <label className="hdField">
                                                <span>Año</span>
                                                <select className="hdControl" value={importYear} onChange={(e) => setImportYear(e.target.value)}>
                                                    {years.map((y) => (
                                                        <option key={y} value={y}>
                                                            {y}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                            style={{ display: "none" }}
                                            onChange={onPickExcelFile}
                                        />

                                        <div
                                            onDragOver={onDragOver}
                                            onDragLeave={onDragLeave}
                                            onDrop={onDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{
                                                marginTop: 12,
                                                border: `2px dashed ${isDragging ? "#888" : "#ccc"}`,
                                                borderRadius: 12,
                                                padding: 16,
                                                cursor: "pointer",
                                                textAlign: "center",
                                                userSelect: "none",
                                            }}
                                            title="Arrastra Excel o haz clic para seleccionarlo"
                                        >
                                            <div style={{ fontWeight: 600 }}>Arrastra aquí tu Excel (.xls / .xlsx)</div>
                                            <div style={{ marginTop: 6, opacity: 0.8 }}>o haz clic para seleccionarlo</div>

                                            {excelFile && (
                                                <div style={{ marginTop: 10 }}>
                                                    Archivo: <b>{excelFile.name}</b>
                                                </div>
                                            )}
                                        </div>

                                        {importMsg && <p style={{ marginTop: 12 }}>{importMsg}</p>}
                                    </div>

                                    <div className="hdModalFooter">
                                        <button className="hdBtn light hdBtnSm" type="button" onClick={closeImportModal}>
                                            Cancelar
                                        </button>

                                        <button className="hdBtn primary hdBtnSm" type="button" disabled={importUploading} onClick={submitImport}>
                                            {importUploading ? "Subiendo..." : "Importar"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NUEVA GUARDIA */}
                        <button className="hdBtn primary hdBtnSm tour-new-guard" type="button" onClick={() => openNewGuardiaModal()}>
                            <span className="material-icons-outlined">add</span>
                            <span className="hideOnMobile">Nueva Guardia</span>
                            <span className="showOnMobile">Crear</span>
                        </button>

                        {/* FILTROS */}
                        <button
                            className="hdBtn light hdBtnSm tour-filters"
                            type="button"
                            onClick={() => setFilterOpen((v) => !v)}
                            aria-expanded={filterOpen}
                        >
                            <span className="material-icons-outlined">filter_list</span>
                            Filtros
                        </button>

                        {filterOpen && (
                            <div className="hdFilterMenu" role="menu">
                                <button
                                    type="button"
                                    className={`hdFilterItem ${filterType === "ALL" ? "active" : ""}`}
                                    onClick={() => {
                                        setFilterType("ALL");
                                        setFilterOpen(false);
                                    }}
                                >
                                    Todos
                                </button>
                                <button
                                    type="button"
                                    className={`hdFilterItem ${filterType === "CA" ? "active" : ""}`}
                                    onClick={() => {
                                        setFilterType("CA");
                                        setFilterOpen(false);
                                    }}
                                >
                                    Continuidad (CA)
                                </button>
                                <button
                                    type="button"
                                    className={`hdFilterItem ${filterType === "PF" ? "active" : ""}`}
                                    onClick={() => {
                                        setFilterType("PF");
                                        setFilterOpen(false);
                                    }}
                                >
                                    Presencia Física (PF)
                                </button>
                                <button
                                    type="button"
                                    className={`hdFilterItem ${filterType === "LOC" ? "active" : ""}`}
                                    onClick={() => {
                                        setFilterType("LOC");
                                        setFilterOpen(false);
                                    }}
                                >
                                    Localizada (LOC)
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {(eventsLoading || eventsError) && (
                    <div style={{ padding: "10px 16px" }}>
                        {eventsLoading && <span style={{ fontWeight: 700 }}>Cargando guardias...</span>}
                        {eventsError && <span style={{ color: "#b91c1c", fontWeight: 700 }}>{eventsError}</span>}
                    </div>
                )}

                <div className="hdCalendar">
                    <div className={`hdFullCalendarWrap ${eventsLoading ? "" : "hdEnter"}`}>
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            initialDate={new Date()}
                            firstDay={1}
                            height="auto"
                            locale="es"
                            headerToolbar={false}
                            datesSet={() => {
                                syncTitle();
                                loadDutiesForCurrentView();
                            }}
                            dayHeaderFormat={{ weekday: "short" }}
                            events={filteredEvents}
                            dayCellClassNames={(arg) => (arg.isToday ? ["hdTodayCell"] : [])}
                            eventContent={(arg) => {
                                const type = arg.event.extendedProps?.type;
                                const jefe = arg.event.extendedProps?.jefe;
                                const text = arg.event.title;

                                return (
                                    <div className={`hdFcChip ${type || ""}`}>
                                        <span className="hdFcChipText">{text}</span>
                                        {jefe && (
                                            <span className="material-icons-outlined hdFcJefe" title="Jefe de Guardia">
                                                local_police
                                            </span>
                                        )}
                                    </div>
                                );
                            }}
                            dateClick={(info) => openNewGuardiaModal(info.dateStr)}
                            eventClick={(info) => {
                                console.log("eventClick raw:", info.event.extendedProps?.raw);
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* MODAL NUEVA GUARDIA */}
            {newOpen && (
                <div className="hdModalOverlay" role="dialog" aria-modal="true">
                    <div className="hdModalCard">
                        <div className="hdModalHead">
                            <div className="hdModalTitle">Nueva Guardia</div>
                            <button className="hdModalClose" onClick={() => setNewOpen(false)} type="button" aria-label="Cerrar">
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        <div className="hdModalBody">
                            <label className="hdField">
                                <span>Tipo</span>
                                <select value={newType} onChange={(e) => setNewType(e.target.value)} className="hdControl">
                                    <option value="CA">CA (Continuidad)</option>
                                    <option value="PF">PF (Presencia Física)</option>
                                    <option value="LOC">LOC (Localizada)</option>
                                </select>
                            </label>

                            <label className="hdField">
                                <span>Fecha</span>
                                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="hdControl" />
                            </label>

                            {/* NUEVO: selector de trabajador requerido por backend */}
                            <label className="hdField">
                                <span>Trabajador</span>

                                {workersLoading ? (
                                    <div className="hdControl">Cargando trabajadores...</div>
                                ) : workersError ? (
                                    <div className="hdControl">{workersError}</div>
                                ) : (
                                    <select
                                        className="hdControl"
                                        value={newWorkerId}
                                        onChange={(e) => setNewWorkerId(e.target.value)}
                                    >
                                        <option value="">Selecciona un trabajador</option>
                                        {workers.map((w) => (
                                            <option key={w.id} value={String(w.id)}>
                                                {w.name} (id: {w.id})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </label>

                            <label className="hdField">
                                <span>Especialidad</span>
                                <select className="hdControl" value={newIdSpeciality} onChange={(e) => setNewIdSpeciality(e.target.value)}>
                                    <option value="">Selecciona una especialidad</option>
                                    {specialities.map((s) => (
                                        <option key={s.id} value={String(s.id)}>
                                            {s.name} (id: {s.id})
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="hdField">
                                <span>Hora</span>
                                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="hdControl" />
                            </label>
                        </div>

                        <div className="hdModalFooter">
                            <button className="hdBtn light hdBtnSm" type="button" onClick={() => setNewOpen(false)}>
                                Cancelar
                            </button>
                            <button className="hdBtn primary hdBtnSm" type="button" onClick={addGuardia}>
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <section className="hdLegendCard">
                <h4 className="hdLegendTitle">Leyenda</h4>
                <div className="hdLegendGrid">
                    <div className="hdLegendItem">
                        <span className="dot ca" />
                        <span>Continuidad (CA)</span>
                    </div>
                    <div className="hdLegendItem">
                        <span className="dot pf" />
                        <span>Presencia Física (PF)</span>
                    </div>
                    <div className="hdLegendItem">
                        <span className="dot loc" />
                        <span>Localizada (LOC)</span>
                    </div>
                    <div className="hdLegendItem">
                        <span className="material-icons-outlined amber">local_police</span>
                        <span>Jefe de Guardia</span>
                    </div>
                </div>
            </section>

            <Joyride
                steps={tourSteps}
                run={runTour}
                continuous
                showProgress
                showSkipButton
                scrollOffset={150}
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        zIndex: 10000,
                        primaryColor: "#007bff",
                    },
                }}
                locale={{
                    back: "Atrás",
                    close: "Cerrar",
                    last: "Finalizar",
                    next: "Siguiente",
                    skip: "Saltar",
                }}
            />
        </div>
    );
}